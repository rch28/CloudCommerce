import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

const ts = Date.now();

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

  test("GET /api/v1/inventory?lowStock=true - filters low stock", async () => {
    const res = await ctx.get("/api/v1/inventory?lowStock=true");
    expect(res.ok()).toBe(true);
  });

  test("GET /api/v1/inventory?search={sku} - search by SKU", async () => {
    const list = await ctx.get("/api/v1/inventory");
    const body = await list.json();
    if (body.length > 0 && body[0].sku) {
      const res = await ctx.get(`/api/v1/inventory?search=${body[0].sku}`);
      expect(res.ok()).toBe(true);
    }
  });

  test("GET /api/v1/inventory/history - requires variantId param", async () => {
    const res = await ctx.get("/api/v1/inventory/history");
    expect(res.status()).toBe(400);
  });

  test("GET /api/v1/inventory/history?variantId= - returns inventory change log", async () => {
    const list = await ctx.get("/api/v1/inventory");
    const body = await list.json();
    const firstItem = body?.[0];
    if (!firstItem?.variantId) {
      test.skip();
      return;
    }
    const res = await ctx.get(`/api/v1/inventory/history?variantId=${firstItem.variantId}`);
    expect(res.ok()).toBe(true);
    const historyBody = await res.json();
    expect(Array.isArray(historyBody.items ?? historyBody)).toBe(true);
  });
});
