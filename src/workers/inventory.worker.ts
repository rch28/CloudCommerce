import { Worker } from "bullmq";
import { getQueueConnection } from "@/lib/queue/connection";
import { QUEUES } from "@/lib/queue/names";
import type { InventoryJobPayload } from "@/lib/queue/payloads";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/services/notifications";

export function createInventoryWorker(): Worker {
  const worker = new Worker<InventoryJobPayload>(
    QUEUES.INVENTORY,
    async (job) => {
      const payload = job.data;

      switch (payload.type) {
        case "sync":
          await syncVariantInventory(payload.variantId, payload.tenantId);
          break;

        case "adjust":
          await adjustVariantInventory(
            payload.variantId,
            payload.quantity,
            payload.reason,
            payload.tenantId,
            payload.userId,
            payload.orderId,
          );
          break;

        case "check_low_stock":
          if (payload.variantId) {
            await checkLowStock(payload.variantId, payload.tenantId);
          } else {
            await checkAllLowStock(payload.tenantId);
          }
          break;
      }
    },
    {
      connection: getQueueConnection(),
      concurrency: 5,
      lockDuration: 30000,
      stalledInterval: 15000,
      maxStalledCount: 3,
      removeOnComplete: { age: 60 * 60 * 24 },
      removeOnFail: { age: 60 * 60 * 24 * 3 },
    },
  );

  worker.on("completed", (job) => {
    logger.info("Inventory job completed", {
      metadata: { jobId: job.id, type: job.data.type },
    });
  });

  worker.on("failed", (job, err) => {
    logger.error("Inventory job failed", {
      error: err.message,
      metadata: { jobId: job?.id, type: job?.data?.type },
    });
  });

  return worker;
}

async function syncVariantInventory(variantId: string, tenantId: string): Promise<void> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { quantity: true },
  });
  if (!variant) {
    logger.warn("Inventory sync: variant not found", {
      metadata: { variantId, tenantId },
    });
    return;
  }

  await prisma.inventory.upsert({
    where: { variantId },
    update: { quantity: variant.quantity, updatedAt: new Date() },
    create: {
      variantId,
      tenantId,
      quantity: variant.quantity,
      reserved: 0,
      lowStockThreshold: 5,
      reorderLevel: 10,
    },
  });
}

async function adjustVariantInventory(
  variantId: string,
  quantity: number,
  reason: string,
  tenantId: string,
  userId?: string,
  orderId?: string,
): Promise<void> {
  const inv = await prisma.inventory.findUnique({ where: { variantId } });
  if (!inv) throw new Error("Inventory record not found");

  const newQty = inv.quantity + quantity;
  if (newQty < 0) throw new Error("Insufficient stock");

  await prisma.inventory.update({
    where: { variantId },
    data: { quantity: newQty },
  });

  await prisma.inventoryLog.create({
    data: {
      variantId,
      change: quantity,
      reason: orderId ? `${reason} (order ${orderId})` : reason,
      previousQty: inv.quantity,
      newQty,
    },
  });

  if (newQty <= inv.lowStockThreshold) {
    const product = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { name: true } } },
    });
    const productName = product?.product?.name ?? "Product";
    await createNotification(tenantId, {
      type: newQty <= 0 ? "inventory.out_of_stock" : "inventory.low_stock",
      title: newQty <= 0 ? `${productName} out of stock` : `${productName} low stock`,
      body: `${productName} has ${newQty} units remaining`,
      data: { variantId, productName, quantity: newQty, threshold: inv.lowStockThreshold, reason },
      channel: "in_app",
    });
  }
}

async function checkLowStock(variantId: string, tenantId: string): Promise<void> {
  const inv = await prisma.inventory.findUnique({
    where: { variantId },
    include: { variant: { include: { product: { select: { name: true } } } } },
  });
  if (!inv) return;

  if (inv.quantity <= inv.lowStockThreshold) {
    const productName = inv.variant?.product?.name ?? "Product";
    const notifType = inv.quantity <= 0 ? "inventory.out_of_stock" : "inventory.low_stock";
    await createNotification(tenantId, {
      type: notifType,
      title: inv.quantity <= 0 ? `${productName} out of stock` : `${productName} low stock`,
      body: `${productName} (SKU: ${inv.variant?.sku ?? ""}) has ${inv.quantity} units remaining`,
      data: { variantId, productName, quantity: inv.quantity, threshold: inv.lowStockThreshold },
      channel: "in_app",
    });
  }
}

async function checkAllLowStock(tenantId: string): Promise<void> {
  const lowItems = await prisma.inventory.findMany({
    where: { tenantId, quantity: { lte: prisma.inventory.fields.lowStockThreshold } },
    include: { variant: { include: { product: { select: { name: true } } } } },
  });

  for (const inv of lowItems) {
    const productName = inv.variant?.product?.name ?? "Product";
    const notifType = inv.quantity <= 0 ? "inventory.out_of_stock" : "inventory.low_stock";
    await createNotification(tenantId, {
      type: notifType,
      title: inv.quantity <= 0 ? `${productName} out of stock` : `${productName} low stock`,
      body: `${productName} (SKU: ${inv.variant?.sku ?? ""}) has ${inv.quantity} units remaining`,
      data: { variantId: inv.variantId, productName, quantity: inv.quantity, threshold: inv.lowStockThreshold },
      channel: "in_app",
    });
  }

  logger.info("Low stock check completed", {
    metadata: { tenantId, affectedCount: lowItems.length },
  });
}
