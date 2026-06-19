import { Worker } from "bullmq";
import { getQueueConnection } from "@/lib/queue/connection";
import { QUEUES } from "@/lib/queue/names";
import type { MailJobPayload } from "@/lib/queue/payloads";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export function createMailWorker(): Worker {
  const worker = new Worker<MailJobPayload>(
    QUEUES.MAIL,
    async (job) => {
      const payload = job.data;

      switch (payload.type) {
        case "order_confirmation":
          await sendEmail({
            type: "order_confirmation",
            to: payload.to,
            orderNumber: payload.orderNumber,
            customerName: payload.customerName,
            total: payload.total,
          });
          break;

        case "shipping_confirmation":
          await sendEmail({
            type: "order_shipped",
            to: payload.to,
            orderNumber: payload.orderNumber,
            customerName: payload.customerName,
          });
          break;

        case "delivery_confirmation":
          await sendEmail({
            type: "order_delivered",
            to: payload.to,
            orderNumber: payload.orderNumber,
            customerName: payload.customerName,
          });
          break;

        case "password_reset":
          await sendEmail({
            type: "password_reset",
            to: payload.to,
            resetLink: payload.resetLink,
          });
          break;

        case "notification":
          logger.info("Sending notification email", {
            metadata: { to: payload.to, subject: payload.subject },
          });
          break;
      }
    },
    {
      connection: getQueueConnection(),
      concurrency: 10,
      lockDuration: 30000,
      stalledInterval: 15000,
      maxStalledCount: 3,
      removeOnComplete: { age: 60 * 60 * 24 },
      removeOnFail: { age: 60 * 60 * 24 * 7 },
    },
  );

  worker.on("completed", (job) => {
    logger.info("Mail job completed", {
      metadata: { jobId: job.id, type: job.data.type },
    });
  });

  worker.on("failed", (job, err) => {
    logger.error("Mail job failed", {
      error: err.message,
      metadata: { jobId: job?.id, type: job?.data?.type },
    });
  });

  worker.on("stalled", (jobId) => {
    logger.warn("Mail job stalled", { metadata: { jobId } });
  });

  return worker;
}
