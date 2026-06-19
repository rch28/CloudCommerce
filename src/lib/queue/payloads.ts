import { z } from "zod";

// ---------------------------------------------------------------------------
// Mail Jobs
// ---------------------------------------------------------------------------

export const MailOrderConfirmationSchema = z.object({
  type: z.literal("order_confirmation"),
  to: z.string().email(),
  orderNumber: z.string(),
  customerName: z.string(),
  total: z.number(),
  tenantId: z.string().uuid(),
});

export const MailShippingConfirmationSchema = z.object({
  type: z.literal("shipping_confirmation"),
  to: z.string().email(),
  orderNumber: z.string(),
  customerName: z.string(),
  tenantId: z.string().uuid(),
});

export const MailDeliveryConfirmationSchema = z.object({
  type: z.literal("delivery_confirmation"),
  to: z.string().email(),
  orderNumber: z.string(),
  customerName: z.string(),
  tenantId: z.string().uuid(),
});

export const MailPasswordResetSchema = z.object({
  type: z.literal("password_reset"),
  to: z.string().email(),
  resetLink: z.string().url(),
  tenantId: z.string().uuid().optional(),
});

export const MailNotificationSchema = z.object({
  type: z.literal("notification"),
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  tenantId: z.string().uuid(),
});

export const MailJobSchema = z.discriminatedUnion("type", [
  MailOrderConfirmationSchema,
  MailShippingConfirmationSchema,
  MailDeliveryConfirmationSchema,
  MailPasswordResetSchema,
  MailNotificationSchema,
]);

export type MailJobPayload = z.infer<typeof MailJobSchema>;

// ---------------------------------------------------------------------------
// Inventory Jobs
// ---------------------------------------------------------------------------

export const InventorySyncSchema = z.object({
  type: z.literal("sync"),
  variantId: z.string().uuid(),
  tenantId: z.string().uuid(),
});

export const InventoryAdjustSchema = z.object({
  type: z.literal("adjust"),
  variantId: z.string().uuid(),
  quantity: z.number().int(),
  reason: z.string(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
});

export const InventoryCheckLowStockSchema = z.object({
  type: z.literal("check_low_stock"),
  tenantId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
});

export const InventoryJobSchema = z.discriminatedUnion("type", [
  InventorySyncSchema,
  InventoryAdjustSchema,
  InventoryCheckLowStockSchema,
]);

export type InventoryJobPayload = z.infer<typeof InventoryJobSchema>;

// ---------------------------------------------------------------------------
// Notification Jobs
// ---------------------------------------------------------------------------

export const NotifDeliverInAppSchema = z.object({
  type: z.literal("deliver_in_app"),
  notificationId: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid().optional(),
});

export const NotifDeliverEmailSchema = z.object({
  type: z.literal("deliver_email"),
  notificationId: z.string().uuid(),
  tenantId: z.string().uuid(),
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
});

export const NotifDeliverBatchSchema = z.object({
  type: z.literal("deliver_batch"),
  notificationIds: z.array(z.string().uuid()),
  tenantId: z.string().uuid(),
});

export const NotificationJobSchema = z.discriminatedUnion("type", [
  NotifDeliverInAppSchema,
  NotifDeliverEmailSchema,
  NotifDeliverBatchSchema,
]);

export type NotificationJobPayload = z.infer<typeof NotificationJobSchema>;

// ---------------------------------------------------------------------------
// Webhook Jobs
// ---------------------------------------------------------------------------

export const WebhookDeliverSchema = z.object({
  type: z.literal("deliver"),
  webhookEventId: z.string().uuid(),
  provider: z.string(),
  eventType: z.string(),
  rawBody: z.string(),
  tenantId: z.string().uuid(),
  attempt: z.number().int().min(1).default(1),
});

export const WebhookCleanupSchema = z.object({
  type: z.literal("cleanup"),
  olderThanDays: z.number().int().default(30),
  tenantId: z.string().uuid().optional(),
});

export const WebhookJobSchema = z.discriminatedUnion("type", [
  WebhookDeliverSchema,
  WebhookCleanupSchema,
]);

export type WebhookJobPayload = z.infer<typeof WebhookJobSchema>;

// ---------------------------------------------------------------------------
// Union
// ---------------------------------------------------------------------------

export const AnyJobSchema = z.union([
  MailJobSchema,
  InventoryJobSchema,
  NotificationJobSchema,
  WebhookJobSchema,
]);

export type AnyJobPayload = z.infer<typeof AnyJobSchema>;

// ---------------------------------------------------------------------------
// Job name helpers for metrics
// ---------------------------------------------------------------------------

export function jobName(payload: AnyJobPayload): string {
  return `${payload.type}`;
}
