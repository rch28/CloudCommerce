import { test, expect } from "@playwright/test";

test.describe("Metrics API", () => {
  test("GET /api/v1/metrics - returns queue metrics", async () => {
    const res = await fetch("http://localhost:3000/api/v1/metrics");
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.timestamp).toBeDefined();
    expect(body.memory).toBeDefined();
    expect(body.queues).toBeDefined();
  });
});
