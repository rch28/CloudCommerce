import { prisma } from "@/lib/prisma";

export interface DashboardStats {
  revenue: number;
  orders: number;
  products: number;
  inventory: number;
  revenueChange: number;
  ordersChange: number;
  productsChange: number;
  inventoryChange: number;
  revenueData: Array<{ month: string; revenue: number; orders: number }>;
  orderChartData: Array<{ day: string; orders: number }>;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function calcChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

export async function getDashboardStats(tenantId: string): Promise<DashboardStats> {
  if (!process.env.DATABASE_URL) {
    return {
      revenue: 84120, orders: 1510, products: 142, inventory: 127,
      revenueChange: 16.2, ordersChange: 12.8, productsChange: 4.1, inventoryChange: -2.3,
      revenueData: [
        { month: "Jan", revenue: 42000, orders: 820 },
        { month: "Feb", revenue: 51000, orders: 940 },
        { month: "Mar", revenue: 48500, orders: 880 },
        { month: "Apr", revenue: 61200, orders: 1120 },
        { month: "May", revenue: 72400, orders: 1340 },
        { month: "Jun", revenue: 84100, orders: 1510 },
      ],
      orderChartData: [
        { day: "Mon", orders: 42 }, { day: "Tue", orders: 58 },
        { day: "Wed", orders: 35 }, { day: "Thu", orders: 67 },
        { day: "Fri", orders: 81 }, { day: "Sat", orders: 29 }, { day: "Sun", orders: 23 },
      ],
    };
  }

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    currentAgg,
    prevAgg,
    productCount,
    productsBeforeThisMonth,
    inventoryResult,
    sixMonthOrders,
    weeklyOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { tenantId, createdAt: { gte: currentMonthStart } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { tenantId, createdAt: { gte: prevMonthStart, lt: currentMonthStart } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.product.count({
      where: { tenantId, deletedAt: null },
    }),
    prisma.product.count({
      where: { tenantId, deletedAt: null, createdAt: { lt: currentMonthStart } },
    }),
    prisma.productVariant.aggregate({
      where: { product: { tenantId, deletedAt: null } },
      _sum: { quantity: true },
    }),
    prisma.order.findMany({
      where: { tenantId, createdAt: { gte: sixMonthsAgo } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: { tenantId, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const revenue = Number(currentAgg._sum.total || 0);
  const prevRevenue = Number(prevAgg._sum.total || 0);
  const orders = currentAgg._count;
  const prevOrders = prevAgg._count;
  const products = productCount;
  const inventory = Number(inventoryResult._sum.quantity || 0);

  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${d.getMonth()}`);
  }

  const monthBuckets: Record<string, { revenue: number; orders: number }> = {};
  for (const key of monthKeys) {
    monthBuckets[key] = { revenue: 0, orders: 0 };
  }
  for (const order of sixMonthOrders) {
    const key = `${order.createdAt.getFullYear()}-${order.createdAt.getMonth()}`;
    if (monthBuckets[key]) {
      monthBuckets[key].revenue += Number(order.total);
      monthBuckets[key].orders += 1;
    }
  }

  const revenueData = monthKeys.map((key) => {
    const [, m] = key.split("-").map(Number);
    return { month: MONTHS[m], revenue: monthBuckets[key].revenue, orders: monthBuckets[key].orders };
  });

  const dayKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dayKeys.push(d.toISOString().split("T")[0]);
  }

  const dayBuckets: Record<string, number> = {};
  for (const key of dayKeys) {
    dayBuckets[key] = 0;
  }
  for (const order of weeklyOrders) {
    const key = order.createdAt.toISOString().split("T")[0];
    if (dayBuckets[key] !== undefined) {
      dayBuckets[key]++;
    }
  }

  const orderChartData = dayKeys.map((key) => {
    const d = new Date(key);
    return { day: DAYS[d.getDay()], orders: dayBuckets[key] };
  });

  return {
    revenue,
    orders,
    products,
    inventory,
    revenueChange: calcChange(revenue, prevRevenue),
    ordersChange: calcChange(orders, prevOrders),
    productsChange: calcChange(products, productsBeforeThisMonth),
    inventoryChange: 0,
    revenueData,
    orderChartData,
  };
}
