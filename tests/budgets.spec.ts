import { expect, test } from "@playwright/test";

test("supports fiscal-year budget planning edits", async ({ page }) => {
  await page.goto("/budgets");

  await expect(
    page.getByRole("heading", { name: "FY2027 Cybersecurity Budget" })
  ).toBeVisible();

  await page.getByLabel("Fiscal Year").selectOption("FY2026");
  await expect(
    page.getByRole("heading", { name: "FY2026 Cybersecurity Budget" })
  ).toBeVisible();

  await page.getByLabel("Fiscal Year").selectOption("FY2027");
  await page.getByRole("button", { name: "Software and SaaS" }).click();

  const worksheetTotal = page.getByTestId("worksheet-total");
  const originalTotal = await worksheetTotal.textContent();
  await page.getByTestId("software-budget-fy27-onetrust").fill("300000");
  await expect(worksheetTotal).not.toHaveText(originalTotal ?? "");
  await expect(page.getByText("Unsaved local changes")).toBeVisible();

  await page.getByRole("button", { name: "Add Row" }).click();
  await expect(
    page.getByRole("heading", { name: "New Software and SaaS line" })
  ).toBeVisible();
});

test("recalculates maintenance renewal quote changes", async ({ page }) => {
  await page.goto("/budgets");

  await page.getByRole("button", { name: "Maintenance Renewals" }).click();
  const increase = page.getByTestId("renewal-increase-renewal-onetrust");
  const savings = page.getByTestId("renewal-savings-renewal-onetrust");
  const originalIncrease = await increase.textContent();
  const originalSavings = await savings.textContent();

  await page.getByTestId("renewal-quote-renewal-onetrust").fill("220000");

  await expect(increase).not.toHaveText(originalIncrease ?? "");
  await expect(savings).not.toHaveText(originalSavings ?? "");
});
