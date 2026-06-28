import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { inventorySchema, stockAdjustSchema, stockReserveSchema, stockReleaseSchema, type InventoryInput, type StockAdjustInput, type StockReserveInput, type StockReleaseInput } from "@/lib/schemas";
import { createNotification } from "@/lib/services/notifications";

interface InventoryRecord {
  id: string; variantId: string; quantity: number; reserved: number;
  lowStockThreshold: number; reorderLevel: number; tenantId: string;
  updatedAt: Date;
  variant?: {
    id: string; sku: string; price: number;
    product: { id: string; name: string; slug: string };
  };
}

interface InventoryLogRecord {
  id: string; variantId: string; change: number; reason: string;
  previousQty: number; newQty: number; previousReserved: number; newReserved: number;
  userId: string | null; createdAt: Date;
}

const mockInventory: InventoryRecord[] = [];
const mockLogs: InventoryLogRecord[] = [];

function computeAvailable(record: InventoryRecord): number {
  return Math.max(0, record.quantity - record.reserved);
}

function statusLabel(qty: number, threshold: number): string {
  if (qty === 0) return "out_of_stock";
  if (qty <= threshold) return "low_stock";
  return "in_stock";
}

async function addLog(params: {
  variantId: string; change: number; reason: string;
  previousQty: number; newQty: number;
  previousReserved: number; newReserved: number;
  userId?: string;
}) {
  if (process.env.DATABASE_URL) {
    await prisma.inventoryLog.create({ data: params });
    return;
  }
  const log: InventoryLogRecord = {
    id: `log-${Date.now()}`, ...params, userId: params.userId ?? null,
    createdAt: new Date(),
  };
  mockLogs.push(log);
}

export async function listInventory(tenantId: string, filter?: { lowStock?: boolean; outOfStock?: boolean; search?: string }) {
  if (process.env.DATABASE_URL) {
    const conditions: Record<string, unknown>[] = [{ tenantId }];

    if (filter?.outOfStock) {
      conditions.push({ quantity: 0 });
    }
    if (filter?.search) {
      conditions.push({
        OR: [
          { variant: { sku: { contains: filter.search } } },
          { variant: { product: { name: { contains: filter.search } } } },
        ],
      });
    }

    const where = conditions.length > 1 ? { AND: conditions } : conditions[0];

    let items = await prisma.inventory.findMany({
      where,
      include: { variant: { include: { product: { select: { id: true, name: true, slug: true } } } } },
      orderBy: { updatedAt: "desc" },
    }) as unknown as InventoryRecord[];

    let result = items.map((item) => ({
      ...item,
      available: computeAvailable(item),
      status: statusLabel(item.quantity, item.lowStockThreshold),
    }));

    if (filter?.lowStock) {
      result = result.filter((i) => i.status === "low_stock");
    }

    return result;
  }
  let result = mockInventory.filter((i) => i.tenantId === tenantId);
  if (filter?.lowStock) result = result.filter((i) => i.quantity <= i.lowStockThreshold && i.quantity > 0);
  if (filter?.outOfStock) result = result.filter((i) => i.quantity === 0);
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    result = result.filter((i) =>
      i.variant?.sku.toLowerCase().includes(q) ||
      i.variant?.product.name.toLowerCase().includes(q)
    );
  }
  return result.map((item) => ({
    ...item,
    available: computeAvailable(item),
    status: statusLabel(item.quantity, item.lowStockThreshold),
  }));
}

export async function getInventory(variantId: string) {
  if (process.env.DATABASE_URL) {
    const record = await prisma.inventory.findUnique({
      where: { variantId },
      include: { variant: { include: { product: { select: { id: true, name: true, slug: true } } } } },
    });
    if (!record) return null;
    const r = record as unknown as InventoryRecord;
    return { ...r, available: computeAvailable(r), status: statusLabel(r.quantity, r.lowStockThreshold) };
  }
  const record = mockInventory.find((i) => i.variantId === variantId) ?? null;
  if (!record) return null;
  return { ...record, available: computeAvailable(record), status: statusLabel(record.quantity, record.lowStockThreshold) };
}

