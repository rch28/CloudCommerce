import { NextRequest, NextResponse } from "next/server";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import * as taxService from "@/lib/services/tax";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;
  try {
    const tenantId = await getTenantId(request);
    const { id } = await params;
    const zone = await taxService.getTaxZone(tenantId, id);
    if (!zone) return NextResponse.json({ error: "Tax zone not found" }, { status: 404 });
    return NextResponse.json(zone);
  } catch (e) { return handleError(e); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = requirePermission(request, "update");
  if (forbidden) return forbidden;
  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const { id } = await params;
    const body = await request.json();
    const zone = await taxService.updateTaxZone(tenantId, id, body, { userId });
    return NextResponse.json(zone);
  } catch (e) { return handleError(e); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = requirePermission(request, "delete");
  if (forbidden) return forbidden;
  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const { id } = await params;
    await taxService.deleteTaxZone(tenantId, id, { userId });
    return NextResponse.json({ success: true });
  } catch (e) { return handleError(e); }
}
