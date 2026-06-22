import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

const ts = Date.now();

test.describe("Staff Management API", () => {
  let adminCtx: Awaited<ReturnType<typeof loginAsAdmin>>;

  test.beforeAll(async () => {
    adminCtx = await loginAsAdmin();
  });

  test("GET /api/v1/settings/staff - returns staff list", async () => {
    const res = await adminCtx.get("/api/v1/settings/staff");
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("POST /api/v1/settings/staff - invites a staff member", async () => {
    const email = `staff-invite-${ts}@test.com`;
    const res = await adminCtx.post("/api/v1/settings/staff", {
      data: { email, role: "staff", name: "Test Staff" },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.email).toBe(email);
    expect(body.role).toBe("staff");
  });

  test("POST /api/v1/settings/staff - validates required fields", async () => {
    const res = await adminCtx.post("/api/v1/settings/staff", { data: {} });
    expect(res.status() === 400 || res.status() === 403).toBe(true);
  });

  test("POST /api/v1/settings/staff - validates email format", async () => {
    const res = await adminCtx.post("/api/v1/settings/staff", {
      data: { email: "not-an-email", role: "staff" },
    });
    expect(res.status() === 400 || res.status() === 403).toBe(true);
  });

  test("POST /api/v1/settings/staff - rejects duplicate invitation", async () => {
    const email = `staff-dupe-${ts}@test.com`;
    const first = await adminCtx.post("/api/v1/settings/staff", {
      data: { email, role: "staff", name: "First" },
    });
    expect(first.ok()).toBe(true);

    const second = await adminCtx.post("/api/v1/settings/staff", {
      data: { email, role: "staff", name: "Second" },
    });
    expect(second.status() === 409 || second.status() === 400).toBe(true);
  });

  test("DELETE /api/v1/settings/staff?staffId= - removes staff member", async () => {
    const email = `staff-delete-${ts}@test.com`;
    const create = await adminCtx.post("/api/v1/settings/staff", {
      data: { email, role: "staff", name: "Delete Me" },
    });
    expect(create.ok()).toBe(true);
    const created = await create.json();
    const res = await adminCtx.delete(`/api/v1/settings/staff?staffId=${created.id}`);
    expect(res.ok()).toBe(true);
  });
});
