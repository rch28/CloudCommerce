import { NextResponse } from "next/server";
import { generateInventoryReport } from "@/lib/services/reports";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = req.headers.get("x-tenant-id") || searchParams.get("tenantId") || "t-1";
  const format = searchParams.get("format") || "json";

  try {
    const data = await generateInventoryReport(tenantId);

    if (format === "csv") {
      const headers = "Product,SKU,Stock,Threshold,Status,Sold 30d";
      const rows = data.map((r) => `${r.productName},${r.sku},${r.stock},${r.lowStockThreshold},${r.status},${r.sold30d}`);
      const csv = [headers, ...rows].join("\n");
      return new NextResponse(csv, {
        headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=inventory-report.csv" },
      });
    }

    return NextResponse.json({ data, summary: { total: data.length, lowStock: data.filter((r) => r.status === "low_stock").length, outOfStock: data.filter((r) => r.status === "out_of_stock").length } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
