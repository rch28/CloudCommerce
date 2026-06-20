import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Billing API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/subscriptions - returns subscription info", async () => {
    const res = await ctx.get("/api/v1/subscriptions");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    // Expect subscription object with a plan property
    expect(body.plan).toBeDefined();
    expect(body.status).toBeDefined();
  });

  test("POST /api/v1/subscriptions - rejects duplicate subscription", async () => {
    const res = await ctx.post("/api/v1/subscriptions", {
      data: { action: "subscribe", planSlug: "growth", trialDays: 14 },
    });
    // Tenant already has a subscription, so this should fail with 400
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("already has a subscription");
  });

  test("POST /api/v1/subscriptions - requires action field", async () => {
    const res = await ctx.post("/api/v1/subscriptions", { data: {} });
    expect(res.status()).toBe(400);
  });
});
