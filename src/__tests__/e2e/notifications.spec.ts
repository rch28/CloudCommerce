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

  test("PATCH /api/v1/notifications/:id - marks notification as read", async () => {
    const list = await ctx.get("/api/v1/notifications");
    const body = await list.json();
    const notif = body.notifications?.[0];
    if (!notif) {
      test.skip();
      return;
    }
    const res = await ctx.patch(`/api/v1/notifications/${notif.id}`);
    expect(res.ok()).toBe(true);
  });

  test("GET /api/v1/notifications/unread-count - returns unread count", async () => {
    const res = await ctx.get("/api/v1/notifications/unread-count");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(typeof body.count).toBe("number");
  });

  test("GET /api/v1/notifications/preferences - returns notification preferences", async () => {
    const res = await ctx.get("/api/v1/notifications/preferences");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toBeDefined();
  });

  test("PUT /api/v1/notifications/preferences - updates preferences", async () => {
    const res = await ctx.put("/api/v1/notifications/preferences", {
      data: { channel: "email", events: ["order.created"], enabled: true },
    });
    expect(res.ok()).toBe(true);
  });
});
