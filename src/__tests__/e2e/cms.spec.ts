import { test, expect } from "@playwright/test";
import { loginAsMerchant, loginAsAdmin } from "./helpers/auth";

const ts = Date.now();

test.describe("CMS API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;
  let adminCtx: Awaited<ReturnType<typeof loginAsAdmin>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
    adminCtx = await loginAsAdmin();
  });

  test("GET /api/v1/cms/pages - returns pages", async () => {
    const res = await ctx.get("/api/v1/cms/pages");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.items).toBeDefined();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET /api/v1/cms/pages - supports pagination", async () => {
    const res = await ctx.get("/api/v1/cms/pages?page=1&pageSize=10");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.items).toBeDefined();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("POST /api/v1/cms/pages - creates a page", async () => {
    const res = await ctx.post("/api/v1/cms/pages", {
      data: {
        title: `Test Page ${ts}`,
        slug: `test-page-${ts}`,
        content: "<p>Hello</p>",
        status: "draft",
      },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.title).toContain("Test Page");
    expect(body.slug).toContain("test-page");
  });

  test("POST /api/v1/cms/pages - validates required fields", async () => {
    const res = await ctx.post("/api/v1/cms/pages", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("GET /api/v1/cms/pages/:id - returns page by id", async () => {
    const create = await ctx.post("/api/v1/cms/pages", {
      data: { title: `Get Page ${ts}`, slug: `get-page-${ts}`, content: "<p>Test</p>", status: "draft" },
    });
    expect(create.ok()).toBe(true);
    const created = await create.json();
    const res = await ctx.get(`/api/v1/cms/pages/${created.id}`);
    expect(res.ok()).toBe(true);
    expect((await res.json()).title).toContain("Get Page");
  });

  test("PATCH /api/v1/cms/pages/:id - updates a page", async () => {
    const create = await ctx.post("/api/v1/cms/pages", {
      data: { title: `Before ${ts}`, slug: `before-${ts}`, content: "<p>Old</p>", status: "draft" },
    });
    expect(create.ok()).toBe(true);
    const created = await create.json();
    const res = await ctx.patch(`/api/v1/cms/pages/${created.id}`, {
      data: { title: `After ${ts}`, status: "published" },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.title).toContain("After");
  });

  test("DELETE /api/v1/cms/pages/:id - deletes a page (admin)", async () => {
    const create = await ctx.post("/api/v1/cms/pages", {
      data: { title: `Delete ${ts}`, slug: `delete-${ts}`, content: "<p>Bye</p>", status: "draft" },
    });
    expect(create.ok()).toBe(true);
    const created = await create.json();
    const res = await adminCtx.delete(`/api/v1/cms/pages/${created.id}`);
    expect(res.ok()).toBe(true);
  });

  test("POST /api/v1/cms/pages/:id/publish - publishes a page", async () => {
    const create = await ctx.post("/api/v1/cms/pages", {
      data: { title: `Publish ${ts}`, slug: `publish-${ts}`, content: "<p>Live</p>", status: "draft" },
    });
    expect(create.ok()).toBe(true);
    const created = await create.json();
    const res = await ctx.post(`/api/v1/cms/pages/${created.id}/publish`, {
      data: { publish: true },
    });
    expect(res.ok()).toBe(true);
  });

  test("POST /api/v1/cms/pages/:id/sections - creates a section", async () => {
    const create = await ctx.post("/api/v1/cms/pages", {
      data: { title: `Sec Create ${ts}`, slug: `sec-create-${ts}`, content: "<p>Sec</p>", status: "draft" },
    });
    expect(create.ok()).toBe(true);
    const created = await create.json();
    const res = await ctx.post(`/api/v1/cms/pages/${created.id}/sections`, {
      data: { type: "hero", sortOrder: 0, content: { heading: "Hello" } },
    });
    expect(res.ok()).toBe(true);
  });

  test("GET /api/v1/cms/banners - returns banners", async () => {
    const res = await ctx.get("/api/v1/cms/banners");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("POST /api/v1/cms/banners - creates a banner", async () => {
    const res = await ctx.post("/api/v1/cms/banners", {
      data: { title: `Test Banner ${ts}`, position: "top", isActive: true },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.title).toContain("Test Banner");
  });

  test("POST /api/v1/cms/banners - validates required fields", async () => {
    const res = await ctx.post("/api/v1/cms/banners", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("PATCH /api/v1/cms/banners/:id - updates a banner", async () => {
    const create = await ctx.post("/api/v1/cms/banners", {
      data: { title: `Banner Before ${ts}`, position: "top", isActive: true },
    });
    expect(create.ok()).toBe(true);
    const created = await create.json();
    const res = await ctx.patch(`/api/v1/cms/banners/${created.id}`, {
      data: { isActive: false },
    });
    expect(res.ok()).toBe(true);
  });

  test("DELETE /api/v1/cms/banners/:id - deletes a banner (admin)", async () => {
    const create = await ctx.post("/api/v1/cms/banners", {
      data: { title: `Banner Delete ${ts}`, position: "top", isActive: true },
    });
    expect(create.ok()).toBe(true);
    const created = await create.json();
    const res = await adminCtx.delete(`/api/v1/cms/banners/${created.id}`);
    expect(res.ok()).toBe(true);
  });
});
