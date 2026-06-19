import type { Redis } from "ioredis";
import { QUEUES, deadLetterName, type QueueName } from "./names";
import { getQueue } from "./index";
import { logger } from "@/lib/logger";

let monitorClient: Redis | null = null;

async function getMonitorClient(): Promise<Redis | null> {
  if (monitorClient) return monitorClient;
  try {
    const { Redis } = await import("ioredis");
    const url = process.env.REDIS_QUEUE_URL
      ?? process.env.REDIS_URL
      ?? "redis://localhost:6379";
    monitorClient = new Redis(url, {
      maxRetriesPerRequest: 2,
      retryStrategy: () => null,
      lazyConnect: true,
      enableReadyCheck: false,
    });
    await monitorClient.connect();
    return monitorClient;
  } catch (err) {
    logger.error("Failed to create monitoring Redis client", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export interface QueueMetrics {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  deadLetterCount: number;
}

export interface WorkerHealth {
  queue: string;
  isHealthy: boolean;
  metrics: QueueMetrics | null;
  error: string | null;
}

export async function getQueueMetrics(name: QueueName): Promise<QueueMetrics> {
  const q = getQueue(name);
  const [jobCounts, isPaused] = await Promise.all([
    q.getJobCounts(),
    q.isPaused(),
  ]);

  let deadLetterCount = 0;
  try {
    const dlq = getQueue(deadLetterName(name) as QueueName);
    const dlCounts = await dlq.getJobCounts();
    deadLetterCount = dlCounts.waiting + dlCounts.active + dlCounts.failed;
  } catch {
    // DLQ may not exist yet
  }

  return {
    name,
    waiting: jobCounts.waiting ?? 0,
    active: jobCounts.active ?? 0,
    completed: jobCounts.completed ?? 0,
    failed: jobCounts.failed ?? 0,
    delayed: jobCounts.delayed ?? 0,
    paused: isPaused,
    deadLetterCount,
  };
}

export async function getDeadLetterJobs(
  name: QueueName,
  start = 0,
  end = 20,
) {
  const dlq = getQueue(deadLetterName(name) as QueueName);
  return dlq.getJobs(["failed", "waiting"], start, end);
}

export async function retryDeadLetterJob(
  name: QueueName,
  jobId: string,
): Promise<void> {
  const dlq = getQueue(deadLetterName(name) as QueueName);
  const job = await dlq.getJob(jobId);
  if (!job) throw new Error(`Dead-letter job ${jobId} not found in ${name}`);

  const target = getQueue(name);
  await target.add(job.name, job.data, {
    ...job.opts,
    attempts: 5,
  });

  await job.remove();
  logger.info(`Retried dead-letter job ${jobId} back to ${name}`);
}

export async function getAllQueueHealth(): Promise<WorkerHealth[]> {
  const names: QueueName[] = [
    QUEUES.MAIL,
    QUEUES.INVENTORY,
    QUEUES.NOTIFICATIONS,
    QUEUES.WEBHOOKS,
  ];

  const results = await Promise.allSettled(
    names.map(async (name) => {
      const metrics = await getQueueMetrics(name);
      return {
        queue: name,
        isHealthy: metrics.failed < metrics.completed * 0.1 || metrics.completed === 0,
        metrics,
        error: null,
      } satisfies WorkerHealth;
    }),
  );

  return results.map((r) => {
    if (r.status === "fulfilled") return r.value;
    return {
      queue: "unknown",
      isHealthy: false,
      metrics: null,
      error: r.reason?.message ?? String(r.reason),
    } satisfies WorkerHealth;
  });
}

export async function getAggregateMetrics() {
  const health = await getAllQueueHealth();
  const totals = health.reduce(
    (acc, h) => {
      if (!h.metrics) return acc;
      acc.waiting += h.metrics.waiting;
      acc.active += h.metrics.active;
      acc.completed += h.metrics.completed;
      acc.failed += h.metrics.failed;
      acc.delayed += h.metrics.delayed;
      acc.deadLetter += h.metrics.deadLetterCount;
      return acc;
    },
    { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, deadLetter: 0 },
  );

  return {
    ...totals,
    throughputRate: totals.completed > 0
      ? (totals.completed / (totals.completed + totals.failed)) * 100
      : 100,
    healthyQueues: health.filter((h) => h.isHealthy).length,
    totalQueues: health.length,
  };
}

export async function cleanupStaleLocks(): Promise<number> {
  const client = await getMonitorClient();
  if (!client) return 0;
  try {
    const keys = await client.keys("bull:*:lock");
    let removed = 0;
    for (const key of keys) {
      const ttl = await client.ttl(key);
      if (ttl < 0) {
        await client.del(key);
        removed++;
      }
    }
    if (removed > 0) {
      logger.info(`Cleaned up ${removed} stale queue locks`);
    }
    return removed;
  } catch {
    return 0;
  }
}
