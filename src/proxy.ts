import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/security/rate-limit";
import { rateLimitRedis } from "@/lib/rate-limit-redis";
import { logger } from "@/lib/logger";
import { redisClient } from "@/lib/redis";

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
  return PROTECTED_PATHS.some((p) => pathname.startsWith(p));
}

const AUTH_SKIP_PATHS = ["/auth/login", "/auth/register", "/api/auth/", "/api/v1/auth/customer/", "/api/v1/account/"];

function shouldSkipAuth(pathname: string): boolean {
  return AUTH_SKIP_PATHS.some((p) => pathname.startsWith(p));
}

export async function proxy(request: NextRequest) {
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

  // Rate limiting on API routes (Redis-backed, fallback to in-memory).
  // Use the last hop from x-real-ip (set by the trusted load balancer) to avoid
  // spoofing via x-forwarded-for. Fall back to x-forwarded-for only when
  // x-real-ip is absent (e.g. local dev without a reverse proxy).
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/webhooks/")) {
    const ip =
      request.headers.get("x-real-ip")?.trim() ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    // Auth endpoints get a stricter limit (10 req/min) to slow brute-force.
    const isAuthPath = pathname.startsWith("/api/auth/");
    const limits = isAuthPath
      ? { maxRequests: 10, windowMs: 60_000 }
      : { maxRequests: 100, windowMs: 60_000 };
    const key = `api:${ip}:${isAuthPath ? "auth" : pathname}`;

    let allowed: boolean;
    let remaining: number;
    let reset: number;

    if (redisClient) {
      const result = await rateLimitRedis(key, limits);
      allowed = result.allowed;
      remaining = result.remaining;
      reset = result.reset;
    } else {
      const result = rateLimit(key, limits);
      allowed = result.allowed;
      remaining = result.remaining;
      reset = result.reset;
    }

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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|fonts/).*)",
  ],
};
