import { test, expect } from "@playwright/test";

test("Counter page basics", async ({ page }) => {
  await page.goto("counter/");
  await expect(page).toHaveTitle(/Counter in Granary/);
  await expect(
    page.getByRole("heading", { name: /Counter Widget/ }),
  ).toBeVisible();
});

test("Increment button increments", async ({ page }) => {
  const incrementButton = page.getByRole("button", {
    name: "Add one to counter",
  });
  const counterValue = page.getByRole("spinbutton", { name: "Value" });
  await page.goto("counter/");
  await expect(page).toHaveTitle(/Counter in Granary/);
  await expect(incrementButton).toBeVisible();
  await expect(incrementButton).toHaveAccessibleName("Add one to counter");
  await expect(incrementButton).toHaveRole("button");
  await expect(incrementButton).toHaveText("+");
  await expect(counterValue).toHaveValue("1");
  await incrementButton.click();
  await expect(counterValue).toHaveValue("2");
  await incrementButton.click();
  await expect(counterValue).toHaveValue("3");
});

test("Decrement button increments", async ({ page }) => {
  const decrementButton = page.getByRole("button", {
    name: "Subtract one from counter",
  });
  const counterValue = page.getByRole("spinbutton", { name: "Value" });
  await page.goto("counter/");
  await expect(page).toHaveTitle(/Counter in Granary/);
  await expect(decrementButton).toBeVisible();
  await expect(decrementButton).toHaveAccessibleName(
    "Subtract one from counter",
  );
  await expect(decrementButton).toHaveRole("button");
  await expect(decrementButton).toHaveText("-");
  await expect(counterValue).toHaveValue("1");
  await decrementButton.click();
  await expect(counterValue).toHaveValue("0");
  await decrementButton.click();
  await expect(counterValue).toHaveValue("-1");
});
