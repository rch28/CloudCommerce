interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 60_000;

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttlMs = DEFAULT_TTL) {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function invalidateCache(pattern?: string) {
  if (!pattern) { store.clear(); return; }
  for (const key of store.keys()) {
    if (key.includes(pattern)) store.delete(key);
  }
}

export function cacheKey(...parts: string[]) {
  return parts.join(":");
}
