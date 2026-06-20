import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Promotions API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/promotions - returns list", async () => {
    const res = await ctx.get("/api/v1/promotions");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("POST /api/v1/promotions - creates a promotion", async () => {
    const res = await ctx.post("/api/v1/promotions", {
      data: {
        name: "Summer Sale", discountType: "percentage", discountValue: 10,
        startsAt: new Date().toISOString(),
      },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe("Summer Sale");
  });

  test("POST /api/v1/promotions - validates required fields", async () => {
    const res = await ctx.post("/api/v1/promotions", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("PATCH /api/v1/promotions/:id - updates promotion", async () => {
    const create = await ctx.post("/api/v1/promotions", {
      data: {
        name: "Old Sale", discountType: "fixed", discountValue: 5,
        startsAt: new Date().toISOString(),
      },
    });
    const created = await create.json();
    const res = await ctx.patch(`/api/v1/promotions/${created.id}`, { data: { name: "New Sale" } });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toBe("New Sale");
  });
});
