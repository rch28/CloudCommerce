import { test, expect } from "@playwright/test";
import { loginAsMerchant, loginAsAdmin, unauthContext } from "./helpers/auth";

const ts = Date.now();

test.describe("Products API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;
  let adminCtx: Awaited<ReturnType<typeof loginAsAdmin>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
    adminCtx = await loginAsAdmin();
  });

  test("GET /api/v1/products - returns list", async () => {
    const res = await ctx.get("/api/v1/products");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET /api/v1/products - allows public read access", async () => {
    const unauth = await unauthContext();
    const res = await unauth.get("/api/v1/products");
    expect(res.ok()).toBe(true);
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
    const created = await create.json();
    const res = await ctx.put(`/api/v1/products/${created.id}`, {
      data: { name: "After", status: "active" },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe("After");
  });

  test("DELETE /api/v1/products/:id - soft deletes (admin)", async () => {
    const slug = `del-prod-${ts}`;
    const create = await ctx.post("/api/v1/products", {
      data: {
        name: "Del Prod", slug, status: "draft",
        images: [], variants: [{ sku: `DP-${ts}`, price: 1, quantity: 1, isDefault: true, status: "active" }], options: [],
      },
    });
    const created = await create.json();
    const res = await adminCtx.delete(`/api/v1/products/${created.id}`);
    expect(res.ok()).toBe(true);
  });
});
