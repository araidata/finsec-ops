import { expect, test } from "@playwright/test";

test("Budget keeps the worksheet-first planning workflow", async ({ page }) => {
  await page.goto("/budgets");
  await expect(page.getByRole("heading", { name: /Budget$/ })).toBeVisible();
  await page.getByRole("button", { name: "Software", exact: true }).click();
  await expect(page.getByRole("table").first()).toBeVisible();
});

test("Contracts exposes the bounded register and selected workbench", async ({
  page,
}) => {
  await page.goto("/contracts");
  await expect(page.getByRole("heading", { name: "Contracts" })).toBeVisible();
  await expect(page.getByRole("table").first()).toBeVisible();
});

test("Maintenance Renewals preserves its register and selected workspace", async ({
  page,
}) => {
  await page.goto("/renewals");
  await expect(
    page.getByRole("heading", { name: "Maintenance Renewals" })
  ).toBeVisible();
  await expect(page.getByRole("table").first()).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Overview", exact: true })
  ).toBeVisible();
});

test("Catalog preserves Vendor cards and the Reseller register", async ({
  page,
}) => {
  await page.goto("/products?tab=vendors");
  await expect(page.getByRole("heading", { name: "Vendors" })).toBeVisible();
  await page.getByRole("button", { name: "Resellers" }).click();
  await expect(page.getByLabel("Search resellers")).toBeVisible();
});
