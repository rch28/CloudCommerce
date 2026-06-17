import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, getTenantId, handleError } from "@/lib/api-helpers";

const mockLogs = [
  { id: "log-1", entityType: "product", entityId: "P-1005", action: "created", changes: null, userId: null, tenantId: "t-1", createdAt: new Date().toISOString() },
  { id: "log-2", entityType: "product", entityId: "P-1002", action: "updated", changes: "{\"price\": 299}", userId: null, tenantId: "t-1", createdAt: new Date(Date.now() - 3600000).toISOString() },
];

export async function GET(request: NextRequest) {
  const forbidden = requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = getTenantId(request);
    const entityType = request.nextUrl.searchParams.get("entityType") || undefined;
    const page = Number(request.nextUrl.searchParams.get("page")) || 1;
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize")) || 20;

    if (process.env.DATABASE_URL) {
      const where: Record<string, unknown> = { tenantId };
      if (entityType) where.entityType = entityType;
      const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.auditLog.count({ where }),
      ]);
      return NextResponse.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
    }

    let result = [...mockLogs];
    if (entityType) result = result.filter((l) => l.entityType === entityType);
    const total = result.length;
    const items = result.slice((page - 1) * pageSize, page * pageSize);
    return NextResponse.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) {
    return handleError(e);
  }
}
