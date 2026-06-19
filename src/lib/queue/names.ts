export const QUEUES = {
  MAIL: "mail",
  INVENTORY: "inventory",
  NOTIFICATIONS: "notifications",
  WEBHOOKS: "webhooks",
  DEAD_LETTER: "dead_letter",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export function deadLetterName(base: QueueName): string {
  return `${base}:dead`;
}
