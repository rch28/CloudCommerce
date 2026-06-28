import { redisClient } from "@/lib/redis";
import { createClient } from "redis";
import type { RedisClientType } from "redis";

export interface OrderEventPayload {
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

const CHANNEL_PREFIX = "orders:";
const HISTORY_PREFIX = "orders:";
const MAX_HISTORY = 50;
const HISTORY_TTL = 7 * 24 * 60 * 60;
function channelFor(tenantId: string): string {
  return `${CHANNEL_PREFIX}${tenantId}`;
}

function historyKey(tenantId: string): string {
  return `${HISTORY_PREFIX}${tenantId}:history`;
}

export class OrderEventPublisher {
  static async publish(tenantId: string, payload: OrderEventPayload): Promise<void> {
    if (!redisClient) return;
    try {
      const channel = channelFor(tenantId);
      const raw = JSON.stringify(payload);
      await redisClient.publish(channel, raw);
      await redisClient.lPush(historyKey(tenantId), raw);
      await redisClient.lTrim(historyKey(tenantId), 0, MAX_HISTORY - 1);
      await redisClient.expire(historyKey(tenantId), HISTORY_TTL);
    } catch (err) {
      console.error("[OrderEventPublisher] publish failed:", err);
    }
  }
}

export class OrderEventSubscriber {
  private sub: RedisClientType;
  // Callbacks receive the channel-derived tenantId as the authoritative scope —
  // never trust the tenantId embedded in the payload body.
  onEvent: ((event: OrderEventPayload, channelTenantId: string) => void) | null = null;
  onNotification: ((event: NotificationEventPayload, channelTenantId: string) => void) | null = null;
  private connected = false;

  constructor() {
    const url = process.env.REDIS_QUEUE_URL || process.env.REDIS_URL || process.env.UPSTASH_REST_URL || "redis://localhost:6379";
    this.sub = createClient({ url });
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    this.connected = true;
    await this.sub.connect();
    await this.sub.pSubscribe(`${CHANNEL_PREFIX}*`, (message: string, channel: string) => {
      if (!this.onEvent) return;
      try {
        const event = JSON.parse(message) as OrderEventPayload;
        const channelTenantId = channel.slice(CHANNEL_PREFIX.length);
        this.onEvent(event, channelTenantId);
      } catch { /* skip malformed */ }
    });
    await this.sub.pSubscribe(`notifications:*`, (message: string, channel: string) => {
      if (!this.onNotification) return;
      try {
        const event = JSON.parse(message) as NotificationEventPayload;
        const channelTenantId = channel.slice("notifications:".length);
        this.onNotification(event, channelTenantId);
      } catch { /* skip malformed */ }
    });
  }

  async getHistory(tenantId: string): Promise<OrderEventPayload[]> {
    if (!redisClient) return [];
    try {
      const raw = await redisClient.lRange(historyKey(tenantId), 0, MAX_HISTORY - 1);
      return raw.map((r) => JSON.parse(r) as OrderEventPayload).reverse();
    } catch {
      return [];
    }
  }

  async getNotificationHistory(tenantId: string): Promise<NotificationEventPayload[]> {
    if (!redisClient) return [];
    try {
      const raw = await redisClient.lRange(`notifications:${tenantId}:history`, 0, 49);
      return raw.map((r) => JSON.parse(r) as NotificationEventPayload).reverse();
    } catch {
      return [];
    }
  }

  async disconnect(): Promise<void> {
    await this.sub.quit();
    this.connected = false;
  }
}
