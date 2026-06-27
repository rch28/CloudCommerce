import { NextRequest, NextResponse } from "next/server";
import { variantRepo } from "@/lib/services/variants";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const variants = await variantRepo.listByProduct(id);
    return NextResponse.json(variants);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await requirePermission(request, "create");
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const body = await request.json();
    const variant = await variantRepo.createOne(id, body, { userId, tenantId });
    return NextResponse.json(variant, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
