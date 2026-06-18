import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { getCartByCustomer, getCartBySession, clearUserCart, addToCart, removeFromCart } from "@/lib/services/cart";
import { calculatePricing } from "@/lib/services/pricing";

function getSessionId(request: Request): string | null {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/cc_cart_session=([^;]+)/);
  return match ? match[1] : null;
}

async function resolveCart(tenantId: string, sessionId: string | null, customerId?: string) {
  if (customerId) {
    const cart = await getCartByCustomer(customerId, tenantId);
    if (cart) return cart;
  }
  if (sessionId) {
    const cart = await getCartBySession(sessionId, tenantId);
    if (cart) return cart;
  }
  return { id: "", items: [], pricing: calculatePricing([]), itemCount: 0 };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const session = await getSessionUser();
  const sessionId = getSessionId(request);

  let customerId: string | undefined;
  if (session && session.role === "customer") {
    const customer = await prisma.customer.findUnique({
      where: { email_tenantId: { email: session.email, tenantId: session.tenantId! } },
    });
    customerId = customer?.id;
  }

  const cart = await resolveCart(tenantId, sessionId, customerId);
  return NextResponse.json(cart);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { tenantId, variantId, quantity = 1, price } = body;
  if (!tenantId || !variantId) {
    return NextResponse.json({ error: "tenantId and variantId required" }, { status: 400 });
  }

  const session = await getSessionUser();
  const sessionId = getSessionId(request);

  let customerId: string | null = null;
  if (session && session.role === "customer") {
    const customer = await prisma.customer.findUnique({
      where: { email_tenantId: { email: session.email, tenantId: session.tenantId! } },
    });
    customerId = customer?.id ?? null;
  }

  try {
    const item = await addToCart(customerId, sessionId, tenantId, variantId, quantity, price ?? 0);
    return NextResponse.json(item, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const variantId = searchParams.get("variantId");

  const session = await getSessionUser();
  const sessionId = getSessionId(request);

  let customerId: string | null = null;
  if (session && session.role === "customer" && tenantId) {
    const customer = await prisma.customer.findUnique({
      where: { email_tenantId: { email: session.email, tenantId: session.tenantId! } },
    });
    customerId = customer?.id ?? null;
  }

  if (variantId) {
    await removeFromCart(customerId, sessionId, variantId);
    return NextResponse.json({ success: true });
  }

  await clearUserCart(customerId, sessionId);
  return NextResponse.json({ success: true });
}
