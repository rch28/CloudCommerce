import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Tax API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/tax/zones - returns tax zones", async () => {
    const res = await ctx.get("/api/v1/tax/zones");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.items).toBeDefined();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("POST /api/v1/tax/zones - creates a tax zone", async () => {
    const ts = Date.now();
    const res = await ctx.post("/api/v1/tax/zones", {
      data: {
        name: `US Tax ${ts}`,
        type: "country",
        country: "US",
      },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toContain("US Tax");
  });

  test("POST /api/v1/tax/zones - validates required fields", async () => {
    const res = await ctx.post("/api/v1/tax/zones", { data: {} });
    expect(res.status()).toBe(400);
  });
});
