import { requests } from "@/lib/axios";

export const adminApi = {
  getStats: () => requests.get<any>("/admin/stats"),
};
