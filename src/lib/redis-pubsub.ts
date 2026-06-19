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
  onEvent: ((event: OrderEventPayload) => void) | null = null;
  private connected = false;

  constructor() {
    this.sub = createClient({ url: "redis://localhost:6379" });
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    this.connected = true;
    await this.sub.connect();
    await this.sub.pSubscribe(`${CHANNEL_PREFIX}*`, (message: string, _channel: string) => {
      if (!this.onEvent) return;
      try {
        const event = JSON.parse(message) as OrderEventPayload;
        this.onEvent(event);
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

  async disconnect(): Promise<void> {
    await this.sub.quit();
    this.connected = false;
  }
}
