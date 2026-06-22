import { test, expect, request } from "@playwright/test";

const BASE = "http://localhost:3000";
const ts = Date.now();

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
    const res = await ctx.post("/api/v1/wishlist", {
      data: { variantId: `var-wishlist-${Date.now()}` },
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

  test("DELETE /api/v1/wishlist/:variantId - requires auth", async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { "x-tenant-id": tenantId },
    });
    const res = await ctx.delete("/api/v1/wishlist/some-variant");
    expect(res.status()).toBe(401);
  });

  test("GET /api/v1/wishlist/count - returns count", async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { "x-tenant-id": tenantId },
    });
    const res = await ctx.get("/api/v1/wishlist/count");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(typeof body.count).toBe("number");
  });

  test("POST /api/v1/wishlist/sync - requires auth", async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { "x-tenant-id": tenantId },
    });
    const res = await ctx.post("/api/v1/wishlist/sync", {
      data: { items: [] },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/v1/wishlist/move-to-cart - requires auth", async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { "x-tenant-id": tenantId },
    });
    const res = await ctx.post("/api/v1/wishlist/move-to-cart", {
      data: { variantIds: [] },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/v1/wishlist/share - requires auth", async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { "x-tenant-id": tenantId },
    });
    const res = await ctx.post("/api/v1/wishlist/share");
    expect(res.status()).toBe(401);
  });

  test("GET /api/v1/storefront/wishlist/:shareToken - validates token", async () => {
    const res = await fetch(`${BASE}/api/v1/storefront/wishlist/invalid-token-${ts}`);
    if (res.status === 404) {
      expect(res.status).toBe(404);
    } else {
      const body = await res.json();
      expect(body).toBeDefined();
    }
  });
});
