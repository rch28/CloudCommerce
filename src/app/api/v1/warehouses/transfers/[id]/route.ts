import { NextRequest, NextResponse } from "next/server";
import { getTransfer, updateTransferStatus } from "@/lib/services/warehouse";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantId(_request);
    const { id } = await params;
    const record = await getTransfer(tenantId, id);
    if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(record);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await requirePermission(request, "update");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const { id } = await params;
    const body = await request.json();
    const result = await updateTransferStatus(tenantId, id, body.status, { userId });
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
