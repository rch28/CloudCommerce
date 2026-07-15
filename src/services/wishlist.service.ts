import { requests } from "@/lib/axios";

function tenantHeaders(tenantId?: string) {
  return tenantId ? { headers: { "x-tenant-id": tenantId } } : undefined;
}

export const wishlistApi = {
  get: (tenantId?: string) => requests.get<any>("/wishlist", tenantHeaders(tenantId)),
  add: (variantId: string, tenantId?: string) => requests.post<any>("/wishlist", { variantId }, tenantHeaders(tenantId)),
  remove: (variantId: string, tenantId?: string) => requests.delete(`/wishlist/${variantId}`, tenantHeaders(tenantId)),
  moveToCart: (data: any, tenantId?: string) => requests.post<any>("/wishlist/move-to-cart", data, tenantHeaders(tenantId)),
  share: (tenantId?: string) => requests.post<any>("/wishlist/share", undefined, tenantHeaders(tenantId)),
  getByShareToken: (shareToken: string) => requests.get<any>(`/storefront/wishlist/${shareToken}`),
};
