import { NextRequest, NextResponse } from "next/server";
import { getTenantId, requirePermission, handleError } from "@/lib/api-helpers";
import * as taxService from "@/lib/services/tax";

export async function POST(request: NextRequest) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;
  try {
    const tenantId = getTenantId(request);
    const body = await request.json();
    const result = await taxService.calculateTax(tenantId, body);
    return NextResponse.json(result);
  } catch (e) { return handleError(e); }
}
