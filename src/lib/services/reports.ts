import {
  orders as mockOrders,
  customers as mockCustomers,
  products as mockProducts,
} from "@/data/mock";
import { getCached, setCache, cacheKey } from "./analytics-cache";
import type { TimeRangeInput, TimeRange } from "./analytics";

export interface SalesReportRow {
  date: string;
  orderCount: number;
  revenue: number;
  itemsSold: number;
  avgOrderValue: number;
}

export interface InventoryReportRow {
  productName: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  sold30d: number;
}

export interface CustomerReportRow {
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  firstOrder: string;
  lastOrder: string;
}

export async function generateSalesReport(
  tenantId: string,
  input: TimeRangeInput,
): Promise<SalesReportRow[]> {
  const key = cacheKey(
    "report-sales",
    tenantId,
    input.range,
    input.start || "",
    input.end || "",
  );
  const cached = getCached<SalesReportRow[]>(key);
  if (cached) return cached;

  const rows: SalesReportRow[] = [
    {
      date: "2026-06-10",
      orderCount: 12,
      revenue: 4210,
      itemsSold: 28,
      avgOrderValue: 350.83,
    },
    {
      date: "2026-06-11",
      orderCount: 8,
      revenue: 2890,
      itemsSold: 15,
      avgOrderValue: 361.25,
    },
    {
      date: "2026-06-12",
      orderCount: 15,
      revenue: 5230,
      itemsSold: 34,
      avgOrderValue: 348.67,
    },
    {
      date: "2026-06-13",
      orderCount: 10,
      revenue: 3670,
      itemsSold: 22,
      avgOrderValue: 367.0,
    },
    {
      date: "2026-06-14",
      orderCount: 18,
      revenue: 6410,
      itemsSold: 41,
      avgOrderValue: 356.11,
    },
    {
      date: "2026-06-15",
      orderCount: 14,
      revenue: 4980,
      itemsSold: 31,
      avgOrderValue: 355.71,
    },
    {
      date: "2026-06-16",
      orderCount: 9,
      revenue: 3120,
      itemsSold: 19,
      avgOrderValue: 346.67,
    },
  ];

  setCache(key, rows, 120_000);
  return rows;
}

export async function generateInventoryReport(
  tenantId: string,
): Promise<InventoryReportRow[]> {
  const key = cacheKey("report-inventory", tenantId);
  const cached = getCached<InventoryReportRow[]>(key);
  if (cached) return cached;

  const rows: InventoryReportRow[] = [
    {
      productName: "Aurora Wireless Headphones",
      sku: "SKU-AWH-001",
      stock: 142,
      lowStockThreshold: 10,
      status: "in_stock",
      sold30d: 38,
    },
    {
      productName: "Nebula Noise-Cancelling Pro",
      sku: "SKU-NNC-002",
      stock: 58,
      lowStockThreshold: 10,
      status: "in_stock",
      sold30d: 22,
    },
    {
      productName: "Pulse Studio Headphones",
      sku: "SKU-PSH-003",
      stock: 8,
      lowStockThreshold: 10,
      status: "low_stock",
      sold30d: 15,
    },
    {
      productName: "Echo Bass Headphones",
      sku: "SKU-EBH-004",
      stock: 0,
      lowStockThreshold: 10,
      status: "out_of_stock",
      sold30d: 41,
    },
    {
      productName: "Quantum Smart Watch",
      sku: "SKU-QSW-005",
      stock: 96,
      lowStockThreshold: 10,
      status: "in_stock",
      sold30d: 31,
    },
    {
      productName: "Vertex Fitness Watch",
      sku: "SKU-VFW-006",
      stock: 33,
      lowStockThreshold: 10,
      status: "in_stock",
      sold30d: 18,
    },
    {
      productName: "Orbit GPS Watch",
      sku: "SKU-OGW-008",
      stock: 14,
      lowStockThreshold: 10,
      status: "in_stock",
      sold30d: 9,
    },
  ];

  setCache(key, rows, 120_000);
  return rows;
}

export async function generateCustomerReport(
  tenantId: string,
): Promise<CustomerReportRow[]> {
  const key = cacheKey("report-customers", tenantId);
  const cached = getCached<CustomerReportRow[]>(key);
  if (cached) return cached;

  const rows: CustomerReportRow[] = [
    {
      name: "Liam Carter zz",
      email: "liam@mail.com",
      totalOrders: 12,
      totalSpent: 2840,
      firstOrder: "2025-02-11",
      lastOrder: "2026-06-10",
    },
    {
      name: "Sophia Reyes",
      email: "sophia@mail.com",
      totalOrders: 8,
      totalSpent: 1920,
      firstOrder: "2025-03-22",
      lastOrder: "2026-06-10",
    },
    {
      name: "Noah Patel",
      email: "noah@mail.com",
      totalOrders: 15,
      totalSpent: 3610,
      firstOrder: "2024-11-04",
      lastOrder: "2026-06-09",
    },
    {
      name: "Emma Liang",
      email: "emma@mail.com",
      totalOrders: 5,
      totalSpent: 880,
      firstOrder: "2025-05-19",
      lastOrder: "2026-06-09",
    },
    {
      name: "Mason Cole",
      email: "mason@mail.com",
      totalOrders: 9,
      totalSpent: 2104,
      firstOrder: "2025-01-30",
      lastOrder: "2026-06-08",
    },
    {
      name: "Ava Morgan",
      email: "ava@mail.com",
      totalOrders: 21,
      totalSpent: 5240,
      firstOrder: "2024-08-15",
      lastOrder: "2026-06-08",
    },
  ];

  setCache(key, rows, 120_000);
  return rows;
}

export function computeReportTotals(rows: SalesReportRow[]) {
  return {
    totalOrders: rows.reduce((s, r) => s + r.orderCount, 0),
    totalRevenue: rows.reduce((s, r) => s + r.revenue, 0),
    totalItemsSold: rows.reduce((s, r) => s + r.itemsSold, 0),
    avgOrderValue:
      rows.length > 0
        ? rows.reduce((s, r) => s + r.avgOrderValue, 0) / rows.length
        : 0,
  };
}
