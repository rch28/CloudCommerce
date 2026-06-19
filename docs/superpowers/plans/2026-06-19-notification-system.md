# Notification System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-channel notification system (in-app + email) for merchants and customers covering order, payment, and inventory events.

**Architecture:** In-app notifications stored in PostgreSQL via Prisma, pushed in real-time via Redis Pub/Sub → WebSocket. Email via existing `sendEmail()` infrastructure. REST API for history/preferences. WebSocket extended to handle notification events alongside order events.

**Tech Stack:** Prisma 7, Next.js 16, Redis (Pub/Sub + history), WebSocket (`ws`), React 19, shadcn/ui

---

### File Inventory

| Action | File | Purpose |
|--------|------|---------|
| Modify | `prisma/schema.prisma` | Add Notification + NotificationPreference models |
| Create | `src/lib/services/notifications.ts` | Core notification service |
| Create | `src/app/api/v1/notifications/route.ts` | GET list, POST mark-all-read |
| Create | `src/app/api/v1/notifications/unread-count/route.ts` | GET unread count |
| Create | `src/app/api/v1/notifications/[id]/route.ts` | PATCH mark single as read |
| Create | `src/app/api/v1/notifications/preferences/route.ts` | GET/PUT preferences |
| Modify | `src/lib/redis-pubsub.ts` | Add NotificationEventPublisher + NotificationEventSubscriber |
| Modify | `src/ws-server.ts` | Subscribe to notification channel, broadcast to clients |
| Modify | `src/hooks/useOrderWebSocket.ts` | Handle `"notification"` message type |
| Create | `src/hooks/useNotifications.ts` | Client-side hook for notification state |
| Create | `src/components/dashboard/notification-dropdown.tsx` | Merchant dashboard bell dropdown |
| Modify | `src/components/dashboard/topbar.tsx` | Replace static Bell icon with NotificationDropdown |
| Create | `src/app/(storefront)/account/notifications/page.tsx` | Customer notification center page |
| Create | `src/components/cc/views/notification-center-view.tsx` | Notification center view component |
| Modify | `src/lib/services/orders.ts` | Wire order.created, shipped, delivered, cancelled notifications |
| Modify | `src/lib/services/payment.ts` | Wire payment.failed, payment.received notifications |
| Modify | `src/lib/services/inventory.ts` | Wire inventory.low_stock, inventory.out_of_stock notifications |

---

### Task 1: Add Prisma models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Add Notification model** after `model AuditLog` (before `model Customer`):

```prisma
model Notification {
  id           String    @id @default(cuid())
  tenantId     String
  userId       String?
  type         String
  title        String
  body         String
  data         Json?
  channel      String    @default("in_app")
  readAt       DateTime?
  emailSentAt  DateTime?
  createdAt    DateTime  @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id])
  user   User?  @relation(fields: [userId], references: [id])

  @@index([tenantId, userId, readAt])
  @@index([tenantId, createdAt])
}
```

- [ ] **Add NotificationPreference model** after Notification:

```prisma
model NotificationPreference {
  id        String   @id @default(cuid())
  tenantId  String
  userId    String
  channel   String
  events    String[]
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@unique([tenantId, userId, channel])
}
```

- [ ] **Add relations to Tenant and User models**:
  - Add `notifications Notification[]` to `model Tenant`
  - Add `notificationPreferences NotificationPreference[]` to `model Tenant`
  - Add `notifications Notification[]` to `model User`
  - Add `notificationPreferences NotificationPreference[]` to `model User`

- [ ] **Run Prisma generate**

```bash
bunx prisma generate
```

- [ ] **Create migration**

```bash
bunx prisma migrate dev --name add_notifications
```

---

### Task 2: Create notification service

**Files:**
- Create: `src/lib/services/notifications.ts`

