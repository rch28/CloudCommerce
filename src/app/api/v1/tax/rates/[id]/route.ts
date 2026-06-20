import { NextRequest, NextResponse } from "next/server";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import * as taxService from "@/lib/services/tax";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;
  try {
    const tenantId = await getTenantId(request);
    const { id } = await params;
    const rate = await taxService.getTaxRate(tenantId, id);
    if (!rate) return NextResponse.json({ error: "Tax rate not found" }, { status: 404 });
    return NextResponse.json(rate);
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
    const rate = await taxService.updateTaxRate(tenantId, id, body, { userId });
    return NextResponse.json(rate);
  } catch (e) { return handleError(e); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = requirePermission(request, "delete");
  if (forbidden) return forbidden;
  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const { id } = await params;
    await taxService.deleteTaxRate(tenantId, id, { userId });
    return NextResponse.json({ success: true });
  } catch (e) { return handleError(e); }
}
