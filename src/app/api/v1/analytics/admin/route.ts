import { NextRequest, NextResponse } from "next/server";
import { getAdminAnalytics, getTimeSeriesData } from "@/lib/services/analytics";
import { requireAdminRole, handleError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const forbidden = await requireAdminRole(req);
  if (forbidden) return forbidden;

  try {
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") || "month") as "today" | "week" | "month" | "year" | "custom";
    const start = searchParams.get("start") ?? undefined;
    const end = searchParams.get("end") ?? undefined;
    const metric = searchParams.get("metric");

    if (metric) {
      const data = await getTimeSeriesData(null, metric, { range, start, end });
      return NextResponse.json({ data, metric });
    }
    const metrics = await getAdminAnalytics({ range, start, end });
    return NextResponse.json(metrics);
  } catch (e) {
    return handleError(e);
  }
}
