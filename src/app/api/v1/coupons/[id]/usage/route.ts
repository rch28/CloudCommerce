// src/app/api/v1/coupons/[id]/usage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTenantId, requirePermission, handleError } from "@/lib/api-helpers";
import { getUsageStats } from "@/lib/services/coupon-usage";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const params = await paramsPromise;
    const tenantId = getTenantId(request);
    const sp = request.nextUrl.searchParams;
    const page = Number(sp.get("page")) || 1;
    const pageSize = Number(sp.get("pageSize")) || 20;

    const result = await getUsageStats(tenantId, {
      couponId: params.id,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
