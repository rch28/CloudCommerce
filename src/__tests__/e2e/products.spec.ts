import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

const ts = Date.now();

test.describe("Products API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/products - returns list", async () => {
    const res = await ctx.get("/api/v1/products");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET /api/v1/products - allows public read access", async () => {
    const res = await fetch("http://localhost:3000/api/v1/products");
    expect(res.ok).toBe(true);
  });

  test("POST /api/v1/products - creates a product", async () => {
    const slug = `test-product-${ts}`;
    const res = await ctx.post("/api/v1/products", {
      data: {
        name: "Test Product",
        slug,
        status: "active",
        images: [{ url: "https://example.com/img.jpg", alt: "test", sortOrder: 0 }],
        variants: [{ sku: `TP-${ts}`, price: 19.99, quantity: 10, isDefault: true, status: "active" }],
        options: [],
      },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe("Test Product");
    expect(body.status).toBe("active");
  });

  test("POST /api/v1/products - validates required fields", async () => {
    const res = await ctx.post("/api/v1/products", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("GET /api/v1/products/:id - returns product by id", async () => {
    const slug = `get-prod-${ts}`;
    const create = await ctx.post("/api/v1/products", {
      data: {
        name: "Get Prod",
        slug,
        status: "active",
        images: [],
        variants: [{ sku: `GP-${ts}`, price: 9.99, quantity: 5, isDefault: true, status: "active" }],
        options: [],
      },
    });
    const created = await create.json();
    const res = await ctx.get(`/api/v1/products/${created.id}`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe("Get Prod");
  });

  test("PUT /api/v1/products/:id - updates product", async () => {
    const slug = `before-prod-${ts}`;
    const create = await ctx.post("/api/v1/products", {
      data: {
        name: "Before", slug, status: "draft",
        images: [], variants: [{ sku: `BP-${ts}`, price: 1, quantity: 1, isDefault: true, status: "active" }], options: [],
      },
    });
    expect(create.ok()).toBe(true);
    const created = await create.json();
    const res = await ctx.put(`/api/v1/products/${created.id}`, {
      data: { name: "After", status: "active" },
    });
    expect(res.ok()).toBe(true);
  });

  test("POST /api/v1/products/:id/duplicate - duplicates a product", async () => {
    const slug = `orig-${ts}`;
    const create = await ctx.post("/api/v1/products", {
      data: {
        name: "Original", slug, status: "active",
        images: [{ url: "https://example.com/img.jpg", alt: "test", sortOrder: 0 }],
        variants: [{ sku: `ORIG-${ts}`, price: 19.99, quantity: 10, isDefault: true, status: "active" }],
        options: [],
      },
    });
    expect(create.ok()).toBe(true);
    const created = await create.json();
    const res = await ctx.post(`/api/v1/products/${created.id}/duplicate`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toContain("Original");
  });

  test("POST /api/v1/products/generate-variants - validates input", async () => {
    const res = await ctx.post("/api/v1/products/generate-variants", { data: {} });
    expect(res.status()).toBe(400);
  });
});
