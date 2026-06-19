import { Worker } from "bullmq";
import { getQueueConnection } from "@/lib/queue/connection";
import { QUEUES } from "@/lib/queue/names";
import { WebhookJobSchema, type WebhookJobPayload } from "@/lib/queue/payloads";
import { logger } from "@/lib/logger";
import axios from "axios";
import { prisma } from "@/lib/prisma";

const WEBHOOK_TIMEOUT = 10000;

export function createWebhookWorker(): Worker {
  const worker = new Worker<WebhookJobPayload>(
    QUEUES.WEBHOOKS,
    async (job) => {
      const payload = WebhookJobSchema.parse(job.data);

      switch (payload.type) {
        case "deliver":
          return deliverWebhook(payload);
        case "cleanup":
          return cleanupOldWebhooks(payload.olderThanDays, payload.tenantId);
      }
    },
    {
      connection: getQueueConnection(),
      concurrency: 20,
      lockDuration: 60000,
      stalledInterval: 30000,
      maxStalledCount: 3,
      removeOnComplete: { age: 60 * 60 * 24 * 7 },
      removeOnFail: { age: 60 * 60 * 24 * 14 },
    },
  );

  worker.on("completed", (job) => {
    const meta: Record<string, unknown> = { jobId: job.id };
    if (job.data.type === "deliver") {
      meta.eventType = job.data.eventType;
    }
    logger.info("Webhook job completed", { metadata: meta });
  });

  worker.on("failed", (job, err) => {
    const meta: Record<string, unknown> = { jobId: job?.id };
    if (job?.data?.type === "deliver") {
      meta.eventType = job.data.eventType;
      meta.attempt = job.data.attempt;
    }
    logger.error("Webhook job failed", {
      error: err.message,
      metadata: meta,
    });
  });

  return worker;
}

async function deliverWebhook(payload: Extract<WebhookJobPayload, { type: "deliver" }>): Promise<void> {
  const { webhookEventId, provider, eventType, rawBody, tenantId, attempt } = payload;

  const webhookUrl = await resolveWebhookUrl(provider, tenantId);
  if (!webhookUrl) {
    await markWebhookFailed(webhookEventId, `No webhook URL configured for ${provider}`);
    return;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Webhook-Event": eventType,
    "X-Webhook-Provider": provider,
    "X-Webhook-Attempt": String(attempt),
  };

  try {
    const response = await axios.post(webhookUrl, rawBody, {
      headers,
      timeout: WEBHOOK_TIMEOUT,
      validateStatus: () => true,
    });

    const success = response.status >= 200 && response.status < 300;

    if (success) {
      await markWebhookProcessed(webhookEventId);
      await logWebhookEntry(webhookEventId, "info", `Delivered successfully (${response.status})`);
    } else {
      const errorMsg = `Webhook returned ${response.status}: ${response.statusText}`;
      await logWebhookEntry(webhookEventId, "warn", errorMsg);
      await updateWebhookAttempt(webhookEventId, attempt, errorMsg);
      throw new Error(errorMsg);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await logWebhookEntry(webhookEventId, "error", errorMsg);
    await updateWebhookAttempt(webhookEventId, attempt, errorMsg);
    throw err;
  }
}

async function resolveWebhookUrl(provider: string, tenantId: string): Promise<string | null> {
  if (!process.env.DATABASE_URL) return `https://mock-webhook.local/${provider}`;

  const store = await prisma.store.findFirst({
    where: { tenantId },
    select: { customDomain: true, subdomain: true },
  });

  if (!store) return null;

  const domain = store.customDomain ?? `${store.subdomain}.example.com`;
  return `https://${domain}/api/webhooks/${provider}`;
}

async function markWebhookProcessed(id: string): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  await prisma.webhookEvent.update({
    where: { id },
    data: { status: "processed", processedAt: new Date() },
  });
}

async function markWebhookFailed(id: string, error: string): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  await prisma.webhookEvent.update({
    where: { id },
    data: { status: "failed", error, processedAt: new Date() },
  });
}

async function updateWebhookAttempt(id: string, attempt: number, error: string): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  await prisma.webhookEvent.update({
    where: { id },
    data: {
      attempts: attempt,
      error,
      status: attempt >= 5 ? "failed" : "retrying",
      nextRetryAt: attempt < 5
        ? new Date(Date.now() + Math.min(1000 * Math.pow(2, attempt), 30000))
        : null,
    },
  });
}

async function logWebhookEntry(webhookId: string, level: string, message: string): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  await prisma.webhookLog.create({
    data: { webhookId, level, message },
  });
}

async function cleanupOldWebhooks(olderThanDays: number, tenantId?: string): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const where: Record<string, unknown> = { processedAt: { lte: cutoff } };
  if (tenantId) where.tenantId = tenantId;

  const result = await prisma.webhookEvent.deleteMany({ where });
  logger.info("Webhook cleanup completed", {
    metadata: { deletedCount: result.count, olderThanDays },
  });
}
