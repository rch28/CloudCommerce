import { prisma } from "@/lib/prisma";
import { processEvent, type WebhookPayload } from "./handler";

interface RetryEntry {
  id: string;
  payload: WebhookPayload;
  attempts: number;
  nextRetry: number;
}

const retryQueue: RetryEntry[] = [];
let timer: ReturnType<typeof setInterval> | null = null;

function getBackoffDelay(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 30000);
}

export async function enqueueRetry(eventId: string, payload: WebhookPayload) {
  const entry: RetryEntry = {
    id: eventId,
    payload,
    attempts: 0,
    nextRetry: Date.now() + getBackoffDelay(0),
  };
  retryQueue.push(entry);
  startProcessor();
}

function startProcessor() {
  if (timer) return;
  timer = setInterval(() => processQueue(), 5000);
}

async function processQueue() {
  const now = Date.now();
  const due = retryQueue.filter((e) => e.nextRetry <= now);
  if (due.length === 0) return;

  for (const entry of due) {
    if (entry.attempts >= 5) {
      const idx = retryQueue.indexOf(entry);
      if (idx >= 0) retryQueue.splice(idx, 1);
      if (process.env.DATABASE_URL) {
        await prisma.webhookEvent.update({
          where: { id: entry.id },
          data: { status: "failed", error: "Max retry attempts exhausted" },
        }).catch(() => {});
      }
      continue;
    }

    entry.attempts++;
    try {
      const result = await processEvent(entry.payload);
      if (result.success) {
        const idx = retryQueue.indexOf(entry);
        if (idx >= 0) retryQueue.splice(idx, 1);
        if (process.env.DATABASE_URL) {
          await prisma.webhookEvent.update({
            where: { id: entry.id },
            data: { status: "processed", processedAt: new Date() },
          }).catch(() => {});
        }
      } else {
        entry.nextRetry = now + getBackoffDelay(entry.attempts);
        if (process.env.DATABASE_URL) {
          await prisma.webhookEvent.update({
            where: { id: entry.id },
            data: { status: "retrying", attempts: entry.attempts, nextRetryAt: new Date(entry.nextRetry) },
          }).catch(() => {});
        }
      }
    } catch {
      entry.nextRetry = now + getBackoffDelay(entry.attempts);
    }
  }

  if (retryQueue.length === 0 && timer) {
    clearInterval(timer);
    timer = null;
  }
}
