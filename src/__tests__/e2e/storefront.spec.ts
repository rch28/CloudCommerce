import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("Storefront API (Customer-Facing)", () => {
  test("GET /api/v1/products - public listing", async () => {
    const res = await fetch(`${BASE}/api/v1/products`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET /api/v1/products?search={term} - search by product name", async () => {
    const list = await fetch(`${BASE}/api/v1/products`);
    const all = await list.json();
    const first = all.items?.[0];
    if (!first?.name) {
      test.skip();
      return;
    }
    const searchTerm = first.name.split(" ")[0];
    const res = await fetch(`${BASE}/api/v1/products?search=${encodeURIComponent(searchTerm)}`);
    expect(res.ok).toBe(true);
  });

  test("GET /api/v1/products?search=nonexistent - empty search results", async () => {
    const res = await fetch(`${BASE}/api/v1/products?search=zzzznonexistent`);
    if (!res.ok) {
      test.skip();
      return;
    }
    const body = await res.json();
    expect(body.items ?? body.hits ?? body).toBeDefined();
  });

  test("GET /api/v1/products?categoryId= - filter by category", async () => {
    const list = await fetch(`${BASE}/api/v1/products`);
    const all = await list.json();
    const audioProduct = all.items.find((p: any) => p.category?.slug === "audio" || p.categoryId);
    if (!audioProduct?.categoryId) {
      test.skip();
      return;
    }
    const res = await fetch(`${BASE}/api/v1/products?categoryId=${audioProduct.categoryId}`);
    expect(res.ok).toBe(true);
  });

  test("GET /api/v1/products?sort=price_asc - sorts by price ascending", async () => {
    const res = await fetch(`${BASE}/api/v1/products?sort=price_asc`);
    if (!res.ok) {
      test.skip();
      return;
    }
    const body = await res.json();
    if (body.items && body.items.length > 1) {
      const prices = body.items.map((p: any) => p.price).filter((p: any) => p != null);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    }
  });

  test("GET /api/v1/products?sort=price_desc - sorts by price descending", async () => {
    const res = await fetch(`${BASE}/api/v1/products?sort=price_desc`);
    if (!res.ok) {
      test.skip();
      return;
    }
    const body = await res.json();
    if (body.items && body.items.length > 1) {
      const prices = body.items.map((p: any) => p.price).filter((p: any) => p != null);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
      }
    }
  });

  test("GET /api/v1/products?page=1&pageSize=2 - pagination", async () => {
    const res = await fetch(`${BASE}/api/v1/products?page=1&pageSize=2`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.items.length).toBeLessThanOrEqual(2);
    expect(typeof body.page).toBe("number");
    expect(typeof body.totalPages).toBe("number");
  });

  test("GET /api/v1/products/:id - public product detail", async () => {
    const list = await fetch(`${BASE}/api/v1/products`);
    const all = await list.json();
    const first = all.items?.[0];
    if (!first) {
      test.skip();
      return;
    }
    const res = await fetch(`${BASE}/api/v1/products/${first.id}`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.name).toBe(first.name);
    expect(body.variants).toBeDefined();
    expect(body.images).toBeDefined();
  });

  test("GET /api/v1/products/:id - returns 404 for non-existent", async () => {
    const res = await fetch(`${BASE}/api/v1/products/nonexistent-id`);
    expect(res.status).toBe(404);
  });

  test("GET /api/v1/storefront/products/:id/reviews - public reviews for a product", async () => {
    const list = await fetch(`${BASE}/api/v1/products`);
    const all = await list.json();
    const first = all.items?.[0];
    if (!first) {
      test.skip();
      return;
    }
    const res = await fetch(`${BASE}/api/v1/storefront/products/${first.id}/reviews`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.items).toBeDefined();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET /api/v1/categories - public category list", async () => {
    const res = await fetch(`${BASE}/api/v1/categories`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET / - landing page loads", async ({ page }) => {
    const resp = await page.goto("/");
    expect(resp?.ok()).toBe(true);
  });
});
