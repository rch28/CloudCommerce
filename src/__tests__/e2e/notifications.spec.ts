import { test, expect } from "@playwright/test";
import { loginAsMerchant } from "./helpers/auth";

test.describe("Notifications API", () => {
  let ctx: Awaited<ReturnType<typeof loginAsMerchant>>;

  test.beforeAll(async () => {
    ctx = await loginAsMerchant();
  });

  test("GET /api/v1/notifications - returns list", async () => {
    const res = await ctx.get("/api/v1/notifications");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.notifications)).toBe(true);
    expect(typeof body.total).toBe("number");
  });

  test("GET /api/v1/notifications - requires auth", async () => {
    const res = await fetch("http://localhost:3000/api/v1/notifications");
    expect(res.status).toBe(401);
  });

  test("POST /api/v1/notifications - mark all as read", async () => {
    const res = await ctx.post("/api/v1/notifications", {
      data: { action: "mark_all_read" },
    });
    expect(res.ok()).toBe(true);
  });

  test("POST /api/v1/notifications - rejects unknown action", async () => {
    const res = await ctx.post("/api/v1/notifications", {
      data: { action: "invalid" },
    });
    expect(res.status()).toBe(400);
  });
});
