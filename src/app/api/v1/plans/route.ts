import { NextResponse } from "next/server";
import { PLANS } from "@/lib/features";

export const dynamic = "force-dynamic";

export async function GET() {
  const plans = Object.values(PLANS).map((p) => ({
    slug: p.slug,
    name: p.name,
    price: p.price,
    maxProducts: p.maxProducts,
    maxStaff: p.maxStaff,
    analytics: p.analytics,
    customDomain: p.customDomain,
    realTimeSync: p.realTimeSync,
    apiAccess: p.apiAccess,
    prioritySupport: p.prioritySupport,
    features: p.featureKeys,
  }));
  return NextResponse.json(plans);
}
