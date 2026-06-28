import { NextRequest, NextResponse } from "next/server";
import { getTenantId, requirePermission, handleError } from "@/lib/api-helpers";
import { redeemPointsSchema } from "@/lib/schemas/loyalty";
import { redeemPoints } from "@/lib/services/loyalty";

export async function POST(request: NextRequest) {
  const forbidden = await requirePermission(request, "manage");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const parsed = redeemPointsSchema.parse(body);

    const result = await redeemPoints(tenantId, parsed.customerId, parsed.points, parsed.redemptionType);
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
