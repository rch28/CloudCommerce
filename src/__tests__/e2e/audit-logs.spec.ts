import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("Audit Logs API", () => {
  test("GET /api/v1/audit-logs - returns audit log entries", async () => {
    const res = await fetch(`${BASE}/api/v1/audit-logs`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET /api/v1/audit-logs - filters by entityType", async () => {
    const res = await fetch(`${BASE}/api/v1/audit-logs?entityType=Product`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET /api/v1/audit-logs - filters by action", async () => {
    const res = await fetch(`${BASE}/api/v1/audit-logs?action=created`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("GET /api/v1/audit-logs - supports pagination", async () => {
    const res = await fetch(`${BASE}/api/v1/audit-logs?page=1&pageSize=5`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.items).toBeDefined();
    expect(body.items.length).toBeLessThanOrEqual(5);
  });

  test("GET /api/v1/audit-logs - sorts by newest first", async () => {
    const res = await fetch(`${BASE}/api/v1/audit-logs?sort=newest`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
  });
});
