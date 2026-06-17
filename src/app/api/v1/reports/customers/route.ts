import { NextResponse } from "next/server";
import { generateCustomerReport } from "@/lib/services/reports";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = req.headers.get("x-tenant-id") || searchParams.get("tenantId") || "t-1";
  const format = searchParams.get("format") || "json";

  try {
    const data = await generateCustomerReport(tenantId);

    if (format === "csv") {
      const headers = "Name,Email,Total Orders,Total Spent,First Order,Last Order";
      const rows = data.map((r) => `${r.name},${r.email},${r.totalOrders},${r.totalSpent},${r.firstOrder},${r.lastOrder}`);
      const csv = [headers, ...rows].join("\n");
      return new NextResponse(csv, {
        headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=customer-report.csv" },
      });
    }

    return NextResponse.json({ data, summary: { total: data.length, totalRevenue: data.reduce((s, r) => s + r.totalSpent, 0) } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
