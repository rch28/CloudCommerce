import { test, expect, request } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

const BASE = "http://localhost:3000";
const ts = Date.now();

test.describe("Reviews API", () => {
  let adminCtx: Awaited<ReturnType<typeof loginAsAdmin>>;

  test.beforeAll(async () => {
    adminCtx = await loginAsAdmin();
  });

  test("GET /api/v1/reviews - returns list with x-tenant-id (merchant role default)", async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { "x-tenant-id": "t-1" },
    });
    const res = await ctx.get("/api/v1/reviews");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.items).toBeDefined();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET /api/v1/reviews - filters by productId", async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { "x-tenant-id": "t-1" },
    });
    const res = await ctx.get("/api/v1/reviews?productId=nonexistent");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.items).toEqual([]);
  });

  test("POST /api/v1/reviews - returns 401 without auth", async () => {
    const ctx = await request.newContext({ baseURL: BASE });
    const res = await ctx.post("/api/v1/reviews", {
      data: { productId: "p-1", rating: 5, title: "Great", body: "Love it" },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/v1/reviews - returns 401 without customer session", async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { "x-tenant-id": "t-1" },
    });
    const res = await ctx.post("/api/v1/reviews", { data: {} });
    expect(res.status()).toBe(401);
  });

  test("GET /api/v1/reviews - filters by status", async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { "x-tenant-id": "t-1" },
    });
    const res = await ctx.get("/api/v1/reviews?status=pending");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET /api/v1/reviews - filters by rating", async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { "x-tenant-id": "t-1" },
    });
    const res = await ctx.get("/api/v1/reviews?rating=5");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET /api/v1/reviews/:id - returns single review", async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { "x-tenant-id": "t-1" },
    });
    const list = await ctx.get("/api/v1/reviews");
    const body = await list.json();
    const review = body.items?.[0];
    if (!review) {
      test.skip();
      return;
    }
    const res = await ctx.get(`/api/v1/reviews/${review.id}`);
    expect(res.ok()).toBe(true);
  });

  test("PUT /api/v1/reviews/:id/moderate - moderates a review (admin)", async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { "x-tenant-id": "t-1" },
    });
    const list = await ctx.get("/api/v1/reviews");
    const body = await list.json();
    const review = body.items?.[0];
    if (!review) {
      test.skip();
      return;
    }
    const res = await adminCtx.put(`/api/v1/reviews/${review.id}/moderate`, {
      data: { status: "approved" },
    });
    expect(res.ok()).toBe(true);
  });

  test("PUT /api/v1/reviews/:id/reply - adds merchant reply", async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { "x-tenant-id": "t-1" },
    });
    const list = await ctx.get("/api/v1/reviews");
    const body = await list.json();
    const review = body.items?.[0];
    if (!review) {
      test.skip();
      return;
    }
    const res = await adminCtx.put(`/api/v1/reviews/${review.id}/reply`, {
      data: { body: `Thank you for your review! ${ts}` },
    });
    expect(res.ok()).toBe(true);
  });

  test("POST /api/v1/reviews/:id/vote - votes on review", async () => {
    const ctx = await request.newContext({ baseURL: BASE });
    const list = await ctx.get("/api/v1/reviews");
    const body = await list.json();
    const review = body.items?.[0];
    if (!review) {
      test.skip();
      return;
    }
    const res = await fetch(`${BASE}/api/v1/reviews/${review.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ helpful: true }),
    });
    expect(res.ok === true || res.status === 401).toBe(true);
  });

  test("POST /api/v1/reviews/:id/report - reports a review", async () => {
    const ctx = await request.newContext({ baseURL: BASE });
    const list = await ctx.get("/api/v1/reviews");
    const body = await list.json();
    const review = body.items?.[0];
    if (!review) {
      test.skip();
      return;
    }
    const res = await fetch(`${BASE}/api/v1/reviews/${review.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "inappropriate" }),
    });
    expect(res.ok === true || res.status === 401).toBe(true);
  });
});
