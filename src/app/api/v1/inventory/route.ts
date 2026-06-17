import { NextRequest, NextResponse } from "next/server";
import { listInventory, adjustStock } from "@/lib/services/inventory";
import { logAudit } from "@/lib/audit";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const lowStock = request.nextUrl.searchParams.get("lowStock") === "true";
    const inventory = await listInventory(tenantId, lowStock || undefined);
    return NextResponse.json(inventory);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(request: NextRequest) {
  const forbidden = requirePermission(request, "update");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();
    const result = await adjustStock(body, userId);
    await logAudit({
      entityType: "inventory",
      entityId: result.id,
      action: "stock_adjusted",
      changes: body,
      userId,
      tenantId,
    });
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
