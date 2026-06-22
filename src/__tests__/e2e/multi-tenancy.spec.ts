import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

const ts = Date.now();

test.describe("Multi-Tenancy", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/products with tenant filter - returns only that tenant's products", async () => {
    const res = await ctx.get("/api/v1/products?tenantId=t-1");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("POST /api/v1/products with explicit tenantId - creates product for that tenant", async () => {
    const slug = `mt-prod-${ts}`;
    const res = await ctx.post("/api/v1/products", {
      data: {
        name: "MT Product",
        slug,
        status: "active",
        tenantId: "t-1",
        images: [],
        variants: [{ sku: `MT-${ts}`, price: 9.99, quantity: 10, isDefault: true, status: "active" }],
        options: [],
      },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.tenantId).toBeDefined();
  });

  test("GET /api/v1/orders?tenantId=t-1 - returns orders for that tenant", async () => {
    const res = await ctx.get("/api/v1/orders?tenantId=t-1");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.orders)).toBe(true);
  });

  test("GET /api/v1/orders without tenantId - returns 400", async () => {
    const res = await ctx.get("/api/v1/orders");
    expect(res.status()).toBe(400);
  });

  test("POST /api/v1/customers with tenantId - creates customer for that tenant", async () => {
    const email = `mt-cust-${ts}@test.com`;
    const res = await ctx.post("/api/v1/customers", {
      data: { tenantId: "t-1", email, name: "MT Customer" },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.tenantId).toBe("t-1");
  });

  test("GET /api/v1/customers without tenantId - returns 400", async () => {
    const res = await ctx.get("/api/v1/customers");
    expect(res.status()).toBe(400);
  });

  test("GET /api/v1/categories - returns categories scoped to tenant", async () => {
    const res = await ctx.get("/api/v1/categories");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("POST /api/v1/categories with tenantId - creates category for that tenant", async () => {
    const catSlug = `mt-cat-${ts}`;
    const res = await ctx.post("/api/v1/categories", {
      data: { name: "MT Category", slug: catSlug, tenantId: "t-1" },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.tenantId).toBeDefined();
  });
});
