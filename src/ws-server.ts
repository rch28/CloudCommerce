import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { prisma } from "@/lib/prisma";
import { OrderEventSubscriber, type OrderEventPayload, type NotificationEventPayload } from "@/lib/redis-pubsub";

const WS_PORT = parseInt(process.env.WS_PORT || "3001", 10);
const HEARTBEAT_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 10_000;

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

function cleanup(ws: WebSocket, client: ClientState) {
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

  subscriber.onEvent = (event: OrderEventPayload) => {
    broadcast(event.data.tenantId, { type: "order_event", ...event });
  };

  subscriber.onNotification = (event: NotificationEventPayload) => {
    broadcast(event.data.tenantId, { type: "notification", ...event });
  };

  const server = createServer();
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    const client: ClientState = {
      tenantId: null,
      authenticated: false,
      lastPong: Date.now(),
      heartbeatTimer: null,
    };

    send(ws, { type: "auth_required" });

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
      cleanup(ws, client);
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
