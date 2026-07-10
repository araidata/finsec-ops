import { expect, test } from "@playwright/test";

test.skip(
  !process.env.DATABASE_URL && !process.env.POSTGRES_PRISMA_URL,
  "Database-backed catalog and purchase workflows require a configured development database."
);

test("opens Product Catalog and shows database-backed management tabs", async ({
  page,
}) => {
  await page.goto("/products");
  await expect(
    page.getByRole("heading", { name: "Product Catalog" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Companies" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Products and Services" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Seller Relationships" }).click();
  await expect(page.getByText("Create Seller Relationship")).toBeVisible();
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
