import { requests } from "@/lib/axios";

export const reviewsApi = {
  list: (params?: Record<string, string>) => requests.get<any[]>("/reviews", { params }),
  get: (id: string) => requests.get<any>(`/reviews/${id}`),
  create: (data: any) => requests.post<any>("/reviews", data),
  moderate: (id: string, data: any) => requests.patch<any>(`/reviews/${id}/moderate`, data),
  reply: (id: string, data: any) => requests.post<any>(`/reviews/${id}/reply`, data),
  storefrontList: (productId: string, params?: Record<string, string>) =>
    requests.get<any>(`/storefront/products/${productId}/reviews`, { params }),
};
