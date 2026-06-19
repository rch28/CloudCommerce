import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { mergeGuestCart } from "@/lib/services/cart";
import { syncAfterLogin } from "@/lib/services/wishlist";

export async function POST(request: Request) {
  const body = await request.json();
  const { tenantId } = body;
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const session = await getSessionUser();
  if (!session || session.role !== "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/cc_cart_session=([^;]+)/);
  const sessionId = match ? match[1] : null;
  if (!sessionId) {
    return NextResponse.json({ error: "No guest cart to merge" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { email_tenantId: { email: session.email, tenantId: session.tenantId! } },
  });
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  try {
    const cart = await mergeGuestCart(sessionId, customer.id, tenantId);
    await syncAfterLogin(sessionId, customer.id, tenantId).catch(() => {});
    return NextResponse.json(cart);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
