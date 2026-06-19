import { createClient } from "redis";
import type { RedisClientType } from "redis";

const REDIS_URL = process.env.REDIS_URL;
const UPSTASH_REST_URL = process.env.UPSTASH_REST_URL;
const UPSTASH_REST_TOKEN = process.env.UPSTASH_REST_TOKEN;
const REDIS_CLOUD_URL = process.env.REDIS_CLOUD_URL;
const REDIS_CLOUD_PASSWORD = process.env.REDIS_CLOUD_PASSWORD;

function getRedisUrl(): string {
  if (UPSTASH_REST_URL && UPSTASH_REST_TOKEN) return UPSTASH_REST_URL;
  if (REDIS_CLOUD_URL && REDIS_CLOUD_PASSWORD) return REDIS_CLOUD_URL;
  if (REDIS_URL) return REDIS_URL;
  return "redis://localhost:6379";
}

let redisClient: RedisClientType | undefined;

try {
  redisClient = createClient({ url: getRedisUrl() });
  await redisClient.connect();
} catch (err) {
  console.error("[Redis] Connection failed:", err);
  redisClient = undefined;
}

export { redisClient };

// ---------------------------------------------------------------------------
// Key Management
// ---------------------------------------------------------------------------

/**
 * Build a tenant‑aware cache key.
 *
 * @param namespace - Logical grouping (e.g. "product", "category")
 * @param key - Specific identifier
 * @param tenantId - Optional tenant identifier
 * @returns Full cache key string
 */
export function makeCacheKey(
  namespace: string,
  key: string,
  tenantId?: string,
): string {
  const parts = [namespace];
  if (tenantId) parts.push(`tenant:${tenantId}`);
  parts.push(key);
  return parts.join(":");
}

// ---------------------------------------------------------------------------
// Cache Service
// ---------------------------------------------------------------------------

/**
 * Simple wrapper around Redis that provides typed get/set/del with TTL.
 */
export class CacheService {
  // Default TTL values (in seconds) – production‑safe defaults
  static readonly PRODUCT_TTL = 60 * 60 * 24; // 1 day
  static readonly CATEGORY_TTL = 60 * 60 * 24; // 1 day
  static readonly STOREFRONT_TTL = 60 * 60; // 1 hour
  static readonly SETTINGS_TTL = 60 * 60 * 24; // 1 day

  /**
   * Get a value from cache.
   * @param namespace Cache namespace (e.g. "product")
   * @param identifier Identifier within that namespace
   * @param tenantId Optional tenant identifier
   * @param ttl Override TTL in seconds (optional)
   */
  static async get<T>(
    namespace: string,
    identifier: string,
    tenantId?: string,
    ttl?: number,
  ): Promise<T | null> {
    const key = makeCacheKey(namespace, identifier, tenantId);
    const client = redisClient!;
    const raw = await client.get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  }

  /**
   * Set a value in cache with optional TTL.
   * @param namespace Cache namespace
   * @param identifier Identifier
   * @param value Value to store
   * @param ttl TTL in seconds (if omitted, uses namespace default)
   */
  static async set<T>(
    namespace: string,
    identifier: string,
    value: T,
    tenantId?: string,
    ttl?: number,
  ): Promise<"OK"> {
    const key = makeCacheKey(namespace, identifier, tenantId);
    const client = redisClient!;
    const json = JSON.stringify(value);
    if (ttl !== undefined) {
      return client.set(key, json, { EX: ttl });
    }
    const defaultTtl = (CacheService as any)[`${namespace.toUpperCase()}_TTL`];
    if (defaultTtl !== undefined) {
      return client.set(key, json, { EX: defaultTtl });
    }
    return client.set(key, json);
  }

  /**
   * Delete a key from cache.
   */
  static async del(
    namespace: string,
    identifier: string,
    tenantId?: string,
  ): Promise<"OK"> {
    const key = makeCacheKey(namespace, identifier, tenantId);
    const client = redisClient!;
    return client.del(key);
  }

