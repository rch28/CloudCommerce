import { test, expect } from "@playwright/test";
import { loginAsMerchant, unauthContext } from "./helpers/auth";

test.describe("Addresses API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/addresses - returns 400 without customerId", async () => {
    const res = await ctx.get("/api/v1/addresses");
    expect(res.status()).toBe(400);
  });

  test("GET /api/v1/addresses - returns list with customerId", async () => {
    const res = await ctx.get("/api/v1/addresses?customerId=cust-1");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("POST /api/v1/addresses - validates customerId", async () => {
    const res = await ctx.post("/api/v1/addresses", {
      data: { street: "123 Main St" },
    });
    expect(res.status()).toBe(400);
  });
});
