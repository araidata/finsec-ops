import { describe, expect, it } from "vitest";

import {
  renewalLineVariance,
  sumContractLineAmounts,
} from "@/lib/server/contract-service";

describe("contract service financial helpers", () => {
  it("sums contract header totals from line items", () => {
    expect(
      sumContractLineAmounts([
        { annualAmount: "456000.00", totalAmount: "456000.00" },
        { annualAmount: "336000.00", totalAmount: "336000.00" },
        { annualAmount: "458000.00", totalAmount: "458000.00" },
      ])
    ).toEqual({
      annualValue: 1250000,
      totalValue: 1250000,
    });
  });

  it("calculates quoted and final renewal variance", () => {
    expect(
      renewalLineVariance({
        currentAnnualAmount: "100000.00",
        quotedAnnualAmount: "112000.00",
        finalAmount: "106000.00",
      })
    ).toEqual({
      quotedVariance: 12000,
      finalVariance: 6000,
      quotedVariancePercent: 0.12,
      finalVariancePercent: 0.06,
    });
  });

  it("handles zero current amount safely", () => {
    expect(
      renewalLineVariance({
        currentAnnualAmount: "0.00",
        quotedAnnualAmount: "5000.00",
        finalAmount: "4500.00",
      })
    ).toEqual({
      quotedVariance: 5000,
      finalVariance: 4500,
      quotedVariancePercent: 0,
      finalVariancePercent: 0,
    });
  });
});
