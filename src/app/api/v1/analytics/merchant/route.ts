import { NextResponse } from "next/server";
import { getMerchantAnalytics, getTimeSeriesData } from "@/lib/services/analytics";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = req.headers.get("x-tenant-id") || searchParams.get("tenantId") || "t-1";
  const range = (searchParams.get("range") || "month") as any;
  const start = searchParams.get("start") || undefined;
  const end = searchParams.get("end") || undefined;
  const metric = searchParams.get("metric");

  try {
    if (metric) {
      const data = await getTimeSeriesData(tenantId, metric, { range, start, end });
      return NextResponse.json({ data, metric });
    }
    const metrics = await getMerchantAnalytics(tenantId, { range, start, end });
    return NextResponse.json(metrics);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
