import { NextRequest, NextResponse } from "next/server";
import { getMerchantAnalytics, getTimeSeriesData } from "@/lib/services/analytics";
import { getTenantId, requirePermission, handleError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const forbidden = await requirePermission(req, "read");
  if (forbidden) return forbidden;

  try {
    const tenantId = await getTenantId(req);
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") || "month") as "today" | "week" | "month" | "year" | "custom";
    const start = searchParams.get("start") ?? undefined;
    const end = searchParams.get("end") ?? undefined;
    const metric = searchParams.get("metric");

    if (metric) {
      const data = await getTimeSeriesData(tenantId, metric, { range, start, end });
      return NextResponse.json({ data, metric });
    }
    const metrics = await getMerchantAnalytics(tenantId, { range, start, end });
    return NextResponse.json(metrics);
  } catch (e) {
    return handleError(e);
  }
}
