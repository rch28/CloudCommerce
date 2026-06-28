import { NextRequest, NextResponse } from "next/server";
import { createOrder, updateOrderStatus, listMerchantOrders } from "@/lib/services/orders";
import { getTenantId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const forbidden = await requirePermission(req, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(req);
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId") ?? undefined;
    const status = searchParams.get("status") ?? "all";
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

    const result = await listMerchantOrders(tenantId, { search, status, page, limit, customerId });
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  const forbidden = await requirePermission(req, "manage");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const order = await createOrder(body, tenantId);
    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: NextRequest) {
  const forbidden = await requirePermission(req, "manage");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(req);
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }
    const order = await updateOrderStatus(id, status, tenantId);
    return NextResponse.json(order);
  } catch (e) {
    return handleError(e);
  }
}
