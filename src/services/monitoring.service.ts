const SENTRY_DSN = process.env.SENTRY_DSN || "";
const IS_ENABLED = !!SENTRY_DSN;

interface SentryEvent {
  message?: string;
  level?: "info" | "warning" | "error";
  exception?: { type: string; value: string; stacktrace?: string };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: { id?: string; email?: string };
}

export async function captureEvent(event: SentryEvent): Promise<void> {
  if (!IS_ENABLED) return;
  try {
    await fetch(`${SENTRY_DSN}/store/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        platform: "javascript",
        ...event,
      }),
    });
  } catch {
    // fail silently
  }
}

export function captureException(error: Error, extra?: Record<string, unknown>) {
  return captureEvent({
    level: "error",
    exception: {
      type: error.name,
      value: error.message,
      stacktrace: error.stack,
    },
    extra,
  });
}

export function captureMessage(message: string, level: SentryEvent["level"] = "info") {
  return captureEvent({ message, level });
}
