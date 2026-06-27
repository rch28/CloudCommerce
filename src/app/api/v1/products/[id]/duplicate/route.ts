import { NextRequest, NextResponse } from "next/server";
import { productRepo } from "@/lib/services/products";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await requirePermission(request, "create");
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const product = await productRepo.duplicate(id, { userId, tenantId });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
