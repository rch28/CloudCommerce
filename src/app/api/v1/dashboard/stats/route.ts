import { NextRequest, NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/services/dashboard";
import { getTenantId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const forbidden = await requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(request);
    const data = await getDashboardStats(tenantId);
    return NextResponse.json(data);
  } catch (e) {
    return handleError(e);
  }
}
