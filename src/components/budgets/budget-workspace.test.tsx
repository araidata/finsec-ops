import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BudgetWorkspace } from "@/components/budgets/budget-workspace";

vi.mock("next/navigation", () => ({
  usePathname: () => "/budgets",
}));

describe("BudgetWorkspace", () => {
  it("updates Finance summary when an inline proposed amount changes", () => {
    render(<BudgetWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "Software and SaaS" }));

    const totalBefore = screen.getByTestId("finance-total-proposed").textContent;
    const proposedInput = screen.getByTestId("proposed-fy27-onetrust");

    fireEvent.change(proposedInput, { target: { value: "300000" } });

    expect(screen.getByTestId("finance-total-proposed").textContent).not.toBe(
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
    expect(screen.getAllByText("Approved")[0]).toBeVisible();
  });

  it("recalculates renewal increase and savings when quote changes", () => {
    render(<BudgetWorkspace />);

    const increase = screen.getByTestId("renewal-increase-renewal-onetrust");
    const savings = screen.getByTestId("renewal-savings-renewal-onetrust");
    const beforeIncrease = increase.textContent;
    const beforeSavings = savings.textContent;

    fireEvent.change(screen.getByTestId("renewal-quote-renewal-onetrust"), {
      target: { value: "220000" },
    });

    expect(increase.textContent).not.toBe(beforeIncrease);
    expect(savings.textContent).not.toBe(beforeSavings);
  });

  it("opens a detail drawer for a budget row", () => {
    render(<BudgetWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "Software and SaaS" }));
    fireEvent.click(
      within(screen.getAllByRole("table")[0]).getByRole("button", {
        name: "OneTrust Platform Enterprise",
      })
    );

    expect(screen.getByRole("heading", { name: "OneTrust Platform Enterprise" })).toBeVisible();
    expect(screen.getByText("Business justification")).toBeVisible();
  });
});
