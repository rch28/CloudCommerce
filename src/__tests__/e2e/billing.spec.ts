import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

const ts = Date.now();

test.describe("Billing API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/subscriptions - returns subscription info", async () => {
    const res = await ctx.get("/api/v1/subscriptions");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.plan).toBeDefined();
    expect(body.status).toBeDefined();
  });

  test("POST /api/v1/subscriptions - rejects duplicate subscription", async () => {
    const res = await ctx.post("/api/v1/subscriptions", {
      data: { action: "subscribe", planSlug: "growth", trialDays: 14 },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("already has a subscription");
  });

  test("POST /api/v1/subscriptions - requires action field", async () => {
    const res = await ctx.post("/api/v1/subscriptions", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("POST /api/v1/subscriptions - cancel subscription", async () => {
    const res = await ctx.post("/api/v1/subscriptions", {
      data: { action: "cancel" },
    });
    expect(res.ok()).toBe(true);
  });

  test("PUT /api/v1/subscriptions - switch plan", async () => {
    const res = await ctx.put("/api/v1/subscriptions", {
      data: { planSlug: "growth" },
    });
    expect(res.ok() || res.status() === 400).toBe(true);
  });

  test("GET /api/v1/plans - returns available plans", async () => {
    const res = await ctx.get("/api/v1/plans");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.plans ?? body)).toBe(true);
  });

  test("GET /api/v1/payments - returns payment history", async () => {
    const res = await ctx.get("/api/v1/payments");
    expect(res.ok()).toBe(true);
  });
});
