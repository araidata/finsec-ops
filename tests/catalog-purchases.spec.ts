import { expect, test } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

test.skip(
  !process.env.DATABASE_URL && !process.env.POSTGRES_PRISMA_URL,
  "Database-backed catalog and purchase workflows require a configured development database."
);

test("opens Product Catalog with Vendors and Resellers tabs only", async ({
  page,
}) => {
  await page.goto("/products");
  await expect(
    page.getByRole("heading", { name: "Product Catalog" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Vendors" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Resellers" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vendors" })).toBeVisible();
  await expect(page.getByText("Product Components").first()).toBeVisible();
  await expect(page.getByText("Capabilities").first()).toBeVisible();
  await expect(page.getByText("Product Functions").first()).toBeVisible();
  await expect(page.getByText("Companies")).toHaveCount(0);
  await expect(page.getByText("Purchasing Eligibility")).toHaveCount(0);
  await expect(page.getByText("Create / Edit")).toHaveCount(0);
});

test("opens vendor catalog from the sidebar navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Vendors" }).click();
  await expect(page).toHaveURL(/\/products\?tab=vendors/);
  await expect(page.getByRole("button", { name: "Vendors" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vendors" })).toBeVisible();
  await expect(page.getByText("Microsoft")).toBeVisible();
});

test("opens Product Catalog reseller tab without product mappings", async ({
  page,
}) => {
  await page.goto("/products?tab=resellers");
  await expect(page.getByLabel("Search resellers")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add Reseller" }).first()
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Contracts" })
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Purchases" })
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Renewals" })
  ).toBeVisible();
  await expect(page.getByText("Purchasing Eligibility")).toHaveCount(0);
});

test("opens Purchases and exposes dependent purchase controls", async ({
  page,
}) => {
  await page.goto("/purchases");
  await expect(page.getByRole("heading", { name: "Purchases" })).toBeVisible();
  await expect(page.getByLabel("Vendor").first()).toBeVisible();
  await expect(page.getByLabel("Product or service").first()).toBeVisible();
  await expect(page.getByLabel("Product Component").first()).toBeVisible();
  await expect(page.getByLabel("Included functions").first()).toBeVisible();
  await expect(page.getByLabel("Seller company")).toBeVisible();
  await expect(page.getByLabel("Purchasing agreement")).toBeVisible();
});
