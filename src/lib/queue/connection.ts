function getQueueRedisUrl(): string {
  if (process.env.REDIS_QUEUE_URL) return process.env.REDIS_QUEUE_URL;
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  if (process.env.UPSTASH_REST_URL && process.env.UPSTASH_REST_TOKEN) return process.env.UPSTASH_REST_URL;
  if (process.env.REDIS_CLOUD_URL && process.env.REDIS_CLOUD_PASSWORD) return process.env.REDIS_CLOUD_URL;
  return "redis://localhost:6379";
}

export function getQueueConnection(): { url: string } {
  return { url: getQueueRedisUrl() };
}

export async function testQueueConnection(): Promise<boolean> {
  try {
    const Redis = (await import("ioredis")).default;
    const client = new Redis(getQueueRedisUrl());
    await client.ping();
    client.disconnect();
    return true;
  } catch {
    return false;
  }
}
