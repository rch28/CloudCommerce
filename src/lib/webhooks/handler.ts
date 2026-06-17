import { prisma } from "@/lib/prisma";
import { enqueueRetry } from "./queue";

export interface WebhookPayload {
  provider: string;
  eventType: string;
  rawBody: string;
}

export async function handleWebhook(payload: WebhookPayload) {
  if (process.env.DATABASE_URL) {
    const event = await prisma.webhookEvent.create({
      data: {
        provider: payload.provider,
        eventType: payload.eventType,
        rawBody: payload.rawBody,
        status: "processing",
      },
    });
    try {
      const result = await processEvent(payload);
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: { status: result.success ? "processed" : "failed", processedAt: new Date(), error: result.error ?? null },
      });
      if (!result.success) {
        await enqueueRetry(event.id, payload);
      }
      return result;
    } catch (err: any) {
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: { status: "failed", error: err.message, processedAt: new Date() },
      });
      await enqueueRetry(event.id, payload);
      return { success: false, error: err.message };
    }
  }

  try {
    const result = await processEvent(payload);
    if (!result.success) {
      await enqueueRetry(`mock-${Date.now()}`, payload);
    }
    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function processEvent(payload: WebhookPayload): Promise<{ success: boolean; error?: string }> {
  const { provider, eventType } = payload;

  switch (eventType) {
    case "payment_intent.succeeded":
    case "payment.success":
      return { success: true };
    case "payment_intent.payment_failed":
    case "payment.failed":
      return { success: true };
    case "customer.subscription.updated":
    case "subscription.renewed":
      return { success: true };
    case "customer.subscription.deleted":
    case "subscription.cancelled":
      return { success: true };
    default:
      return { success: true };
  }
}
