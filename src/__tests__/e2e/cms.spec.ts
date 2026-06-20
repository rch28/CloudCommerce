import { test, expect } from "@playwright/test";
import { loginAsMerchant, unauthContext } from "./helpers/auth";

test.describe("CMS API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
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
    const ts = Date.now();
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
});
