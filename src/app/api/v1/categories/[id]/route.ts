import { NextRequest, NextResponse } from "next/server";
import { getCategory, updateCategory, deleteCategory } from "@/lib/services/categories";
import { requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const category = await getCategory(id);
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
    const body = await request.json();
    const category = await updateCategory(id, body);
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
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
