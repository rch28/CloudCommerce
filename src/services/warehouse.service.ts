import { requests } from "@/lib/axios";

export const warehouseApi = {
  list: () => requests.get<any[]>("/warehouses"),
  get: (id: string) => requests.get<any>(`/warehouses/${id}`),
  create: (data: any) => requests.post<any>("/warehouses", data),
  update: (id: string, data: any) => requests.patch<any>(`/warehouses/${id}`, data),
  delete: (id: string) => requests.delete(`/warehouses/${id}`),
  getInventory: (warehouseId: string) => requests.get<any[]>(`/warehouses/${warehouseId}/inventory`),
  listTransfers: () => requests.get<any[]>("/warehouses/transfers"),
  createTransfer: (data: any) => requests.post<any>("/warehouses/transfers", data),
  updateTransfer: (id: string, data: any) => requests.patch<any>(`/warehouses/transfers/${id}`, data),
  allocate: (data: any) => requests.post<any>("/warehouses/allocate", data),
};
