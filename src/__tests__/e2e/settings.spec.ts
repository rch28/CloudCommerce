import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

const ts = Date.now();

test.describe("Settings API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/settings - returns settings", async () => {
    const res = await ctx.get("/api/v1/settings");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toBeDefined();
  });

  test("PUT /api/v1/settings - updates store info", async () => {
    const res = await ctx.put("/api/v1/settings", {
      data: { storeInfo: { name: `Updated Store ${ts}` }, domains: { subdomain: `updated-${ts}` } },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    // storeInfo fields are flattened to top-level store record fields
    expect(body.name).toBe(`Updated Store ${ts}`);
  });
});
