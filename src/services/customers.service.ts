import { requests } from "@/lib/axios";

export const customersApi = {
  list: (params?: Record<string, string>) => requests.get<any>("/customers", { params }),
  get: (id: string) => requests.get<any>(`/customers/${id}`),
};
