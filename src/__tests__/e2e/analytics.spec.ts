import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Analytics API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/analytics/merchant - returns dashboard data", async () => {
    const res = await ctx.get("/api/v1/analytics/merchant");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toBeDefined();
  });

  test("GET /api/v1/analytics/merchant - accepts range parameter", async () => {
    const res = await ctx.get("/api/v1/analytics/merchant?range=week");
    expect(res.ok()).toBe(true);
  });

  test("GET /api/v1/analytics/merchant - accepts metric parameter", async () => {
    const res = await ctx.get("/api/v1/analytics/merchant?metric=revenue");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.metric).toBe("revenue");
    expect(body.data).toBeDefined();
  });

  test("GET /api/v1/analytics/merchant - different ranges", async () => {
    for (const range of ["today", "7d", "30d", "month", "year"]) {
      const res = await ctx.get(`/api/v1/analytics/merchant?range=${range}`);
      expect(res.ok()).toBe(true);
    }
  });

  test("GET /api/v1/analytics/admin - returns admin analytics (admin)", async () => {
    const res = await ctx.get("/api/v1/analytics/admin");
    expect(res.ok()).toBe(true);
  });

  test("GET /api/v1/reports/sales - returns sales report", async () => {
    const res = await ctx.get("/api/v1/reports/sales?range=month");
    expect(res.ok()).toBe(true);
  });

  test("GET /api/v1/reports/inventory - returns inventory report", async () => {
    const res = await ctx.get("/api/v1/reports/inventory");
    expect(res.ok()).toBe(true);
  });

  test("GET /api/v1/reports/customers - returns customer report", async () => {
    const res = await ctx.get("/api/v1/reports/customers");
    expect(res.ok()).toBe(true);
  });

  test("GET /api/v1/dashboard/stats - returns dashboard stats", async () => {
    const res = await ctx.get("/api/v1/dashboard/stats");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toBeDefined();
  });
});
