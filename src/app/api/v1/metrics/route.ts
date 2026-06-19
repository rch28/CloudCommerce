import { NextResponse } from "next/server";
import { getAggregateMetrics, getAllQueueHealth } from "@/lib/queue/monitoring";
import { redisClient } from "@/lib/redis";
import { getWsMetrics } from "@/lib/ws-metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  const queueMetrics = await getAggregateMetrics();
  const queueHealth = await getAllQueueHealth();
  const redisInfo = await getRedisInfo();
  const memoryUsage = process.memoryUsage();
  const ws = getWsMetrics();

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
      rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
    },
    redis: redisInfo,
    queues: {
      aggregate: queueMetrics,
      detail: queueHealth,
    },
    websocket: ws,
    eventLoop: await getEventLoopLag(),
  });
}

async function getRedisInfo() {
  if (!redisClient) {
    return { connected: false, usedMemory: null, totalKeys: null };
  }
  try {
    const info = await redisClient.info("memory");
    const keys = await redisClient.dbSize();
    const usedMemoryMatch = info.match(/used_memory_human:(\S+)/);
    return {
      connected: true,
      usedMemory: usedMemoryMatch?.[1] ?? "unknown",
      totalKeys: keys,
    };
  } catch {
    return { connected: false, usedMemory: null, totalKeys: null };
  }
}

async function getEventLoopLag(): Promise<number> {
  return new Promise((resolve) => {
    const start = Date.now();
    setImmediate(() => {
      resolve(Date.now() - start);
    });
  });
}
