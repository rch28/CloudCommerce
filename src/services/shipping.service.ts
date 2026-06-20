import { requests } from "@/lib/axios";

export const shippingApi = {
  listZones: () => requests.get<any[]>("/shipping/zones"),
  getZone: (id: string) => requests.get<any>(`/shipping/zones/${id}`),
  createZone: (data: any) => requests.post<any>("/shipping/zones", data),
  updateZone: (id: string, data: any) => requests.put<any>(`/shipping/zones/${id}`, data),
  deleteZone: (id: string) => requests.delete(`/shipping/zones/${id}`),
  listMethods: () => requests.get<any[]>("/shipping/methods"),
  getMethod: (id: string) => requests.get<any>(`/shipping/methods/${id}`),
  createMethod: (data: any) => requests.post<any>("/shipping/methods", data),
  updateMethod: (id: string, data: any) => requests.put<any>(`/shipping/methods/${id}`, data),
  deleteMethod: (id: string) => requests.delete(`/shipping/methods/${id}`),
  createRate: (data: any) => requests.post<any>("/shipping/rates", data),
  deleteRate: (data: any) => requests.delete("/shipping/rates", { data }),
  calculate: (data: any) => requests.post<any>("/shipping/calculate", data),
};
