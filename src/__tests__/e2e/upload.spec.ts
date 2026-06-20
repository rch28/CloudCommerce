import { test, expect } from "@playwright/test";

test.describe("Upload API", () => {
  test("POST /api/v1/upload - validates file", async () => {
    const res = await fetch("http://localhost:3000/api/v1/upload", { method: "POST" });
    expect(res.status).toBe(400);
  });
});
