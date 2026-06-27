import { NextRequest, NextResponse } from "next/server";
import { variantRepo } from "@/lib/services/variants";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const forbidden = await requirePermission(request, "update");
  if (forbidden) return forbidden;

  const { variantId } = await params;
  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const body = await request.json();
    const variant = await variantRepo.updateOne(variantId, body, { userId, tenantId });
    return NextResponse.json(variant);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const forbidden = await requirePermission(request, "delete");
  if (forbidden) return forbidden;

  const { variantId } = await params;
  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    await variantRepo.remove(variantId, { userId, tenantId });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
