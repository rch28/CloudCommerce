import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/security/rate-limit";
import { logger } from "@/lib/logger";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.stripe.com https://*.sentry.io",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.cloudfront.net https://*.stripe.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.stripe.com https://*.sentry.io https://famous.ai",
  "frame-src 'self' https://*.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURE_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

const PUBLIC_PATHS = [
  "/_next/",
  "/api/webhooks/",
  "/favicon.ico",
  "/images/",
  "/fonts/",
];

const PROTECTED_PATHS = ["/merchant", "/admin", "/account"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname.startsWith(`/${p}`));
}

const AUTH_SKIP_PATHS = ["/auth/login", "/auth/register", "/api/auth/"];

function shouldSkipAuth(pathname: string): boolean {
  return AUTH_SKIP_PATHS.some((p) => pathname.startsWith(p));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = crypto.randomUUID?.() || `${Date.now()}`;

  const response = NextResponse.next();

  response.headers.set("x-request-id", requestId);

  // CSP
  response.headers.set("Content-Security-Policy", CSP);

  // Security headers
  for (const [key, value] of Object.entries(SECURE_HEADERS)) {
    response.headers.set(key, value);
  }

  // Auth check for protected routes
  if (!shouldSkipAuth(pathname) && isProtected(pathname)) {
    const token = request.cookies.get("cc_session_token")?.value;
    if (!token) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Rate limiting on API routes
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/webhooks/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const key = `api:${ip}:${pathname}`;
    const { allowed, remaining, reset } = rateLimit(key, { maxRequests: 100, windowMs: 60_000 });

    response.headers.set("x-ratelimit-remaining", String(remaining));
    response.headers.set("x-ratelimit-reset", String(reset));

    if (!allowed) {
      logger.warn("Rate limit exceeded", { requestId, metadata: { path: pathname, ip } });
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(reset - Date.now() / 1000)),
        },
      });
    }
  }

  // Request logging (sample non-public paths)
  if (!isPublic(pathname) && !pathname.startsWith("/_next/")) {
    logger.info(`${request.method} ${pathname}`, {
      requestId,
      metadata: { method: request.method, path: pathname },
    });
  }

  return response;
}
