import { NextRequest, NextResponse } from "next/server";
import { allocateStock } from "@/lib/services/warehouse";
import { allocateInventorySchema } from "@/lib/schemas/warehouse";
import { getTenantId, requirePermission, handleError } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const forbidden = await requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const parsed = allocateInventorySchema.parse(body);
    const result = await allocateStock(tenantId, parsed.items, parsed.destination);
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
