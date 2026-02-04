import { test, expect } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("");
  await expect(page).toHaveTitle(/Granary/);
});

test("can go from index to the counter page", async ({ page }) => {
  await page.goto("");
  await page.getByRole("link", { name: "Counter example" }).click();
  await expect(page).toHaveTitle(/Counter in Granary/);
  await expect(
    page.getByRole("heading", { name: /Counter Widget/ }),
  ).toBeVisible();
});
