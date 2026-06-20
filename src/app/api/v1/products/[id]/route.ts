import { NextRequest, NextResponse } from "next/server";
import { productRepo } from "@/lib/services/products";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const product = await productRepo.getById(id);
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
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const body = await request.json();
    const product = await productRepo.updateOne(id, body, { userId, tenantId });
    return NextResponse.json(product);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = requirePermission(request, "update");
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const { action } = await request.json();

    let product;
    if (action === "archive") product = await productRepo.archive(id, { userId, tenantId });
    else if (action === "restore") product = await productRepo.restore(id, { userId, tenantId });
    else return NextResponse.json({ error: "Invalid action. Use 'archive' or 'restore'." }, { status: 400 });

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
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    await productRepo.remove(id, { userId, tenantId });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
