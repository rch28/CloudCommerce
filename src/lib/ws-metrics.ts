// Exposes WebSocket server connection count for observability
// Set by ws-server.ts on startup, read by metrics endpoint

let connectedClients = 0;
let totalEventsProcessed = 0;
let serverStartTime = 0;

export const wsMetrics = {
  get connectedClients(): number {
    return connectedClients;
  },
  set connectedClients(v: number) {
    connectedClients = v;
  },
  get totalEventsProcessed(): number {
    return totalEventsProcessed;
  },
  set totalEventsProcessed(v: number) {
    totalEventsProcessed = v;
  },
  get serverStartTime(): number {
    return serverStartTime;
  },
  set serverStartTime(v: number) {
    serverStartTime = v;
  },
  get uptime(): number {
    return serverStartTime ? Date.now() - serverStartTime : 0;
  },
};

export function getWsMetrics() {
  return {
    connectedClients: wsMetrics.connectedClients,
    totalEventsProcessed: wsMetrics.totalEventsProcessed,
    uptime: wsMetrics.uptime,
    startTime: wsMetrics.serverStartTime
      ? new Date(wsMetrics.serverStartTime).toISOString()
      : null,
  };
}
