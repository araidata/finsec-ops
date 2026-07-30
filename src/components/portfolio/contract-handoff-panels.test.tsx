import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  CreateRenewalPanel,
  PushBudgetPanel,
} from "@/components/portfolio/contract-handoff-panels";

const contract = {
  id: "contract-1",
  title: "Security Platform",
  businessOwner: "Alex Analyst",
  annualValue: "125000",
  lineItems: [{ renewable: true }],
};

describe("Contract handoff panels", () => {
  it("renders the renewal handoff only from its focused module", () => {
    render(
      <CreateRenewalPanel
        contract={contract}
        onClose={vi.fn()}
        fiscalOptions={[{ id: "fy-1", label: "FY27" }]}
        budgetPlanOptions={[{ id: "plan-1", label: "Plan" }]}
        accountOptions={[{ id: "account-1", label: "63256 Software" }]}
        annualOptions={[]}
      />
    );

    expect(screen.getByText("Push Contract to Renewal")).toBeInTheDocument();
    expect(screen.getByText(/1 renewable lines/)).toBeInTheDocument();
  });

  it("renders the budget handoff only from its focused module", () => {
    render(
      <PushBudgetPanel
        contract={contract}
        onClose={vi.fn()}
        fiscalOptions={[{ id: "fy-1", label: "FY27" }]}
        budgetPlanOptions={[{ id: "plan-1", label: "Plan" }]}
        accountOptions={[{ id: "account-1", label: "63256 Software" }]}
      />
    );

    expect(screen.getByText("Push Contract to Budget")).toBeInTheDocument();
    expect(screen.getByText("$125,000")).toBeInTheDocument();
  });
});
