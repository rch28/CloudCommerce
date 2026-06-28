import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/services/notifications";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export interface StripeSessionResult {
  sessionId: string;
  stripeUrl: string;
}

export async function createCheckoutSession(
  orderId: string,
  tenantId: string,
  origin: string,
): Promise<StripeSessionResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, address: true },
  });

  if (!order) throw new Error("Order not found");
  if (order.stripeSessionId) {
    throw new Error("Order already has a Stripe session");
  }

  const baseUrl = origin.replace(/\/$/, "");
  const tenantSlug = (await prisma.tenant.findUnique({ where: { id: tenantId }, select: { subdomain: true } }))?.subdomain ?? "";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: order.customerId
      ? (
          await prisma.customer.findUnique({
            where: { id: order.customerId },
            select: { email: true },
          })
        )?.email ?? undefined
      : undefined,
    metadata: {
      orderId: order.id,
      orderNumber: order.number,
      tenantId,
    },
    payment_intent_data: {
      metadata: {
        orderId: order.id,
        orderNumber: order.number,
      },
    },
    line_items: order.items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.productName,
          description: `SKU: ${item.sku}`,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: item.quantity,
    })),
    ...(Number(order.shipping) > 0
      ? {
          shipping_options: [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: { amount: Math.round(Number(order.shipping) * 100), currency: "usd" },
                display_name: "Standard Shipping",
                delivery_estimate: {
                  minimum: { unit: "business_day", value: 5 },
                  maximum: { unit: "business_day", value: 10 },
                },
              },
            },
          ],
        }
      : {
          shipping_options: [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: { amount: 0, currency: "usd" },
                display_name: "Free Shipping",
                delivery_estimate: {
                  minimum: { unit: "business_day", value: 5 },
                  maximum: { unit: "business_day", value: 10 },
                },
              },
            },
          ],
        }),
    success_url: `${baseUrl}/store/${tenantSlug}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/store/${tenantSlug}/checkout`,
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { stripeSessionId: session.id },
  });

  return { sessionId: session.id, stripeUrl: session.url ?? "" };
}

export function verifyWebhook(rawBody: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

export async function refundPayment(
  paymentIntentId: string,
  amount?: number,
): Promise<Stripe.Refund> {
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amount !== undefined ? { amount: Math.round(amount * 100) } : {}),
  });
}

export async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  // Idempotent: only transition if the order is still in a pre-paid state.
  const updated = await prisma.order.updateMany({
    where: { id: orderId, status: { in: ["pending", "processing"] } },
    data: {
      status: "paid",
      paymentIntentId: session.payment_intent?.toString() ?? null,
    },
  });

  // Skip side-effects if already processed (count === 0 means already past pending).
  if (updated.count === 0) return;
}

export async function handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent) {
  const orderId = intent.metadata?.orderId;
  if (!orderId) return;

  // Idempotent: only transition if still in a pre-paid state.
  const updated = await prisma.order.updateMany({
    where: { id: orderId, status: { in: ["pending", "processing"] } },
    data: {
      status: "paid",
      paymentIntentId: intent.id,
      chargeId: intent.latest_charge?.toString() ?? null,
    },
  });

  if (updated.count === 0) return; // Already processed.

  const paidOrder = await prisma.order.findUnique({ where: { id: orderId }, select: { number: true, total: true, tenantId: true, customer: { select: { name: true, email: true } } } });
  if (paidOrder) {
    createNotification(paidOrder.tenantId, {
      type: "payment.received",
      title: `Payment received for Order #${paidOrder.number}`,
      body: `Payment of $${Number(paidOrder.total).toFixed(2)} was successful`,
      data: { orderId, orderNumber: paidOrder.number, total: Number(paidOrder.total), customerEmail: paidOrder.customer?.email ?? "", customerName: paidOrder.customer?.name ?? "" },
      channel: "both",
    }).catch(() => {});
  }
}

export async function handlePaymentIntentFailed(intent: Stripe.PaymentIntent) {
  const orderId = intent.metadata?.orderId;
  if (!orderId) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  // Idempotent: only cancel/restock if not already cancelled/refunded.
  if (order.status === "cancelled" || order.status === "refunded") return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "cancelled" },
    });

    for (const item of order.items) {
      await tx.$queryRawUnsafe(
        `UPDATE "ProductVariant" SET quantity = quantity + $1 WHERE id = $2`,
        item.quantity,
        item.variantId,
      );
    }
  });

  createNotification(order.tenantId, {
    type: "payment.failed",
    title: `Payment failed for Order #${order.number}`,
    body: `Payment of $${Number(order.total).toFixed(2)} failed. The order has been cancelled and stock released.`,
    data: { orderId: order.id, orderNumber: order.number, total: Number(order.total) },
    channel: "in_app",
  }).catch(() => {});
}

export async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent?.toString();
  if (!paymentIntentId) return;

  const order = await prisma.order.findFirst({
    where: { paymentIntentId },
    include: { items: true },
  });
  if (!order) return;

  // Idempotent — skip if already refunded.
  if (order.status === "refunded") return;

  // Restock inventory on refund (parallel to cancel).
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: "refunded" },
    });

    for (const item of order.items) {
      await tx.$queryRawUnsafe(
        `UPDATE "ProductVariant" SET quantity = quantity + $1 WHERE id = $2`,
        item.quantity,
        item.variantId,
      );
    }
  });
}
