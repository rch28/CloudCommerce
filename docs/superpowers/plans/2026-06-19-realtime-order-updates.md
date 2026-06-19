# Realtime Order Updates — Implementation Plan

**Goal:** Live order feed on Merchant Dashboard via Redis Pub/Sub + Bun WebSocket

**Architecture:** Order Service → Redis Pub/Sub → Standalone WS Server → WebSocket → React hook → Dashboard widget

**Tech Stack:** Bun (native WebSocket), Redis (official `redis` package), React/Next.js 16

---

## Files to create/modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/lib/redis-pubsub.ts` | Redis Pub/Sub publisher + subscriber |
| Create | `src/ws-server.ts` | Standalone Bun WebSocket server |
| Create | `src/hooks/useOrderWebSocket.ts` | React client hook |
| Create | `src/components/dashboard/merchant/live-orders-feed.tsx` | Dashboard widget |
| Modify | `src/lib/services/orders.ts` | Publish events at key points |
| Modify | `src/components/dashboard/merchant/dashboard-view.tsx` | Wire in live feed widget |
| Modify | `package.json` | Add dev server scripts |
| Modify | `docker-compose.yml` | Add WS server port |

---

### Task 1: Install missing dependencies

- [ ] **Run:** `bun add redis` — the `redis` package is imported in `src/lib/redis.ts` but missing from package.json

- [ ] **Run:** `bun add -d concurrently` — for running WS server alongside Next.js in dev

- [ ] **Verify:** `grep -c '"redis"' package.json` should return 1 under dependencies

---

### Task 2: Create Redis Pub/Sub module (`src/lib/redis-pubsub.ts`)

- [ ] **Create file `src/lib/redis-pubsub.ts`**:

```typescript
import { redisClient } from "@/lib/redis";

export interface OrderEvent {
  event: "order.created" | "order.payment_received" | "order.shipped" | "order.cancelled";
  data: {
    id: string;
    number: string;
    status: string;
    total: number;
    customerName: string;
    itemCount: number;
    tenantId: string;
  };
  timestamp: string;
}

const EVENT_TTL = 7 * 24 * 60 * 60; // 7 days for history replay
const MAX_HISTORY = 50;

function channelFor(tenantId: string): string {
  return `orders:${tenantId}`;
}

function historyKey(tenantId: string): string {
  return `orders:${tenantId}:history`;
}

export class OrderEventPublisher {
  static async publish(tenantId: string, event: OrderEvent): Promise<void> {
    try {
      const channel = channelFor(tenantId);
      const payload = JSON.stringify(event);
      await redisClient!.publish(channel, payload);
      // Persist for replay on reconnect
      await redisClient!.lPush(historyKey(tenantId), payload);
      await redisClient!.lTrim(historyKey(tenantId), 0, MAX_HISTORY - 1);
      await redisClient!.expire(historyKey(tenantId), EVENT_TTL);
    } catch (err) {
      console.error("[OrderEventPublisher] Failed to publish event:", err);
    }
  }
}

export class OrderEventSubscriber {
  private subscriber: typeof redisClient;
  private handler: ((event: OrderEvent) => void) | null = null;

  constructor() {
    this.subscriber = redisClient!.duplicate();
  }

  async subscribe(tenantId: string, handler: (event: OrderEvent) => void): Promise<void> {
    this.handler = handler;
    await this.subscriber.connect();
    await this.subscriber.subscribe(channelFor(tenantId), (message) => {
      try {
        const event = JSON.parse(message) as OrderEvent;
        handler(event);
      } catch (err) {
        console.error("[OrderEventSubscriber] Failed to parse event:", err);
      }
    });
  }

  async getHistory(tenantId: string): Promise<OrderEvent[]> {
    try {
      const raw = await redisClient!.lRange(historyKey(tenantId), 0, MAX_HISTORY - 1);
      return raw.map((r) => JSON.parse(r) as OrderEvent).reverse();
    } catch {
      return [];
    }
  }

  async disconnect(): Promise<void> {
    await this.subscriber.disconnect();
  }
}
```

---

### Task 3: Create WebSocket server (`src/ws-server.ts`)

- [ ] **Create file `src/ws-server.ts`**:

