import { requests } from "@/lib/axios";

export const analyticsApi = {
  getMerchant: (params?: Record<string, string>) => requests.get<any>("/analytics/merchant", { params }),
};
