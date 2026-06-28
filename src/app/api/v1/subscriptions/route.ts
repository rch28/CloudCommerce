import { NextRequest, NextResponse } from "next/server";
import { getSubscription, subscribe, changePlan, cancelSubscription } from "@/lib/services/subscriptions";
import { getTenantId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const forbidden = await requirePermission(req, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(req);
    const sub = await getSubscription(tenantId);
    return NextResponse.json(sub);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const forbidden = await requirePermission(req, "manage");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const { action, planSlug, trialDays } = body;

    if (action === "subscribe") {
      const sub = await subscribe(tenantId, planSlug, trialDays);
      return NextResponse.json(sub, { status: 201 });
    }
    if (action === "cancel") {
      const sub = await cancelSubscription(tenantId);
      return NextResponse.json(sub);
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: NextRequest) {
  const forbidden = await requirePermission(req, "manage");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const { planSlug } = body;
    if (!planSlug) return NextResponse.json({ error: "planSlug required" }, { status: 400 });
    const sub = await changePlan(tenantId, planSlug);
    return NextResponse.json(sub);
  } catch (e) {
    return handleError(e);
  }
}
