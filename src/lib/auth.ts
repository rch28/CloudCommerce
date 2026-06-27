import { randomBytes, pbkdf2Sync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const ITERATIONS = 100000;
const DIGEST = "sha512";
const SESSION_COOKIE = "cc_session_token";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verify = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(verify, "hex");
  // Constant-time comparison to avoid leaking hash bytes via timing.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * A precomputed hash of a random value. Verifying a submitted password against
 * this on the "user not found" path keeps login timing constant, preventing
 * account-enumeration via response-time differences.
 */
export const DUMMY_PASSWORD_HASH = hashPassword(randomBytes(16).toString("hex"));

export function generateSessionToken(): string {
  return randomBytes(48).toString("hex");
}

export function getSessionExpiry(): Date {
  return new Date(Date.now() + SESSION_DURATION_MS);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Secure everywhere except explicit local development (covers HTTPS staging/preview).
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}
