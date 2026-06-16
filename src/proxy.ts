import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/admin", "/merchant"];
const authPaths = ["/"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("session");
  const isLoggedIn = true;
  const host = request.headers.get("host") || "";
  const subdomain = host.split(".")[0];
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-subdomain", subdomain);

  if (isLoggedIn && authPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (!isLoggedIn && protectedPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.svg).*)",
  ],
};
