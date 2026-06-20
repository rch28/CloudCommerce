import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Inventory API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/inventory - returns list", async () => {
    const res = await ctx.get("/api/v1/inventory");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("GET /api/v1/inventory?alerts=true - returns alerts if available", async () => {
    const res = await ctx.get("/api/v1/inventory?alerts=true");
    expect(res.ok()).toBe(true);
  });

  test("POST /api/v1/inventory - validates required fields", async () => {
    const res = await ctx.post("/api/v1/inventory", { data: {} });
    expect(res.status()).toBe(400);
  });
});
