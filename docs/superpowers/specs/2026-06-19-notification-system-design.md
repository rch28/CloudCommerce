# Notification System — Design Spec

**Date:** 2026-06-19
**Status:** Approved
**Phase:** 4 Sprint 4

## Overview

Multi-channel notification system for CloudCommerce. Supports in-app (notification center + real-time push via WebSocket) and email delivery for order, payment, and inventory events. Serves both merchants (dashboard dropdown) and customers (account notification center).

## Data Models

### Notification

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| tenantId | String | Multi-tenant |
| userId | String? | Nullable for system/broadcast |
| type | String | `order.created`, `order.shipped`, `order.delivered`, `order.cancelled`, `payment.failed`, `payment.received`, `inventory.low_stock`, `inventory.out_of_stock` |
| title | String | Short headline |
| body | String | Detail message |
| data | Json? | Payload (orderId, orderNumber, amount, variantId, etc.) |
| channel | String | `in_app` \| `email` \| `both` |
| readAt | DateTime? | Null = unread |
| emailSentAt | DateTime? | Null = not sent |
| createdAt | DateTime | `@default(now())` |

### NotificationPreference

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| tenantId | String | Multi-tenant |
| userId | String | FK to User |
| channel | String | `in_app` \| `email` |
| events | String[] | Event types this channel covers |
| enabled | Boolean | Master toggle per channel |

`@@unique([tenantId, userId, channel])`

## Architecture

```
Service Layer (orders.ts, payment.ts, inventory.ts)
  │
  ▼
NotificationService.createNotification()
  ├──► Prisma (persist)
  ├──► Redis Pub/Sub "notifications:{tenantId}"
  │      └──► WS Server → Push to connected clients
  └──► sendEmail() (if channel includes email)
```

### Event Types

| Event | Triggers | Audience |
|-------|----------|----------|
| `order.created` | checkout() | Merchant |
| `order.shipped` | updateOrderStatus → shipped | Customer |
| `order.delivered` | updateOrderStatus → delivered | Customer |
| `order.cancelled` | updateOrderStatus → cancelled | Merchant + Customer |
| `payment.failed` | webhook → payment_intent.payment_failed | Merchant |
| `payment.received` | webhook → payment_intent.succeeded | Merchant |
| `inventory.low_stock` | stock ≤ lowStockThreshold | Merchant |
| `inventory.out_of_stock` | stock = 0 | Merchant |

## Service Layer

**File:** `src/lib/services/notifications.ts`

- `createNotification(tenantId, data)` → persist + publish + optionally email
- `getNotifications(tenantId, userId, { limit, offset, unreadOnly })` → paginated
- `getUnreadCount(tenantId, userId)` → `{ count }`
- `markAsRead(id, tenantId, userId)` → set `readAt`
- `markAllAsRead(tenantId, userId)` → batch update
- `getPreferences(tenantId, userId)` → array of preferences
- `updatePreference(tenantId, userId, channel, events, enabled)` → upsert

Mock data fallback when `DATABASE_URL` not set, following existing pattern.

## API Routes

All under `src/app/api/v1/notifications/`. Authenticated via `getSessionUser()`, tenant from `x-tenant-id`.

| Method | Path | Handler | Returns |
|--------|------|---------|---------|
| GET | `/api/v1/notifications` | listNotifications | `{ notifications, total }` |
| GET | `/api/v1/notifications/unread-count` | getUnreadCount | `{ count }` |
| PATCH | `/api/v1/notifications/[id]` | markAsRead | `{ success: true }` |
| POST | `/api/v1/notifications/mark-all-read` | markAllAsRead | `{ success: true }` |
| GET | `/api/v1/notifications/preferences` | getPreferences | `{ preferences }` |
| PUT | `/api/v1/notifications/preferences` | updatePreferences | `{ preference }` |

## WebSocket Integration

- Redis channel: `notifications:{tenantId}`
- WS outbound message: `{ type: "notification", payload: { id, type, title, body, data, createdAt } }`
- History: Redis list `notifications:{tenantId}:history` (last 50, 7-day TTL), replayed on `get_history`
- Extend `useOrderWebSocket` hook to handle `"notification"` events

## UI Components

### Merchant Dashboard — Notification Dropdown

- Bell icon in topbar with unread count badge
- DropdownMenu showing last 10 notifications
- Per-item: icon (by type), title, timestamp, read/unread dot
- "Mark all read" + "View all" footer
- Real-time count update via WebSocket

### Customer Account — Notification Center

- Page at `/(storefront)/account/notifications`
- Paginated list of notifications
- Filter: All / Unread
- Card layout with read/unread styling
- Click to mark as read and expand details
- Empty state when no notifications

### Merchant — Notification Preferences

- Settings page or section with per-channel event toggles
- Switch component per event type, grouped by channel

## Integration Points

### orders.ts
- `checkout()` → create notification `order.created`
- `updateOrderStatusValidated()` → notify on shipped/delivered/cancelled transitions

### payment.ts (webhook handlers)
- `handlePaymentIntentFailed()` → create notification `payment.failed`
- `handlePaymentIntentSucceeded()` → create notification `payment.received`

### inventory.ts
- After `adjustStock()` / `decreaseStockOnOrder()` / `releaseStock()` → check thresholds and create notification if low/out

## Extensibility

- New channels (SMS, push): add to `NotificationPreference.channel` type, implement provider, add to delivery pipeline
- New event types: add to system event list, create notification in relevant service, users opt in via preferences
