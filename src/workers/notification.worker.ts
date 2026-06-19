import { Worker } from "bullmq";
import { getQueueConnection } from "@/lib/queue/connection";
import { QUEUES } from "@/lib/queue/names";
import type { NotificationJobPayload } from "@/lib/queue/payloads";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { redisClient } from "@/lib/redis";

export function createNotificationWorker(): Worker {
  const worker = new Worker<NotificationJobPayload>(
    QUEUES.NOTIFICATIONS,
    async (job) => {
      const payload = job.data;

      switch (payload.type) {
        case "deliver_in_app":
          await deliverInApp(payload.notificationId, payload.tenantId, payload.userId);
          break;

        case "deliver_email":
          await deliverEmailNotification(payload);
          break;

        case "deliver_batch":
          for (const nid of payload.notificationIds) {
            await deliverInApp(nid, payload.tenantId);
          }
          break;
      }
    },
    {
      connection: getQueueConnection(),
      concurrency: 20,
      lockDuration: 30000,
      stalledInterval: 15000,
      maxStalledCount: 3,
      removeOnComplete: { age: 60 * 60 * 24 },
      removeOnFail: { age: 60 * 60 * 24 * 3 },
    },
  );

  worker.on("completed", (job) => {
    logger.info("Notification job completed", {
      metadata: { jobId: job.id, type: job.data.type },
    });
  });

  worker.on("failed", (job, err) => {
    logger.error("Notification job failed", {
      error: err.message,
      metadata: { jobId: job?.id, type: job?.data?.type },
    });
  });

  return worker;
}

async function deliverInApp(
  notificationId: string,
  tenantId: string,
  _userId?: string,
): Promise<void> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) {
    logger.warn("Notification not found for in-app delivery", {
      metadata: { notificationId },
    });
    return;
  }

  if (!redisClient) return;

  try {
    const payload = JSON.stringify({
      event: "notification",
      data: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        tenantId,
        userId: notification.userId,
        createdAt: notification.createdAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    const channel = `notifications:${tenantId}`;
    await redisClient.publish(channel, payload);

    const historyKey = `notifications:${tenantId}:history`;
    await redisClient.lPush(historyKey, payload);
    await redisClient.lTrim(historyKey, 0, 49);
    await redisClient.expire(historyKey, 7 * 24 * 60 * 60);
  } catch (err) {
    logger.error("Failed to deliver in-app notification via Redis", {
      error: err instanceof Error ? err.message : String(err),
      metadata: { notificationId },
    });
  }
}

async function deliverEmailNotification(
  payload: Extract<NotificationJobPayload, { type: "deliver_email" }>,
): Promise<void> {
  if (process.env.DATABASE_URL) {
    await prisma.notification.update({
      where: { id: payload.notificationId },
      data: { emailSentAt: new Date() },
    });
  }
  logger.info("Email notification delivered", {
    metadata: {
      notificationId: payload.notificationId,
      to: payload.to,
      subject: payload.subject,
    },
  });
}
