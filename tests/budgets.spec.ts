import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

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
  await page.getByRole("button", { name: "Software", exact: true }).click();
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
  await resellerSelect.evaluate((select) => {
    const option = Array.from(
      (select as HTMLSelectElement).options
    ).find((candidate) => candidate.textContent?.includes("SHI"));
    if (!option) throw new Error("SHI reseller option was not rendered.");
    (select as HTMLSelectElement).value = option.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });

  const worksheetTotal = page.getByTestId("worksheet-total");
  const originalTotal = await worksheetTotal.textContent();
  const budgetInput = page.getByLabel(
    "Budget amount for OneTrust Platform Enterprise"
  );
  const currentBudget = await budgetInput.inputValue();
  await budgetInput.fill(currentBudget === "300000" ? "310000" : "300000");
  await expect(worksheetTotal).not.toHaveText(originalTotal ?? "");
  await expect(page.getByText("Unsaved local changes")).toBeVisible();

  await page
    .getByRole("button", { name: "Done editing OneTrust Platform Enterprise" })
    .click();
  await page.getByRole("button", { name: "Software", exact: true }).click();
  await expect(
    page.getByLabel("Replacement status for OneTrust Platform Enterprise")
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Edit OneTrust Platform Enterprise" })
  ).toBeVisible();
});

test("persists deleted software rows after reload", async ({ page }) => {
  await page.goto("/budgets");
  await page.getByRole("button", { name: "Software", exact: true }).click();
  const deleteNewSoftwareRow = page.getByRole("button", {
    name: "Delete New Software line",
  });
  const startingRowCount = await deleteNewSoftwareRow.count();
  await page.getByRole("button", { name: "Add Row" }).click();
  await expect(page.getByRole("heading", { name: "Software" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Category Summary" })
  ).toHaveCount(0);

  await expect(deleteNewSoftwareRow).toHaveCount(startingRowCount + 1);
  await expect(deleteNewSoftwareRow.last()).toBeVisible();
  await deleteNewSoftwareRow.last().click();

  await expect(
    page.getByRole("heading", { name: "Delete Budget Row" })
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Confirm delete New Software line" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Delete Budget Row" })
  ).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Software" })).toBeVisible();
  await expect(deleteNewSoftwareRow).toHaveCount(startingRowCount);
  await page.reload();
  await page.getByRole("button", { name: "Software", exact: true }).click();
  await expect(deleteNewSoftwareRow).toHaveCount(startingRowCount);
});

test("pushes a contract into the software budget worksheet", async ({
  page,
}) => {
  await page.goto("/contracts");
  await expect(page.getByRole("heading", { name: "Rapid7" })).toBeVisible();

  await page.getByRole("button", { name: "Push to Budget" }).click();
  await expect(
    page.getByRole("heading", { name: "Push Contract to Budget" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Push to Budget" }).click();
  await expect(page.getByText("Contract pushed to Budget.")).toBeVisible();

  await page.goto("/budgets");
  await page.getByRole("button", { name: "Software", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Rapid7 InsightIDR", exact: true })
  ).toBeVisible();
});

test("shows training quantity in read and edit modes", async ({ page }) => {
  await page.goto("/budgets");

  await page.getByRole("button", { name: "Training", exact: true }).click();
  const trainingTable = page.getByRole("table").first();

  await expect(
    trainingTable.getByRole("columnheader", { name: "Quantity" })
  ).toBeVisible();
  await expect(
    trainingTable.getByRole("cell", { name: "12", exact: true })
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Edit SANS Institute Technical Training" })
    .click();
  const worksheetTotal = page.getByTestId("worksheet-total");
  const originalTotal = await worksheetTotal.textContent();

  const quantityInput = page.getByLabel("Count amount").first();
  await quantityInput.fill("15");

  await expect(worksheetTotal).not.toHaveText(originalTotal ?? "");
  await expect(quantityInput).toHaveValue("15");
});

test("shows organizational dues rows counted by summary", async ({ page }) => {
  await page.goto("/budgets");

  await expect(
    page.getByRole("row", { name: /Organizational Dues/ })
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Organizational Dues", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Organizational Dues" })
  ).toBeVisible();
  await expect(page.getByText("No budget lines match this view.")).toHaveCount(
    0
  );
  await expect(page.getByText(/Total \([1-9]\d*\)/)).toBeVisible();
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

  await page.getByRole("button", { name: "Conferences", exact: true }).click();
  const conferenceTable = page.getByRole("table").first();
  await expect(
    conferenceTable.getByRole("columnheader", { name: "Purpose" })
  ).toHaveCount(0);
  await expect(
    conferenceTable.getByRole("columnheader", { name: "Owner" })
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Software", exact: true }).click();
  await page.getByRole("button", { name: "Add Row" }).last().click();
  await expect(page.getByRole("heading", { name: "Software" })).toBeVisible();
  await page
    .getByRole("button", {
      name: "Send New Software line to Maintenance",
    })
    .last()
    .click();

  await expect(
    page.getByRole("heading", { name: "Send to Maintenance" })
  ).toBeVisible();
  await expect(page.getByText("Financial account")).toHaveCount(0);
  await expect(page.getByText("Owner")).toHaveCount(0);
  await page.getByRole("button", { name: "Create Link" }).click();
  await expect(
    page.getByRole("button", {
      name: "View Maintenance for New Software line",
    })
    .last()
  ).toBeVisible();
});
