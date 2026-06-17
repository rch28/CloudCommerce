import { createHash, randomBytes, timingSafeEqual } from "crypto";

const SECRET = process.env.CSRF_SECRET || randomBytes(32).toString("hex");

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
