import { test, expect } from "@playwright/test";
import { loginAsMerchant, unauthContext } from "./helpers/auth";

test.describe("Categories API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/categories - returns list", async () => {
    const res = await ctx.get("/api/v1/categories");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET /api/v1/categories - returns 401 without auth", async () => {
    const unauth = await unauthContext();
    const res = await unauth.get("/api/v1/categories");
    expect(res.status()).toBe(401);
  });

  test("POST /api/v1/categories - creates a category", async () => {
    const res = await ctx.post("/api/v1/categories", {
      data: { name: "Test Cat", slug: "test-cat" },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe("Test Cat");
    expect(body.slug).toBe("test-cat");
  });

  test("GET /api/v1/categories/:id - returns category by id", async () => {
    const create = await ctx.post("/api/v1/categories", {
      data: { name: "Get Test", slug: "get-test" },
    });
    const created = await create.json();
    const res = await ctx.get(`/api/v1/categories/${created.id}`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe("Get Test");
  });

  test("PATCH /api/v1/categories/:id - updates category", async () => {
    const create = await ctx.post("/api/v1/categories", {
      data: { name: "Before", slug: "before" },
    });
    const created = await create.json();
    const res = await ctx.patch(`/api/v1/categories/${created.id}`, {
      data: { name: "After" },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe("After");
  });

  test("PATCH /api/v1/categories/:id - archive/restore", async () => {
    const create = await ctx.post("/api/v1/categories", {
      data: { name: "Archive Test", slug: "archive-test" },
    });
    const created = await create.json();
    const archive = await ctx.patch(`/api/v1/categories/${created.id}`, {
      data: { action: "archive" },
    });
    expect(archive.ok()).toBe(true);
    const restore = await ctx.patch(`/api/v1/categories/${created.id}`, {
      data: { action: "restore" },
    });
    expect(restore.ok()).toBe(true);
  });

  test("DELETE /api/v1/categories/:id - deletes category", async () => {
    const create = await ctx.post("/api/v1/categories", {
      data: { name: "Delete Test", slug: "delete-test" },
    });
    const created = await create.json();
    const res = await ctx.delete(`/api/v1/categories/${created.id}`);
    expect(res.ok()).toBe(true);
    const get = await ctx.get(`/api/v1/categories/${created.id}`);
    expect(get.status()).toBe(404);
  });

  test("POST /api/v1/categories - validates required fields", async () => {
    const res = await ctx.post("/api/v1/categories", { data: {} });
    expect(res.status()).toBe(400);
  });
});
