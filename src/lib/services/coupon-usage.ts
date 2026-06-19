import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

interface UsageMeta {
  orderId: string;
  couponId?: string;
  promotionId?: string;
  customerId?: string;
  discountAmount: number;
  discountType: string;
  discountCode?: string;
  tenantId: string;
  userId?: string;
}

export async function recordUsage(meta: UsageMeta): Promise<void> {
  await prisma.promotionUsage.create({
    data: {
      promotionId: meta.promotionId ?? null,
      couponId: meta.couponId ?? null,
      orderId: meta.orderId,
      customerId: meta.customerId ?? null,
      discountAmount: meta.discountAmount,
      discountType: meta.discountType,
      discountCode: meta.discountCode ?? null,
      tenantId: meta.tenantId,
    },
  });

  if (meta.couponId) {
    await prisma.coupon.update({
      where: { id: meta.couponId },
      data: { currentUses: { increment: 1 } },
    });
  }

  await logAudit({
    entityType: "promotion_usage",
    entityId: meta.orderId,
    action: "discount_applied",
    changes: {
      couponId: meta.couponId,
      promotionId: meta.promotionId,
      discountAmount: meta.discountAmount,
      discountType: meta.discountType,
      discountCode: meta.discountCode,
    },
    userId: meta.userId,
    tenantId: meta.tenantId,
  });
}

export async function getUsageStats(
  tenantId: string,
  options?: { couponId?: string; promotionId?: string; from?: Date; to?: Date; page?: number; pageSize?: number },
) {
  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.min(100, Math.max(1, options?.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { tenantId };
  if (options?.couponId) where.couponId = options.couponId;
  if (options?.promotionId) where.promotionId = options.promotionId;
  if (options?.from || options?.to) {
    const createdAt: Record<string, Date> = {};
    if (options.from) createdAt.gte = options.from;
    if (options.to) createdAt.lte = options.to;
    where.createdAt = createdAt;
  }

  const [items, total] = await Promise.all([
    prisma.promotionUsage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.promotionUsage.count({ where }),
  ]);

  return {
    items: items.map((i) => ({
      ...i,
      discountAmount: Number(i.discountAmount),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAggregateUsageStats(tenantId: string) {
  const usages = await prisma.promotionUsage.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const totalDiscount = usages.reduce((sum, u) => sum + Number(u.discountAmount), 0);
  const totalOrders = new Set(usages.map((u) => u.orderId)).size;
  const byType: Record<string, { count: number; total: number }> = {};

  for (const u of usages) {
    if (!byType[u.discountType]) byType[u.discountType] = { count: 0, total: 0 };
    byType[u.discountType].count++;
    byType[u.discountType].total += Number(u.discountAmount);
  }

  return {
    totalDiscount,
    totalOrders,
    totalUsages: usages.length,
    byType,
  };
}
