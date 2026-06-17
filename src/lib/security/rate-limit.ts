const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const DEFAULTS: RateLimitConfig = { maxRequests: 60, windowMs: 60_000 };

export function rateLimit(key: string, config: Partial<RateLimitConfig> = {}) {
  const { maxRequests, windowMs } = { ...DEFAULTS, ...config };
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count++;
  const remaining = Math.max(0, maxRequests - bucket.count);
  const reset = Math.ceil(bucket.resetAt / 1000);

  if (bucket.count > maxRequests) {
    return { allowed: false, remaining: 0, reset };
  }

  return { allowed: true, remaining, reset };
}

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(key);
    }
  }, 300_000);
}
