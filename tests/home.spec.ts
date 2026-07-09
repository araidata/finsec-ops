import { expect, test } from "@playwright/test";

test("renders the Phase 0 dashboard shell", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Financial Operations Command" })
  ).toBeVisible();
  await expect(page.getByText("Budget Utilization")).toBeVisible();
  await expect(page.getByText("Upcoming Renewals")).toBeVisible();
});
