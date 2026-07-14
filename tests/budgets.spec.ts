import { expect, test } from "@playwright/test";

test("supports fiscal-year budget planning edits", async ({ page }) => {
  await page.goto("/budgets");

  await expect(
    page.getByRole("heading", { name: "FY2027 Cybersecurity Budget" })
  ).toHaveCount(1);
  await expect(
    page.getByText(
      "Fiscal-year financial tracking workspace for cybersecurity budget lines, Finance accounts, and category rollups."
    )
  ).toHaveCount(0);
  await expect(page.getByLabel("Search budget rows")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Export" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add Row" })).toHaveCount(0);

  await page.getByLabel("Fiscal Year").selectOption("FY2026");
  await expect(
    page.getByRole("heading", { name: "FY2026 Cybersecurity Budget" })
  ).toHaveCount(1);

  await page.getByLabel("Fiscal Year").selectOption("FY2027");
  await page.getByRole("button", { name: "Software" }).click();
  await expect(page.getByRole("heading", { name: "Software" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add Row" })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Software, SaaS, Support, and Services",
    })
  ).toHaveCount(0);

  const softwareTable = page.getByRole("table").first();
  await expect(
    softwareTable.getByRole("columnheader", { name: "Account" })
  ).toHaveCount(0);
  await expect(
    softwareTable.getByRole("columnheader", { name: "Owner" })
  ).toHaveCount(0);
  await expect(
    softwareTable.getByRole("columnheader", { name: "Actual Spend" })
  ).toHaveCount(0);
  await expect(
    softwareTable.getByRole("columnheader", { name: "Remaining" })
  ).toHaveCount(0);

  await page
    .getByRole("button", { name: "Edit OneTrust Platform Enterprise" })
    .click();
  await expect(
    page.getByLabel("Replacement status for OneTrust Platform Enterprise")
  ).toBeVisible();
  await expect(
    page.getByLabel("Replacing for OneTrust Platform Enterprise")
  ).toBeVisible();

  const resellerSelect = page.getByLabel(
    "Reseller for OneTrust Platform Enterprise"
  );
  await expect(resellerSelect).toBeVisible();
  await expect(resellerSelect).toContainText("Direct");
  await expect(resellerSelect).toContainText("SHI");
  await resellerSelect.selectOption("SHI");

  const worksheetTotal = page.getByTestId("worksheet-total");
  const originalTotal = await worksheetTotal.textContent();
  await page.getByTestId("software-budget-fy27-onetrust").fill("300000");
  await expect(worksheetTotal).not.toHaveText(originalTotal ?? "");
  await expect(page.getByText("Unsaved local changes")).toBeVisible();

  await page
    .getByRole("button", { name: "Done editing OneTrust Platform Enterprise" })
    .click();
  await expect(
    page.getByLabel("Replacement status for OneTrust Platform Enterprise")
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Edit OneTrust Platform Enterprise" })
  ).toBeVisible();
});

test("shows training quantity in read and edit modes", async ({ page }) => {
  await page.goto("/budgets");

  await page.getByRole("button", { name: "Training" }).click();
  const trainingTable = page.getByRole("table").first();

  await expect(
    trainingTable.getByRole("columnheader", { name: "Quantity" })
  ).toBeVisible();
  await expect(
    trainingTable.getByRole("cell", { name: "12", exact: true })
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Edit SANS Training Vouchers" })
    .click();
  const worksheetTotal = page.getByTestId("worksheet-total");
  const originalTotal = await worksheetTotal.textContent();

  const quantityInput = page.getByLabel("Count amount").first();
  await quantityInput.fill("15");

  await expect(worksheetTotal).not.toHaveText(originalTotal ?? "");
  await expect(quantityInput).toHaveValue("15");
});

test("keeps removed workflow controls and maintenance clutter out", async ({
  page,
}) => {
  await page.goto("/budgets");

  await expect(page.getByLabel("Scenario")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Maintenance Renewals" })
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Roll Forward" })).toHaveCount(
    0
  );

  await page.getByRole("button", { name: "Conferences" }).click();
  const conferenceTable = page.getByRole("table").first();
  await expect(
    conferenceTable.getByRole("columnheader", { name: "Purpose" })
  ).toHaveCount(0);
  await expect(
    conferenceTable.getByRole("columnheader", { name: "Owner" })
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Software" }).click();
  await page.getByRole("button", { name: "Add Row" }).last().click();
  await page
    .getByRole("button", {
      name: "Send New Software and SaaS line to Maintenance",
    })
    .click();

  await expect(
    page.getByRole("heading", { name: "Send to Maintenance" })
  ).toBeVisible();
  await expect(page.getByText("Financial account")).toHaveCount(0);
  await expect(page.getByText("Owner")).toHaveCount(0);
  await page.getByRole("button", { name: "Create Link" }).click();
  await expect(
    page.getByRole("button", {
      name: "View Maintenance for New Software and SaaS line",
    })
  ).toBeVisible();
});
