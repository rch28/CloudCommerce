import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { enqueueNotificationDelivery } from "@/lib/queue/enqueue";

export interface CreateNotificationInput {
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  userId?: string;
  channel?: "in_app" | "email" | "both";
}

interface NotificationResult {
  id: string;
  tenantId: string;
  userId: string | null;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  channel: string;
  readAt: string | null;
  emailSentAt: string | null;
  createdAt: string;
}

function formatTimestamp(d: Date): string {
  return d.toISOString();
}

const mockNotifications: NotificationResult[] = [];
let notifCounter = 0;

function mockId(): string {
  return `notif-${Date.now()}-${++notifCounter}`;
}

export async function createNotification(
  tenantId: string,
  input: CreateNotificationInput,
): Promise<NotificationResult | null> {
  const channel = input.channel ?? "in_app";

  if (process.env.DATABASE_URL) {
    const notification = await prisma.notification.create({
      data: {
        tenantId,
        userId: input.userId ?? null,
        type: input.type,
        title: input.title,
        body: input.body,
        data: (input.data ?? {}) as object,
        channel,
      },
    });

    if (channel === "email" || channel === "both") {
      sendEmailForNotification(input).catch(() => {});
    }

    publishNotificationEvent(tenantId, notification).catch(() => {});
    enqueueNotificationDelivery(notification.id, tenantId, notification.userId ?? undefined);

    return mapNotification(notification);
  }

  const now = new Date();
  const n: NotificationResult = {
    id: mockId(),
    tenantId,
    userId: input.userId ?? null,
    type: input.type,
    title: input.title,
    body: input.body,
    data: (input.data ?? {}) as Record<string, unknown>,
    channel,
    readAt: null,
    emailSentAt: null,
    createdAt: formatTimestamp(now),
  };
  mockNotifications.unshift(n);

  if (channel === "email" || channel === "both") {
    sendEmailForNotification(input).catch(() => {});
  }

  return n;
}

async function sendEmailForNotification(input: CreateNotificationInput): Promise<void> {
  switch (input.type) {
    case "order.created":
    case "payment.received":
      await sendEmail({
        type: "order_confirmation",
        to: input.data?.customerEmail as string || "",
        orderNumber: input.data?.orderNumber as string || "",
        customerName: input.data?.customerName as string || "",
        total: Number(input.data?.total || 0),
      }).catch(() => {});
      break;
    case "order.shipped":
      await sendEmail({
        type: "order_shipped",
        to: input.data?.customerEmail as string || "",
        orderNumber: input.data?.orderNumber as string || "",
        customerName: input.data?.customerName as string || "",
      }).catch(() => {});
      break;
    case "order.delivered":
      await sendEmail({
        type: "order_delivered",
        to: input.data?.customerEmail as string || "",
        orderNumber: input.data?.orderNumber as string || "",
        customerName: input.data?.customerName as string || "",
      }).catch(() => {});
      break;
  }
}

async function publishNotificationEvent(tenantId: string, notification: { id: string; type: string; title: string; body: string; data: unknown; createdAt: Date }): Promise<void> {
  const { redisClient } = await import("@/lib/redis");
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
  } catch {
    // fire-and-forget
  }
}

interface PrismaNotification {
  id: string; tenantId: string; userId: string | null; type: string;
  title: string; body: string; data: unknown; channel: string;
  readAt: Date | null; emailSentAt: Date | null; createdAt: Date;
}

function mapNotification(n: PrismaNotification): NotificationResult {
  return {
    id: n.id,
    tenantId: n.tenantId,
    userId: n.userId ?? null,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data ? (typeof n.data === "string" ? JSON.parse(n.data) : n.data as Record<string, unknown>) : null,
    channel: n.channel,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    emailSentAt: n.emailSentAt ? n.emailSentAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  };
}

export async function getNotifications(
  tenantId: string,
  userId: string,
  opts?: { limit?: number; offset?: number; unreadOnly?: boolean },
) {
  const { limit = 20, offset = 0, unreadOnly = false } = opts ?? {};

  if (process.env.DATABASE_URL) {
    const where: Record<string, unknown> = { tenantId, userId };
    if (unreadOnly) where.readAt = null;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications: notifications.map(mapNotification),
      total,
      limit,
      offset,
    };
  }

  let filtered = mockNotifications.filter((n) => n.tenantId === tenantId && n.userId === userId);
  if (unreadOnly) filtered = filtered.filter((n) => n.readAt === null);
  return {
    notifications: filtered.slice(offset, offset + limit),
    total: filtered.length,
    limit,
    offset,
  };
}

export async function getUnreadCount(tenantId: string, userId: string) {
  if (process.env.DATABASE_URL) {
    const count = await prisma.notification.count({
      where: { tenantId, userId, readAt: null },
    });
    return { count };
  }
  return {
    count: mockNotifications.filter((n) => n.tenantId === tenantId && n.userId === userId && n.readAt === null).length,
  };
}

export async function markAsRead(id: string, tenantId: string, userId: string) {
  if (process.env.DATABASE_URL) {
    await prisma.notification.updateMany({
      where: { id, tenantId, userId },
      data: { readAt: new Date() },
    });
    return { success: true };
  }
  const n = mockNotifications.find((n) => n.id === id && n.tenantId === tenantId && n.userId === userId);
  if (n) n.readAt = new Date().toISOString();
  return { success: true };
}

export async function markAllAsRead(tenantId: string, userId: string) {
  if (process.env.DATABASE_URL) {
    await prisma.notification.updateMany({
      where: { tenantId, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }
  mockNotifications
    .filter((n) => n.tenantId === tenantId && n.userId === userId && n.readAt === null)
    .forEach((n) => { n.readAt = new Date().toISOString(); });
  return { success: true };
}

export async function getPreferences(tenantId: string, userId: string) {
  if (process.env.DATABASE_URL) {
    const prefs = await prisma.notificationPreference.findMany({
      where: { tenantId, userId },
    });
    return { preferences: prefs };
  }
  return { preferences: [] };
}

export async function updatePreference(
  tenantId: string,
  userId: string,
  channel: string,
  events: string[],
  enabled: boolean,
) {
  if (process.env.DATABASE_URL) {
    const pref = await prisma.notificationPreference.upsert({
      where: { tenantId_userId_channel: { tenantId, userId, channel } },
      update: { events, enabled },
      create: { tenantId, userId, channel, events, enabled },
    });
    return { preference: pref };
  }
  return { preference: { id: `pref-${Date.now()}`, tenantId, userId, channel, events, enabled } };
}
