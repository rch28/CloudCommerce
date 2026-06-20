import { NextRequest, NextResponse } from "next/server";
import { reserveStock } from "@/lib/services/warehouse";
import { reserveStockSchema } from "@/lib/schemas/warehouse";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const forbidden = requirePermission(request, "update");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const parsed = reserveStockSchema.parse(body);
    const result = await reserveStock(tenantId, parsed, { userId });
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
