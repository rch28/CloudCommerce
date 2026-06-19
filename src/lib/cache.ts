import {
  productCache,
  categoryCache,
  storefrontCache,
  settingsCache,
  CacheService,
} from "@/lib/redis";
import { logger } from "@/lib/logger";

export function withCache<T>(
  fn: () => Promise<T>,
  cache: { get: (id: string, tenantId?: string) => Promise<T | null>; set: (data: T, tenantId?: string) => Promise<"OK"> },
  key: string,
  tenantId?: string,
): Promise<T> {
  return (async () => {
    if (!tenantId) return fn();
    try {
      const cached = await cache.get(key, tenantId);
      if (cached !== null) return cached;
    } catch (err) {
      logger.warn("Cache read failed, falling through", {
        error: err instanceof Error ? err.message : String(err),
        metadata: { key, tenantId },
      });
    }
    const result = await fn();
    try {
      await cache.set(result, tenantId);
    } catch (err) {
      logger.warn("Cache write failed, continuing", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return result;
  })();
}

export function invalidateProductCache(id: string, tenantId?: string): void {
  if (!tenantId) return;
  productCache.invalidate(id, tenantId).catch(() => {});
}

export function invalidateCategoryCache(id: string, tenantId?: string): void {
  if (!tenantId) return;
  categoryCache.invalidate(id, tenantId).catch(() => {});
}

export function invalidateStorefrontCache(tenantId: string): void {
  storefrontCache.invalidate(tenantId).catch(() => {});
}

export function invalidateSettingsCache(tenantId: string): void {
  settingsCache.invalidate(tenantId).catch(() => {});
}

export async function cacheSearchResults<T>(
  query: string,
  tenantId: string,
  page: number,
  fn: () => Promise<T>,
): Promise<T> {
  const key = `search:${hashQuery(query)}:${page}`;
  try {
    const cached = await CacheService.get<T>("search", key, tenantId, CacheService.STOREFRONT_TTL);
    if (cached !== null) return cached;
  } catch {
    // fall through
  }
  const result = await fn();
  try {
    await CacheService.set("search", key, result, tenantId, CacheService.STOREFRONT_TTL);
  } catch {
    // fall through
  }
  return result;
}

export async function invalidateSearchCache(tenantId: string): Promise<void> {
  try {
    const { redisClient } = await import("@/lib/redis");
    if (!redisClient) return;
    const pattern = `search:tenant:${tenantId}:*`;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch {
    // fail silently for cache
  }
}

function hashQuery(q: string): string {
  let hash = 0;
  for (let i = 0; i < q.length; i++) {
    const char = q.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
