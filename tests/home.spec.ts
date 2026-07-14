import { expect, test } from "@playwright/test";

test("renders the Phase 0 dashboard shell", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Financial Operations Command" })
  ).toBeVisible();
  await expect(page.getByText("Budget Utilization")).toBeVisible();
  await expect(page.getByText("Upcoming Renewals")).toBeVisible();
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
