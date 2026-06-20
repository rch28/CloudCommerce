import { NextRequest, NextResponse } from "next/server";
import { releaseStock } from "@/lib/services/warehouse";
import { releaseStockSchema } from "@/lib/schemas/warehouse";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const forbidden = requirePermission(request, "update");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const body = await request.json();
    const parsed = releaseStockSchema.parse(body);
    const result = await releaseStock(tenantId, parsed, { userId });
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
