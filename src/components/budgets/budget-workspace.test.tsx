import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BudgetWorkspace } from "@/components/budgets/budget-workspace";
import { budgetWorkspaceData } from "@/lib/budgets/budget-data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/budgets",
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/budgets/actions", () => ({
  createBudgetRowAction: vi.fn(),
  deleteBudgetRowAction: vi.fn(),
  duplicateBudgetRowAction: vi.fn(),
  saveBudgetRowAction: vi.fn(),
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

function activeWorksheetTable(): HTMLElement {
  return screen.getAllByRole("table")[0];
}

function renderBudgetWorkspace() {
  return render(
    <BudgetWorkspace initialData={budgetWorkspaceData} persistChanges={false} />
  );
}

function expectNoRemovedWorksheetHeaders(table: HTMLElement): void {
  ["Account", "Owner", "Actual Spend", "Remaining"].forEach((header) => {
    expect(
      within(table).queryByRole("columnheader", { name: header })
    ).not.toBeInTheDocument();
  });
}

describe("BudgetWorkspace", () => {
  it("shows one page title and a Software worksheet without removed columns", () => {
    renderBudgetWorkspace();

    expect(
      screen.getAllByRole("heading", {
        name: "FY2027 Cybersecurity Budget",
      })
    ).toHaveLength(1);
    expect(
      screen.queryByText(
        "Fiscal-year financial tracking workspace for cybersecurity budget lines, Finance accounts, and category rollups."
      )
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Search budget rows")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Fiscal Year")).toBeVisible();
    expect(screen.getByRole("button", { name: "Export" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Add Row" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Software" }));

    expect(screen.getByRole("heading", { name: "Software" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Add Row" })).toBeVisible();
    expect(
      screen.queryByRole("heading", {
        name: "Software, SaaS, Support, and Services",
      })
    ).not.toBeInTheDocument();

    const table = activeWorksheetTable();
    expectNoRemovedWorksheetHeaders(table);
    expect(
      within(table).getByRole("columnheader", { name: "Replacement?" })
    ).toBeVisible();
    expect(
      within(table).getByRole("columnheader", { name: "Replacing" })
    ).toBeVisible();
  });

  it("updates worksheet totals when a software budget amount changes", () => {
    renderBudgetWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "Software" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit OneTrust Platform Enterprise",
      })
    );

    const totalBefore = screen.getByTestId("worksheet-total").textContent;
    fireEvent.change(screen.getByTestId("software-budget-fy27-onetrust"), {
      target: { value: "300000" },
    });

    expect(screen.getByTestId("worksheet-total").textContent).not.toBe(
      totalBefore
    );
    expect(screen.getByText("Unsaved local changes")).toBeVisible();
  });

  it("exposes software replacement status and can exit edit mode", () => {
    renderBudgetWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "Software" }));

    const table = activeWorksheetTable();
    expect(within(table).getByText("Yes")).toBeVisible();
    expect(within(table).getByText("Legacy vendor review tracker")).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit OneTrust Platform Enterprise",
      })
    );

    expect(
      screen.getByLabelText("Replacement status for OneTrust Platform Enterprise")
    ).toBeVisible();
    expect(
      screen.getByLabelText("Replacing for OneTrust Platform Enterprise")
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Done editing OneTrust Platform Enterprise",
      })
    );

    expect(
      screen.queryByLabelText(
        "Replacement status for OneTrust Platform Enterprise"
      )
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Edit OneTrust Platform Enterprise",
      })
    ).toBeVisible();
  });

  it("switches fiscal years and shows the selected budget plan", () => {
    renderBudgetWorkspace();

    fireEvent.change(screen.getByLabelText("Fiscal Year"), {
      target: { value: "FY2026" },
    });

    expect(
      screen.getAllByRole("heading", {
        name: "FY2026 Cybersecurity Budget",
      })
    ).toHaveLength(1);
    expect(screen.getByText("Category Summary")).toBeVisible();
  });

  it("shows and edits training quantity", () => {
    renderBudgetWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "Training" }));

    const table = activeWorksheetTable();
    expectNoRemovedWorksheetHeaders(table);
    expect(
      within(table).getByRole("columnheader", { name: "Quantity" })
    ).toBeVisible();
    expect(within(table).getByText("12")).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "Edit SANS Training Vouchers" })
    );
    const totalBefore = screen.getByTestId("worksheet-total").textContent;

    fireEvent.change(screen.getAllByLabelText("Count amount")[0], {
      target: { value: "15" },
    });

    expect(screen.getByTestId("worksheet-total").textContent).not.toBe(
      totalBefore
    );
    expect(screen.getByDisplayValue("15")).toBeVisible();
  });

  it("keeps conference worksheet columns focused", () => {
    renderBudgetWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "Conferences" }));

    const table = activeWorksheetTable();
    expectNoRemovedWorksheetHeaders(table);
    expect(
      within(table).getByRole("columnheader", { name: "Conference" })
    ).toBeVisible();
    expect(
      within(table).getByRole("columnheader", { name: "Attendees" })
    ).toBeVisible();
    expect(
      within(table).getByRole("columnheader", { name: "Registration Fee" })
    ).toBeVisible();
    expect(
      within(table).queryByRole("columnheader", { name: "Purpose" })
    ).not.toBeInTheDocument();
    expect(
      within(table).queryByRole("columnheader", { name: "Owner" })
    ).not.toBeInTheDocument();
  });

  it("shows category and account rollups without unsupported workflow controls", () => {
    renderBudgetWorkspace();

    expect(screen.getByText("Category Summary")).toBeVisible();
    expect(screen.getByText("Account Rollup")).toBeVisible();
    expect(screen.queryByLabelText("Scenario")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Roll Forward" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Maintenance Renewals" })
    ).not.toBeInTheDocument();
  });

  it("opens a detail drawer for a budget row", () => {
    renderBudgetWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "Software" }));
    fireEvent.click(
      within(activeWorksheetTable()).getByRole("button", {
        name: "Open details for OneTrust Platform Enterprise",
      })
    );

    expect(
      screen.getByRole("heading", { name: "OneTrust Platform Enterprise" })
    ).toBeVisible();
    expect(screen.getByText("Row-level account override")).toBeVisible();
  });

  it("confirms a budget line before sending it to maintenance", () => {
    renderBudgetWorkspace();

    fireEvent.click(screen.getByRole("button", { name: "Software" }));
    const addButtons = screen.getAllByRole("button", { name: "Add Row" });
    fireEvent.click(addButtons[addButtons.length - 1]);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Send New Software and SaaS line to Maintenance",
      })
    );

    expect(
      screen.getByRole("heading", { name: "Send to Maintenance" })
    ).toBeVisible();
    expect(screen.getByText("Product or service")).toBeVisible();
    expect(screen.queryByText("Owner")).not.toBeInTheDocument();
    expect(screen.queryByText("Financial account")).not.toBeInTheDocument();
  });
});