export async function upsertInventory(data: InventoryInput, tenantId: string, userId?: string) {
  const parsed = inventorySchema.parse(data);
  const { variantId, quantity, reserved, lowStockThreshold, reorderLevel } = parsed;

  if (process.env.DATABASE_URL) {
    const record = await prisma.inventory.upsert({
      where: { variantId },
      update: { quantity, reserved: reserved ?? 0, lowStockThreshold, reorderLevel },
      create: { variantId, quantity, reserved: reserved ?? 0, lowStockThreshold, reorderLevel, tenantId },
    });
    return record;
  }
  const idx = mockInventory.findIndex((i) => i.variantId === variantId);
  if (idx >= 0) {
    mockInventory[idx] = { ...mockInventory[idx], quantity, reserved: reserved ?? 0, lowStockThreshold, reorderLevel, updatedAt: new Date() };
    return mockInventory[idx];
  }
  const entry: InventoryRecord = {
    id: `inv-${Date.now()}`, variantId, quantity, reserved: reserved ?? 0,
    lowStockThreshold, reorderLevel, tenantId, updatedAt: new Date(),
  };
  mockInventory.push(entry);
  return entry;
}

export async function adjustStock(data: StockAdjustInput, userId?: string) {
  const parsed = stockAdjustSchema.parse(data);
  const { variantId, change, reason } = parsed;

  if (process.env.DATABASE_URL) {
    // Atomic CAS: only commit if quantity stays >= 0. RETURNING gives us both
    // old and new quantities without a separate read, eliminating the race.
    const rows = await prisma.$queryRawUnsafe<
      Array<{ new_qty: number; prev_qty: number; reserved: number; tenant_id: string }>
    >(
      `UPDATE "Inventory"
       SET quantity = quantity + $1, "updatedAt" = NOW()
       WHERE "variantId" = $2 AND (quantity + $1) >= 0
       RETURNING
         quantity                AS new_qty,
         quantity - $1           AS prev_qty,
         reserved,
         "tenantId"              AS tenant_id`,
      change,
      variantId,
    );

    if (rows.length === 0) {
      // Check whether the record doesn't exist or stock was insufficient.
      const exists = await prisma.inventory.findUnique({ where: { variantId }, select: { id: true } });
      if (!exists) throw new Error("Inventory record not found");
      throw new Error("Insufficient stock");
    }

    const { new_qty: newQty, prev_qty: prevQty, reserved, tenant_id: tenantId } = rows[0];

    await Promise.all([
      addLog({ variantId, change, reason, previousQty: prevQty, newQty, previousReserved: reserved, newReserved: reserved, userId }),
      logAudit({
        entityType: "inventory", entityId: variantId, action: "stock_adjusted",
        changes: { variantId, change, reason, previousQty: prevQty, newQty }, userId, tenantId,
      }),
    ]);

    await checkAndNotifyStock(variantId, newQty, tenantId, reason);

    return { variantId, quantity: newQty, reserved };
  }
  const idx = mockInventory.findIndex((i) => i.variantId === variantId);
  if (idx === -1) throw new Error("Inventory record not found");
  const prev = mockInventory[idx].quantity;
  const newQty = prev + change;
  if (newQty < 0) throw new Error("Insufficient stock");
  mockInventory[idx].quantity = newQty;
  mockInventory[idx].updatedAt = new Date();
  await addLog({ variantId, change, reason, previousQty: prev, newQty, previousReserved: mockInventory[idx].reserved, newReserved: mockInventory[idx].reserved, userId });
  return mockInventory[idx];
}

export async function reserveStock(data: StockReserveInput, userId?: string) {
  const parsed = stockReserveSchema.parse(data);
  const { variantId, quantity, orderId } = parsed;

  if (process.env.DATABASE_URL) {
    const inv = await prisma.inventory.findUnique({ where: { variantId } }) as unknown as InventoryRecord | null;
    if (!inv) throw new Error("Inventory record not found");
    const available = inv.quantity - inv.reserved;
    if (available < quantity) throw new Error(`Insufficient available stock. Requested: ${quantity}, Available: ${Math.max(0, available)}`);
    const newReserved = inv.reserved + quantity;
    const [updated] = await Promise.all([
      prisma.inventory.update({ where: { variantId }, data: { reserved: newReserved } as any }),
      addLog({
        variantId, change: 0, reason: `Reserved for order ${orderId || "pending"}`,
        previousQty: inv.quantity, newQty: inv.quantity,
        previousReserved: inv.reserved, newReserved, userId,
      }),
    ]);
    return updated;
  }
  const idx = mockInventory.findIndex((i) => i.variantId === variantId);
  if (idx === -1) throw new Error("Inventory record not found");
  const available = mockInventory[idx].quantity - mockInventory[idx].reserved;
  if (available < quantity) throw new Error(`Insufficient available stock. Requested: ${quantity}, Available: ${Math.max(0, available)}`);
  mockInventory[idx].reserved += quantity;
  return mockInventory[idx];
}

