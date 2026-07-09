import { describe, expect, it } from "vitest";

import {
  calculateActualSpendTotal,
  calculateApprovedBudgetTotal,
  calculateCommittedSpendTotal,
  calculateForecastTotal,
  calculateRemainingBudget,
  calculateRenewalExposureByFiscalYear,
  type BudgetCalculationLineItem,
} from "@/lib/financial-calculations";

const lineItems: BudgetCalculationLineItem[] = [
  {
    status: "APPROVED",
    approvedAmount: 1_000_000,
    forecastAmount: 1_050_000,
    committedAmount: 700_000,
    actualAmount: 125_000,
  },
  {
    status: "COMMITTED",
    approvedAmount: 500_000,
    forecastAmount: 500_000,
    committedAmount: 250_000,
    actualAmount: 50_000,
  },
  {
    status: "PROPOSED",
    approvedAmount: 400_000,
    forecastAmount: 425_000,
    committedAmount: 0,
    actualAmount: 0,
  },
  {
    status: "CANCELED",
    approvedAmount: 250_000,
    forecastAmount: 250_000,
    committedAmount: 250_000,
    actualAmount: 25_000,
  },
];

describe("financial calculations", () => {
  it("calculates approved budget total from approved, committed, and closed items", () => {
    expect(calculateApprovedBudgetTotal(lineItems)).toBe(1_500_000);
  });

  it("calculates forecast total from active budget items", () => {
    expect(calculateForecastTotal(lineItems)).toBe(1_975_000);
  });

  it("calculates committed spend total from active budget items", () => {
    expect(calculateCommittedSpendTotal(lineItems)).toBe(950_000);
  });

  it("calculates actual spend total from active budget items", () => {
    expect(calculateActualSpendTotal(lineItems)).toBe(175_000);
  });

  it("calculates remaining budget after committed and actual spend", () => {
    expect(calculateRemainingBudget(lineItems)).toBe(375_000);
  });

  it("calculates renewal exposure by fiscal year for active renewals", () => {
    expect(
      calculateRenewalExposureByFiscalYear([
        {
          fiscalYearId: "fy-2027",
          status: "PLANNED",
          exposureAmount: 300_000,
        },
        {
          fiscalYearId: "fy-2027",
          status: "IN_PROGRESS",
          exposureAmount: 175_000,
        },
        {
          fiscalYearId: "fy-2028",
          status: "APPROVED",
          exposureAmount: 425_000,
        },
        {
          fiscalYearId: "fy-2028",
          status: "CANCELED",
          exposureAmount: 100_000,
        },
      ])
    ).toEqual({
      "fy-2027": 475_000,
      "fy-2028": 425_000,
    });
  });
});
