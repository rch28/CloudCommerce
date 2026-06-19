import { logger } from "@/lib/logger";
import { createMailWorker } from "./mail.worker";
import { createInventoryWorker } from "./inventory.worker";
import { createNotificationWorker } from "./notification.worker";
import { createWebhookWorker } from "./webhook.worker";
import { closeAllQueues } from "@/lib/queue";
import { cleanupStaleLocks } from "@/lib/queue/monitoring";

async function main() {
  logger.info("Starting background workers...");

  await cleanupStaleLocks();

  const mailWorker = createMailWorker();
  const inventoryWorker = createInventoryWorker();
  const notificationWorker = createNotificationWorker();
  const webhookWorker = createWebhookWorker();

  logger.info("All workers registered and listening", {
    metadata: { workers: ["mail", "inventory", "notifications", "webhooks"] },
  });

  process.on("SIGTERM", async () => {
    logger.info("SIGTERM received, shutting down workers...");
    await Promise.all([
      mailWorker.close(),
      inventoryWorker.close(),
      notificationWorker.close(),
      webhookWorker.close(),
    ]);
    await closeAllQueues();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    logger.info("SIGINT received, shutting down workers...");
    await Promise.all([
      mailWorker.close(),
      inventoryWorker.close(),
      notificationWorker.close(),
      webhookWorker.close(),
    ]);
    await closeAllQueues();
    process.exit(0);
  });
}

main().catch((err) => {
  logger.error("Failed to start workers", { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
