import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/services/settings";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const settings = await getSettings(tenantId);
    return NextResponse.json(settings);
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(request: NextRequest) {
  const forbidden = requirePermission(request, "update");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const result = await updateSettings(tenantId, body, userId);
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
