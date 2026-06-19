"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { OrderEventPayload } from "@/lib/redis-pubsub";

const RECONNECT_BASE = 1000;
const RECONNECT_MAX = 30_000;
const STALE_TIMEOUT = 45_000;

interface UseOrderWebSocketReturn {
  events: OrderEventPayload[];
  connected: boolean;
  error: string | null;
  clearEvents: () => void;
}

function getWsUrl(): string {
  if (typeof window === "undefined") return "";
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envUrl) return envUrl;
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.hostname}:3001`;
}

export function useOrderWebSocket(): UseOrderWebSocketReturn {
  const [events, setEvents] = useState<OrderEventPayload[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  const staleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const clearEvents = useCallback(() => setEvents([]), []);
  const scheduleReconnectRef = useRef<() => void>(() => {});

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    const delay = Math.min(RECONNECT_BASE * Math.pow(2, retryCount.current), RECONNECT_MAX);
    retryCount.current += 1;
    if (!mountedRef.current && delay > RECONNECT_BASE * 32) return;
    reconnectTimer.current = setTimeout(() => {
      if (mountedRef.current) {
        scheduleReconnectRef.current();
      }
    }, delay);
  }, []);

  useEffect(() => {
    scheduleReconnectRef.current = scheduleReconnect;
  });

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    const url = getWsUrl();
    if (!url) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return; }
        retryCount.current = 0;
        setConnected(true);
        setError(null);

        const token = getCookie("cc_session_token");
        if (token) {
          ws.send(JSON.stringify({ type: "auth", data: { sessionToken: token } }));
          ws.send(JSON.stringify({ type: "get_history" }));
        }
      };

      ws.onmessage = (eventMsg) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(eventMsg.data);
          if (msg.type === "auth_ok") {
            setConnected(true);
          } else if (msg.type === "auth_error") {
            setError("Authentication failed");
          } else if (msg.type === "order_event") {
            const payload = msg as OrderEventPayload;
            setEvents((prev) => [payload, ...prev].slice(0, 100));
          } else if (msg.type === "notification") {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("ws-notification", { detail: msg.data }));
            }
          } else if (msg.type === "notification_replay") {
            const notifEvents = (msg.events || []) as Array<Record<string, unknown>>;
            if (notifEvents.length > 0 && typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("ws-notification-replay", { detail: notifEvents }));
            }
          } else if (msg.type === "replay") {
            const replayEvents = (msg.events || []) as OrderEventPayload[];
            if (replayEvents.length > 0) {
              setEvents((prev) => {
                const existing = new Set(prev.map((e) => `${e.event}:${e.data.id}:${e.timestamp}`));
                const newOnes = replayEvents.filter(
                  (e) => !existing.has(`${e.event}:${e.data.id}:${e.timestamp}`)
                );
                return [...newOnes, ...prev].slice(0, 100);
              });
            }
          } else if (msg.type === "heartbeat") {
            ws.send(JSON.stringify({ type: "pong" }));
          }
        } catch { /* skip malformed */ }

        if (staleTimer.current) clearTimeout(staleTimer.current);
        staleTimer.current = setTimeout(() => {
          if (mountedRef.current) setConnected(false);
        }, STALE_TIMEOUT);
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        wsRef.current = null;
        scheduleReconnect();
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setError("WebSocket connection error");
      };
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to connect");
      scheduleReconnect();
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (staleTimer.current) clearTimeout(staleTimer.current);
    };
  }, [connect]);

  return { events, connected, error, clearEvents };
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}
