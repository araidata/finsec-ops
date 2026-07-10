import { describe, expect, it } from "vitest";

import {
  calculateBudgetSummary,
  calculateBudgetVariance,
  calculateContractSummary,
  getBudgetIndicator,
  getNoticeDeadline,
  getRedundancyCandidates,
  getRenewalUrgency,
  isUnderusedModule,
} from "@/lib/portfolio-analytics";
import {
  budgetItems,
  contracts,
  productModules,
  products,
} from "@/lib/portfolio-data";

const today = new Date("2026-07-09T00:00:00.000Z");

describe("portfolio analytics", () => {
  it("calculates budget totals and variance", () => {
    const summary = calculateBudgetSummary(budgetItems);

    expect(summary.totalBudgeted).toBe(2_200_000);
    expect(summary.totalForecasted).toBe(2_265_000);
    expect(summary.totalActual).toBe(670_000);
    expect(calculateBudgetVariance(budgetItems[6])).toBe(-8_000);
  });

  it("identifies budget indicators for funding and variance states", () => {
    expect(getBudgetIndicator(budgetItems[4])).toBe("Partially Approved");
    expect(getBudgetIndicator(budgetItems[5])).toBe("Deferred");
    expect(getBudgetIndicator(budgetItems[6])).toBe("Over Budget");
    expect(getBudgetIndicator(budgetItems[7])).toBe("Unfunded");
  });

  it("calculates renewal urgency from renewal and notice deadlines", () => {
    const okta = contracts.find((contract) => contract.id === "contract-okta");

    expect(okta).toBeDefined();
    expect(getNoticeDeadline(okta!)).toBe("2026-05-11");
    expect(getRenewalUrgency(okta!, today)).toBe("Critical");
  });

  it("summarizes active contracts and high-risk renewals", () => {
    const summary = calculateContractSummary(contracts, today);

    expect(summary.activeContracts).toBe(2);
    expect(summary.annualContractValue).toBe(1_395_000);
    expect(summary.highRiskRenewals).toBe(2);
  });

  it("flags enabled low-adoption modules and redundancy candidates", () => {
    expect(isUnderusedModule(productModules[0])).toBe(true);
    expect(isUnderusedModule(productModules[4])).toBe(false);
    expect(getRedundancyCandidates(products)).toHaveLength(2);
  });
});
