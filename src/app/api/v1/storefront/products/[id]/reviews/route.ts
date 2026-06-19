import { NextRequest, NextResponse } from "next/server";
import { calculateRatingStats, listStorefrontReviews } from "@/lib/services/reviews";
import { reviewCache } from "@/lib/redis";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const params = await paramsPromise;
    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(sp.get("pageSize")) || 10));
    const sort = (sp.get("sort") || "recent") as "recent" | "highest" | "lowest";
    const includeStats = sp.get("stats") !== "false";

    const [reviews, stats] = await Promise.all([
      listStorefrontReviews(params.id, { page, pageSize, sort }),
      includeStats ? calculateRatingStats(params.id) : Promise.resolve(null),
    ]);

    const result: Record<string, unknown> = { ...reviews };
    if (stats) result.stats = stats;

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
