type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  tenantId?: string;
  userId?: string;
  durationMs?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

const LEVEL_ORDER: LogLevel[] = ["debug", "info", "warn", "error"];
const CURRENT_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER.indexOf(level) >= LEVEL_ORDER.indexOf(CURRENT_LEVEL);
}

function formatEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

function log(level: LogLevel, message: string, meta?: Partial<LogEntry>) {
  if (!shouldLog(level)) return;
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  const formatted = formatEntry(entry);
  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export const logger = {
  debug: (msg: string, meta?: Partial<LogEntry>) => log("debug", msg, meta),
  info: (msg: string, meta?: Partial<LogEntry>) => log("info", msg, meta),
  warn: (msg: string, meta?: Partial<LogEntry>) => log("warn", msg, meta),
  error: (msg: string, meta?: Partial<LogEntry>) => log("error", msg, meta),
};
