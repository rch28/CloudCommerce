import { NextRequest, NextResponse } from "next/server";
import { productRepo } from "@/lib/services/products";
import { searchService, setMockProducts } from "@/lib/services/search";
import { getTenantId, getUserId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const forbidden = await requirePermission(request, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(request);
    const sp = request.nextUrl.searchParams;
    const query = sp.get("search") || sp.get("q") || "";

    if (query) {
      // For mock mode, feed current products into search adapter
      if (!process.env.DATABASE_URL && !process.env.MEILISEARCH_HOST && !process.env.ELASTICSEARCH_URL) {
        const all = await productRepo.list(tenantId, { pageSize: 1000 });
        setMockProducts(all.items as any);
      }
      const result = await searchService.searchProducts({
        query,
        page: Number(sp.get("page")) || 1,
        pageSize: Number(sp.get("pageSize")) || 10,
        filters: Object.fromEntries(
          Array.from(sp.entries()).filter(([k]) => ["categoryId", "status"].includes(k))
        ),
        sort: sp.get("sort") || undefined,
        order: (sp.get("order") as "asc" | "desc") || undefined,
      });
      return NextResponse.json(result);
    }

    const result = await productRepo.list(tenantId, {
      search: sp.get("search") || undefined,
      categoryId: sp.get("category") || sp.get("categoryId") || undefined,
      status: sp.get("status") || undefined,
      orderBy: sp.get("sort") || undefined,
      order: (sp.get("order") as "asc" | "desc") || undefined,
      page: Number(sp.get("page")) || 1,
      pageSize: Number(sp.get("pageSize")) || 10,
    });
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  const forbidden = await requirePermission(request, "create");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(request);
    const userId = await getUserId(request);
    const body = await request.json();
    const product = await productRepo.createOne(body, { userId, tenantId });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
