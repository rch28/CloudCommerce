export interface PlanFeatures {
  maxProducts: number;
  maxStaff: number;
  analytics: "none" | "basic" | "advanced";
  customDomain: boolean;
  realTimeSync: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  featureKeys: string[];
}

export const PLANS = {
  starter: {
    slug: "starter",
    name: "Starter",
    price: 29,
    maxProducts: 100,
    maxStaff: 1,
    analytics: "basic" as const,
    customDomain: false,
    realTimeSync: false,
    apiAccess: false,
    prioritySupport: false,
    featureKeys: ["basic_analytics", "email_support", "100_products"],
  },
  growth: {
    slug: "growth",
    name: "Growth",
    price: 79,
    maxProducts: 1000,
    maxStaff: 5,
    analytics: "advanced" as const,
    customDomain: true,
    realTimeSync: true,
    apiAccess: false,
    prioritySupport: false,
    featureKeys: ["advanced_analytics", "email_support", "1000_products", "custom_domain", "real_time_sync"],
  },
  enterprise: {
    slug: "enterprise",
    name: "Enterprise",
    price: 199,
    maxProducts: -1,
    maxStaff: -1,
    analytics: "advanced" as const,
    customDomain: true,
    realTimeSync: true,
    apiAccess: true,
    prioritySupport: true,
    featureKeys: ["*"],
  },
} satisfies Record<string, PlanFeatures & { slug: string; name: string; price: number }>;

export type PlanSlug = keyof typeof PLANS;

export function hasFeature(planSlug: string | undefined, feature: string): boolean {
  if (!planSlug) return false;
  const plan = PLANS[planSlug as PlanSlug];
  if (!plan) return false;
  return plan.featureKeys.includes("*") || plan.featureKeys.includes(feature);
}

export function getFeatures(planSlug: string) {
  const plan = PLANS[planSlug as PlanSlug];
  if (!plan) return PLANS.starter.featureKeys;
  return plan.featureKeys;
}

export function getPlanLimits(planSlug: string) {
  const plan = PLANS[planSlug as PlanSlug];
  if (!plan) return { maxProducts: 0, maxStaff: 0 };
  return { maxProducts: plan.maxProducts, maxStaff: plan.maxStaff };
}
