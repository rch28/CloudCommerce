"use client";
import { useState } from "react";
import { Bell, Package, Truck, CheckCircle, XCircle, AlertTriangle, DollarSign, Inbox } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useNotifications } from "@/hooks/useNotifications";

function getIcon(type: string) {
  switch (type) {
    case "order.created": return <Package size={18} />;
    case "order.shipped": return <Truck size={18} />;
    case "order.delivered": return <CheckCircle size={18} />;
    case "order.cancelled": return <XCircle size={18} />;
    case "payment.failed": return <XCircle size={18} />;
    case "payment.received": return <DollarSign size={18} />;
    case "inventory.low_stock": return <AlertTriangle size={18} />;
    case "inventory.out_of_stock": return <AlertTriangle size={18} />;
    default: return <Bell size={18} />;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationCenterView() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications(50);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = filter === "unread" ? notifications.filter((n) => !n.readAt) : notifications;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-[#7C3AED] transition-colors hover:bg-[#1E293B]"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${
            filter === "all" ? "bg-[#7C3AED] text-white" : "border border-border bg-card text-muted-foreground hover:text-[#F8FAFC]"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${
            filter === "unread" ? "bg-[#7C3AED] text-white" : "border border-border bg-card text-muted-foreground hover:text-[#F8FAFC]"
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {loading ? (
        <LoadingSpinner size={28} className="py-16" />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox size={40} className="text-muted-foreground/30" />
          <p className="text-lg font-medium text-[#F8FAFC]">No notifications</p>
          <p className="text-sm text-muted-foreground">
            {filter === "unread" ? "All notifications have been read" : "You haven't received any notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => { if (!n.readAt) markAsRead(n.id); }}
              className={`flex w-full gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-[#7C3AED]/30 ${
                n.readAt ? "opacity-70" : ""
              }`}
            >
              <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                n.type.includes("cancelled") || n.type.includes("failed") || n.type.includes("out_of_stock")
                  ? "bg-rose-500/10 text-rose-400"
                  : n.type.includes("low_stock")
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-emerald-500/10 text-emerald-400"
              }`}>
                {getIcon(n.type)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-[#F8FAFC]">{n.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground/60">{timeAgo(n.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
              </div>
              {!n.readAt && (
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#7C3AED]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