- [ ] **Create notification service file** at `src/lib/services/notifications.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

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

type OrderEventType =
  | "order.created"
  | "order.shipped"
  | "order.delivered"
  | "order.cancelled"
  | "payment.failed"
  | "payment.received"
  | "inventory.low_stock"
  | "inventory.out_of_stock";

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

    await publishNotificationEvent(tenantId, notification);

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

function mapNotification(n: any): NotificationResult {
  return {
    id: n.id,
    tenantId: n.tenantId,
    userId: n.userId ?? null,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data ? (typeof n.data === "string" ? JSON.parse(n.data) : n.data) : null,
    channel: n.channel,
    readAt: n.readAt ? n.readAt.toISOString?.() ?? n.readAt : null,
    emailSentAt: n.emailSentAt ? n.emailSentAt.toISOString?.() ?? n.emailSentAt : null,
    createdAt: n.createdAt.toISOString?.() ?? n.createdAt,
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
```

---

### Task 3: Create API routes

**Files:**
- Create: `src/app/api/v1/notifications/route.ts`
- Create: `src/app/api/v1/notifications/unread-count/route.ts`
- Create: `src/app/api/v1/notifications/[id]/route.ts`
- Create: `src/app/api/v1/notifications/preferences/route.ts`

- [ ] **Create `src/app/api/v1/notifications/route.ts`**:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/get-session";
import {
  getNotifications,
  markAllAsRead,
} from "@/lib/services/notifications";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = session.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const result = await getNotifications(session.id, tenantId, { limit, offset, unreadOnly });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = session.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

    const body = await request.json();
    if (body.action === "mark_all_read") {
      const result = await markAllAsRead(tenantId, session.id);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Create directories**:

```bash
mkdir -p "src/app/api/v1/notifications/[id]" src/app/api/v1/notifications/unread-count src/app/api/v1/notifications/preferences
```

- [ ] **Create `src/app/api/v1/notifications/unread-count/route.ts`**:

```typescript
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/get-session";
import { getUnreadCount } from "@/lib/services/notifications";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = session.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

    const result = await getUnreadCount(tenantId, session.id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Create `src/app/api/v1/notifications/[id]/route.ts`**:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/get-session";
import { markAsRead } from "@/lib/services/notifications";

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = session.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

    const { id } = await params;
    const result = await markAsRead(id, tenantId, session.id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Create `src/app/api/v1/notifications/preferences/route.ts`**:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/get-session";
import { getPreferences, updatePreference } from "@/lib/services/notifications";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = session.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

    const result = await getPreferences(tenantId, session.id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = session.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

    const body = await request.json();
    const { channel, events, enabled } = body;
    if (!channel || !Array.isArray(events)) {
      return NextResponse.json({ error: "channel and events required" }, { status: 400 });
    }

    const result = await updatePreference(tenantId, session.id, channel, events, enabled ?? true);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

---

### Task 4: Add WebSocket notification channel

**Files:**
- Modify: `src/lib/redis-pubsub.ts`
- Modify: `src/ws-server.ts`
- Modify: `src/hooks/useOrderWebSocket.ts`

- [ ] **Add notification types to `src/lib/redis-pubsub.ts`** (after `OrderEventPayload`):

```typescript
export interface NotificationEventPayload {
  event: "notification";
  data: {
    id: string;
    type: string;
    title: string;
    body: string;
    data: unknown;
    tenantId: string;
    createdAt: string;
  };
  timestamp: string;
}
```

- [ ] **Modify `src/ws-server.ts`** to subscribe to notification channel and broadcast:

Change the import to import `NotificationEventPayload`:
```typescript
import { OrderEventSubscriber, type OrderEventPayload, type NotificationEventPayload } from "@/lib/redis-pubsub";
```

Add notification subscription in `main()`, after the `subscriber.onEvent` block:

```typescript
  subscriber.onNotification = (event: NotificationEventPayload) => {
    broadcast(event.data.tenantId, { type: "notification", ...event });
  };
```

- [ ] **Add `onNotification` callback to `OrderEventSubscriber`** class in `redis-pubsub.ts`:

Add to the `OrderEventSubscriber` class:
```typescript
  onNotification: ((event: NotificationEventPayload) => void) | null = null;
```

And extend the `pSubscribe` handler to detect notification events (they come on `notifications:*` channels, which the current `orders:*` pattern won't catch). We need a separate subscriber for notifications.

Actually, the simplest approach: use the same subscriber but add a second `pSubscribe` for `notifications:*`. Add this after the existing `pSubscribe` in the `connect` method:

```typescript
    await this.sub.pSubscribe(`${CHANNEL_PREFIX}*`, (message: string, _channel: string) => {
      if (!this.onEvent) return;
      try {
        const event = JSON.parse(message) as OrderEventPayload;
        this.onEvent(event);
      } catch { /* skip malformed */ }
    });
```

Wait, `CHANNEL_PREFIX` is `"orders:"`. We need a new prefix for notifications. Let me add a `NOTIF_CHANNEL_PREFIX`.

Add to `redis-pubsub.ts`:
```typescript
const NOTIF_CHANNEL_PREFIX = "notifications:";
```

And add a second pSubscribe in `connect()`:
```typescript
    await this.sub.pSubscribe(`notifications:*`, (message: string) => {
      if (!this.onNotification) return;
      try {
        const event = JSON.parse(message) as NotificationEventPayload;
        this.onNotification(event);
      } catch { /* skip malformed */ }
    });
```

And add `getNotificationHistory` method:
```typescript
  async getNotificationHistory(tenantId: string): Promise<NotificationEventPayload[]> {
    if (!redisClient) return [];
    try {
      const raw = await redisClient.lRange(`notifications:${tenantId}:history`, 0, 49);
      return raw.map((r) => JSON.parse(r) as NotificationEventPayload).reverse();
    } catch {
      return [];
    }
  }
```

- [ ] **Extend WS server `get_history` handler** to send notification replay:

Replace the `get_history` handler block in `ws-server.ts`:
```typescript
        } else if (msg.type === "get_history" && client.authenticated && client.tenantId) {
          const [events, notifs] = await Promise.all([
            subscriber.getHistory(client.tenantId),
            subscriber.getNotificationHistory(client.tenantId),
          ]);
          send(ws, { type: "replay", events });
          if (notifs.length > 0) {
            send(ws, { type: "notification_replay", events: notifs });
          }
        }
