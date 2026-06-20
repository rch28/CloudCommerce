import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsMerchant } from "./helpers/auth";

test.describe("Admin API", () => {
  let adminCtx: Awaited<ReturnType<typeof loginAsAdmin>>;

  test.beforeAll(async () => {
    adminCtx = await loginAsAdmin();
  });

  test("GET /api/v1/admin/stats - returns admin dashboard stats", async () => {
    const res = await adminCtx.get("/api/v1/admin/stats");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.adminMetrics).toBeDefined();
    expect(typeof body.adminMetrics.totalMerchants).toBe("number");
    expect(Array.isArray(body.merchants)).toBe(true);
    expect(Array.isArray(body.activity)).toBe(true);
  });
});
