import { test, expect, request } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("Checkout API", () => {
  test("POST /api/v1/checkout - validates cart (returns 400 with empty body)", async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { "x-tenant-id": "t-1" },
    });
    const res = await ctx.post("/api/v1/checkout", {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/v1/checkout - returns 400 without tenant-id header", async () => {
    const ctx = await request.newContext({ baseURL: BASE });
    const res = await ctx.post("/api/v1/checkout", {
      data: { addressId: "addr-1" },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/v1/checkout - returns 400 with missing address", async () => {
    const ctx = await request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { "x-tenant-id": "t-1" },
    });
    const res = await ctx.post("/api/v1/checkout", {
      data: { tenantId: "t-1" },
    });
    expect(res.status()).toBe(400);
  });
});
