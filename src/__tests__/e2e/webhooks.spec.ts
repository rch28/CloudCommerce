import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Webhooks API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test.skip("GET /api/v1/webhooks - returns list", async () => {
    const res = await ctx.get("/api/v1/webhooks");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });
});
