import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { checkoutSchema } from "@/lib/schemas";
import { createCheckoutSession } from "@/lib/services/payment";

interface StripeSessionResult {
  stripeUrl: string;
  sessionId: string;
  order: {
    id: string;
    number: string;
    status: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();

    const body = await request.json();
    const { tenantId, addressId, address: inlineAddress, notes, shippingMethodId, shippingPrice } = body;

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

    const origin = request.headers.get("origin") ?? `http://${request.headers.get("host") ?? "localhost:3000"}`;

    const result = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findFirst({
        where: customerId
          ? { customerId, tenantId }
          : { sessionId, tenantId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      images: { select: { url: true }, take: 1 },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      for (const item of cart.items) {
        const variant = item.variant;
        if (!variant) throw new Error(`Variant ${item.variantId} not found`);
        if (variant.status !== "active") {
          throw new Error(`${variant.product?.name ?? "Product"} is no longer available`);
        }
        if (variant.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for ${variant.product?.name ?? "product"}: ${variant.quantity} available, ${item.quantity} requested`,
          );
        }
      }

      let resolvedAddress: { label: string; line1: string; line2: string | null; city: string; state: string; zip: string; country: string };

      if (addressId) {
        const savedAddress = await tx.address.findUnique({ where: { id: addressId } });
        if (!savedAddress) throw new Error("Address not found");
        resolvedAddress = {
          label: savedAddress.label,
          line1: savedAddress.line1,
          line2: savedAddress.line2,
          city: savedAddress.city,
          state: savedAddress.state,
          zip: savedAddress.zip,
          country: savedAddress.country,
        };
      } else if (inlineAddress) {
        resolvedAddress = {
          label: inlineAddress.label,
          line1: inlineAddress.line1,
          line2: inlineAddress.line2 ?? null,
          city: inlineAddress.city,
          state: inlineAddress.state,
          zip: inlineAddress.zip,
          country: inlineAddress.country,
        };
      } else {
        throw new Error("Shipping address is required");
      }

      const lastOrder = await tx.order.findFirst({
        where: { number: { startsWith: "CC-" } },
        orderBy: { number: "desc" },
        select: { number: true },
      });
      const lastNum = lastOrder ? parseInt(lastOrder.number.slice(3), 10) : 0;
      const orderNumber = `CC-${String(lastNum + 1).padStart(5, "0")}`;

      const subtotal = cart.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
      const shipping = shippingPrice !== undefined ? shippingPrice : (subtotal >= 100 ? 0 : 10);
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const total = Math.round((subtotal + shipping + tax) * 100) / 100;

      const order = await tx.order.create({
        data: {
          number: orderNumber,
          customerId,
          tenantId,
          status: "pending",
          subtotal,
          shipping,
          tax,
          total,
          notes: parsed.data.notes ?? null,
          items: {
            create: cart.items.map((item) => ({
              variantId: item.variantId,
              productName: item.variant?.product?.name ?? "",
              sku: item.variant?.sku ?? "",
              price: Number(item.price),
              quantity: item.quantity,
              image: item.variant?.product?.images?.[0]?.url ?? null,
            })),
          },
          address: { create: resolvedAddress },
        },
      });

      for (const item of cart.items) {
        const result = await tx.$queryRawUnsafe<Array<{ quantity: number }>>(
          `UPDATE "ProductVariant" SET quantity = quantity - $1 WHERE id = $2 AND quantity >= $1 RETURNING quantity`,
          item.quantity,
          item.variantId,
        );
        if (result.length === 0) {
          throw new Error(`Stock depleted for ${item.variant?.product?.name ?? "product"} during checkout`);
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.delete({ where: { id: cart.id } });

      return { order, orderNumber };
    });

    const stripeResult = await createCheckoutSession(result.order.id, tenantId, origin);

    return NextResponse.json(
      {
        stripeUrl: stripeResult.stripeUrl,
        sessionId: stripeResult.sessionId,
        order: {
          id: result.order.id,
          number: result.order.number,
          status: result.order.status,
        },
      } satisfies StripeSessionResult,
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
