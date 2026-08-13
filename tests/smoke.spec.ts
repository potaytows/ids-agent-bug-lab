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
  await expect(
    page.getByText(
      "This local QA demo stores submitted orders in the FaultyMart MySQL test database. Use test data only.",
    ),
  ).toBeVisible();
});

test("a shopper can reset catalog filters", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("product-search").fill("mug");

  await expect(page.getByTestId("product-result-count")).toHaveText("1 products");

  await page.getByTestId("reset-catalog-filters").click();

  await expect(page.getByTestId("product-search")).toHaveValue("");
  await expect(page.getByTestId("sort-select")).toHaveValue("featured");
  await expect(page.getByTestId("category-filter-all")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByTestId("product-result-count")).toHaveText("6 products");
});

test("a shopper can clear all saved items", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("save-product-1").click();
  await page.getByTestId("saved-items-toggle").click();

  await expect(page.getByTestId("product-result-count")).toHaveText("1 products");

  await page.getByTestId("clear-saved-items").click();

  await expect(page.getByTestId("saved-items-toggle")).toContainText("0");
  await expect(page.getByTestId("saved-items-toggle")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(page.getByTestId("product-result-count")).toHaveText("6 products");
  await expect(page.getByTestId("clear-saved-items")).toHaveCount(0);
});
