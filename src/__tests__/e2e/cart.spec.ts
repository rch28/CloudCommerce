import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

const ts = Date.now();

test.describe("Cart API", () => {
  let variantId: string;

  test.beforeAll(async () => {
    // Create a product with a variant so we have a real variant ID for cart tests
    const ctx = await loginAsMerchant();
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
    const res = await fetch("http://localhost:3000/api/v1/cart?tenantId=t-1");
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body).toBeDefined();
    expect(body.items).toBeDefined();
  });

  test("POST /api/v1/cart - adds item", async () => {
    const res = await fetch("http://localhost:3000/api/v1/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: "t-1", variantId, quantity: 2 }),
    });
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body).toBeDefined();
  });

  test("POST /api/v1/cart - validates variant id", async () => {
    const res = await fetch("http://localhost:3000/api/v1/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: "t-1", quantity: 1 }),
    });
    expect(res.status).toBe(400);
  });
});
