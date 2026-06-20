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
    // Should be an object with merchant analytics data
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
});
