import { prisma } from "@/lib/prisma";
import { inventorySchema, stockAdjustSchema, type InventoryInput, type StockAdjustInput } from "@/lib/schemas";

const mockInventory: Array<{
  id: string; variantId: string; quantity: number; lowStockThreshold: number; reorderLevel: number; tenantId: string; updatedAt: Date;
  variant: { id: string; sku: string; product: { name: string; images: string[] } }
}> = [];

export async function listInventory(tenantId: string, lowStock?: boolean) {
  if (process.env.DATABASE_URL) {
    const where: Record<string, unknown> = { tenantId };
    if (lowStock) {
      where.quantity = { lte: prisma.inventory.fields.lowStockThreshold };
    }
    return prisma.inventory.findMany({
      where,
      include: { variant: { include: { product: { select: { name: true, images: true } } } } },
      orderBy: { updatedAt: "desc" },
    });
  }
  let result = mockInventory.filter((i) => i.tenantId === tenantId);
  if (lowStock) result = result.filter((i) => i.quantity <= i.lowStockThreshold);
  return result;
}

export async function getInventory(variantId: string) {
  if (process.env.DATABASE_URL) {
    return prisma.inventory.findUnique({
      where: { variantId },
      include: { variant: { include: { product: { select: { name: true, images: true } } } } },
    });
  }
  return mockInventory.find((i) => i.variantId === variantId) ?? null;
}

export async function upsertInventory(data: InventoryInput, tenantId: string) {
  const parsed = inventorySchema.parse(data);
  if (process.env.DATABASE_URL) {
    return prisma.inventory.upsert({
      where: { variantId: parsed.variantId },
      update: { quantity: parsed.quantity, lowStockThreshold: parsed.lowStockThreshold, reorderLevel: parsed.reorderLevel },
      create: { ...parsed, tenantId },
    });
  }
  const idx = mockInventory.findIndex((i) => i.variantId === parsed.variantId);
  if (idx >= 0) {
    mockInventory[idx] = { ...mockInventory[idx], ...parsed, updatedAt: new Date() };
    return mockInventory[idx];
  }
  const entry = { id: `inv-${Date.now()}`, ...parsed, tenantId, updatedAt: new Date(), variant: { id: parsed.variantId, sku: "", product: { name: "", images: [] } } };
  mockInventory.push(entry);
  return entry;
}

export async function adjustStock(data: StockAdjustInput, userId?: string) {
  const parsed = stockAdjustSchema.parse(data);
  if (process.env.DATABASE_URL) {
    const inv = await prisma.inventory.findUnique({ where: { variantId: parsed.variantId } });
    if (!inv) throw new Error("Inventory record not found");
    const newQty = inv.quantity + parsed.change;
    if (newQty < 0) throw new Error("Insufficient stock");
    const [updated] = await Promise.all([
      prisma.inventory.update({
        where: { variantId: parsed.variantId },
        data: { quantity: newQty },
      }),
      prisma.inventoryLog.create({
        data: {
          variantId: parsed.variantId,
          change: parsed.change,
          reason: parsed.reason,
          previousQty: inv.quantity,
          newQty,
          userId,
        },
      }),
    ]);
    return updated;
  }
  const idx = mockInventory.findIndex((i) => i.variantId === parsed.variantId);
  if (idx === -1) throw new Error("Inventory record not found");
  const previousQty = mockInventory[idx].quantity;
  const newQty = previousQty + parsed.change;
  if (newQty < 0) throw new Error("Insufficient stock");
  mockInventory[idx].quantity = newQty;
  mockInventory[idx].updatedAt = new Date();
  return mockInventory[idx];
}
