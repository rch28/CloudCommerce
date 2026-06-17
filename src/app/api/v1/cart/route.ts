import { NextResponse } from "next/server";
import { getCart, addToCart, clearCart } from "@/lib/services/cart";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  const customerId = searchParams.get("customerId") ?? undefined;
  const sessionId = searchParams.get("sessionId") ?? undefined;
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  const cart = await getCart(tenantId, customerId, sessionId);
  return NextResponse.json(cart);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { tenantId, customerId, sessionId, ...data } = body;
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  try {
    const result = await addToCart(tenantId, data, customerId ?? undefined, sessionId ?? undefined);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId") ?? undefined;
  const sessionId = searchParams.get("sessionId") ?? undefined;
  await clearCart(customerId, sessionId);
  return NextResponse.json({ success: true });
}
