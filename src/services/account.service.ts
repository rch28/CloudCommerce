import { requests } from "@/lib/axios";

export const accountApi = {
  getProfile: () => requests.get<any>("/account/profile"),
  updateProfile: (data: any) => requests.put<any>("/account/profile", data),
  listOrders: () => requests.get<any[]>("/account/orders"),
  getOrder: (id: string) => requests.get<any>(`/account/orders/${id}`),
  listAddresses: () => requests.get<any[]>("/account/addresses"),
  createAddress: (data: any) => requests.post<any>("/account/addresses", data),
  updateAddress: (id: string, data: any) => requests.put<any>(`/account/addresses/${id}`, data),
  deleteAddress: (id: string) => requests.delete(`/account/addresses/${id}`),
  setDefaultAddress: (id: string) => requests.put<any>(`/account/addresses/${id}/default`, {}),
};
