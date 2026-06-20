"use client";
import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Package, Truck, CheckCircle, XCircle, AlertTriangle, DollarSign, Loader2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

function getIcon(type: string) {
  switch (type) {
    case "order.created": return <Package size={15} />;
    case "order.shipped": return <Truck size={15} />;
    case "order.delivered": return <CheckCircle size={15} />;
    case "order.cancelled": return <XCircle size={15} />;
    case "payment.failed": return <XCircle size={15} />;
    case "payment.received": return <DollarSign size={15} />;
    case "inventory.low_stock": return <AlertTriangle size={15} />;
    case "inventory.out_of_stock": return <AlertTriangle size={15} />;
    default: return <Bell size={15} />;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications(10);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg border border-slate-800 bg-slate-900/60  p-2 text-muted-foreground transition-colors hover:text-[#F8FAFC]"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7C3AED] px-1 text-[10px] font-bold text-white ring-2 ring-background">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60  shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-[#F8FAFC]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-[#7C3AED] transition-colors hover:text-[#8B5CF6]"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Bell size={24} className="text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { if (!n.readAt) markAsRead(n.id); }}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-[#1E293B] ${
                    n.readAt ? "opacity-60" : ""
                  }`}
                >
                  <span className={`mt-0.5 shrink-0 ${n.type.includes("cancelled") || n.type.includes("failed") || n.type.includes("out_of_stock") ? "text-rose-400" : n.type.includes("low_stock") ? "text-amber-400" : "text-emerald-400"}`}>
                    {getIcon(n.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#F8FAFC]">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground/60">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
