import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BudgetWorkspace } from "@/components/budgets/budget-workspace";

vi.mock("next/navigation", () => ({
  usePathname: () => "/budgets",
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

describe("BudgetWorkspace", () => {
  it("updates worksheet totals when a software budget amount changes", () => {
    render(<BudgetWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "Software and SaaS" }));

    const totalBefore = screen.getByTestId("worksheet-total").textContent;
    fireEvent.change(screen.getByTestId("software-budget-fy27-onetrust"), {
      target: { value: "300000" },
    });

    expect(screen.getByTestId("worksheet-total").textContent).not.toBe(
      totalBefore
    );
    expect(screen.getByText("Unsaved local changes")).toBeVisible();
  });

  it("switches fiscal years and shows the selected budget plan", () => {
    render(<BudgetWorkspace />);

    fireEvent.change(screen.getByLabelText("Fiscal Year"), {
      target: { value: "FY2026" },
    });

    expect(
      screen.getByRole("heading", { name: "FY2026 Cybersecurity Budget" })
    ).toBeVisible();
    expect(screen.getByText("Budget Comparison")).toBeVisible();
  });

  it("recalculates training totals from quantity and cost", () => {
    render(<BudgetWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "Training" }));
    const totalBefore = screen.getByTestId("worksheet-total").textContent;
    const qtyInput = screen.getAllByLabelText("Count amount")[0];

    fireEvent.change(qtyInput, { target: { value: "15" } });

    expect(screen.getByTestId("worksheet-total").textContent).not.toBe(
      totalBefore
    );
  });

  it("opens the context sheet from the toolbar", () => {
    render(<BudgetWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "Show Context" }));

    expect(
      screen.getByRole("heading", { name: "Budget Context" })
    ).toBeVisible();
    expect(screen.getByText("Top Accounts")).toBeVisible();
  });

  it("opens a detail drawer for a budget row", () => {
    render(<BudgetWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "Software and SaaS" }));
    fireEvent.click(
      within(screen.getAllByRole("table")[0]).getByRole("button", {
        name: "Open details for OneTrust Platform Enterprise",
      })
    );

    expect(
      screen.getByRole("heading", { name: "OneTrust Platform Enterprise" })
    ).toBeVisible();
    expect(screen.getByText("Row-level account override")).toBeVisible();
  });
});
