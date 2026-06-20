import { requests } from "@/lib/axios";

export const cartApi = {
  get: (tenantId: string) => requests.get<any>("/cart", { params: { tenantId } }),
  addItem: (data: any) => requests.post<any>("/cart", data),
  updateItem: (variantId: string, data: any) => requests.patch<any>(`/cart/items/${variantId}`, data),
  removeItem: (variantId: string, tenantId: string) => requests.delete(`/cart/items/${variantId}`, { params: { tenantId } }),
  clear: (tenantId: string) => requests.delete("/cart", { params: { tenantId } }),
};
