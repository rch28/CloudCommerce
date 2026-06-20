import { test, expect, request } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("Wishlist API", () => {
  const tenantId = "t-1";

  test("GET /api/v1/wishlist - returns wishlist", async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { "x-tenant-id": tenantId },
    });
    const res = await ctx.get("/api/v1/wishlist");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.items).toBeDefined();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("POST /api/v1/wishlist - requires auth (no customer session)", async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { "x-tenant-id": tenantId },
    });
    // POST requires a customer ID or cc_cart_session cookie; without either it returns 401
    const variantId = `var-wishlist-${Date.now()}`;
    const res = await ctx.post("/api/v1/wishlist", {
      data: { variantId },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/v1/wishlist - returns 400 without tenant header", async () => {
    const ctx = await request.newContext({ baseURL: BASE });
    const res = await ctx.post("/api/v1/wishlist", {
      data: { variantId: "var-1" },
    });
    expect(res.status()).toBe(400);
  });
});
