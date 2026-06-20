import { requests } from "@/lib/axios";

export const billingApi = {
  getSubscription: () => requests.get<any>("/subscriptions"),
  updateSubscription: (data: any) => requests.put<any>("/subscriptions", data),
  createSubscription: (data: any) => requests.post<any>("/subscriptions", data),
  listPayments: () => requests.get<any[]>("/payments"),
};
