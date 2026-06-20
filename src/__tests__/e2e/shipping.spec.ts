import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

const ts = Date.now();

test.describe("Shipping API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/shipping/zones - returns zones", async () => {
    const res = await ctx.get("/api/v1/shipping/zones");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("POST /api/v1/shipping/zones - validates required fields", async () => {
    const res = await ctx.post("/api/v1/shipping/zones", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("POST /api/v1/shipping/zones - creates a shipping zone", async () => {
    const res = await ctx.post("/api/v1/shipping/zones", {
      data: { name: `Test Zone ${ts}`, countries: ["US"] },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe(`Test Zone ${ts}`);
  });
});
