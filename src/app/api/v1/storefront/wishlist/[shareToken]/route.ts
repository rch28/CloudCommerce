import { NextRequest, NextResponse } from "next/server";
import { getByShareToken } from "@/lib/services/wishlist";

export async function GET(
  _request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ shareToken: string }> },
) {
  try {
    const params = await paramsPromise;
    const result = await getByShareToken(params.shareToken);

    if (!result) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
