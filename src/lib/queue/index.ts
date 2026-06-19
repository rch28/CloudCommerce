import { Queue, type DefaultJobOptions } from "bullmq";
import { getQueueConnection } from "./connection";
import { QUEUES, type QueueName } from "./names";
import { logger } from "@/lib/logger";

const queues = new Map<QueueName, Queue>();

const DEFAULT_OPTS: Record<QueueName, DefaultJobOptions> = {
  [QUEUES.MAIL]: {
    attempts: 5,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { age: 60 * 60 * 24 * 3 },
    removeOnFail: { age: 60 * 60 * 24 * 7 },
  },
  [QUEUES.INVENTORY]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { age: 60 * 60 * 24 },
    removeOnFail: { age: 60 * 60 * 24 * 3 },
  },
  [QUEUES.NOTIFICATIONS]: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { age: 60 * 60 * 24 },
    removeOnFail: { age: 60 * 60 * 24 * 3 },
  },
  [QUEUES.WEBHOOKS]: {
    attempts: 5,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 60 * 60 * 24 * 7 },
    removeOnFail: { age: 60 * 60 * 24 * 14 },
  },
  [QUEUES.DEAD_LETTER]: {
    attempts: 1,
    removeOnComplete: { age: 60 * 60 * 24 * 30 },
    removeOnFail: { age: 60 * 60 * 24 * 30 },
  },
};

export function getQueue(name: QueueName): Queue {
  let q = queues.get(name);
  if (!q) {
    q = new Queue(name, {
      connection: getQueueConnection(),
      defaultJobOptions: DEFAULT_OPTS[name],
    });

    q.on("error", (err) => {
      logger.error(`Queue ${name} error`, {
        metadata: { error: err.message },
      });
    });

    queues.set(name, q);
  }
  return q;
}

export async function closeAllQueues(): Promise<void> {
  for (const q of queues.values()) {
    await q.close();
  }
  queues.clear();
}

export function getMailQueue(): Queue {
  return getQueue(QUEUES.MAIL);
}

export function getInventoryQueue(): Queue {
  return getQueue(QUEUES.INVENTORY);
}

export function getNotificationQueue(): Queue {
  return getQueue(QUEUES.NOTIFICATIONS);
}

export function getWebhookQueue(): Queue {
  return getQueue(QUEUES.WEBHOOKS);
}

export function getDeadLetterQueue(): Queue {
  return getQueue(QUEUES.DEAD_LETTER);
}
