import { NextRequest, NextResponse } from "next/server";
import { listOrders, getOrder, createOrder, updateOrderStatus } from "@/lib/services/orders";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  const customerId = searchParams.get("customerId") ?? undefined;
  const id = searchParams.get("id");
  const status = searchParams.get("status") ?? "all";
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  if (id) {
    const order = await getOrder(id);
    return NextResponse.json(order ?? { error: "Not found" }, { status: order ? 200 : 404 });
  }
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const { listMerchantOrders } = await import("@/lib/services/orders");
  const result = await listMerchantOrders(tenantId, { search, status, page, limit, customerId });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { tenantId, ...data } = body;
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  try {
    const order = await createOrder(data, tenantId);
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, status, tenantId } = body;
  if (!id || !status || !tenantId) return NextResponse.json({ error: "id, status, tenantId required" }, { status: 400 });
  try {
    const order = await updateOrderStatus(id, status, tenantId);
    return NextResponse.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
