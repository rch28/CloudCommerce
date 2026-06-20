import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mapRole, can, type Permission } from "./permissions";

export async function getTenantId(request: NextRequest): Promise<string> {
  try {
    const headerTenant = request.headers.get("x-tenant-id");
    if (headerTenant) return headerTenant;

    const token = request.cookies.get("cc_session_token")?.value;
    if (token) {
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: { select: { tenantId: true } } },
      });
      if (session?.user?.tenantId) return session.user.tenantId;
    }
  } catch {}

  return "t-1";
}

export async function getUserId(request: NextRequest): Promise<string | undefined> {
  try {
    const token = request.cookies.get("cc_session_token")?.value;
    if (token) {
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: { select: { id: true } } },
      });
      return session?.user?.id;
    }
  } catch {}
  return undefined;
}

export function getUserRole(request: NextRequest): string {
  return request.headers.get("x-user-role") || "merchant";
}

export function requirePermission(request: NextRequest, permission: Permission) {
  const role = mapRole(getUserRole(request));
  if (!can(role, permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export function handleError(error: unknown) {
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
