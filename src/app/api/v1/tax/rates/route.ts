import { NextRequest, NextResponse } from "next/server";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import * as taxService from "@/lib/services/tax";

export async function GET(request: NextRequest) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;
  try {
    const tenantId = getTenantId(request);
    const sp = request.nextUrl.searchParams;
    const result = await taxService.getTaxRates(tenantId, {
      page: Number(sp.get("page")) || 1,
      pageSize: Number(sp.get("pageSize")) || 20,
      zoneId: sp.get("zoneId") || undefined,
    });
    return NextResponse.json(result);
  } catch (e) { return handleError(e); }
}

export async function POST(request: NextRequest) {
  const forbidden = requirePermission(request, "create");
  if (forbidden) return forbidden;
  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const rate = await taxService.createTaxRate(tenantId, body, { userId });
    return NextResponse.json(rate, { status: 201 });
  } catch (e) { return handleError(e); }
}
