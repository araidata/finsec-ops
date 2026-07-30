import { expect, test } from "@playwright/test";

test("renders the database-backed dashboard shell", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Financial Operations Command" })
  ).toBeVisible();
  await expect(page.getByText("Budget Utilization")).toBeVisible();
  await expect(page.getByText("Upcoming Renewals", { exact: true })).toBeVisible();
  await expect(page.getByText("Department assignment coverage")).toBeVisible();
  await expect(page.getByRole("button", { name: "New Forecast" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Decision Brief" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Export" })).toHaveCount(0);
});

test("dashboard chart dropdowns change their views", async ({ page }) => {
  await page.goto("/");

  const spendView = page.getByLabel("Spend category view");
  await expect(spendView).toHaveValue("top");
  await spendView.selectOption("all");
  await expect(spendView).toHaveValue("all");

  const forecastView = page.getByLabel("Forecast chart view");
  await expect(forecastView).toHaveValue("fiscal");
  await forecastView.selectOption("budget");
  await expect(forecastView).toHaveValue("budget");
});

test("sidebar points to active workspaces and excludes Purchases", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Settings" })).toHaveAttribute(
    "href",
    "/settings"
  );
  await expect(page.getByRole("link", { name: "Deployment" })).toHaveAttribute(
    "href",
    "/deployment"
  );
  await expect(
    page.getByRole("link", { name: /Purchasing|Purchases/ })
  ).toHaveCount(0);
  await expect(page.getByText("Department of Finance")).toHaveCount(0);
  await expect(page.getByText("FY 2027")).toHaveCount(0);
});