```

- [ ] **Extend `src/hooks/useOrderWebSocket.ts`** to handle notification messages:

Add `"notification"` and `"notification_replay"` message handling in the `ws.onmessage` handler, after the `order_event` case:

```typescript
          } else if (msg.type === "notification") {
            // Notifications handled by useNotifications hook via custom event
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("ws-notification", { detail: msg.data }));
            }
          } else if (msg.type === "notification_replay") {
            const notifEvents = (msg.events || []) as Array<Record<string, unknown>>;
            if (notifEvents.length > 0 && typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("ws-notification-replay", { detail: notifEvents }));
            }
```

---

### Task 5: Create useNotifications hook

**Files:**
- Create: `src/hooks/useNotifications.ts`

- [ ] **Create `src/hooks/useNotifications.ts`**:

```typescript
"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export interface NotificationItem {
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

interface UseNotificationsReturn {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(limit = 20): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        fetch(`/api/v1/notifications?limit=${limit}`),
        fetch("/api/v1/notifications/unread-count"),
      ]);
      if (!notifRes.ok || !countRes.ok) throw new Error("Failed to fetch notifications");
      const notifData = await notifRes.json();
      const countData = await countRes.json();
      if (mountedRef.current) {
        setNotifications(notifData.notifications ?? []);
        setUnreadCount(countData.count ?? 0);
      }
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [limit]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/v1/notifications/${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark as read");
      if (mountedRef.current) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // silent
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
      if (mountedRef.current) {
        setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
        setUnreadCount(0);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();

    const handleNotif = () => {
      fetchNotifications();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("ws-notification", handleNotif);
      window.addEventListener("ws-notification-replay", handleNotif);
    }

    return () => {
      mountedRef.current = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("ws-notification", handleNotif);
        window.removeEventListener("ws-notification-replay", handleNotif);
      }
    };
  }, [fetchNotifications]);

  return { notifications, unreadCount, loading, error, markAsRead, markAllAsRead, refresh: fetchNotifications };
}
```

---

### Task 6: Create Merchant Dashboard notification dropdown

**Files:**
- Create: `src/components/dashboard/notification-dropdown.tsx`
- Modify: `src/components/dashboard/topbar.tsx`

- [ ] **Create `src/components/dashboard/notification-dropdown.tsx`**:

```typescript
"use client";
import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Package, Truck, CheckCircle, XCircle, AlertTriangle, DollarSign, Loader2 } from "lucide-react";
import { useNotifications, type NotificationItem } from "@/hooks/useNotifications";

