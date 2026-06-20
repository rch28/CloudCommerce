import { requests } from "@/lib/axios";

export const loyaltyApi = {
  getAccount: (params?: Record<string, string>) => requests.get<any>("/loyalty/account", { params }),
  enroll: (data?: any) => requests.post<any>("/loyalty/account", data),
  listRules: (params?: Record<string, string>) => requests.get<any[]>("/loyalty/rules", { params }),
  createRule: (data: any) => requests.post<any>("/loyalty/rules", data),
  updateRule: (id: string, data: any) => requests.patch<any>(`/loyalty/rules/${id}`, data),
  deleteRule: (id: string) => requests.delete(`/loyalty/rules/${id}`),
  getSettings: () => requests.get<any>("/loyalty/settings"),
  updateSettings: (data: any) => requests.put<any>("/loyalty/settings", data),
  listCustomers: (params?: Record<string, string>) => requests.get<any[]>("/customers", { params }),
  listAuditLogs: (params?: Record<string, string>) => requests.get<any[]>("/audit-logs", { params }),
};
