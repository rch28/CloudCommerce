import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mapRole, can, type Permission } from "./permissions";

/**
 * Resolve and validate the session attached to a request.
 * The session is the single source of truth for identity, tenant, and role —
 * client-supplied headers (x-tenant-id / x-user-role) are NEVER trusted for
 * authenticated requests.
 */
async function getRequestSession(request: NextRequest) {
  const token = request.cookies.get("cc_session_token")?.value;
  if (!token) return null;
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: { select: { id: true, role: true, tenantId: true } } },
    });
    if (!session || session.expiresAt < new Date()) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Resolve the tenant for a request.
 * - Authenticated requests: tenant comes from the session (header is ignored).
 * - Public/storefront requests (no session): tenant comes from x-tenant-id.
 * Throws when no tenant can be resolved instead of silently defaulting.
 */
export async function getTenantId(request: NextRequest): Promise<string> {
  const session = await getRequestSession(request);
  if (session?.user?.tenantId) return session.user.tenantId;

  const headerTenant = request.headers.get("x-tenant-id");
  if (headerTenant) return headerTenant;

  throw new Error("Unable to resolve tenant for request");
}

export async function getUserId(request: NextRequest): Promise<string | undefined> {
  const session = await getRequestSession(request);
  return session?.user?.id;
}

/** Role is derived from the validated session only — never from a client header. */
export async function getUserRole(request: NextRequest): Promise<string> {
  const session = await getRequestSession(request);
  return session?.user?.role ?? "guest";
}

export async function requirePermission(request: NextRequest, permission: Permission) {
  const role = mapRole(await getUserRole(request));
  if (!can(role, permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/** Restricts a route to platform admins (role === "admin"). */
export async function requireAdminRole(request: NextRequest) {
  const role = await getUserRole(request);
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export function handleError(error: unknown) {
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  // Log full detail server-side; return a safe message to the client.
  if (error instanceof Error) {
    console.error("[api] request error:", error);
    // Prisma errors carry a `code` (e.g. P2002) and may embed schema details —
    // never surface those verbatim.
    const isPrismaError = typeof (error as { code?: unknown }).code === "string";
    if (isPrismaError) {
      return NextResponse.json({ error: "Database error" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error("[api] unknown error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
