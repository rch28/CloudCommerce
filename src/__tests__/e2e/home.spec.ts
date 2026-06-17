import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("should load and display the brand", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBe(true);
    await expect(page.locator("text=CloudCommerce")).toBeVisible();
  });

  test("should have secure headers", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers();
    expect(headers?.["x-content-type-options"]).toBe("nosniff");
    expect(headers?.["x-frame-options"]).toBe("DENY");
  });
});
