import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { checkoutSchema } from "@/lib/schemas";
import { checkout } from "@/lib/services/orders";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();

    const body = await request.json();
    const { tenantId, addressId, address: inlineAddress, notes, couponCode, shippingMethodId, shippingPrice } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const parsed = checkoutSchema.safeParse({ addressId, address: inlineAddress, notes });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    let customerId: string | null = null;
    let sessionId: string | null = null;

    if (session?.role === "customer") {
      const customer = await prisma.customer.findUnique({
        where: { email_tenantId: { email: session.email, tenantId } },
      });
      if (customer) {
        customerId = customer.id;
      }
    }

    if (!customerId) {
      const cookieSessionId = request.cookies.get("cc_cart_session")?.value;
      if (!cookieSessionId) {
        return NextResponse.json({ error: "No cart session found" }, { status: 400 });
      }
      sessionId = cookieSessionId;
    }

    const address = parsed.data.address
      ? { ...parsed.data.address, line2: parsed.data.address.line2 ?? null }
      : undefined;

    const result = await checkout({
      customerId,
      sessionId,
      tenantId,
      addressId: parsed.data.addressId,
      address,
      notes: parsed.data.notes,
      couponCode,
      shippingMethodId,
      shippingPrice,
    });

    return NextResponse.json({ order: result }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
