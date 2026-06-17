import { NextRequest, NextResponse } from "next/server";
import { updateVariant, deleteVariant } from "@/lib/services/variants";
import { logAudit } from "@/lib/audit";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const forbidden = requirePermission(request, "update");
  if (forbidden) return forbidden;

  const { variantId } = await params;
  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const variant = await updateVariant(variantId, body);
    await logAudit({ entityType: "variant", entityId: variantId, action: "updated", changes: body, userId, tenantId });
    return NextResponse.json(variant);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const forbidden = requirePermission(request, "delete");
  if (forbidden) return forbidden;

  const { variantId } = await params;
  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    await deleteVariant(variantId);
    await logAudit({ entityType: "variant", entityId: variantId, action: "deleted", userId, tenantId });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
