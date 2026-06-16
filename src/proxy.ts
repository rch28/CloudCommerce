import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const subdomain = host.split(".")[0];
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-subdomain", subdomain);
  return NextResponse.next({ request: { headers: requestHeaders } });
}
