import { NextRequest, NextResponse } from "next/server";
import { getWarehouse, updateWarehouse, deleteWarehouse } from "@/lib/services/warehouse";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = getTenantId(_request);
    const { id } = await params;
    const record = await getWarehouse(tenantId, id);
    if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(record);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = requirePermission(request, "update");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const { id } = await params;
    const body = await request.json();
    const record = await updateWarehouse(tenantId, id, body, { userId });
    return NextResponse.json(record);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = requirePermission(request, "delete");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const { id } = await params;
    await deleteWarehouse(tenantId, id, { userId });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
