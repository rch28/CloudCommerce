import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

const ts = Date.now();

test.describe("Customers API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/customers - returns list", async () => {
    const res = await ctx.get("/api/v1/customers?tenantId=t-1");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("POST /api/v1/customers - creates a customer", async () => {
    const email = `customer-${ts}@test.com`;
    const res = await ctx.post("/api/v1/customers", {
      data: { tenantId: "t-1", email, name: "Test Customer" },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.email).toBe(email);
    expect(body.name).toBe("Test Customer");
  });

  test("POST /api/v1/customers - validates required fields", async () => {
    const res = await ctx.post("/api/v1/customers", { data: { tenantId: "t-1" } });
    expect(res.status()).toBe(400);
  });

  test("GET /api/v1/customers?tenantId=t-1 - missing tenantId returns 400", async () => {
    const res = await ctx.get("/api/v1/customers");
    expect(res.status()).toBe(400);
  });
});
