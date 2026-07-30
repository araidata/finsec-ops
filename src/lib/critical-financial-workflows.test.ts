import { describe, expect, it } from "vitest";

import {
  calculateForecastToApprovedVariance,
  calculateRenewalIncrease,
  cents,
} from "@/lib/budgets/budget-calculations";
import {
  requiresDecisionReason,
  renewalAmountChange,
  validateDispositionRequirements,
} from "@/lib/maintenance-renewal-rules";

describe("critical financial and workflow invariants", () => {
  it("preserves cents through approved, forecast, and renewal variance", () => {
    expect(
      calculateForecastToApprovedVariance(cents(108_000), cents(100_000))
    ).toBe(cents(8_000));
    expect(
      calculateRenewalIncrease({
        currentCostCents: cents(100_000),
        renewalQuoteCents: cents(112_000),
      })
    ).toBe(cents(12_000));
    expect(renewalAmountChange(100_000, 108_000)).toEqual({
      amount: 8_000,
      percentage: 0.08,
    });
  });

  it("enforces Renewal disposition approval requirements", () => {
    expect(validateDispositionRequirements({ disposition: "REPLACE" })).toEqual(
      ["replacement product or project", "target replacement date"]
    );
    expect(
      requiresDecisionReason({
        decisionStatus: "APPROVED",
        recommendedDisposition: "RENEW_AS_IS",
        approvedDisposition: "RENEGOTIATE",
      })
    ).toBe(true);
  });
});
