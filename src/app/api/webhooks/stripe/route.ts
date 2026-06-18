import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { verifyWebhook, handleCheckoutSessionCompleted, handlePaymentIntentSucceeded, handlePaymentIntentFailed, handleChargeRefunded } from "@/lib/services/payment";
import { enqueueRetry } from "@/lib/webhooks/queue";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = verifyWebhook(rawBody, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Invalid signature: ${message}` }, { status: 400 });
  }

  const eventRecord = await prisma.webhookEvent.create({
    data: {
      provider: "stripe",
      eventType: event.type,
      rawBody,
      status: "processing",
    },
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(intent);
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(intent);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }

      default:
        break;
    }

    await prisma.webhookEvent.update({
      where: { id: eventRecord.id },
      data: { status: "processed", processedAt: new Date() },
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.webhookEvent.update({
      where: { id: eventRecord.id },
      data: {
        status: "failed",
        error: message,
        processedAt: new Date(),
      },
    });

    const payload = { provider: "stripe", eventType: event.type, rawBody };
    await enqueueRetry(eventRecord.id, payload);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
