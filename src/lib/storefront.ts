import { CacheService } from "@/lib/redis";

export const STOREFRONT_REVALIDATE = 60;
export const PRODUCT_DETAIL_REVALIDATE = 120;
export const CATEGORY_PAGE_REVALIDATE = 300;

export class StorefrontCache {
  static async getFeaturedProducts(tenantId: string): Promise<unknown[] | null> {
    return CacheService.get<unknown[]>("storefront", "featured", tenantId);
  }

  static async setFeaturedProducts(tenantId: string, data: unknown[]): Promise<"OK"> {
    return CacheService.set("storefront", "featured", data, tenantId, CacheService.STOREFRONT_TTL);
  }

  static async getCategories(tenantId: string): Promise<unknown[] | null> {
    return CacheService.get<unknown[]>("storefront", "categories", tenantId);
  }

  static async setCategories(tenantId: string, data: unknown[]): Promise<"OK"> {
    return CacheService.set("storefront", "categories", data, tenantId, CacheService.STOREFRONT_TTL);
  }

  static async getSettings(tenantId: string): Promise<unknown | null> {
    return CacheService.get<unknown>("settings", "data", tenantId);
  }

  static async setSettings(tenantId: string, data: unknown): Promise<"OK"> {
    return CacheService.set("settings", "data", data, tenantId, CacheService.SETTINGS_TTL);
  }

  static async invalidateAll(tenantId: string): Promise<void> {
    await CacheService.invalidate("storefront", "featured", tenantId);
    await CacheService.invalidate("storefront", "categories", tenantId);
    await CacheService.invalidate("settings", "data", tenantId);
  }

  static async getNavigation(tenantId: string): Promise<unknown[] | null> {
    return CacheService.get<unknown[]>("storefront", "navigation", tenantId);
  }

  static async setNavigation(tenantId: string, data: unknown[]): Promise<"OK"> {
    return CacheService.set("storefront", "navigation", data, tenantId, CacheService.STOREFRONT_TTL);
  }
}
