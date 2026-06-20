import { prisma } from "@/lib/prisma";
import { PLANS, type PlanSlug } from "@/lib/features";
import { getProvider } from "@/lib/payments";
import { logAudit } from "@/lib/audit";

interface MockSubscription {
  id: string; tenantId: string; planId: string; planSlug: string; planName: string; planPrice: number;
  status: string; currentPeriodStart: Date; currentPeriodEnd: Date;
  canceledAt: Date | null; trialEndsAt: Date | null;
  createdAt: Date; updatedAt: Date;
}

interface MockPayment {
  id: string; subscriptionId: string; tenantId: string; amount: number; currency: string;
  status: string; provider: string; providerPaymentId: string | null;
  invoiceUrl: string | null; description: string | null;
  createdAt: Date; updatedAt: Date;
}

const mockSubscriptions: MockSubscription[] = [];
const mockPayments: MockPayment[] = [];

function getPlanId(planSlug: string): string {
  const plan = PLANS[planSlug as PlanSlug];
  if (!plan) throw new Error(`Unknown plan: ${planSlug}`);
  return `plan-${plan.slug}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function getSubscription(tenantId: string) {
  if (process.env.DATABASE_URL) {
    let sub = await prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true, payments: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
    if (!sub) {
      const starterPlan = await prisma.plan.findUnique({ where: { slug: "starter" } });
      if (starterPlan) {
        sub = await prisma.subscription.create({
          data: {
            tenantId,
            planId: starterPlan.id,
            status: "active",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          include: { plan: true, payments: { orderBy: { createdAt: "desc" }, take: 10 } },
        });
      }
    }
    return sub ? { ...sub, planSlug: sub.plan.slug, planName: sub.plan.name, planPrice: Number(sub.plan.price) } : null;
  }
  const sub = mockSubscriptions.find((s) => s.tenantId === tenantId);
  if (!sub) {
    const mock = createMockSubscription(tenantId, "starter");
    mockSubscriptions.push(mock);
    return mock;
  }
  return sub;
}

function createMockSubscription(tenantId: string, planSlug: string): MockSubscription {
  return {
    id: `sub-${Date.now()}`, tenantId, planId: getPlanId(planSlug),
    planSlug, planName: PLANS[planSlug as PlanSlug]?.name || planSlug,
    planPrice: PLANS[planSlug as PlanSlug]?.price || 0,
    status: "active",
    currentPeriodStart: new Date(),
    currentPeriodEnd: addDays(new Date(), 30),
    canceledAt: null, trialEndsAt: null,
    createdAt: new Date(), updatedAt: new Date(),
  };
}

export async function subscribe(tenantId: string, planSlug: string, trialDays?: number) {
  const plan = PLANS[planSlug as PlanSlug];
  if (!plan) throw new Error(`Unknown plan: ${planSlug}`);

  if (process.env.DATABASE_URL) {
    const existing = await prisma.subscription.findUnique({ where: { tenantId } });
    if (existing) throw new Error("Tenant already has a subscription");

    const sub = await prisma.subscription.create({
      data: {
        tenantId, planId: getPlanId(planSlug),
        status: trialDays ? "trialing" : "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: addDays(new Date(), trialDays || 30),
        trialEndsAt: trialDays ? addDays(new Date(), trialDays) : null,
      },
      include: { plan: true },
    });
    await logAudit({
      entityType: "subscription", entityId: sub.id, action: "subscribed",
      changes: { plan: planSlug, trial: trialDays }, tenantId,
    });
    return { ...sub, planSlug: sub.plan.slug, planName: sub.plan.name, planPrice: Number(sub.plan.price) };
  }

  const idx = mockSubscriptions.findIndex((s) => s.tenantId === tenantId);
  if (idx >= 0) throw new Error("Tenant already has a subscription");

  const mock = createMockSubscription(tenantId, planSlug);
  if (trialDays) { mock.status = "trialing"; mock.trialEndsAt = addDays(new Date(), trialDays); }
  mockSubscriptions.push(mock);
  return mock;
}

export async function changePlan(tenantId: string, newPlanSlug: string) {
  const plan = PLANS[newPlanSlug as PlanSlug];
  if (!plan) throw new Error(`Unknown plan: ${newPlanSlug}`);

  const isUpgrade = (current: string, next: string) => {
    const keys = Object.keys(PLANS);
    return keys.indexOf(next) > keys.indexOf(current);
  };

  if (process.env.DATABASE_URL) {
    let sub = await prisma.subscription.findUnique({ where: { tenantId }, include: { plan: true } });
    if (!sub) {
      const starterPlan = await prisma.plan.findUnique({ where: { slug: "starter" } });
      if (!starterPlan) throw new Error("No plan found");
      sub = await prisma.subscription.create({
        data: {
          tenantId,
          planId: starterPlan.id,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        include: { plan: true },
      });
    }
    if (sub.status !== "active" && sub.status !== "trialing") throw new Error("Subscription is not active");

    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        planId: getPlanId(newPlanSlug),
        currentPeriodEnd: addDays(new Date(), 30),
      },
      include: { plan: true },
    });

    const action = isUpgrade(sub.plan.slug, newPlanSlug) ? "upgraded" : "downgraded";
    await logAudit({
      entityType: "subscription", entityId: sub.id, action: action as any,
      changes: { from: sub.plan.slug, to: newPlanSlug }, tenantId,
    });
    return { ...updated, planSlug: updated.plan.slug, planName: updated.plan.name, planPrice: Number(updated.plan.price) };
  }

  const idx = mockSubscriptions.findIndex((s) => s.tenantId === tenantId);
  if (idx < 0) throw new Error("No active subscription");
  if (mockSubscriptions[idx].status !== "active" && mockSubscriptions[idx].status !== "trialing") {
    throw new Error("Subscription is not active");
  }
  mockSubscriptions[idx].planId = getPlanId(newPlanSlug);
  mockSubscriptions[idx].planSlug = newPlanSlug;
  mockSubscriptions[idx].planName = plan.name;
  mockSubscriptions[idx].planPrice = plan.price;
  mockSubscriptions[idx].currentPeriodEnd = addDays(new Date(), 30);
  mockSubscriptions[idx].updatedAt = new Date();
  return mockSubscriptions[idx];
}

export async function cancelSubscription(tenantId: string) {
  if (process.env.DATABASE_URL) {
    let sub = await prisma.subscription.findUnique({ where: { tenantId } });
    if (!sub) {
      const starterPlan = await prisma.plan.findUnique({ where: { slug: "starter" } });
      if (!starterPlan) throw new Error("No plan found");
      sub = await prisma.subscription.create({
        data: {
          tenantId,
          planId: starterPlan.id,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "canceled", canceledAt: new Date() },
      include: { plan: true },
    });
    await logAudit({
      entityType: "subscription", entityId: sub.id, action: "canceled",
      changes: { status: "canceled" }, tenantId,
    });
    return { ...updated, planSlug: updated.plan.slug, planName: updated.plan.name, planPrice: Number(updated.plan.price) };
  }

  const idx = mockSubscriptions.findIndex((s) => s.tenantId === tenantId);
  if (idx < 0) throw new Error("No active subscription");
  mockSubscriptions[idx].status = "canceled";
  mockSubscriptions[idx].canceledAt = new Date();
  mockSubscriptions[idx].updatedAt = new Date();
  return mockSubscriptions[idx];
}

export async function listPayments(tenantId: string) {
  if (process.env.DATABASE_URL) {
    return prisma.payment.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
  return mockPayments.filter((p) => p.tenantId === tenantId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function recordPayment(tenantId: string, subscriptionId: string, amount: number, provider: string, opts?: { invoiceUrl?: string; description?: string }) {
  if (process.env.DATABASE_URL) {
    const payment = await prisma.payment.create({
      data: {
        subscriptionId, tenantId, amount, provider,
        status: "succeeded",
        providerPaymentId: `pay_${Date.now()}`,
        invoiceUrl: opts?.invoiceUrl ?? null,
        description: opts?.description ?? null,
      },
    });
    await logAudit({
      entityType: "payment", entityId: payment.id, action: "payment_received",
      changes: { amount, provider }, tenantId,
    });
    return payment;
  }
  const payment: MockPayment = {
    id: `pay-${Date.now()}`, subscriptionId, tenantId, amount, currency: "usd",
    status: "succeeded", provider, providerPaymentId: `pay_${Date.now()}`,
    invoiceUrl: opts?.invoiceUrl ?? null, description: opts?.description ?? null,
    createdAt: new Date(), updatedAt: new Date(),
  };
  mockPayments.push(payment);
  return payment;
}
