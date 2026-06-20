import { requests } from "@/lib/axios";

export const ordersApi = {
  list: (params?: Record<string, string>) => requests.get<any>("/orders", { params }),
  get: (id: string) => requests.get<any>(`/orders/${id}`),
  updateStatus: (id: string, data: any) => requests.post<any>(`/orders/${id}/status`, data),
  refund: (id: string, data: any) => requests.post<any>(`/orders/${id}/refund`, data),
  resendConfirmation: (id: string) => requests.post<any>(`/orders/${id}/resend-confirmation`),
};