export async function releaseStock(data: StockReleaseInput, userId?: string) {
  const parsed = stockReleaseSchema.parse(data);
  const { variantId, quantity, orderId } = parsed;

  if (process.env.DATABASE_URL) {
    const inv = await prisma.inventory.findUnique({ where: { variantId } }) as unknown as InventoryRecord | null;
    if (!inv) throw new Error("Inventory record not found");
    const newReserved = Math.max(0, inv.reserved - quantity);
    const [updated] = await Promise.all([
      prisma.inventory.update({ where: { variantId }, data: { reserved: newReserved } } as any),
      addLog({
        variantId, change: 0, reason: `Released from order ${orderId || "cancelled"}`,
        previousQty: inv.quantity, newQty: inv.quantity,
        previousReserved: inv.reserved, newReserved, userId,
      }),
    ]);
    return updated;
  }
  const idx = mockInventory.findIndex((i) => i.variantId === variantId);
  if (idx === -1) throw new Error("Inventory record not found");
  mockInventory[idx].reserved = Math.max(0, mockInventory[idx].reserved - quantity);
  return mockInventory[idx];
}

export async function decreaseStockOnOrder(variantId: string, quantity: number, orderId: string, userId?: string) {
  if (process.env.DATABASE_URL) {
    const inv = await prisma.inventory.findUnique({ where: { variantId } }) as unknown as InventoryRecord | null;
    if (!inv) throw new Error("Inventory record not found");
    const newQty = inv.quantity - quantity;
    if (newQty < 0) throw new Error("Insufficient stock");
    const newReserved = Math.max(0, inv.reserved - quantity);
    const [updated] = await Promise.all([
      prisma.inventory.update({ where: { variantId }, data: { quantity: newQty, reserved: newReserved } as any }),
      addLog({
        variantId, change: -quantity, reason: `Order ${orderId} confirmed`,
        previousQty: inv.quantity, newQty,
        previousReserved: inv.reserved, newReserved, userId,
      }),
    ]);

    await checkAndNotifyStock(variantId, newQty, inv.tenantId, `Order ${orderId} confirmed`);

    return updated;
  }
  const idx = mockInventory.findIndex((i) => i.variantId === variantId);
  if (idx === -1) throw new Error("Inventory record not found");
  const newQty = mockInventory[idx].quantity - quantity;
  if (newQty < 0) throw new Error("Insufficient stock");
  mockInventory[idx].quantity = newQty;
  mockInventory[idx].reserved = Math.max(0, mockInventory[idx].reserved - quantity);
  return mockInventory[idx];
}

export async function getStockHistory(variantId: string, limit = 50) {
  if (process.env.DATABASE_URL) {
    return prisma.inventoryLog.findMany({
      where: { variantId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }) as unknown as InventoryLogRecord[];
  }
  return mockLogs
    .filter((l) => l.variantId === variantId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

async function checkAndNotifyStock(
  variantId: string,
  newQty: number,
  tenantId: string,
  reason: string,
) {
  if (!process.env.DATABASE_URL) return;
  const inv = await prisma.inventory.findUnique({
    where: { variantId },
    include: { variant: { include: { product: { select: { name: true } } } } },
  });
  if (!inv) return;
  const productName = (inv.variant as any)?.product?.name ?? "Product";

  if (newQty <= 0) {
    createNotification(tenantId, {
      type: "inventory.out_of_stock",
      title: `${productName} is out of stock`,
      body: `${productName} (SKU: ${(inv.variant as any)?.sku ?? variantId}) is now out of stock. ${reason}`,
      data: { variantId, productName, sku: (inv.variant as any)?.sku ?? "", newQty, reason },
      channel: "in_app",
    }).catch(() => {});
  } else if (newQty <= inv.lowStockThreshold) {
    createNotification(tenantId, {
      type: "inventory.low_stock",
      title: `${productName} stock is low`,
      body: `${productName} (SKU: ${(inv.variant as any)?.sku ?? variantId}) has only ${newQty} units remaining (threshold: ${inv.lowStockThreshold}). ${reason}`,
      data: { variantId, productName, sku: (inv.variant as any)?.sku ?? "", newQty, threshold: inv.lowStockThreshold, reason },
      channel: "in_app",
    }).catch(() => {});
  }
}

export async function getInventoryAlerts(tenantId: string) {
  const all = await listInventory(tenantId);
  const lowStock = all.filter((i: Record<string, unknown>) => i.status === "low_stock");
  const outOfStock = all.filter((i: Record<string, unknown>) => i.status === "out_of_stock");
  return { lowStock, outOfStock, total: all.length };
}
