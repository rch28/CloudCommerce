import { NextRequest, NextResponse } from "next/server";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";
import { getBanner, updateBanner, deleteBanner } from "@/lib/services/cms";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const banner = await getBanner(id);
    if (!banner) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(banner);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await requirePermission(request, "update");
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const body = await request.json();
    const banner = await updateBanner(id, body, { userId, tenantId });
    return NextResponse.json(banner);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await requirePermission(request, "delete");
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    await deleteBanner(id, { userId, tenantId });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
