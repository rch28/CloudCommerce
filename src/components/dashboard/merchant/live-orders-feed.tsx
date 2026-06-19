"use client";
import { useSyncExternalStore } from "react";
import { ShoppingCart, CreditCard, Truck, XCircle, Clock } from "lucide-react";
import { useOrderWebSocket } from "@/hooks/useOrderWebSocket";
import Badge from "@/components/cc/Badge";

const eventConfig: Record<string, { icon: typeof ShoppingCart; color: string; bg: string }> = {
  "order.created": {
    icon: ShoppingCart,
    color: "text-sky-400",
    bg: "bg-sky-500/15",
  },
  "order.payment_received": {
    icon: CreditCard,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
  },
  "order.shipped": {
    icon: Truck,
    color: "text-purple-400",
    bg: "bg-purple-500/15",
  },
  "order.cancelled": {
    icon: XCircle,
    color: "text-rose-400",
    bg: "bg-rose-500/15",
  },
};

function EventIcon({ event }: { event: string }) {
  const cfg = eventConfig[event];
  if (!cfg) return <Clock className="h-4 w-4 text-muted-foreground" />;
  const Icon = cfg.icon;
  return <Icon className={`h-4 w-4 ${cfg.color}`} />;
}

function subscribeToNow(cb: () => void) {
  const id = setInterval(cb, 30_000);
  cb();
  return () => clearInterval(id);
}

function RelativeTime({ timestamp }: { timestamp: string }) {
  const now = useSyncExternalStore(subscribeToNow, () => Date.now(), () => 0);
  const date = new Date(timestamp);
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  let label: string;
  if (seconds < 10) label = "just now";
  else if (seconds < 60) label = `${seconds}s ago`;
  else if (minutes < 60) label = `${minutes}m ago`;
  else if (hours < 24) label = `${hours}h ago`;
  else label = date.toLocaleDateString();

  return (
    <span className="text-xs text-muted-foreground" title={date.toLocaleString()}>
      {label}
    </span>
  );
}

const eventLabel: Record<string, string> = {
  "order.created": "New Order",
  "order.payment_received": "Payment Received",
  "order.shipped": "Order Shipped",
  "order.cancelled": "Order Cancelled",
};

export default function LiveOrdersFeed() {
  const { events, connected, error, clearEvents } = useOrderWebSocket();

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Live Orders</h3>
          <span
            className={`inline-flex h-2 w-2 rounded-full ${
              connected ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
          <span className="text-xs text-muted-foreground">
            {connected ? "connected" : "disconnected"}
          </span>
        </div>
        {events.length > 0 && (
          <button
            onClick={clearEvents}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 text-xs text-rose-400 bg-rose-500/10">
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {events.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ShoppingCart className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Waiting for orders...</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Real-time orders will appear here
            </p>
          </div>
        )}

        {events.length > 0 && (
          <div className="divide-y divide-border">
            {events.map((evt, i) => {
              const cfg = eventConfig[evt.event];
              return (
                <div
                  key={`${evt.event}:${evt.data.id}:${evt.timestamp}:${i}`}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/50 animate-in slide-in-from-top-1 duration-300"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      cfg?.bg ?? "bg-muted"
                    }`}
                  >
                    <EventIcon event={evt.event} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">
                        {evt.data.number}
                      </span>
                      <Badge status={evt.data.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {eventLabel[evt.event] ?? evt.event} &middot;{" "}
                      {evt.data.customerName} &middot; ${evt.data.total.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {evt.data.itemCount} item{evt.data.itemCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <RelativeTime timestamp={evt.timestamp} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
