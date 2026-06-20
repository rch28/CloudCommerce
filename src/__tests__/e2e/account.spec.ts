import { test, expect } from "@playwright/test";
import { loginAsMerchant, unauthContext } from "./helpers/auth";

test.describe("Account API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/account/profile - requires auth", async () => {
    const unauth = await unauthContext();
    const res = await unauth.get("/api/v1/account/profile");
    expect(res.status()).toBe(401);
  });

  test("GET /api/v1/account/profile - returns profile when authenticated", async () => {
    const res = await ctx.get("/api/v1/account/profile");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.email).toBeDefined();
    expect(body.name).toBeDefined();
    expect(body.role).toBeDefined();
  });

  test("PUT /api/v1/account/profile - updates profile when authenticated", async () => {
    const ts = Date.now();
    const res = await ctx.put("/api/v1/account/profile", {
      data: { name: `Updated Name ${ts}` },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toContain("Updated Name");
  });

  test("PUT /api/v1/account/profile - validates input", async () => {
    const res = await ctx.put("/api/v1/account/profile", {
      data: { email: "not-an-email" },
    });
    expect(res.status()).toBe(400);
  });
});