  /**
   * Explicitly set TTL on an existing key.
   */
  static async expire(
    namespace: string,
    identifier: string,
    tenantId?: string,
    ttl: number,
  ): Promise<number> {
    const key = makeCacheKey(namespace, identifier, tenantId);
    const client = redisClient!;
    return client.expire(key, ttl);
  }

  /**
   * Invalidate (delete) a cache entry.
   */
  static async invalidate(
    namespace: string,
    identifier: string,
    tenantId?: string,
  ): Promise<"OK"> {
    return this.del(namespace, identifier, tenantId);
  }
}

// ---------------------------------------------------------------------------
// Specific Cache Modules
// ---------------------------------------------------------------------------

/**
 * Product cache – handles storage and invalidation of product data.
 */
export const productCache = {
  /**
   * Retrieve a product by ID.
   */
  async get(id: string, tenantId?: string): Promise<any | null> {
    return CacheService.get("product", id, tenantId, CacheService.PRODUCT_TTL);
  },

  /**
   * Store a product.
   */
  async set(product: any, tenantId?: string): Promise<"OK"> {
    return CacheService.set(
      "product",
      product.id,
      product,
      tenantId,
      CacheService.PRODUCT_TTL,
    );
  },

  /**
   * Remove a product from cache.
   */
  async del(id: string, tenantId?: string): Promise<"OK"> {
    return CacheService.del("product", id, tenantId);
  },

  /**
   * Invalidate product cache – can be called after create/update/delete.
   */
  async invalidate(id: string, tenantId?: string): Promise<"OK"> {
    return CacheService.invalidate("product", id, tenantId);
  },
};

/**
 * Category cache – similar to product cache.
 */
export const categoryCache = {
  async get(id: string, tenantId?: string): Promise<any | null> {
    return CacheService.get(
      "category",
      id,
      tenantId,
      CacheService.CATEGORY_TTL,
    );
  },

  async set(category: any, tenantId?: string): Promise<"OK"> {
    return CacheService.set(
      "category",
      category.id,
      category,
      tenantId,
      CacheService.CATEGORY_TTL,
    );
  },

  async del(id: string, tenantId?: string): Promise<"OK"> {
    return CacheService.del("category", id, tenantId);
  },

  async invalidate(id: string, tenantId?: string): Promise<"OK"> {
    return CacheService.invalidate("category", id, tenantId);
  },
};

/**
 * Storefront cache – used for UI‑level data that changes less frequently.
 */
export const storefrontCache = {
  async get(tenantId: string): Promise<any | null> {
    return CacheService.get("storefront", "data", tenantId, CacheService.STOREFRONT_TTL);
  },

  async set(data: any, tenantId: string): Promise<"OK"> {
    return CacheService.set("storefront", "data", data, tenantId, CacheService.STOREFRONT_TTL);
  },

  async del(tenantId: string): Promise<"OK"> {
    return CacheService.del("storefront", "data", tenantId);
  },

  async invalidate(tenantId: string): Promise<"OK"> {
    return CacheService.invalidate("storefront", "data", tenantId);
  },
};

export const settingsCache = {
  async get(tenantId: string): Promise<any | null> {
    return CacheService.get("settings", "data", tenantId, CacheService.SETTINGS_TTL);
  },

  async set(data: any, tenantId: string): Promise<"OK"> {
    return CacheService.set("settings", "data", data, tenantId, CacheService.SETTINGS_TTL);
  },

  async del(tenantId: string): Promise<"OK"> {
    return CacheService.del("settings", "data", tenantId);
  },

  async invalidate(tenantId: string): Promise<"OK"> {
    return CacheService.invalidate("settings", "data", tenantId);
  },
};

// ---------------------------------------------------------------------------
// Helper: Batch invalidation
// ---------------------------------------------------------------------------

/**
 * Invalidate multiple keys at once – useful after schema changes.
 */
export async function invalidateAllForTenant(tenantId: string): Promise<void> {
  const client = redisClient!;
  const pattern = `*:${tenantId}`;
  const keys = await client.keys(pattern);
  if (keys.length > 0) {
    await client.del(...keys);
  }
}
