import { NextRequest, NextResponse } from "next/server";
import { getTenantId, getUserId, handleError } from "@/lib/api-helpers";
import { rewardRuleSchema } from "@/lib/schemas/loyalty";
import { createRewardRule, getRewardRules } from "@/lib/services/loyalty";

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 20));

    const result = await getRewardRules(tenantId, {
      page,
      limit,
      isActive: sp.get("isActive") !== null ? sp.get("isActive") === "true" : undefined,
      eventType: sp.get("eventType") || undefined,
    });

    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const parsed = rewardRuleSchema.parse(body);

    const rule = await createRewardRule(tenantId, parsed, { userId });
    return NextResponse.json(rule, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
