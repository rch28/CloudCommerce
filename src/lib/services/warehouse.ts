import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import {
  warehouseSchema,
  warehouseUpdateSchema,
  stockTransferSchema,
  type WarehouseInput,
  type WarehouseUpdateInput,
  type StockTransferInput,
  type ReserveStockInput,
  type ReleaseStockInput,
  type ConfirmDeductionInput,
} from "@/lib/schemas/warehouse";

interface PaginateParams {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  order?: "asc" | "desc";
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function buildPagination(params: PaginateParams = {}) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

// ── Warehouse CRUD ──────────────────────────────────────

export async function getWarehouses(tenantId: string, params: PaginateParams & { isActive?: boolean } = {}) {
  const { page, pageSize, skip } = buildPagination(params);

  const where: Record<string, unknown> = { tenantId };
  if (params.isActive !== undefined) where.isActive = params.isActive;

  const orderBy = params.orderBy ? { [params.orderBy]: params.order || "asc" } : { sortOrder: "asc" as const };

  const [items, total] = await Promise.all([
    prisma.warehouse.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        _count: { select: { inventories: true } },
      },
    }),
    prisma.warehouse.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getWarehouse(tenantId: string, id: string) {
  return prisma.warehouse.findFirst({
    where: { id, tenantId },
    include: {
      inventories: {
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
    },
  });
}

export async function createWarehouse(tenantId: string, data: WarehouseInput, meta: { userId?: string }) {
  const parsed = warehouseSchema.parse(data);

  const existing = await prisma.warehouse.findUnique({
    where: { code_tenantId: { code: parsed.code, tenantId } },
  });
  if (existing) throw new Error(`Warehouse code "${parsed.code}" already exists`);

  const record = await prisma.warehouse.create({
    data: { ...parsed, tenantId },
  });

  await logAudit({
    entityType: "warehouse",
    entityId: record.id,
    action: "created",
    changes: parsed as Record<string, unknown>,
    userId: meta.userId,
    tenantId,
  });

  return record;
}

export async function updateWarehouse(tenantId: string, id: string, data: WarehouseUpdateInput, meta: { userId?: string }) {
  const parsed = warehouseUpdateSchema.parse(data);

  const existing = await prisma.warehouse.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error("Warehouse not found");

  if (parsed.code && parsed.code !== existing.code) {
    const duplicate = await prisma.warehouse.findUnique({
      where: { code_tenantId: { code: parsed.code, tenantId } },
    });
    if (duplicate) throw new Error(`Warehouse code "${parsed.code}" already exists`);
  }

  const record = await prisma.warehouse.update({ where: { id }, data: parsed });

  await logAudit({
    entityType: "warehouse",
    entityId: id,
    action: "updated",
    changes: { before: existing, after: parsed },
    userId: meta.userId,
    tenantId,
  });

  return record;
}

export async function deleteWarehouse(tenantId: string, id: string, meta: { userId?: string }) {
  const existing = await prisma.warehouse.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error("Warehouse not found");

  const inventoryCount = await prisma.warehouseInventory.count({ where: { warehouseId: id } });
  if (inventoryCount > 0) {
    throw new Error(`Cannot delete warehouse with ${inventoryCount} inventory item(s). Remove or transfer stock first.`);
  }

  await prisma.warehouse.delete({ where: { id } });

  await logAudit({
    entityType: "warehouse",
    entityId: id,
    action: "deleted",
    changes: { name: existing.name, code: existing.code },
    userId: meta.userId,
    tenantId,
  });
}

// ── Inventory Management ────────────────────────────────

export async function getWarehouseInventory(tenantId: string, warehouseId: string, params: PaginateParams = {}) {
  const { page, pageSize, skip } = buildPagination(params);

  const warehouse = await prisma.warehouse.findFirst({ where: { id: warehouseId, tenantId } });
  if (!warehouse) throw new Error("Warehouse not found");

  const [items, total] = await Promise.all([
    prisma.warehouseInventory.findMany({
      where: { warehouseId },
      include: {
        variant: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.warehouseInventory.count({ where: { warehouseId } }),
  ]);

  return {
    items: items.map((i) => ({
      ...i,
      available: i.quantity - i.reserved,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getVariantStock(tenantId: string, variantId: string) {
  const warehouseItems = await prisma.warehouseInventory.findMany({
    where: { variantId },
    include: { warehouse: { select: { id: true, name: true, code: true } } },
  });

  const totalQuantity = warehouseItems.reduce((s, i) => s + i.quantity, 0);
  const totalReserved = warehouseItems.reduce((s, i) => s + i.reserved, 0);

  return {
    variantId,
    totalQuantity,
    totalReserved,
    totalAvailable: totalQuantity - totalReserved,
    perWarehouse: warehouseItems.map((i) => ({
      warehouseId: i.warehouseId,
      warehouseName: i.warehouse.name,
      warehouseCode: i.warehouse.code,
      quantity: i.quantity,
      reserved: i.reserved,
      available: i.quantity - i.reserved,
      lowStockThreshold: i.lowStockThreshold,
    })),
  };
}

export async function adjustStock(
  tenantId: string,
  warehouseId: string,
  variantId: string,
  quantity: number,
  reason: string,
  meta?: { userId?: string },
) {
  return prisma.$transaction(async (tx) => {
    let inventory = await tx.warehouseInventory.findUnique({
      where: { warehouseId_variantId: { warehouseId, variantId } },
    });

    if (!inventory) {
      const warehouse = await tx.warehouse.findFirst({ where: { id: warehouseId, tenantId } });
      if (!warehouse) throw new Error("Warehouse not found");

      inventory = await tx.warehouseInventory.create({
        data: { warehouseId, variantId, quantity: 0, reserved: 0 },
      });
    }

    const newQty = inventory.quantity + quantity;
    if (newQty < 0) throw new Error("Insufficient stock in warehouse");

    const previousQty = inventory.quantity;
    const previousReserved = inventory.reserved;

    const updated = await tx.warehouseInventory.update({
      where: { id: inventory.id },
      data: { quantity: newQty },
    });

    await logAudit({
      entityType: "warehouse_inventory",
      entityId: updated.id,
      action: "stock_adjusted",
      changes: { warehouseId, variantId, change: quantity, reason, previousQty, newQty },
      userId: meta?.userId,
      tenantId,
    });

    return updated;
  });
}

export async function setLowStockThreshold(
  tenantId: string,
  warehouseId: string,
  variantId: string,
  threshold: number,
) {
  const inventory = await prisma.warehouseInventory.findUnique({
    where: { warehouseId_variantId: { warehouseId, variantId } },
  });
  if (!inventory) throw new Error("Inventory record not found");

  return prisma.warehouseInventory.update({
    where: { id: inventory.id },
    data: { lowStockThreshold: threshold },
  });
}

// ── Allocation Engine ───────────────────────────────────

export interface AllocationItem {
  variantId: string;
  quantity: number;
}

export interface AllocationDestination {
  country?: string;
  state?: string;
  zip?: string;
}

export interface AllocationPlanItem {
  warehouseId: string;
  warehouseName: string;
  variantId: string;
  allocated: number;
}

export interface AllocationResult {
  success: boolean;
  allocations: AllocationPlanItem[];
  shortages: Array<{
    variantId: string;
    requested: number;
    available: number;
  }>;
}

export async function allocateStock(
  tenantId: string,
  items: AllocationItem[],
  destination?: AllocationDestination,
): Promise<AllocationResult> {
  const allocations: AllocationPlanItem[] = [];
  const shortages: AllocationResult["shortages"] = [];

  const warehouses = await prisma.warehouse.findMany({
    where: { tenantId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  if (warehouses.length === 0) {
    return {
      success: false,
      allocations: [],
      shortages: items.map((i) => ({ variantId: i.variantId, requested: i.quantity, available: 0 })),
    };
  }

  const scoredWarehouses = warehouses.map((w) => ({
    ...w,
    score: destination ? computeProximityScore(w, destination) : 0,
  }));
  scoredWarehouses.sort((a, b) => a.score - b.score);

  for (const item of items) {
    let remaining = item.quantity;

    for (const wh of scoredWarehouses) {
      if (remaining <= 0) break;

      const inventory = await prisma.warehouseInventory.findUnique({
        where: { warehouseId_variantId: { warehouseId: wh.id, variantId: item.variantId } },
      });

      const available = inventory ? inventory.quantity - inventory.reserved : 0;
      if (available <= 0) continue;

      const take = Math.min(remaining, available);
      allocations.push({
        warehouseId: wh.id,
        warehouseName: wh.name,
        variantId: item.variantId,
        allocated: take,
      });
      remaining -= take;
    }

    if (remaining > 0) {
      shortages.push({
        variantId: item.variantId,
        requested: item.quantity,
        available: item.quantity - remaining,
      });
    }
  }

  return {
    success: shortages.length === 0,
    allocations,
    shortages,
  };
}

function computeProximityScore(warehouse: { state?: string | null; country?: string | null }, destination: AllocationDestination): number {
  let score = 0;
  if (destination.state && warehouse.state === destination.state) score -= 10;
  else if (destination.country && warehouse.country === destination.country) score -= 5;
  return score;
}

// ── Reservation Engine ──────────────────────────────────

export async function reserveStock(
  tenantId: string,
  data: ReserveStockInput,
  meta?: { userId?: string },
) {
  const { warehouseId, variantId, quantity } = data;

  return prisma.$transaction(async (tx) => {
    const inventory = await tx.warehouseInventory.findUnique({
      where: { warehouseId_variantId: { warehouseId, variantId } },
    });

    if (!inventory) throw new Error(`Inventory not found for variant ${variantId} in warehouse ${warehouseId}`);

    const available = inventory.quantity - inventory.reserved;
    if (available < quantity) {
      throw new Error(`Insufficient stock: requested ${quantity}, available ${available}`);
    }

    const updated = await tx.warehouseInventory.update({
      where: { id: inventory.id },
      data: { reserved: { increment: quantity } },
    });

    await logAudit({
      entityType: "warehouse_inventory",
      entityId: updated.id,
      action: "stock_reserved",
      changes: { warehouseId, variantId, quantity },
      userId: meta?.userId,
      tenantId,
    });

    return updated;
  });
}

export async function releaseStock(
  tenantId: string,
  data: ReleaseStockInput,
  meta?: { userId?: string },
) {
  const { warehouseId, variantId, quantity } = data;

  return prisma.$transaction(async (tx) => {
    const inventory = await tx.warehouseInventory.findUnique({
      where: { warehouseId_variantId: { warehouseId, variantId } },
    });

    if (!inventory) throw new Error(`Inventory not found for variant ${variantId} in warehouse ${warehouseId}`);

    const newReserved = Math.max(0, inventory.reserved - quantity);

    const updated = await tx.warehouseInventory.update({
      where: { id: inventory.id },
      data: { reserved: newReserved },
    });

    await logAudit({
      entityType: "warehouse_inventory",
      entityId: updated.id,
      action: "stock_released",
      changes: { warehouseId, variantId, quantity, previousReserved: inventory.reserved, newReserved },
      userId: meta?.userId,
      tenantId,
    });

    return updated;
  });
}

export async function confirmDeduction(
  tenantId: string,
  data: ConfirmDeductionInput,
  meta?: { userId?: string },
) {
  const { warehouseId, variantId, quantity } = data;

  return prisma.$transaction(async (tx) => {
    const inventory = await tx.warehouseInventory.findUnique({
      where: { warehouseId_variantId: { warehouseId, variantId } },
    });

    if (!inventory) throw new Error(`Inventory not found for variant ${variantId} in warehouse ${warehouseId}`);

    if (inventory.reserved < quantity) {
      throw new Error(`Cannot deduct: only ${inventory.reserved} reserved, ${quantity} requested`);
    }

    const newReserved = inventory.reserved - quantity;
    const newQty = inventory.quantity - quantity;
    if (newQty < 0) throw new Error("Insufficient stock");

    const updated = await tx.warehouseInventory.update({
      where: { id: inventory.id },
      data: { quantity: newQty, reserved: newReserved },
    });

    await logAudit({
      entityType: "warehouse_inventory",
      entityId: updated.id,
      action: "stock_adjusted",
      changes: { warehouseId, variantId, quantity: -quantity, reason: "Order shipped - confirmed deduction" },
      userId: meta?.userId,
      tenantId,
    });

    return updated;
  });
}

// ── Stock Transfers ─────────────────────────────────────

export async function getTransfers(tenantId: string, params: PaginateParams & { status?: string } = {}) {
  const { page, pageSize, skip } = buildPagination(params);

  const where: Record<string, unknown> = { tenantId };
  if (params.status && params.status !== "all") where.status = params.status;

  const [items, total] = await Promise.all([
    prisma.stockTransfer.findMany({
      where,
      include: {
        fromWarehouse: { select: { id: true, name: true, code: true } },
        toWarehouse: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.stockTransfer.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getTransfer(tenantId: string, id: string) {
  return prisma.stockTransfer.findFirst({
    where: { id, tenantId },
    include: {
      fromWarehouse: { select: { id: true, name: true, code: true } },
      toWarehouse: { select: { id: true, name: true, code: true } },
    },
  });
}

export async function createTransfer(tenantId: string, data: StockTransferInput, meta: { userId?: string }) {
  const parsed = stockTransferSchema.parse(data);
  if (parsed.fromWarehouseId === parsed.toWarehouseId) {
    throw new Error("Source and destination warehouses must be different");
  }

  return prisma.$transaction(async (tx) => {
    const fromWarehouse = await tx.warehouse.findFirst({ where: { id: parsed.fromWarehouseId, tenantId } });
    if (!fromWarehouse) throw new Error("Source warehouse not found");

    const toWarehouse = await tx.warehouse.findFirst({ where: { id: parsed.toWarehouseId, tenantId } });
    if (!toWarehouse) throw new Error("Destination warehouse not found");

    const fromInventory = await tx.warehouseInventory.findUnique({
      where: { warehouseId_variantId: { warehouseId: parsed.fromWarehouseId, variantId: parsed.variantId } },
    });
    const available = fromInventory ? fromInventory.quantity - fromInventory.reserved : 0;
    if (available < parsed.quantity) {
      throw new Error(`Insufficient available stock in source warehouse: ${available} available, ${parsed.quantity} requested`);
    }

    const transfer = await tx.stockTransfer.create({
      data: { ...parsed, tenantId },
    });

    await tx.warehouseInventory.update({
      where: { warehouseId_variantId: { warehouseId: parsed.fromWarehouseId, variantId: parsed.variantId } },
      data: { quantity: { decrement: parsed.quantity } },
    });

    const toInventory = await tx.warehouseInventory.findUnique({
      where: { warehouseId_variantId: { warehouseId: parsed.toWarehouseId, variantId: parsed.variantId } },
    });
    if (toInventory) {
      await tx.warehouseInventory.update({
        where: { id: toInventory.id },
        data: { quantity: { increment: parsed.quantity } },
      });
    } else {
      await tx.warehouseInventory.create({
        data: {
          warehouseId: parsed.toWarehouseId,
          variantId: parsed.variantId,
          quantity: parsed.quantity,
          reserved: 0,
        },
      });
    }

    await logAudit({
      entityType: "stock_transfer",
      entityId: transfer.id,
      action: "stock_transferred",
      changes: parsed as Record<string, unknown>,
      userId: meta.userId,
      tenantId,
    });

    return transfer;
  });
}

export async function updateTransferStatus(
  tenantId: string,
  id: string,
  status: string,
  meta: { userId?: string },
) {
  const validStatuses = ["pending", "in_transit", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: "${status}". Must be one of: ${validStatuses.join(", ")}`);
  }

  const transfer = await prisma.stockTransfer.findFirst({ where: { id, tenantId } });
  if (!transfer) throw new Error("Transfer not found");

  return prisma.$transaction(async (tx) => {
    const data: Record<string, unknown> = { status };
    if (status === "completed") {
      data.completedAt = new Date();
    }

    if (status === "cancelled" && transfer.status !== "completed") {
      const toInventory = await tx.warehouseInventory.findUnique({
        where: { warehouseId_variantId: { warehouseId: transfer.toWarehouseId, variantId: transfer.variantId } },
      });
      if (toInventory && toInventory.quantity >= transfer.quantity) {
        await tx.warehouseInventory.update({
          where: { id: toInventory.id },
          data: { quantity: { decrement: transfer.quantity } },
        });
      }

      const fromInventory = await tx.warehouseInventory.findUnique({
        where: { warehouseId_variantId: { warehouseId: transfer.fromWarehouseId, variantId: transfer.variantId } },
      });
      if (fromInventory) {
        await tx.warehouseInventory.update({
          where: { id: fromInventory.id },
          data: { quantity: { increment: transfer.quantity } },
        });
      }
    }

    const updated = await tx.stockTransfer.update({ where: { id }, data });

    await logAudit({
      entityType: "stock_transfer",
      entityId: id,
      action: "updated",
      changes: { from: transfer.status, to: status },
      userId: meta.userId,
      tenantId,
    });

    return updated;
  });
}
