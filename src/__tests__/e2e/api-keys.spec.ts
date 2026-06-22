import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

const ts = Date.now();

test.describe("API Keys API", () => {
  let adminCtx: Awaited<ReturnType<typeof loginAsAdmin>>;

  test.beforeAll(async () => {
    adminCtx = await loginAsAdmin();
  });

  test("GET /api/v1/settings/api-keys - returns API keys list", async () => {
    const res = await adminCtx.get("/api/v1/settings/api-keys");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("POST /api/v1/settings/api-keys - creates an API key", async () => {
    const res = await adminCtx.post("/api/v1/settings/api-keys", {
      data: { name: `Test Key ${ts}`, scopes: ["products:read", "orders:read"] },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.name).toContain("Test Key");
    expect(body.key).toBeDefined();
    expect(body.scopes).toContain("products:read");
  });

  test("POST /api/v1/settings/api-keys - validates required fields", async () => {
    const res = await adminCtx.post("/api/v1/settings/api-keys", { data: {} });
    expect(res.status() === 400 || res.status() === 403).toBe(true);
  });

  test("DELETE /api/v1/settings/api-keys?keyId= - revokes an API key", async () => {
    const create = await adminCtx.post("/api/v1/settings/api-keys", {
      data: { name: `Revoke Key ${ts}`, scopes: ["products:read"] },
    });
    expect(create.ok()).toBe(true);
    const created = await create.json();
    const res = await adminCtx.delete(`/api/v1/settings/api-keys?keyId=${created.id}`);
    expect(res.ok()).toBe(true);
  });
});
