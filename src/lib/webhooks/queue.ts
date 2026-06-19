import { prisma } from "@/lib/prisma";
import { enqueueWebhookDelivery } from "@/lib/queue/enqueue";
import type { WebhookPayload } from "./handler";

export async function enqueueRetry(eventId: string, payload: WebhookPayload) {
  const event = await prisma.webhookEvent.findUnique({ where: { id: eventId } });
  if (!event) return;

  const tenantId = event.rawBody ? extractTenantId(event.rawBody) : "";
  const attempt = (event.attempts ?? 0) + 1;

  enqueueWebhookDelivery(
    eventId,
    payload.provider,
    payload.eventType,
    payload.rawBody,
    tenantId,
    attempt,
  );
}

function extractTenantId(rawBody: string): string {
  try {
    const parsed = JSON.parse(rawBody);
    return parsed.tenantId ?? parsed.metadata?.tenantId ?? "";
  } catch {
    return "";
  }
}
