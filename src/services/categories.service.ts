import { requests } from "@/lib/axios";

export const categoriesApi = {
  list: (params?: Record<string, string>) => requests.get<any>("/categories", { params }),
  get: (id: string) => requests.get<any>(`/categories/${id}`),
  create: (data: any) => requests.post<any>("/categories", data),
  update: (id: string, data: any) => requests.put<any>(`/categories/${id}`, data),
  patch: (id: string, data: any) => requests.patch<any>(`/categories/${id}`, data),
  delete: (id: string) => requests.delete(`/categories/${id}`),
  bulk: (data: any) => requests.post<any>("/categories/bulk", data),
};
