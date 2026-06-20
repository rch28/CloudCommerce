import { test, expect } from "@playwright/test";

test.describe("Health API", () => {
  test("GET /api/v1/health - returns healthy", async () => {
    const res = await fetch("http://localhost:3000/api/v1/health");
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(body.timestamp).toBeDefined();
    expect(body.checks).toBeDefined();
  });
});
