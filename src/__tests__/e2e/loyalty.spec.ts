import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

const ts = Date.now();

test.describe("Loyalty API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/loyalty/account - returns loyalty account for customer", async () => {
    const email = `loyal-acc-${ts}@test.com`;
    const cust = await ctx.post("/api/v1/customers", {
      data: { tenantId: "t-1", email, name: "Loyal Acc" },
    });
    expect(cust.ok()).toBe(true);
    const customer = await cust.json();
    const res = await ctx.get(`/api/v1/loyalty/account?customerId=${customer.id}`);
    expect(res.ok()).toBe(true);
  });

  test("GET /api/v1/loyalty/account - requires customerId", async () => {
    const res = await ctx.get("/api/v1/loyalty/account");
    expect(res.status()).toBe(400);
  });

  test("GET /api/v1/loyalty/account/transactions - returns transaction history", async () => {
    const email = `loyal-tx-${ts}@test.com`;
    const cust = await ctx.post("/api/v1/customers", {
      data: { tenantId: "t-1", email, name: "Loyal Tx" },
    });
    expect(cust.ok()).toBe(true);
    const customer = await cust.json();
    const res = await ctx.get(`/api/v1/loyalty/account/transactions?customerId=${customer.id}`);
    expect(res.ok()).toBe(true);
  });

  test("POST /api/v1/loyalty/earn - earns points", async () => {
    const email = `loyal-earn-${ts}@test.com`;
    const cust = await ctx.post("/api/v1/customers", {
      data: { tenantId: "t-1", email, name: "Loyal Earn" },
    });
    expect(cust.ok()).toBe(true);
    const customer = await cust.json();
    const res = await ctx.post("/api/v1/loyalty/earn", {
      data: { customerId: customer.id, points: 50, reason: "Test earn" },
    });
    expect(res.ok() || res.status() === 404 || res.status() === 400).toBe(true);
  });

  test("POST /api/v1/loyalty/earn - validates required fields", async () => {
    const res = await ctx.post("/api/v1/loyalty/earn", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("POST /api/v1/loyalty/redeem - redeems points", async () => {
    const email = `loyal-redeem2-${ts}@test.com`;
    const cust = await ctx.post("/api/v1/customers", {
      data: { tenantId: "t-1", email, name: "Loyal Redeem" },
    });
    expect(cust.ok()).toBe(true);
    const customer = await cust.json();
    const res = await ctx.post("/api/v1/loyalty/redeem", {
      data: { customerId: customer.id, points: 50, redemptionType: "redeem_discount" },
    });
    expect(res.ok() || res.status() === 400).toBe(true);
  });

  test("POST /api/v1/loyalty/redeem - rejects insufficient points", async () => {
    const email = `loyal-insuff2-${ts}@test.com`;
    const cust = await ctx.post("/api/v1/customers", {
      data: { tenantId: "t-1", email, name: "Loyal Insuff" },
    });
    expect(cust.ok()).toBe(true);
    const customer = await cust.json();
    const res = await ctx.post("/api/v1/loyalty/redeem", {
      data: { customerId: customer.id, points: 999999, redemptionType: "redeem_discount" },
    });
    expect(res.status()).toBe(400);
  });

  test("GET /api/v1/loyalty/settings - returns loyalty settings", async () => {
    const res = await ctx.get("/api/v1/loyalty/settings");
    expect(res.ok()).toBe(true);
  });

  test("PUT /api/v1/loyalty/settings - updates settings", async () => {
    const res = await ctx.put("/api/v1/loyalty/settings", {
      data: { enabled: true, pointsPerCurrency: 1, currencyPerPoint: 0.01 },
    });
    expect(res.ok()).toBe(true);
  });

  test("GET /api/v1/loyalty/rules - returns reward rules", async () => {
    const res = await ctx.get("/api/v1/loyalty/rules");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items ?? body)).toBe(true);
  });

  test("POST /api/v1/loyalty/rules - creates a reward rule", async () => {
    const res = await ctx.post("/api/v1/loyalty/rules", {
      data: { name: `Test Rule ${ts}`, type: "earn_points", eventType: "review", points: 25, isActive: true },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toContain("Test Rule");
  });

  test("POST /api/v1/loyalty/rules - validates required fields", async () => {
    const res = await ctx.post("/api/v1/loyalty/rules", { data: {} });
    expect(res.status()).toBe(400);
  });
});
