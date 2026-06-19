import { getMailQueue, getInventoryQueue, getNotificationQueue, getWebhookQueue } from "./index";
import type { MailJobPayload, InventoryJobPayload, NotificationJobPayload, WebhookJobPayload } from "./payloads";
import { logger } from "@/lib/logger";

export function enqueueMail(payload: MailJobPayload): void {
  getMailQueue()
    .add(payload.type, payload, {
      jobId: `${payload.type}:${Date.now()}`,
    })
    .catch((err) => {
      logger.error("Failed to enqueue mail job", {
        error: err.message,
        metadata: { type: payload.type },
      });
    });
}

export function enqueueInventorySync(variantId: string, tenantId: string): void {
  const payload: InventoryJobPayload = { type: "sync", variantId, tenantId };
  getInventoryQueue()
    .add("sync", payload, { jobId: `sync:${variantId}` })
    .catch((err) => {
      logger.error("Failed to enqueue inventory sync", {
        error: err.message,
        metadata: { variantId },
      });
    });
}

export function enqueueInventoryAdjust(
  variantId: string,
  quantity: number,
  reason: string,
  tenantId: string,
  opts?: { userId?: string; orderId?: string },
): void {
  const payload: InventoryJobPayload = {
    type: "adjust",
    variantId,
    quantity,
    reason,
    tenantId,
    ...opts,
  };
  getInventoryQueue()
    .add("adjust", payload, {
      jobId: `adjust:${variantId}:${Date.now()}`,
    })
    .catch((err) => {
      logger.error("Failed to enqueue inventory adjust", {
        error: err.message,
        metadata: { variantId },
      });
    });
}

export function enqueueLowStockCheck(tenantId: string, variantId?: string): void {
  const payload: InventoryJobPayload = { type: "check_low_stock", tenantId, variantId };
  getInventoryQueue()
    .add("check_low_stock", payload, {
      jobId: variantId ? `low-stock:${variantId}` : `low-stock:all:${tenantId}`,
    })
    .catch((err) => {
      logger.error("Failed to enqueue low stock check", {
        error: err.message,
      });
    });
}

export function enqueueNotificationDelivery(
  notificationId: string,
  tenantId: string,
  userId?: string,
): void {
  const payload: NotificationJobPayload = {
    type: "deliver_in_app",
    notificationId,
    tenantId,
    userId,
  };
  getNotificationQueue()
    .add("deliver_in_app", payload, {
      jobId: `notif:${notificationId}`,
    })
    .catch((err) => {
      logger.error("Failed to enqueue notification delivery", {
        error: err.message,
        metadata: { notificationId },
      });
    });
}

export function enqueueBatchNotificationDelivery(
  notificationIds: string[],
  tenantId: string,
): void {
  const payload: NotificationJobPayload = {
    type: "deliver_batch",
    notificationIds,
    tenantId,
  };
  getNotificationQueue()
    .add("deliver_batch", payload, {
      jobId: `notif-batch:${Date.now()}`,
    })
    .catch((err) => {
      logger.error("Failed to enqueue batch notification delivery", {
        error: err.message,
      });
    });
}

export function enqueueWebhookDelivery(
  webhookEventId: string,
  provider: string,
  eventType: string,
  rawBody: string,
  tenantId: string,
  attempt = 1,
): void {
  const payload: WebhookJobPayload = {
    type: "deliver",
    webhookEventId,
    provider,
    eventType,
    rawBody,
    tenantId,
    attempt,
  };
  getWebhookQueue()
    .add("deliver", payload, {
      jobId: `webhook:${webhookEventId}:${attempt}`,
    })
    .catch((err) => {
      logger.error("Failed to enqueue webhook delivery", {
        error: err.message,
        metadata: { webhookEventId },
      });
    });
}

export function enqueueWebhookCleanup(olderThanDays = 30, tenantId?: string): void {
  const payload: WebhookJobPayload = { type: "cleanup", olderThanDays, tenantId };
  getWebhookQueue()
    .add("cleanup", payload, {
      jobId: `webhook-cleanup:${Date.now()}`,
      delay: 1000 * 60 * 60,
    })
    .catch((err) => {
      logger.error("Failed to enqueue webhook cleanup", {
        error: err.message,
      });
    });
}
