import { redisClient } from "@/lib/redis";
import { logger } from "@/lib/logger";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

const DEFAULTS = { maxRequests: 100, windowMs: 60_000 };

export async function rateLimitRedis(
  key: string,
  config: Partial<typeof DEFAULTS> = {},
): Promise<RateLimitResult> {
  const { maxRequests, windowMs } = { ...DEFAULTS, ...config };

  if (!redisClient) {
    return { allowed: true, remaining: maxRequests, reset: Math.ceil(Date.now() / 1000) + Math.ceil(windowMs / 1000) };
  }

  try {
    const now = Date.now();
    const windowKey = Math.floor(now / windowMs);
    const redisKey = `ratelimit:${key}:${windowKey}`;

    const current = await redisClient.incr(redisKey);
    if (current === 1) {
      await redisClient.expire(redisKey, Math.ceil(windowMs / 1000));
    }

    const remaining = Math.max(0, maxRequests - current);
    const reset = (Math.floor(now / windowMs) + 1) * Math.ceil(windowMs / 1000);

    if (current > maxRequests) {
      return { allowed: false, remaining: 0, reset };
    }

    return { allowed: true, remaining, reset };
  } catch (err) {
    logger.error("Redis rate limit check failed, allowing request", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { allowed: true, remaining: 1, reset: Math.ceil(Date.now() / 1000) + 60 };
  }
}
