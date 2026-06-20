import { requests } from "@/lib/axios";

export const inventoryApi = {
  list: (params?: Record<string, string>) => requests.get<any[]>("/inventory", { params }),
  update: (data: any) => requests.patch<any>("/inventory", data),
  getHistory: (variantId: string) => requests.get<any[]>(`/inventory/history`, { params: { variantId } }),
};
