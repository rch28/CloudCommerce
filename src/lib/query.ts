import { prisma } from "@/lib/prisma";

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function paginate<T>(
  model: any,
  where: Record<string, unknown>,
  params: PaginationParams,
  options?: { orderBy?: Record<string, "asc" | "desc">; select?: Record<string, unknown> },
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    model.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: options?.orderBy || { createdAt: "desc" },
      ...(options?.select ? { select: options.select } : {}),
    }),
    model.count({ where }),
  ]);

  return {
    items: items as T[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
