import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAnalytics } from "@/lib/services/analytics";
import { requireAdminRole } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const forbidden = await requireAdminRole(req);
  if (forbidden) return forbidden;
  try {
    const hasDb = !!process.env.DATABASE_URL;

    if (hasDb) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [
        totalTenants,
        activeStores,
        orderAgg,
        ordersToday,
        recentTenants,
        recentActivity,
        monthlyRevenue,
        tenantGrowth,
        analytics,
      ] = await Promise.all([
        prisma.tenant.count(),
        prisma.store.count(),
        prisma.order.aggregate({ _sum: { total: true } }),
        prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
        prisma.tenant.findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
          include: {
            stores: { take: 1 },
            _count: { select: { orders: true } },
          },
        }),
        prisma.auditLog.findMany({
          take: 7,
          orderBy: { createdAt: "desc" },
          include: { tenant: { select: { name: true } } },
        }),
        prisma.order.groupBy({
          by: ["createdAt"],
          where: { createdAt: { gte: monthStart } },
          _sum: { total: true },
          orderBy: { createdAt: "asc" },
        }),
        prisma.tenant.groupBy({
          by: ["createdAt"],
          orderBy: { createdAt: "asc" },
          _count: true,
        }),
        getAdminAnalytics({ range: "month" }),
      ]);

      const totalRevenue = Number(orderAgg._sum.total || 0);

      const merchants = recentTenants.map((t) => ({
        id: t.id,
        name: t.name,
        subdomain: t.subdomain,
        plan: "Growth",
        orders: t._count.orders,
        status: "active" as const,
        revenue: 0,
      }));

      const activity = recentActivity.map((a) => ({
        id: a.id,
        type: (a.action === "create" && a.entityType === "Tenant" ? "merchant_joined" :
               a.action === "create" && a.entityType === "Store" ? "store_launched" :
               a.action === "update" && a.entityType === "Order" ? "payment_received" : "alert") as
          "merchant_joined" | "store_launched" | "payment_received" | "plan_upgraded" | "alert",
        message: `${a.action} ${a.entityType}`,
        time: formatRelativeTime(a.createdAt),
        user: a.tenant?.name,
      }));

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const revenueByMonth: Record<string, number> = {};
      for (const row of monthlyRevenue) {
        const key = months[row.createdAt.getMonth()];
        revenueByMonth[key] = (revenueByMonth[key] || 0) + Number(row._sum.total || 0);
      }
      const revenueData = months.map((month) => ({
        month,
        revenue: revenueByMonth[month] || 0,
        orders: 0,
      }));

      const growthByMonth: Record<string, number> = {};
      for (const row of tenantGrowth) {
        const key = months[row.createdAt.getMonth()];
        growthByMonth[key] = (growthByMonth[key] || 0) + row._count;
      }
      const merchantGrowthData = months.map((month, i) => ({
        month,
        merchants: growthByMonth[month] || 0,
        active: Math.round((growthByMonth[month] || 0) * 0.85),
      }));

      return NextResponse.json({
        adminMetrics: {
          totalMerchants: totalTenants,
          activeStores,
          platformRevenue: totalRevenue,
          ordersToday,
          merchantChange: analytics.tenantChange,
          storeChange: analytics.storeChange,
          revenueChange: analytics.mrrChange,
          ordersChange: 0,
        },
        merchants,
        activity,
        revenueData,
        merchantGrowthData,
      });
    }

    return NextResponse.json({
      adminMetrics: {
        totalMerchants: 0,
        activeStores: 0,
        platformRevenue: 0,
        ordersToday: 0,
        merchantChange: 0,
        storeChange: 0,
        revenueChange: 0,
        ordersChange: 0,
      },
      merchants: [],
      activity: [],
      revenueData: [],
      merchantGrowthData: [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}
