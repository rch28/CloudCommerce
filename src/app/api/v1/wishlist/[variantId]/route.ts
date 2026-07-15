import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { removeItem } from "@/lib/services/wishlist";

export async function DELETE(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ variantId: string }> },
) {
  try {
    const params = await paramsPromise;
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

    await removeItem(tenantId, params.variantId, {
      customerId: customerId ?? undefined,
      sessionId,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to remove item" }, { status: 400 });
  }
}
