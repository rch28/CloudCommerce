export interface CursorPaginateParams {
  cursor?: string;
  take: number;
  orderBy?: "asc" | "desc";
}

export interface CursorPaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function cursorPaginate<T extends { id: string; createdAt: Date }>(
  findMany: (args: {
    where: Record<string, unknown>;
    orderBy: Record<string, "asc" | "desc">;
    take: number;
    cursor?: { id: string };
    skip?: number;
    select?: Record<string, unknown>;
  }) => Promise<T[]>,
  where: Record<string, unknown>,
  params: CursorPaginateParams,
  select?: Record<string, unknown>,
): Promise<CursorPaginatedResult<T>> {
  const take = Math.min(100, Math.max(1, params.take || 20));
  const dir = params.orderBy === "asc" ? "asc" : "desc";

  const baseArgs: Parameters<typeof findMany>[0] = {
    where,
    orderBy: { createdAt: dir },
    take: dir === "desc" ? take + 1 : take + 1,
  };

  const queryArgs = params.cursor
    ? { ...baseArgs, cursor: { id: params.cursor }, skip: 1 }
    : baseArgs;

  const items = await findMany(select ? { ...queryArgs, select } : queryArgs);
  const hasMore = items.length > take;
  if (hasMore) items.pop();

  return {
    items,
    nextCursor: hasMore && items.length > 0 ? items[items.length - 1].id : null,
    hasMore,
  };
}

export function buildCursorWhere(
  baseWhere: Record<string, unknown>,
  cursor?: string,
  cursorField: "id" | "createdAt" = "id",
): Record<string, unknown> {
  return baseWhere;
}
