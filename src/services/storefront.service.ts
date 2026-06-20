import { requests } from "@/lib/axios";

export const storefrontApi = {
  customerLogin: (data: any) => requests.post<any>("/auth/customer/login", data),
  customerRegister: (data: any) => requests.post<any>("/auth/customer/register", data),
  listProducts: (params?: Record<string, string>) => requests.get<any>("/products", { params }),
  listCategories: () => requests.get<any[]>("/categories"),
  listReviews: (productId: string, params?: Record<string, string>) =>
    requests.get<any[]>(`/storefront/products/${productId}/reviews`, { params }),
  getStripeSessionStatus: (sessionId: string) =>
    requests.get<any>(`/payment/stripe/session-status`, { params: { session_id: sessionId } }),
  getWishlistByShareToken: (shareToken: string) =>
    requests.get<any>(`/storefront/wishlist/${shareToken}`),
};