function getIcon(type: string) {
  switch (type) {
    case "order.created": return <Package size={15} />;
    case "order.shipped": return <Truck size={15} />;
    case "order.delivered": return <CheckCircle size={15} />;
    case "order.cancelled": return <XCircle size={15} />;
    case "payment.failed": return <XCircle size={15} />;
    case "payment.received": return <DollarSign size={15} />;
    case "inventory.low_stock": return <AlertTriangle size={15} />;
    case "inventory.out_of_stock": return <AlertTriangle size={15} />;
    default: return <Bell size={15} />;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications(10);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-[#F8FAFC]"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7C3AED] px-1 text-[10px] font-bold text-white ring-2 ring-background">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-[#F8FAFC]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-[#7C3AED] transition-colors hover:text-[#8B5CF6]"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Bell size={24} className="text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { if (!n.readAt) markAsRead(n.id); }}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-[#1E293B] ${
                    n.readAt ? "opacity-60" : ""
                  }`}
                >
                  <span className={`mt-0.5 shrink-0 ${n.type.includes("cancelled") || n.type.includes("failed") || n.type.includes("out_of_stock") ? "text-rose-400" : n.type.includes("low_stock") ? "text-amber-400" : "text-emerald-400"}`}>
                    {getIcon(n.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#F8FAFC]">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground/60">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Replace the Bell button in `src/components/dashboard/topbar.tsx`** with `NotificationDropdown`:

Remove the old Bell button block (lines 37-42):
```typescript
        <button
          className="relative rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-[#F8FAFC]"
        >
          <Bell size={17} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#7C3AED] ring-2 ring-background" />
        </button>
```

Replace with:
```typescript
        <NotificationDropdown />
```

And update the import:
```typescript
import NotificationDropdown from "@/components/dashboard/notification-dropdown";
```

Remove `Bell` from the lucide-react import if it's no longer used elsewhere in the file.

---

### Task 7: Create Customer Account notification center

**Files:**
- Create: `src/components/cc/views/notification-center-view.tsx`
- Create: `src/app/(storefront)/account/notifications/page.tsx`

- [ ] **Create `src/components/cc/views/notification-center-view.tsx`**:

```typescript
"use client";
import { useState } from "react";
import { Bell, Package, Truck, CheckCircle, XCircle, AlertTriangle, DollarSign, Loader2, Inbox } from "lucide-react";
import { useNotifications, type NotificationItem } from "@/hooks/useNotifications";

function getIcon(type: string) {
  switch (type) {
    case "order.created": return <Package size={18} />;
    case "order.shipped": return <Truck size={18} />;
    case "order.delivered": return <CheckCircle size={18} />;
    case "order.cancelled": return <XCircle size={18} />;
    case "payment.failed": return <XCircle size={18} />;
    case "payment.received": return <DollarSign size={18} />;
    case "inventory.low_stock": return <AlertTriangle size={18} />;
    case "inventory.out_of_stock": return <AlertTriangle size={18} />;
    default: return <Bell size={18} />;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationCenterView() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications(50);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = filter === "unread" ? notifications.filter((n) => !n.readAt) : notifications;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-[#7C3AED] transition-colors hover:bg-[#1E293B]"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${
            filter === "all" ? "bg-[#7C3AED] text-white" : "border border-border bg-card text-muted-foreground hover:text-[#F8FAFC]"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${
            filter === "unread" ? "bg-[#7C3AED] text-white" : "border border-border bg-card text-muted-foreground hover:text-[#F8FAFC]"
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox size={40} className="text-muted-foreground/30" />
          <p className="text-lg font-medium text-[#F8FAFC]">No notifications</p>
          <p className="text-sm text-muted-foreground">
            {filter === "unread" ? "All notifications have been read" : "You haven't received any notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => { if (!n.readAt) markAsRead(n.id); }}
              className={`flex w-full gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-[#7C3AED]/30 ${
                n.readAt ? "opacity-70" : ""
              }`}
            >
              <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                n.type.includes("cancelled") || n.type.includes("failed") || n.type.includes("out_of_stock")
                  ? "bg-rose-500/10 text-rose-400"
                  : n.type.includes("low_stock")
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-emerald-500/10 text-emerald-400"
              }`}>
                {getIcon(n.type)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-[#F8FAFC]">{n.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground/60">{timeAgo(n.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
              </div>
              {!n.readAt && (
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#7C3AED]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Create `src/app/(storefront)/account/notifications/page.tsx`**:

```typescript
"use client";
import NotificationCenterView from "@/components/cc/views/notification-center-view";

export default function AccountNotificationsPage() {
  return <NotificationCenterView />;
}
```

---

### Task 8: Wire notifications into order service

**Files:**
- Modify: `src/lib/services/orders.ts`

- [ ] **Import `createNotification`** at the top of `orders.ts`:

```typescript
import { createNotification } from "@/lib/services/notifications";
```

- [ ] **Add notification in `checkout()`** after the `OrderEventPublisher.publish` call (around line 202), before the return statement:

```typescript
    const customer = customerId ? await tx.customer.findUnique({ where: { id: customerId }, select: { name: true, email: true } }) : null;
    createNotification(tenantId, {
      type: "order.created",
      title: `Order #${orderNumber}`,
      body: `New order placed for $${Number(total).toFixed(2)} with ${cart.items.length} item${cart.items.length !== 1 ? "s" : ""}`,
      data: {
        orderId: order.id,
        orderNumber,
        total: Number(total),
        itemCount: cart.items.length,
        customerName: customer?.name ?? "",
        customerEmail: customer?.email ?? "",
      },
      channel: "both",
    }).catch(() => {});
```

- [ ] **Add notification in `updateOrderStatusValidated()`** for shipped/delivered/cancelled transitions:

After the `sendEmail` calls (around lines 552-568), add:

```typescript
  const notifChannel = (newStatus === "shipped" || newStatus === "delivered") ? "both" : "in_app";

  if (newStatus === "shipped") {
    createNotification(tenantId, {
      type: "order.shipped",
      title: `Order #${updated.number} shipped`,
      body: `Your order has been shipped`,
      data: { orderId: updated.id, orderNumber: updated.number, customerEmail: updated.customer?.email ?? "", customerName: updated.customer?.name ?? "" },
      channel: notifChannel,
    }).catch(() => {});
  } else if (newStatus === "delivered") {
    createNotification(tenantId, {
      type: "order.delivered",
      title: `Order #${updated.number} delivered`,
      body: `Your order has been delivered`,
      data: { orderId: updated.id, orderNumber: updated.number, customerEmail: updated.customer?.email ?? "", customerName: updated.customer?.name ?? "" },
      channel: notifChannel,
    }).catch(() => {});
  } else if (newStatus === "cancelled") {
    createNotification(tenantId, {
      type: "order.cancelled",
      title: `Order #${updated.number} cancelled`,
      body: `Order has been cancelled`,
      data: { orderId: updated.id, orderNumber: updated.number },
      channel: "in_app",
    }).catch(() => {});
  }
```

---

### Task 9: Wire notifications into payment service

**Files:**
- Modify: `src/lib/services/payment.ts`

- [ ] **Import `createNotification`** at the top of `payment.ts`:

```typescript
import { createNotification } from "@/lib/services/notifications";
```

- [ ] **Add notification in `handlePaymentIntentFailed()`** after the transaction block (around line 173):

```typescript
  createNotification(order.tenantId, {
    type: "payment.failed",
    title: `Payment failed for Order #${order.number}`,
    body: `Payment of $${Number(order.total).toFixed(2)} failed. The order has been cancelled and stock released.`,
    data: { orderId: order.id, orderNumber: order.number, total: Number(order.total) },
    channel: "in_app",
  }).catch(() => {});
```

- [ ] **Add notification in `handlePaymentIntentSucceeded()`** after the order update (around line 147):

```typescript
  const paidOrder = await prisma.order.findUnique({ where: { id: orderId }, select: { number: true, total: true, tenantId: true, customer: { select: { name: true, email: true } } } });
  if (paidOrder) {
    createNotification(paidOrder.tenantId, {
      type: "payment.received",
      title: `Payment received for Order #${paidOrder.number}`,
      body: `Payment of $${Number(paidOrder.total).toFixed(2)} was successful`,
      data: { orderId, orderNumber: paidOrder.number, total: Number(paidOrder.total), customerEmail: paidOrder.customer?.email ?? "", customerName: paidOrder.customer?.name ?? "" },
      channel: "both",
    }).catch(() => {});
  }
```

---

### Task 10: Wire notifications into inventory service

**Files:**
- Modify: `src/lib/services/inventory.ts`

- [ ] **Import `createNotification`** at the top of `inventory.ts`:

```typescript
import { createNotification } from "@/lib/services/notifications";
```

- [ ] **Add a helper function** at the end of the file (before the final `export` block):

```typescript
async function checkAndNotifyStock(
  variantId: string,
  newQty: number,
  tenantId: string,
  reason: string,
) {
  if (!process.env.DATABASE_URL) return;
  const inv = await prisma.inventory.findUnique({
    where: { variantId },
    include: { variant: { include: { product: { select: { name: true } } } } },
  });
  if (!inv) return;
  const productName = (inv.variant as any)?.product?.name ?? "Product";

  if (newQty <= 0) {
    createNotification(tenantId, {
      type: "inventory.out_of_stock",
      title: `${productName} is out of stock`,
      body: `${productName} (SKU: ${(inv.variant as any)?.sku ?? variantId}) is now out of stock. ${reason}`,
      data: { variantId, productName, sku: (inv.variant as any)?.sku ?? "", newQty, reason },
      channel: "in_app",
    }).catch(() => {});
  } else if (newQty <= inv.lowStockThreshold) {
    createNotification(tenantId, {
      type: "inventory.low_stock",
      title: `${productName} stock is low`,
      body: `${productName} (SKU: ${(inv.variant as any)?.sku ?? variantId}) has only ${newQty} units remaining (threshold: ${inv.lowStockThreshold}). ${reason}`,
      data: { variantId, productName, sku: (inv.variant as any)?.sku ?? "", newQty, threshold: inv.lowStockThreshold, reason },
      channel: "in_app",
    }).catch(() => {});
  }
}
```

- [ ] **Call the helper in `adjustStock()`** after updating stock (after the logAudit call, around line 140):

```typescript
    await checkAndNotifyStock(variantId, newQty, inv.tenantId, reason);
```

- [ ] **Call the helper in `decreaseStockOnOrder()`** after updating stock (around line 220):

```typescript
    await checkAndNotifyStock(variantId, newQty, inv.tenantId, `Order ${orderId} confirmed`);
```

---

### Task 11: Verification

- [ ] **Run Prisma format + generate**:

```bash
bunx prisma generate && bunx prisma format
```

- [ ] **Run lint**:

```bash
bun run lint
```

- [ ] **Run typecheck**:

```bash
bun run typecheck
```

- [ ] **Run tests**:

```bash
bun run test
```
