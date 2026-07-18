import { prisma } from "@/lib/prisma";
import { cacheSearchResults } from "@/lib/cache";

export interface SearchResult<T = unknown> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: string;
}

export interface SearchParams {
  query: string;
  page?: number;
  pageSize?: number;
  filters?: Record<string, string>;
  sort?: string;
  order?: "asc" | "desc";
}

export interface SearchAdapter {
  searchProducts(params: SearchParams): Promise<SearchResult>;
}

// ── PostgreSQL Full-Text Search Adapter ──────────────

class PostgresSearchAdapter implements SearchAdapter {
  private tenantId?: string;

  setTenantId(tid: string) {
    this.tenantId = tid;
  }

  async searchProducts(params: SearchParams): Promise<SearchResult> {
    const q = params.query.trim();
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { deletedAt: null };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { shortDescription: { contains: q, mode: "insensitive" } },
        { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
      ];
    }

    if (params.filters) {
      if (params.filters.categoryId) where.categoryId = params.filters.categoryId;
      if (params.filters.status) where.status = params.filters.status;
      if (params.filters.tenantId) where.tenantId = params.filters.tenantId;
    }

    const orderBy = params.sort
      ? { [params.sort]: params.order || "desc" }
      : { createdAt: "desc" as const };

    const searchFn = async () => {
      const [items, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            images: { orderBy: { sortOrder: "asc" } },
            variants: { where: { deletedAt: null }, take: 1, orderBy: { price: "asc" } },
            category: { select: { id: true, name: true, slug: true } },
          },
          orderBy: orderBy as any,
          skip,
          take: pageSize,
        }),
        prisma.product.count({ where }),
      ]);
      return { items: items as unknown[], total, page, pageSize, totalPages: Math.ceil(total / pageSize), query: q };
    };

    const tenantId = params.filters?.tenantId || this.tenantId;
    if (tenantId && q) {
      return cacheSearchResults(q, tenantId, page, searchFn);
    }
    return searchFn();
  }
}

// ── Mock Fuzzy Search Adapter ────────────────────────

interface MockProductRecord {
  id: string; tenantId: string; name: string; slug: string; description: string | null;
  shortDescription: string | null; status: string; categoryId: string | null;
  variants?: { sku: string }[];
  category?: { name: string } | null;
  [key: string]: unknown;
}

function fuzzyScore(text: string, query: string): number {
  const lower = text.toLowerCase();
  const qlower = query.toLowerCase();

  if (lower === qlower) return 100;
  if (lower.startsWith(qlower)) return 80;
  if (lower.includes(qlower)) return 60;

  const qWords = qlower.split(/\s+/).filter(Boolean);
  const matches = qWords.filter((w) => lower.includes(w)).length;
  if (matches > 0) return (matches / qWords.length) * 50;

  const qChars = qlower.split("");
  let ci = 0;
  for (const ch of lower) {
    if (ch === qChars[ci]) ci++;
    if (ci === qChars.length) return 30;
  }

  return 0;
}

class MockSearchAdapter implements SearchAdapter {
  private allProducts: MockProductRecord[] = [];

  setProducts(products: MockProductRecord[]) {
    this.allProducts = products;
  }

  async searchProducts(params: SearchParams): Promise<SearchResult> {
    const q = params.query.trim();
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));

    let scored = this.allProducts
      .filter((p) => !p.deletedAt)
      .map((p) => {
        const nameScore = fuzzyScore(p.name, q);
        const descScore = p.description ? fuzzyScore(p.description, q) * 0.6 : 0;
        const shortScore = p.shortDescription ? fuzzyScore(p.shortDescription, q) * 0.4 : 0;
        const skuScore = (p.variants ?? []).some((v) => v.sku.toLowerCase().includes(q.toLowerCase())) ? 40 : 0;
        const catScore = p.category?.name ? fuzzyScore(p.category.name, q) * 0.5 : 0;
        return { product: p, score: Math.max(nameScore, descScore, shortScore, skuScore, catScore) };
      })
      .filter((s) => s.score > 0);

    if (params.filters) {
      const filters = params.filters;
      if (filters.categoryId) scored = scored.filter((s) => s.product.categoryId === filters.categoryId);
      if (filters.status) scored = scored.filter((s) => s.product.status === filters.status);
    }

    scored.sort((a, b) => b.score - a.score);

    if (params.sort) {
      scored.sort((a, b) => {
        const aVal = (a.product as Record<string, unknown>)[params.sort!] ?? "";
        const bVal = (b.product as Record<string, unknown>)[params.sort!] ?? "";
        const cmp = String(aVal).localeCompare(String(bVal));
        return params.order === "asc" ? cmp : -cmp;
      });
    }

    const total = scored.length;
    const items = scored.slice((page - 1) * pageSize, page * pageSize).map((s) => s.product);

    return { items: items as unknown[], total, page, pageSize, totalPages: Math.ceil(total / pageSize), query: q };
  }
}

// ── Meilisearch Stub ─────────────────────────────────

class MeilisearchAdapter implements SearchAdapter {
  async searchProducts(params: SearchParams): Promise<SearchResult> {
    throw new Error("Meilisearch adapter not configured. Set MEILISEARCH_HOST and MEILISEARCH_API_KEY.");
  }
}

// ── Elasticsearch Stub ───────────────────────────────

class ElasticsearchAdapter implements SearchAdapter {
  async searchProducts(params: SearchParams): Promise<SearchResult> {
    throw new Error("Elasticsearch adapter not configured. Set ELASTICSEARCH_URL and ELASTICSEARCH_API_KEY.");
  }
}

// ── Factory ─────────────────────────────────────────

const mockSearch = new MockSearchAdapter();

export const searchService: SearchAdapter = (() => {
  if (process.env.MEILISEARCH_HOST) return new MeilisearchAdapter();
  if (process.env.ELASTICSEARCH_URL) return new ElasticsearchAdapter();
  if (process.env.DATABASE_URL) return new PostgresSearchAdapter();
  return mockSearch;
})();

export function setMockProducts(products: MockProductRecord[]) {
  mockSearch.setProducts(products);
}