```typescript
import { prisma } from "@/lib/prisma";
import { OrderEventSubscriber, type OrderEvent } from "@/lib/redis-pubsub";

const WS_PORT = parseInt(process.env.WS_PORT || "3001", 10);
const HEARTBEAT_INTERVAL = 30_000;
const PONG_TIMEOUT = 10_000;

interface ClientState {
  ws: WebSocket;
  tenantId: string | null;
  authenticated: boolean;
  lastPong: number;
  heartbeatTimer: ReturnType<typeof setInterval> | null;
}

const clients = new Map<WebSocket, ClientState>();

function send(ws: WebSocket, payload: Record<string, unknown>) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

async function authenticate(token: string): Promise<{ userId: string; tenantId: string } | null> {
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: { select: { id: true, tenantId: true } } },
    });
    if (!session || session.expiresAt < new Date() || !session.user.tenantId) return null;
    return { userId: session.user.id, tenantId: session.user.tenantId };
  } catch {
    return null;
  }
}

async function handleAuth(client: ClientState, token: string) {
  const user = await authenticate(token);
  if (!user) {
    send(client.ws, { type: "auth_error", message: "Invalid or expired session" });
    setTimeout(() => client.ws.close(), 100);
    return;
  }
  client.tenantId = user.tenantId;
  client.authenticated = true;
  send(client.ws, { type: "auth_ok", data: { tenantId: user.tenantId } });
}

function startHeartbeat(client: ClientState) {
  client.lastPong = Date.now();
  client.heartbeatTimer = setInterval(() => {
    if (Date.now() - client.lastPong > PONG_TIMEOUT) {
      console.log("[WS] Client pong timeout, closing");
      client.ws.close();
      return;
    }
    send(client.ws, { type: "heartbeat" });
  }, HEARTBEAT_INTERVAL);
}

async function main() {
  const subscriber = new OrderEventSubscriber();
  const activeSubscriptions = new Map<string, Set<WebSocket>>();

  console.log(`[WS] Starting WebSocket server on port ${WS_PORT}...`);

  // Connect subscriber and set up multi-tenant handler
  await subscriber.connect();
  // We'll subscribe per-tenant dynamically via the subscriber

  Bun.serve<{ client: ClientState }>({
    port: WS_PORT,
    fetch(req, server) {
      const success = server.upgrade(req, {
        data: {
          ws: null as unknown as WebSocket,
          tenantId: null,
          authenticated: false,
          lastPong: Date.now(),
          heartbeatTimer: null,
        } satisfies ClientState,
      });
      if (success) return undefined;
      return new Response("WebSocket upgrade failed", { status: 426 });
    },
    websocket: {
      async open(ws) {
        const client = ws.data;
        client.ws = ws as unknown as WebSocket;
        clients.set(ws as unknown as WebSocket, client);
        console.log("[WS] Client connected");
        send(ws as unknown as WebSocket, { type: "auth_required" });
      },
      async message(ws, raw) {
        const client = ws.data;
        try {
          const msg = typeof raw === "string" ? JSON.parse(raw) : JSON.parse(new TextDecoder().decode(raw as BufferSource));
          if (msg.type === "auth" && msg.data?.sessionToken) {
            await handleAuth(client, msg.data.sessionToken);
            if (client.authenticated && client.tenantId) {
              // Subscribe to this tenant's events
              if (!activeSubscriptions.has(client.tenantId)) {
                activeSubscriptions.set(client.tenantId, new Set());
                await subscriber.tenantSubscribe(client.tenantId, (event: OrderEvent) => {
                  const sockets = activeSubscriptions.get(client.tenantId);
                  if (sockets) {
                    for (const sock of sockets) {
                      send(sock, { type: "order_event", ...event });
                    }
                  }
                });
              }
              activeSubscriptions.get(client.tenantId)!.add(ws as unknown as WebSocket);
              startHeartbeat(client);
            }
          } else if (msg.type === "pong") {
            client.lastPong = Date.now();
          } else if (msg.type === "get_history" && client.authenticated && client.tenantId) {
            const events = await subscriber.getHistory(client.tenantId);
            send(ws as unknown as WebSocket, { type: "replay", events });
          }
        } catch (err) {
          console.error("[WS] Message error:", err);
          send(ws as unknown as WebSocket, { type: "error", message: "Invalid message" });
        }
      },
      close(ws) {
        const client = ws.data;
        if (client.heartbeatTimer) clearInterval(client.heartbeatTimer);
        if (client.tenantId) {
          const sockets = activeSubscriptions.get(client.tenantId);
          if (sockets) {
            sockets.delete(ws as unknown as WebSocket);
            if (sockets.size === 0) {
              activeSubscriptions.delete(client.tenantId);
            }
          }
        }
        clients.delete(ws as unknown as WebSocket);
        console.log("[WS] Client disconnected");
      },
    },
  });
}

main().catch((err) => {
  console.error("[WS] Fatal error:", err);
  process.exit(1);
});
```

