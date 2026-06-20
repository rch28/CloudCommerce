import { NextResponse } from "next/server";
import { generateSalesReport, computeReportTotals } from "@/lib/services/reports";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = req.headers.get("x-tenant-id") || searchParams.get("tenantId") || "t-1";
  const range = (searchParams.get("range") || "month") as any;
  const start = searchParams.get("start") || undefined;
  const end = searchParams.get("end") || undefined;
  const format = searchParams.get("format") || "json";

  try {
    const data = await generateSalesReport(tenantId, { range, start, end });
    const totals = computeReportTotals(data);

    if (format === "csv") {
      const headers = "Date,Orders,Revenue,Items Sold,Avg Order Value";
      const rows = data.map((r) => `${r.date},${r.orderCount},${r.revenue},${r.itemsSold},${r.avgOrderValue.toFixed(2)}`);
      const csv = [headers, ...rows].join("\n");
      return new NextResponse(csv, {
        headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=sales-report.csv" },
      });
    }

    return NextResponse.json({ data, totals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
