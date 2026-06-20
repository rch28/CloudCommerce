import { requests } from "@/lib/axios";

export const notificationsApi = {
  list: (limit?: number) => requests.get<any>("/notifications", { params: { limit: String(limit || 20) } }),
  getUnreadCount: () => requests.get<{ count: number }>("/notifications/unread-count"),
  markRead: (id: string) => requests.patch(`/notifications/${id}`, {}),
  markAllRead: () => requests.post("/notifications", {}),
};
