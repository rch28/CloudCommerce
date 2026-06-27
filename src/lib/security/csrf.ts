import { createHash, timingSafeEqual } from "crypto";

function resolveSecret(): string {
  const fromEnv = process.env.CSRF_SECRET;
  if (fromEnv) return fromEnv;
  // A random per-process secret would differ across instances (breaking token
  // validation) and silently mask a missing config — fail fast in production.
  if (process.env.NODE_ENV === "production") {
    throw new Error("CSRF_SECRET must be set in production");
  }
  return "dev-insecure-csrf-secret";
}

const SECRET = resolveSecret();

export function generateCSRFToken(sessionId: string): string {
  const data = `${sessionId}:${SECRET}`;
  return createHash("sha256").update(data).digest("hex");
}

export function validateCSRFToken(token: string, sessionId: string): boolean {
  const expected = generateCSRFToken(sessionId);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function csrfHeaderName() {
  return "x-csrf-token" as const;
}
