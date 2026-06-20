import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import type { RewardRuleInput } from "@/lib/schemas/loyalty";

export async function getOrCreateAccount(tenantId: string, customerId: string) {
  let account = await prisma.loyaltyAccount.findUnique({
    where: { customerId_tenantId: { customerId, tenantId } },
  });

  if (!account) {
    account = await prisma.loyaltyAccount.create({
      data: { tenantId, customerId, points: 0, lifetimePoints: 0 },
    });
  }

  await maybeUpgradeTier(account.id, account.lifetimePoints);

  return prisma.loyaltyAccount.findUnique({
    where: { id: account.id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

export async function getAccount(tenantId: string, customerId: string) {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { customerId_tenantId: { customerId, tenantId } },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!account) return null;

  return account;
}

export async function getAccountByCustomerId(customerId: string) {
  return prisma.loyaltyAccount.findUnique({
    where: { id: customerId },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

async function maybeUpgradeTier(accountId: string, lifetimePoints: number) {
  let tier = "bronze";
  if (lifetimePoints >= 10000) tier = "platinum";
  else if (lifetimePoints >= 5000) tier = "gold";
  else if (lifetimePoints >= 1000) tier = "silver";

  await prisma.loyaltyAccount.update({
    where: { id: accountId },
    data: { tier },
  });
}

export async function earnPoints(
  tenantId: string,
  customerId: string,
  eventType: string,
  referenceId?: string,
  description?: string,
) {
  const rule = await prisma.rewardRule.findFirst({
    where: {
      tenantId,
      eventType,
      isActive: true,
      startsAt: { lte: new Date() },
      OR: [
        { endsAt: null },
        { endsAt: { gte: new Date() } },
      ],
    },
  });
  if (!rule) return null;

  let account = await prisma.loyaltyAccount.findUnique({
    where: { customerId_tenantId: { customerId, tenantId } },
  });
  if (!account) {
    account = await prisma.loyaltyAccount.create({
      data: { tenantId, customerId, points: 0, lifetimePoints: 0 },
    });
  }

  const points = rule.points;

  const updated = await prisma.loyaltyAccount.update({
    where: { id: account.id },
    data: {
      points: { increment: points },
      lifetimePoints: { increment: points },
    },
  });

  await maybeUpgradeTier(account.id, updated.lifetimePoints);

  const transaction = await prisma.loyaltyTransaction.create({
    data: {
      accountId: account.id,
      tenantId,
      type: "earned",
      points,
      balanceBefore: account.points,
      balanceAfter: updated.points,
      referenceType: eventType,
      referenceId,
      description,
    },
  });

  await logAudit({
    entityType: "loyalty_account",
    entityId: account.id,
    action: "points_earned",
    changes: { points, eventType },
    userId: undefined,
    tenantId,
  });

  return transaction;
}

export async function earnPurchasePoints(
  tenantId: string,
  customerId: string,
  orderId: string,
  orderTotal: number,
) {
  const rule = await prisma.rewardRule.findFirst({
    where: {
      tenantId,
      eventType: "purchase",
      isActive: true,
      startsAt: { lte: new Date() },
      OR: [
        { endsAt: null },
        { endsAt: { gte: new Date() } },
      ],
    },
  });
  if (!rule) return null;

  let account = await prisma.loyaltyAccount.findUnique({
    where: { customerId_tenantId: { customerId, tenantId } },
  });
  if (!account) {
    account = await prisma.loyaltyAccount.create({
      data: { tenantId, customerId, points: 0, lifetimePoints: 0 },
    });
  }

  const baseUnit = 1;
  const points = rule.points * Math.floor(orderTotal / baseUnit);

  if (points <= 0) return null;

  const updated = await prisma.loyaltyAccount.update({
    where: { id: account.id },
    data: {
      points: { increment: points },
      lifetimePoints: { increment: points },
    },
  });

  await maybeUpgradeTier(account.id, updated.lifetimePoints);

  const transaction = await prisma.loyaltyTransaction.create({
    data: {
      accountId: account.id,
      tenantId,
      type: "earned",
      points,
      balanceBefore: account.points,
      balanceAfter: updated.points,
      referenceType: "purchase",
      referenceId: orderId,
      description: `Points earned from order`,
    },
  });

  await logAudit({
    entityType: "loyalty_account",
    entityId: account.id,
    action: "points_earned",
    changes: { points, eventType: "purchase", orderId },
    userId: undefined,
    tenantId,
  });

  return transaction;
}

export async function redeemPoints(
  tenantId: string,
  customerId: string,
  points: number,
  redemptionType: string,
) {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { customerId_tenantId: { customerId, tenantId } },
  });
  if (!account) throw new Error("Loyalty account not found");
  if (account.points < points) throw new Error("Insufficient points");

  const rule = await prisma.rewardRule.findFirst({
    where: {
      tenantId,
      type: redemptionType,
      isActive: true,
      minPoints: { lte: points },
      startsAt: { lte: new Date() },
      OR: [
        { endsAt: null },
        { endsAt: { gte: new Date() } },
      ],
    },
  });
  if (!rule) throw new Error("No matching redemption rule found");

  if (rule.maxRedemptions) {
    const redemptionCount = await prisma.loyaltyTransaction.count({
      where: {
        accountId: account.id,
        type: "redeemed",
        referenceType: redemptionType,
      },
    });
    if (redemptionCount >= rule.maxRedemptions) {
      throw new Error("Maximum redemptions reached for this rule");
    }
  }

  const updated = await prisma.loyaltyAccount.update({
    where: { id: account.id },
    data: { points: { decrement: points } },
  });

  const transaction = await prisma.loyaltyTransaction.create({
    data: {
      accountId: account.id,
      tenantId,
      type: "redeemed",
      points,
      balanceBefore: account.points,
      balanceAfter: updated.points,
      referenceType: redemptionType,
      description: `Redeemed ${points} points`,
    },
  });

  const redemptionValue = rule.value ? Number(rule.value) : null;
  const redemptionValueType = rule.valueType ?? null;

  await logAudit({
    entityType: "loyalty_account",
    entityId: account.id,
    action: "points_redeemed",
    changes: { points, redemptionType, redemptionValue, redemptionValueType },
    userId: undefined,
    tenantId,
  });

  return {
    transaction,
    code: `LOY-${Date.now().toString(36).toUpperCase()}`,
    value: redemptionValue,
    valueType: redemptionValueType,
  };
}

export async function getRedeemableDiscount(tenantId: string, customerId: string) {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { customerId_tenantId: { customerId, tenantId } },
  });
  if (!account) return null;

  const rules = await prisma.rewardRule.findMany({
    where: {
      tenantId,
      type: "redeem_discount",
      isActive: true,
      startsAt: { lte: new Date() },
      OR: [
        { endsAt: null },
        { endsAt: { gte: new Date() } },
      ],
    },
  });

  return rules
    .filter((r) => !r.minPoints || account.points >= r.minPoints)
    .map((r) => ({
      id: r.id,
      name: r.name,
      pointsRequired: r.points,
      value: r.value ? Number(r.value) : null,
      valueType: r.valueType,
      eligible: !r.minPoints || account.points >= r.minPoints,
    }));
}

export async function getFreeShippingEligibility(tenantId: string, customerId: string) {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { customerId_tenantId: { customerId, tenantId } },
  });
  if (!account) return { eligible: false, pointsRequired: 0 };

  const rule = await prisma.rewardRule.findFirst({
    where: {
      tenantId,
      type: "redeem_free_shipping",
      isActive: true,
      startsAt: { lte: new Date() },
      OR: [
        { endsAt: null },
        { endsAt: { gte: new Date() } },
      ],
    },
  });

  if (!rule) return { eligible: false, pointsRequired: 0 };

  return {
    eligible: account.points >= (rule.minPoints ?? rule.points),
    pointsRequired: rule.minPoints ?? rule.points,
  };
}

