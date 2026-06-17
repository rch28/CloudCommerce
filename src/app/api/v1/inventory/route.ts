import { NextRequest, NextResponse } from "next/server";
import { listInventory, adjustStock, reserveStock, releaseStock, upsertInventory, getInventoryAlerts } from "@/lib/services/inventory";
import { logAudit } from "@/lib/audit";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const sp = request.nextUrl.searchParams;
    const alerts = sp.get("alerts") === "true";

    if (alerts) {
      const result = await getInventoryAlerts(tenantId);
      return NextResponse.json(result);
    }

    const filter: { lowStock?: boolean; outOfStock?: boolean } = {};
    if (sp.get("lowStock") === "true") filter.lowStock = true;
    if (sp.get("outOfStock") === "true") filter.outOfStock = true;

    const inventory = await listInventory(tenantId, Object.keys(filter).length > 0 ? filter : undefined);
    return NextResponse.json(inventory);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  const forbidden = requirePermission(request, "create");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const userId = getUserId(request);
    const body = await request.json();

    if (body.action === "reserve") {
      const result = await reserveStock(body, userId);
      return NextResponse.json(result);
    }
    if (body.action === "release") {
      const result = await releaseStock(body, userId);
      return NextResponse.json(result);
    }

    const result = await upsertInventory(body, tenantId, userId);
    await logAudit({
      entityType: "inventory", entityId: result.variantId,
      action: "stock_adjusted", changes: body, userId, tenantId,
    });
    return NextResponse.json(result, { status: 201 });
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
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
