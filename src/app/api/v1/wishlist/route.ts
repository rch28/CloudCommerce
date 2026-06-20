import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { getTenantId } from "@/lib/api-helpers";
import { wishlistAddSchema } from "@/lib/schemas";
import { addItem, getWishlist } from "@/lib/services/wishlist";

function resolveSession(request: NextRequest) {
  const sessionId = request.cookies.get("cc_cart_session")?.value;
  return { sessionId };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const { sessionId } = resolveSession(request);

    let customerId: string | null = null;
    let tenantId: string | null = null;

    if (session?.role === "customer") {
      const customer = await prisma.customer.findUnique({
        where: { email_tenantId: { email: session.email, tenantId: session.tenantId! } },
      });
      if (customer) {
        customerId = customer.id;
        tenantId = session.tenantId!;
      }
    }

    if (!customerId && sessionId) {
      tenantId = request.headers.get("x-tenant-id") || null;
    }

    if (!customerId && !sessionId) {
      return NextResponse.json({ items: [] });
    }

    if (!tenantId) {
      tenantId = await getTenantId(request);
    }

    const result = await getWishlist(tenantId, { customerId: customerId ?? undefined, sessionId });

    return NextResponse.json({
      id: result.id,
      shareToken: result.shareToken,
      items: result.items.map((item) => ({
        id: item.id,
        variantId: item.variantId,
        addedAt: item.addedAt,
        variant: {
          id: item.variant.id,
          sku: item.variant.sku,
          price: Number(item.variant.price),
          comparePrice: item.variant.comparePrice ? Number(item.variant.comparePrice) : null,
          quantity: item.variant.quantity,
          product: {
            id: item.variant.product.id,
            name: item.variant.product.name,
            slug: item.variant.product.slug,
            image: item.variant.product.images[0]?.url ?? null,
            status: item.variant.product.status,
          },
        },
      })),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    const { sessionId } = resolveSession(request);
    const tenantId = request.headers.get("x-tenant-id");

    if (!tenantId) {
      return NextResponse.json({ error: "Bad Request: missing x-tenant-id header" }, { status: 400 });
    }

    let customerId: string | null = null;

    if (session?.role === "customer") {
      const customer = await prisma.customer.findUnique({
        where: { email_tenantId: { email: session.email, tenantId: session.tenantId! } },
      });
      if (customer) customerId = customer.id;
    }

    if (!customerId && !sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = wishlistAddSchema.parse(body);

    const item = await addItem(tenantId, parsed.variantId, {
      customerId: customerId ?? undefined,
      sessionId,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to add item";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
