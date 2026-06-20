"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { notificationsApi } from "@/services/notifications.service";

export interface NotificationItem {
  id: string;
  tenantId: string;
  userId: string | null;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  channel: string;
  readAt: string | null;
  emailSentAt: string | null;
  createdAt: string;
}

interface UseNotificationsReturn {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(limit = 20): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifData, countData] = await Promise.all([
        notificationsApi.list(limit),
        notificationsApi.getUnreadCount(),
      ]);
      if (mountedRef.current) {
        setNotifications(notifData.notifications ?? []);
        setUnreadCount(countData.count ?? 0);
      }
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [limit]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      if (mountedRef.current) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch { /* silent */ }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      if (mountedRef.current) {
        setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
        setUnreadCount(0);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();

    const handleNotif = () => { fetchNotifications(); };

    if (typeof window !== "undefined") {
      window.addEventListener("ws-notification", handleNotif);
      window.addEventListener("ws-notification-replay", handleNotif);
    }

    return () => {
      mountedRef.current = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("ws-notification", handleNotif);
        window.removeEventListener("ws-notification-replay", handleNotif);
      }
    };
  }, [fetchNotifications]);

  return { notifications, unreadCount, loading, error, markAsRead, markAllAsRead, refresh: fetchNotifications };
}
