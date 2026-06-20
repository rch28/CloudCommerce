import { requests } from "@/lib/axios";

export const wishlistApi = {
  get: () => requests.get<any>("/wishlist"),
  add: (variantId: string) => requests.post<any>("/wishlist", { variantId }),
  remove: (variantId: string) => requests.delete(`/wishlist/${variantId}`),
  moveToCart: (data: any) => requests.post<any>("/wishlist/move-to-cart", data),
  share: () => requests.post<any>("/wishlist/share"),
  getByShareToken: (shareToken: string) => requests.get<any>(`/storefront/wishlist/${shareToken}`),
};
