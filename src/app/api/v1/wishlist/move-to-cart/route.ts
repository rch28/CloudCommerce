import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { wishlistMoveToCartSchema } from "@/lib/schemas";
import { moveToCart } from "@/lib/services/wishlist";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const sessionId = request.cookies.get("cc_cart_session")?.value;
    const tenantId = request.headers.get("x-tenant-id");

    let customerId: string | null = null;

    if (session?.role === "customer") {
      const customer = await prisma.customer.findUnique({
        where: { email_tenantId: { email: session.email, tenantId: session.tenantId! } },
      });
      if (customer) customerId = customer.id;
    }

    if (!tenantId) {
      return NextResponse.json({ error: "Missing x-tenant-id header" }, { status: 400 });
    }

    if (!customerId && !sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = wishlistMoveToCartSchema.parse(body);

    await moveToCart(tenantId, parsed.wishlistItemId, parsed.quantity, {
      customerId: customerId ?? undefined,
      sessionId,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to move item";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
