import { expect, test } from "@playwright/test";

test("storefront loads its core product surface", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Useful things for delightfully busy people.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(6);
  await expect(page.getByRole("button", { name: /Cart/ })).toBeVisible();
});

test("a shopper can reach the mock checkout", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add to cart" }).first().click();
  await page.getByRole("button", { name: /Cart/ }).click();
  await page.getByRole("button", { name: "Continue to checkout" }).click();

  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await expect(page.getByText("This demo never sends or stores your details.")).toBeVisible();
});

