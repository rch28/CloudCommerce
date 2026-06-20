import { NextRequest, NextResponse } from "next/server";
import { getTenantId, getUserId, handleError } from "@/lib/api-helpers";
import { rewardRuleSchema } from "@/lib/schemas/loyalty";
import { getRewardRule, updateRewardRule, deleteRewardRule } from "@/lib/services/loyalty";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = getTenantId(_request);
    const rule = await getRewardRule(tenantId, id);
    if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rule);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const parsed = rewardRuleSchema.partial().parse(body);
    const rule = await updateRewardRule(tenantId, id, parsed, { userId });
    return NextResponse.json(rule);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = getTenantId(_request);
    const userId = getUserId(_request);
    await deleteRewardRule(tenantId, id, { userId });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
