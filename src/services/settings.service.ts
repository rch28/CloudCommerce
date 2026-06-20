import { requests } from "@/lib/axios";

export const settingsApi = {
  get: () => requests.get<any>("/settings"),
  update: (data: any) => requests.put<any>("/settings", data),
  listStaff: () => requests.get<any[]>("/settings/staff"),
  inviteStaff: (data: any) => requests.post<any>("/settings/staff", data),
  updateStaff: (staffId: string, data: any) => requests.patch<any>(`/settings/staff?staffId=${staffId}`, data),
  deleteStaff: (staffId: string) => requests.delete(`/settings/staff?staffId=${staffId}`),
  listApiKeys: () => requests.get<any[]>("/settings/api-keys"),
  createApiKey: (data: any) => requests.post<any>("/settings/api-keys", data),
  deleteApiKey: (keyId: string) => requests.delete(`/settings/api-keys?keyId=${keyId}`),
};