export async function getRewardRules(
  tenantId: string,
  params?: { page?: number; limit?: number; isActive?: boolean; eventType?: string },
) {
  const page = Math.max(1, params?.page ?? 1);
  const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { tenantId };
  if (params?.isActive !== undefined) where.isActive = params.isActive;
  if (params?.eventType) where.eventType = params.eventType;

  const [items, total] = await Promise.all([
    prisma.rewardRule.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.rewardRule.count({ where }),
  ]);

  return {
    items: items.map((r) => ({
      ...r,
      value: r.value ? Number(r.value) : null,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getRewardRule(tenantId: string, id: string) {
  const rule = await prisma.rewardRule.findFirst({ where: { id, tenantId } });
  if (!rule) return null;
  return {
    ...rule,
    value: rule.value ? Number(rule.value) : null,
  };
}

export async function createRewardRule(
  tenantId: string,
  data: RewardRuleInput,
  meta?: { userId?: string },
) {
  const rule = await prisma.rewardRule.create({
    data: {
      tenantId,
      name: data.name,
      type: data.type,
      eventType: data.eventType,
      points: data.points,
      value: data.value ?? null,
      valueType: data.valueType ?? null,
      minPoints: data.minPoints ?? null,
      maxRedemptions: data.maxRedemptions ?? null,
      isActive: data.isActive,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
    },
  });

  await logAudit({
    entityType: "reward_rule",
    entityId: rule.id,
    action: "created",
    changes: data as unknown as Record<string, unknown>,
    userId: meta?.userId,
    tenantId,
  });

  return { ...rule, value: rule.value ? Number(rule.value) : null };
}

export async function updateRewardRule(
  tenantId: string,
  id: string,
  data: Partial<RewardRuleInput>,
  meta?: { userId?: string },
) {
  const existing = await prisma.rewardRule.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error("Reward rule not found");

  const rule = await prisma.rewardRule.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.eventType !== undefined && { eventType: data.eventType }),
      ...(data.points !== undefined && { points: data.points }),
      ...(data.value !== undefined && { value: data.value }),
      ...(data.valueType !== undefined && { valueType: data.valueType }),
      ...(data.minPoints !== undefined && { minPoints: data.minPoints }),
      ...(data.maxRedemptions !== undefined && { maxRedemptions: data.maxRedemptions }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.startsAt !== undefined && { startsAt: data.startsAt ? new Date(data.startsAt) : null }),
      ...(data.endsAt !== undefined && { endsAt: data.endsAt ? new Date(data.endsAt) : null }),
    },
  });

  await logAudit({
    entityType: "reward_rule",
    entityId: id,
    action: "updated",
    changes: data as unknown as Record<string, unknown>,
    userId: meta?.userId,
    tenantId,
  });

  return { ...rule, value: rule.value ? Number(rule.value) : null };
}

export async function deleteRewardRule(tenantId: string, id: string, meta?: { userId?: string }) {
  const existing = await prisma.rewardRule.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error("Reward rule not found");

  await prisma.rewardRule.delete({ where: { id } });

  await logAudit({
    entityType: "reward_rule",
    entityId: id,
    action: "deleted",
    changes: { name: existing.name },
    userId: meta?.userId,
    tenantId,
  });
}

export async function getTransactionHistory(
  tenantId: string,
  customerId: string,
  params?: { page?: number; limit?: number },
) {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { customerId_tenantId: { customerId, tenantId } },
  });
  if (!account) return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };

  const page = Math.max(1, params?.page ?? 1);
  const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.loyaltyTransaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.loyaltyTransaction.count({ where: { accountId: account.id } }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getAllTransactions(
  tenantId: string,
  params?: { page?: number; limit?: number; type?: string; customerId?: string },
) {
  const page = Math.max(1, params?.page ?? 1);
  const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { tenantId };
  if (params?.type) where.type = params.type;
  if (params?.customerId) {
    const account = await prisma.loyaltyAccount.findUnique({
      where: { customerId_tenantId: { customerId: params.customerId, tenantId } },
      select: { id: true },
    });
    if (account) where.accountId = account.id;
    else return { items: [], total: 0, page, limit, totalPages: 0 };
  }

  const [items, total] = await Promise.all([
    prisma.loyaltyTransaction.findMany({
      where,
      include: {
        account: {
          select: { customerId: true, customer: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.loyaltyTransaction.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getAccountWithLifetimePoints(tenantId: string, customerId: string) {
  return prisma.loyaltyAccount.findUnique({
    where: { customerId_tenantId: { customerId, tenantId } },
  });
}
