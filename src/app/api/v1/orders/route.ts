import { NextResponse } from "next/server";
import { listOrders, getOrder, createOrder, updateOrderStatus } from "@/lib/services/orders";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  const customerId = searchParams.get("customerId") ?? undefined;
  const id = searchParams.get("id");
  if (id) {
    const order = await getOrder(id);
    return NextResponse.json(order ?? { error: "Not found" }, { status: order ? 200 : 404 });
  }
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  const orders = await listOrders(tenantId, customerId);
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { tenantId, ...data } = body;
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  try {
    const order = await createOrder(data, tenantId);
    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, status, tenantId } = body;
  if (!id || !status || !tenantId) return NextResponse.json({ error: "id, status, tenantId required" }, { status: 400 });
  try {
    const order = await updateOrderStatus(id, status, tenantId);
    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