Wait — I need to think about this more carefully. The `OrderEventSubscriber` I defined above subscribes to channels via `.subscribe(channel, handler)`. But for multi-tenant support, I need to subscribe to multiple channels. The base `OrderEventSubscriber` needs to support multiple tenants. Let me rethink.

Actually, Redis Pub/Sub allows subscribing to multiple channels. Let me redesign `OrderEventSubscriber` to be tenant-agnostic — it subscribes to ALL order channels and dispatches to handlers.

Actually, a better approach: the subscriber subscribes to a channel pattern (Redis supports glob patterns in Pub/Sub with `PSUBSCRIBE`). We could do `orders:*` to get all tenant events and then dispatch. But PSUBSCRIBE only supports glob-style patterns, not regex.

Wait, actually Redis PSUBSCRIBE supports glob patterns:
- `orders:*` matches all `orders:xxx` channels
- `h?llo` matches `hello`, `hallo`, etc.

So I can PSUBSCRIBE to `orders:*` and dispatch based on the extracted tenantId from the channel name.

Let me redesign:

The subscriber:
```ts
class OrderEventSubscriber {
  private subscriber;
  private handlers = new Map<string, (event: OrderEvent) => void>();
  private subscribed = false;

  constructor() {
    this.subscriber = redisClient!.duplicate();
  }

  async connect() {
    await this.subscriber.connect();
  }

  async addHandler(tenantId: string, handler: (event: OrderEvent) => void) {
    this.handlers.set(tenantId, handler);
    if (!this.subscribed) {
      this.subscribed = true;
      // Subscribe to pattern for all tenants
      await this.subscriber.pSubscribe("orders:*", (message, channel) => {
        const tenantId = channel.split(":")[1];
        const handler = this.handlers.get(tenantId);
        if (handler) {
          try {
            handler(JSON.parse(message));
          } catch {}
        }
      });
    }
  }

  async getHistory(tenantId: string): Promise<OrderEvent[]> { ... }
  async disconnect() { ... }
}
```

This is cleaner. Let me write the final implementations.

Actually, let me just write all the files properly. Let me skip the plan document for now since the user wants implementation. I'll write the plan doc and then execute.

Let me think about the flow more carefully:

1. The WS server starts
2. Client connects via WebSocket
3. Client sends `{ type: "auth", data: { sessionToken } }`
4. Server validates the session token, extracts tenantId
5. Server registers the tenant handler with the subscriber (if not already subscribed to that tenant)
6. Server starts heartbeat for that client
7. When an order event arrives via Redis, the subscriber calls the registered handler, which broadcasts to all connected clients for that tenant
8. On order service operations (checkout, status change), we publish events to Redis

Now for the subscriber, since I'm using `pSubscribe` with a glob pattern `orders:*`, I can handle all tenants through a single subscription. But I need to track which tenants have active clients.

Let me finalize the implementation.<｜end▁of▁thinking｜>

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="todowrite">
<｜｜DSML｜｜parameter name="todos" string="false">[{"content":"Explore existing codebase architecture (services, API, dashboard)","priority":"high","status":"completed"},{"content":"Design WebSocket infrastructure plan","priority":"high","status":"completed"},{"content":"Install dependencies (redis, concurrently)","priority":"high","status":"in_progress"},{"content":"Create Redis Pub/Sub module (src/lib/redis-pubsub.ts)","priority":"high","status":"pending"},{"content":"Create WebSocket server (src/ws-server.ts)","priority":"high","status":"pending"},{"content":"Create React WebSocket hook (src/hooks/useOrderWebSocket.ts)","priority":"high","status":"pending"},{"content":"Create live order feed widget (live-orders-feed.tsx)","priority":"high","status":"pending"},{"content":"Wire order service to publish events","priority":"high","status":"pending"},{"content":"Wire widget into merchant dashboard","priority":"high","status":"pending"},{"content":"Update package.json and docker-compose.yml","priority":"high","status":"pending"},{"content":"Run verification (lint, typecheck, build)","priority":"high","status":"pending"}]