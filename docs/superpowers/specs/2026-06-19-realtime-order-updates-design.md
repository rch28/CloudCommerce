# Realtime Order Updates — Design Spec

## Goal
Live order feed on the Merchant Dashboard with realtime push updates.

## Architecture
```
Order Service → OrderEventPublisher → Redis Pub/Sub (orders:{tenantId})
                                            ↓
                                WS Server (subscribes via redis.duplicate())
                                            ↓
                                WebSocket wss://hostname:3001
                                            ↓
                                Merchant Dashboard (useOrderWebSocket hook)
```

## Components

### 1. Redis Pub/Sub (`src/lib/redis-pubsub.ts`)
- `OrderEventPublisher` — `publish(tenantId, event)` → `orders:{tenantId}`
- `OrderEventSubscriber` — subscribes to channel patterns, calls registered handler
- Uses `redisClient.duplicate()` (Pub/Sub requires dedicated connection)

### 2. WebSocket server (`src/ws-server.ts`)
- Bun-native WebSocket (no ws package needed — built into Bun)
- Port 3001, configurable via `WS_PORT` env
- Auth: validates `cc_session_token` cookie → Prisma session lookup → extract `tenantId`
- Subscribes tenant after auth
- Heartbeat: server sends ping every 30s, expects pong within 10s
- Event persistence: last 50 events per tenant in Redis `orders:{tenantId}:history`
- Replay: on reconnect, client sends `lastTimestamp`, server replays missed events

### 3. Message protocol
| Direction | Type | Purpose |
|-----------|------|---------|
| C→S | `auth` | `{ sessionToken }` |
| S→C | `auth_ok` | `{ tenantId }` |
| S→C | `auth_error` | `{ message }` + close |
| S→C | `order_event` | `{ event, data, timestamp }` |
| S→C | `heartbeat` | `{}` |
| C→S | `pong` | `{}` |
| S→C | `replay` | `{ events: [...] }` on reconnection |

### 4. Events
- `order.created` — after successful checkout
- `order.payment_received` — status transition to "paid"
- `order.shipped` — status transition to "shipped"
- `order.cancelled` — status transition to "cancelled"

### 5. React hook (`src/hooks/useOrderWebSocket.ts`)
- Connects to `ws://hostname:3001` (configurable via `NEXT_PUBLIC_WS_URL`)
- Auto-reconnect with exponential backoff 1s–30s
- Re-authenticates on reconnect
- Returns `{ events, connected, error, clearEvents }`

### 6. Dashboard widget (`live-orders-feed.tsx`)
- Scrollable list of last 50 order events
- Color-coded status badges (created=blue, payment_received=green, shipped=purple, cancelled=red)
- Slide-in animation on new events
- Empty state: "Waiting for orders..."
- Replaces static Recent Orders in `dashboard-view.tsx`

### 7. Order service integration
- Non-blocking `.catch(() => {})` publishes in `checkout()` and `updateOrderStatusValidated()`

## Dev workflow
- `bun add redis` (install missing dependency)
- `bun add -d concurrently`
- `package.json` scripts: `"dev": "concurrently -n next,ws \"next dev\" \"bun run src/ws-server.ts\""`
- `docker-compose.yml` updates for WS server port 3001
