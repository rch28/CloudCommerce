import { NextRequest, NextResponse } from "next/server";
import { getVariantStock } from "@/lib/services/warehouse";
import { getTenantId, handleError } from "@/lib/api-helpers";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ variantId: string }> }) {
  try {
    const tenantId = getTenantId(_request);
    const { variantId } = await params;
    const result = await getVariantStock(tenantId, variantId);
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
