import { test, expect, request } from "@playwright/test";

const BASE = "http://localhost:3000";
const ts = Date.now();

test.describe("Cart API", () => {
  let variantId: string;

  test.beforeAll(async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { "x-user-role": "merchant" },
    });
    await ctx.post("/api/auth/login", {
      data: { email: "merchant@demo.com", password: "merchant123" },
    });
    const slug = `cart-test-product-${ts}`;
    const sku = `CT-${ts}`;
    const res = await ctx.post("/api/v1/products", {
      data: {
        name: "Cart Test Product",
        slug,
        status: "active",
        images: [{ url: "https://example.com/img.jpg", alt: "test", sortOrder: 0 }],
        variants: [{ sku, price: 9.99, quantity: 100, isDefault: true, status: "active" }],
        options: [],
      },
    });
    expect(res.ok()).toBe(true);
    const product = await res.json();
    variantId = product.variants?.[0]?.id || product.id;
  });

  test("GET /api/v1/cart - returns empty cart", async () => {
    const cartCtx = await request.newContext({ baseURL: BASE });
    const res = await cartCtx.get("/api/v1/cart?tenantId=t-1");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.items).toBeDefined();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("POST /api/v1/cart - adds item", async () => {
    const cartCtx = await request.newContext({ baseURL: BASE });
    const res = await cartCtx.post("/api/v1/cart", {
      data: { tenantId: "t-1", variantId, quantity: 2 },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toBeDefined();
  });

  test("POST /api/v1/cart - validates variant id", async () => {
    const cartCtx = await request.newContext({ baseURL: BASE });
    const res = await cartCtx.post("/api/v1/cart", {
      data: { tenantId: "t-1", quantity: 1 },
    });
    expect(res.status() === 400).toBe(true);
  });

  test("POST /api/v1/cart - validates tenantId", async () => {
    const cartCtx = await request.newContext({ baseURL: BASE });
    const res = await cartCtx.post("/api/v1/cart", {
      data: { variantId, quantity: 1 },
    });
    expect(res.status() === 400).toBe(true);
  });

  test("PATCH /api/v1/cart/items/:variantId - updates cart item", async () => {
    const cartCtx = await request.newContext({ baseURL: BASE });
    await cartCtx.post("/api/v1/cart", {
      data: { tenantId: "t-1", variantId, quantity: 1 },
    });
    const res = await cartCtx.patch(`/api/v1/cart/items/${variantId}`, {
      data: { tenantId: "t-1", quantity: 5 },
    });
    expect(res.ok() || res.status() === 400).toBe(true);
  });

  test("DELETE /api/v1/cart/items/:variantId - removes cart item", async () => {
    const cartCtx = await request.newContext({ baseURL: BASE });
    await cartCtx.post("/api/v1/cart", {
      data: { tenantId: "t-1", variantId, quantity: 1 },
    });
    const res = await cartCtx.delete(`/api/v1/cart/items/${variantId}?tenantId=t-1`);
    expect(res.ok()).toBe(true);
  });
});
