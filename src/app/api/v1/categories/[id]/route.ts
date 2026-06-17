import { NextRequest, NextResponse } from "next/server";
import { categoryRepo } from "@/lib/services/categories";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const category = await categoryRepo.getById(id);
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(category);
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
    const category = await categoryRepo.updateOne(id, body, { userId, tenantId });
    return NextResponse.json(category);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = requirePermission(request, "update");
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const { action } = await request.json();

    let category;
    if (action === "archive") category = await categoryRepo.archive(id, { userId, tenantId });
    else if (action === "restore") category = await categoryRepo.restore(id, { userId, tenantId });
    else return NextResponse.json({ error: "Invalid action. Use 'archive' or 'restore'." }, { status: 400 });

    return NextResponse.json(category);
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
    await categoryRepo.remove(id, { userId, tenantId });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
