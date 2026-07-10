import { expect, test } from "@playwright/test";

test.skip(
  !process.env.DATABASE_URL && !process.env.POSTGRES_PRISMA_URL,
  "Database-backed catalog and purchase workflows require a configured development database."
);

test("opens Product Catalog and shows the relationship-first workspace", async ({
  page,
}) => {
  await page.goto("/products");
  await expect(
    page.getByRole("heading", { name: "Product Catalog" })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Companies" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Vendor Portfolio" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Create / Edit" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "New reseller" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Purchasing Eligibility" }).click();
  await expect(page.getByText("Budget reseller choices")).toBeVisible();
});

test("opens vendor catalog from the sidebar navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Vendors" }).click();
  await expect(page).toHaveURL(/\/products\?tab=vendors/);
  await expect(page.getByRole("button", { name: "Vendors" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Vendor Portfolio" })
  ).toBeVisible();
  await expect(page.getByText("Microsoft")).toBeVisible();
});

test("opens Purchases and exposes dependent purchase controls", async ({
  page,
}) => {
  await page.goto("/purchases");
  await expect(page.getByRole("heading", { name: "Purchases" })).toBeVisible();
  await expect(page.getByLabel("Vendor").first()).toBeVisible();
  await expect(page.getByLabel("Product or service").first()).toBeVisible();
  await expect(page.getByLabel("Module").first()).toBeVisible();
  await expect(page.getByLabel("Included features").first()).toBeVisible();
  await expect(page.getByLabel("Seller company")).toBeVisible();
  await expect(page.getByLabel("Purchasing agreement")).toBeVisible();
});
