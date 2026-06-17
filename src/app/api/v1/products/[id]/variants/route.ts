import { NextRequest, NextResponse } from "next/server";
import { listVariants, createVariant } from "@/lib/services/variants";
import { logAudit } from "@/lib/audit";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const variants = await listVariants(id);
    return NextResponse.json(variants);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = requirePermission(request, "create");
  if (forbidden) return forbidden;

  const { id } = await params;
  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const variant = await createVariant(id, body);
    await logAudit({ entityType: "variant", entityId: variant.id, action: "created", userId, tenantId });
    return NextResponse.json(variant, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
