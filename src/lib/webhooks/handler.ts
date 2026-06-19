import { prisma } from "@/lib/prisma";
import { enqueueWebhookDelivery } from "@/lib/queue/enqueue";
import { logger } from "@/lib/logger";

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
        status: "pending",
      },
    });

    enqueueWebhookDelivery(
      event.id,
      payload.provider,
      payload.eventType,
      payload.rawBody,
      extractTenantIdFromPayload(payload.rawBody),
      1,
    );

    try {
      const result = await processEvent(payload);
      if (!result.success) {
        logger.warn("Webhook sync processing failed, async worker will retry", {
          error: result.error,
          metadata: { eventId: event.id },
        });
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("Webhook sync processing threw", {
        error: message,
        metadata: { eventId: event.id },
      });
      return { success: false, error: message };
    }
  }

  try {
    const result = await processEvent(payload);
    if (!result.success) {
      enqueueWebhookDelivery(
        `mock-${Date.now()}`,
        payload.provider,
        payload.eventType,
        payload.rawBody,
        "",
        1,
      );
    }
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

function extractTenantIdFromPayload(rawBody: string): string {
  try {
    const parsed = JSON.parse(rawBody);
    return parsed.tenantId ?? parsed.metadata?.tenantId ?? "";
  } catch {
    return "";
  }
}

export async function processEvent(payload: WebhookPayload): Promise<{ success: boolean; error?: string }> {
  switch (payload.eventType) {
    case "payment_intent.succeeded":
    case "payment.success":
    case "payment_intent.payment_failed":
    case "payment.failed":
    case "customer.subscription.updated":
    case "subscription.renewed":
    case "customer.subscription.deleted":
    case "subscription.cancelled":
      return { success: true };
    default:
      return { success: true };
  }
}
