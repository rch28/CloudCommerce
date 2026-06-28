import { WebSocketServer, WebSocket } from "ws";
import { createServer, type IncomingMessage } from "http";
import { prisma } from "@/lib/prisma";
import { OrderEventSubscriber, type OrderEventPayload, type NotificationEventPayload } from "@/lib/redis-pubsub";
import { wsMetrics } from "@/lib/ws-metrics";

const WS_PORT = parseInt(process.env.WS_PORT || "3001", 10);
const HEARTBEAT_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 10_000;
const AUTH_TIMEOUT_MS = 15_000;

interface ClientState {
  tenantId: string | null;
  authenticated: boolean;
  lastPong: number;
  heartbeatTimer: ReturnType<typeof setInterval> | null;
}

const tenantSockets = new Map<string, Set<WebSocket>>();

function send(ws: WebSocket, payload: Record<string, unknown>) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcast(tenantId: string, payload: Record<string, unknown>) {
  const sockets = tenantSockets.get(tenantId);
  if (sockets) {
    for (const ws of sockets) {
      send(ws, payload);
    }
  }
}

async function authenticate(token: string) {
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

async function handleAuth(ws: WebSocket, client: ClientState, token: string) {
  const user = await authenticate(token);
  if (!user) {
    send(ws, { type: "auth_error", message: "Invalid or expired session" });
    setTimeout(() => ws.close(), 100);
    return;
  }
  client.tenantId = user.tenantId;
  client.authenticated = true;

  if (!tenantSockets.has(user.tenantId)) {
    tenantSockets.set(user.tenantId, new Set());
  }
  tenantSockets.get(user.tenantId)!.add(ws);

  send(ws, { type: "auth_ok", data: { tenantId: user.tenantId } });

  client.lastPong = Date.now();
  client.heartbeatTimer = setInterval(() => {
    if (Date.now() - client.lastPong > PONG_TIMEOUT_MS) {
      ws.close();
      return;
    }
    send(ws, { type: "heartbeat" });
  }, HEARTBEAT_INTERVAL_MS);
}

function cleanup(ws: WebSocket, client: ClientState, authTimeout?: ReturnType<typeof setTimeout>) {
  if (authTimeout) clearTimeout(authTimeout);
  if (client.heartbeatTimer) clearInterval(client.heartbeatTimer);
  if (client.tenantId) {
    const sockets = tenantSockets.get(client.tenantId);
    if (sockets) {
      sockets.delete(ws);
      if (sockets.size === 0) tenantSockets.delete(client.tenantId);
    }
  }
}

async function main() {
  const subscriber = new OrderEventSubscriber();
  await subscriber.connect();

  // Use the Redis channel name as the authoritative tenant scope — never the payload body.
  subscriber.onEvent = (event: OrderEventPayload, channelTenantId: string) => {
    wsMetrics.totalEventsProcessed++;
    broadcast(channelTenantId, { type: "order_event", ...event });
  };

  subscriber.onNotification = (event: NotificationEventPayload, channelTenantId: string) => {
    wsMetrics.totalEventsProcessed++;
    broadcast(channelTenantId, { type: "notification", ...event });
  };

  const server = createServer();

  const allowedOrigins = (process.env.WS_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);

  const wss = new WebSocketServer({
    server,
    verifyClient: ({ req }: { req: IncomingMessage }) => {
      if (allowedOrigins.length === 0) return true;
      const origin = req.headers.origin;
      return !origin || allowedOrigins.includes(origin);
    },
  });

  wsMetrics.serverStartTime = Date.now();

  wss.on("connection", (ws) => {
    wsMetrics.connectedClients = wss.clients.size;
    const client: ClientState = {
      tenantId: null,
      authenticated: false,
      lastPong: Date.now(),
      heartbeatTimer: null,
    };

    send(ws, { type: "auth_required" });

    // Close connections that never authenticate within the allowed window.
    const authTimeout = setTimeout(() => {
      if (!client.authenticated) {
        send(ws, { type: "auth_timeout" });
        ws.close();
      }
    }, AUTH_TIMEOUT_MS);

    ws.on("message", async (raw) => {
      try {
        const text = raw.toString();
        const msg = JSON.parse(text);

        if (msg.type === "auth" && msg.data?.sessionToken) {
          await handleAuth(ws, client, msg.data.sessionToken);
        } else if (msg.type === "pong") {
          client.lastPong = Date.now();
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
      } catch (err) {
        console.error("[WS] message error:", err);
      }
    });

    ws.on("close", () => {
      cleanup(ws, client, authTimeout);
      wsMetrics.connectedClients = wss.clients.size;
      console.log("[WS] client disconnected");
    });

    ws.on("error", () => {});
  });

  server.listen(WS_PORT, () => {
    console.log(`[WS] WebSocket server listening on port ${WS_PORT}`);
  });
}

main().catch((err) => {
  console.error("[WS] fatal error:", err);
  process.exit(1);
});
