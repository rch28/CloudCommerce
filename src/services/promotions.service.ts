import { requests } from "@/lib/axios";

export const promotionsApi = {
  listCoupons: (params?: Record<string, string>) => requests.get<any[]>("/coupons", { params }),
  getCoupon: (id: string) => requests.get<any>(`/coupons/${id}`),
  createCoupon: (data: any) => requests.post<any>("/coupons", data),
  updateCoupon: (id: string, data: any) => requests.patch<any>(`/coupons/${id}`, data),
  deleteCoupon: (id: string) => requests.delete(`/coupons/${id}`),
  getCouponUsage: (id: string) => requests.get<any[]>(`/coupons/${id}/usage`, { params: { pageSize: "50" } }),
  listPromotions: (params?: Record<string, string>) => requests.get<any[]>("/promotions", { params }),
  getPromotion: (id: string) => requests.get<any>(`/promotions/${id}`),
  createPromotion: (data: any) => requests.post<any>("/promotions", data),
  updatePromotion: (id: string, data: any) => requests.patch<any>(`/promotions/${id}`, data),
};
