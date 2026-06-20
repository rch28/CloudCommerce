import { NextRequest, NextResponse } from "next/server";
import { getWarehouseInventory, adjustStock, setLowStockThreshold } from "@/lib/services/warehouse";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getTenantId(request);
    const { id } = await params;
    const sp = request.nextUrl.searchParams;
    const result = await getWarehouseInventory(tenantId, id, {
      page: parseInt(sp.get("page") ?? "1", 10),
      pageSize: parseInt(sp.get("pageSize") ?? "20", 10),
    });
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = requirePermission(request, "update");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const { id: warehouseId } = await params;
    const body = await request.json();

    if (body.action === "setThreshold") {
      const result = await setLowStockThreshold(tenantId, warehouseId, body.variantId, body.threshold);
      return NextResponse.json(result);
    }

    const result = await adjustStock(tenantId, warehouseId, body.variantId, body.quantity, body.reason || "Manual adjustment", { userId });
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}
