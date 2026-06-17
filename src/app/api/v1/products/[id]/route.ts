import { NextRequest, NextResponse } from "next/server";
import { getProduct, updateProduct, deleteProduct, archiveProduct } from "@/lib/services/products";
import { logAudit } from "@/lib/audit";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const product = await getProduct(id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = requirePermission(request, "update");
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const product = await updateProduct(id, body);
    await logAudit({ entityType: "product", entityId: id, action: "updated", changes: body, userId, tenantId });
    return NextResponse.json(product);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = requirePermission(request, "archive");
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const product = await archiveProduct(id);
    await logAudit({ entityType: "product", entityId: id, action: "archived", userId, tenantId });
    return NextResponse.json(product);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = requirePermission(request, "delete");
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    await deleteProduct(id);
    await logAudit({ entityType: "product", entityId: id, action: "deleted", userId, tenantId });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
