import { prisma } from "@/lib/prisma";
import { orders as mockOrders, customers as mockCustomers, merchants as mockMerchants, revenueData, merchantGrowthData } from "@/data/mock";
import { cacheKey, getCached, setCache } from "./analytics-cache";

export type TimeRange = "today" | "week" | "month" | "year" | "custom";

export interface TimeRangeInput {
  range: TimeRange;
  start?: string;
  end?: string;
}

export interface MerchantMetrics {
  revenue: number;
  revenueChange: number;
  revenueData: Array<{ label: string; value: number }>;
  orders: number;
  ordersChange: number;
  ordersData: Array<{ label: string; value: number }>;
  customers: number;
  customersChange: number;
  aov: number;
  aovChange: number;
  conversionRate: number;
  conversionChange: number;
}

export interface AdminMetrics {
  totalTenants: number;
  tenantChange: number;
  activeStores: number;
  storeChange: number;
  mrr: number;
  mrrChange: number;
  arr: number;
  churnRate: number;
  churnChange: number;
  growthData: Array<{ label: string; active: number; total: number }>;
  revenueData: Array<{ label: string; value: number }>;
}

function computeDateRange(input: TimeRangeInput): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  let start: Date;

  switch (input.range) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      break;
    case "month":
      start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      break;
    case "year":
      start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      break;
    case "custom":
      start = input.start ? new Date(input.start) : new Date(now.getFullYear(), now.getMonth(), 1);
      end.setTime(input.end ? new Date(input.end).getTime() : now.getTime());
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { start, end };
}

export async function getMerchantAnalytics(tenantId: string, input: TimeRangeInput): Promise<MerchantMetrics> {
  const key = cacheKey("merchant-analytics", tenantId, input.range, input.start || "", input.end || "");
  const cached = getCached<MerchantMetrics>(key);
  if (cached) return cached;

  if (process.env.DATABASE_URL) {
    const { start, end } = computeDateRange(input);

    const [orderAgg, customerCount, prevOrderAgg, prevCustomerCount] = await Promise.all([
      prisma.order.aggregate({
        where: { tenantId, createdAt: { gte: start, lte: end } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.customer.count({
        where: { tenantId, createdAt: { gte: start, lte: end } },
      }),
      prisma.order.aggregate({
        where: { tenantId, createdAt: { gte: new Date(start.getTime() - (end.getTime() - start.getTime())), lte: start } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.customer.count({
        where: { tenantId, createdAt: { gte: new Date(start.getTime() - (end.getTime() - start.getTime())), lte: start } },
      }),
    ]);

    const revenue = Number(orderAgg._sum.total || 0);
    const prevRevenue = Number(prevOrderAgg._sum.total || 0);
    const orders = orderAgg._count;
    const prevOrders = prevOrderAgg._count;
    const customers = customerCount;
    const prevCustomers = prevCustomerCount;
    const aov = orders > 0 ? revenue / orders : 0;
    const prevAov = prevOrders > 0 ? prevRevenue / prevOrders : 0;

    const calcChange = (curr: number, prev: number) => prev > 0 ? ((curr - prev) / prev) * 100 : 0;

    const result: MerchantMetrics = {
      revenue, revenueChange: calcChange(revenue, prevRevenue),
      revenueData: [],
      orders, ordersChange: calcChange(orders, prevOrders),
      ordersData: [],
      customers, customersChange: calcChange(customers, prevCustomers),
      aov, aovChange: calcChange(aov, prevAov),
      conversionRate: 3.2, conversionChange: 0.4,
    };
    setCache(key, result, 30_000);
    return result;
  }

  const now = new Date();
  const result: MerchantMetrics = {
    revenue: 84120 + Math.floor(Math.random() * 5000),
    revenueChange: 16.2,
    revenueData: revenueData.map((d) => ({ label: d.month, value: d.revenue })),
    orders: 1510 + Math.floor(Math.random() * 200),
    ordersChange: 12.8,
    ordersData: [
      { label: "Mon", value: 42 }, { label: "Tue", value: 58 },
      { label: "Wed", value: 35 }, { label: "Thu", value: 67 },
      { label: "Fri", value: 81 }, { label: "Sat", value: 29 }, { label: "Sun", value: 23 },
    ],
    customers: 86 + Math.floor(Math.random() * 10),
    customersChange: 8.4,
    aov: 55.70 + Math.random() * 5,
    aovChange: 3.1,
    conversionRate: 3.2 + Math.random() * 0.5,
    conversionChange: 0.4,
  };
  setCache(key, result);
  return result;
}

export async function getAdminAnalytics(input: TimeRangeInput): Promise<AdminMetrics> {
  const key = cacheKey("admin-analytics", input.range, input.start || "", input.end || "");
  const cached = getCached<AdminMetrics>(key);
  if (cached) return cached;

  if (process.env.DATABASE_URL) {
    const { start, end } = computeDateRange(input);

    const [tenantCount, prevTenantCount, orderAgg] = await Promise.all([
      prisma.tenant.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.tenant.count({
        where: { createdAt: { gte: new Date(start.getTime() - (end.getTime() - start.getTime())), lte: start } },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: start, lte: end } },
        _sum: { total: true },
      }),
    ]);

    const revenue = Number(orderAgg._sum.total || 0);
    const calcChange = (curr: number, prev: number) => prev > 0 ? ((curr - prev) / prev) * 100 : 0;
    const mrr = Math.round(revenue / Math.max(1, (end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000)));

    const result: AdminMetrics = {
      totalTenants: tenantCount,
      tenantChange: calcChange(tenantCount, prevTenantCount),
      activeStores: Math.round(tenantCount * 0.85),
      storeChange: 8.3,
      mrr, mrrChange: 12.5,
      arr: mrr * 12,
      churnRate: 3.2,
      churnChange: -0.5,
      growthData: [],
      revenueData: [],
    };
    setCache(key, result, 30_000);
    return result;
  }

  const result: AdminMetrics = {
    totalTenants: 214 + Math.floor(Math.random() * 5),
    tenantChange: 12.5,
    activeStores: 182 + Math.floor(Math.random() * 3),
    storeChange: 8.3,
    mrr: 584200 / 6,
    mrrChange: 12.5,
    arr: 584200 / 6 * 12,
    churnRate: 3.2 + Math.random() * 0.3,
    churnChange: -0.5,
    growthData: merchantGrowthData.map((d) => ({ label: d.month, active: d.active, total: d.merchants })),
    revenueData: revenueData.map((d) => ({ label: d.month, value: d.revenue })),
  };
  setCache(key, result);
  return result;
}

export async function getTimeSeriesData(tenantId: string | null, metric: string, input: TimeRangeInput) {
  const key = cacheKey("timeseries", tenantId || "admin", metric, input.range, input.start || "", input.end || "");
  const cached = getCached<Array<{ date: string; value: number }>>(key);
  if (cached) return cached;

  const { start, end } = computeDateRange(input);
  const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  const data: Array<{ date: string; value: number }> = [];

  if (days <= 31) {
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      data.push({ date: d.toISOString().split("T")[0], value: Math.floor(100 + Math.random() * 500) });
    }
  } else {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 0; i < Math.min(days / 30, 12); i++) {
      data.push({ date: months[i % 12] || `M${i}`, value: Math.floor(10000 + Math.random() * 50000) });
    }
  }

  setCache(key, data, 60_000);
  return data;
}
