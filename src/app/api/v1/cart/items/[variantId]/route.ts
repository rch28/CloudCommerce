import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { updateCartItemQuantity, removeFromCart } from "@/lib/services/cart";

function getSessionId(request: Request): string | null {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/cc_cart_session=([^;]+)/);
  return match ? match[1] : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ variantId: string }> },
) {
  const { variantId } = await params;
  const body = await request.json();
  const { quantity, tenantId } = body;

  if (quantity === undefined || quantity < 1) {
    return NextResponse.json({ error: "quantity must be at least 1" }, { status: 400 });
  }

  const session = await getSessionUser();
  const sessionId = getSessionId(request);

  let customerId: string | null = null;
  if (session && session.role === "customer" && tenantId) {
    const customer = await prisma.customer.findUnique({
      where: { email_tenantId: { email: session.email, tenantId: session.tenantId! } },
    });
    customerId = customer?.id ?? null;
  }

  try {
    const item = await updateCartItemQuantity(customerId, sessionId, variantId, quantity);
    return NextResponse.json(item);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ variantId: string }> },
) {
  const { variantId } = await params;
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  const session = await getSessionUser();
  const sessionId = getSessionId(request);

  let customerId: string | null = null;
  if (session && session.role === "customer" && tenantId) {
    const customer = await prisma.customer.findUnique({
      where: { email_tenantId: { email: session.email, tenantId: session.tenantId! } },
    });
    customerId = customer?.id ?? null;
  }

  try {
    await removeFromCart(customerId, sessionId, variantId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
