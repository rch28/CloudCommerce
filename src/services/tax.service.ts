import { requests } from "@/lib/axios";

export const taxApi = {
  listZones: (params?: Record<string, string>) => requests.get<any[]>("/tax/zones", { params }),
  createZone: (data: any) => requests.post<any>("/tax/zones", data),
  updateZone: (id: string, data: any) => requests.patch<any>(`/tax/zones/${id}`, data),
  deleteZone: (id: string) => requests.delete(`/tax/zones/${id}`),
  listRates: (params?: Record<string, string>) => requests.get<any[]>("/tax/rates", { params }),
  createRate: (data: any) => requests.post<any>("/tax/rates", data),
  updateRate: (id: string, data: any) => requests.patch<any>(`/tax/rates/${id}`, data),
  deleteRate: (id: string) => requests.delete(`/tax/rates/${id}`),
};
