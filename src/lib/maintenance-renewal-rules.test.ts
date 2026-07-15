import { describe, expect, it } from "vitest";

import {
  coOpExpirationState,
  dispositionDefinitionByValue,
  renewalAmountChange,
  renewalRegisterStatuses,
  requiresDecisionReason,
  validateDispositionRequirements,
} from "@/lib/maintenance-renewal-rules";

describe("maintenance renewal rules", () => {
  it("documents the commercial versus operational distinction for non-renewal", () => {
    expect(dispositionDefinitionByValue.DO_NOT_RENEW.guidance).toContain(
      "commercial decision"
    );
    expect(dispositionDefinitionByValue.DECOMMISSION.guidance).toContain(
      "operational retirement plan"
    );
  });

  it("supports the operational register statuses without removed workflow stages", () => {
    expect(renewalRegisterStatuses).toContain("COMPLETE");
    expect(renewalRegisterStatuses).toContain("REPLACE");
    expect(renewalRegisterStatuses).toContain("DECOMMISSION");
    expect(renewalRegisterStatuses).not.toContain("REQUIREMENTS_VALIDATION");
    expect(renewalRegisterStatuses).not.toContain("QUOTE_NEGOTIATION");
  });

  it("calculates renewal amount and percentage changes safely", () => {
    expect(renewalAmountChange(100, 115)).toEqual({
      amount: 15,
      percentage: 0.15,
    });
    expect(renewalAmountChange(0, 25)).toEqual({
      amount: 25,
      percentage: null,
    });
    expect(renewalAmountChange(null, 25)).toEqual({
      amount: null,
      percentage: null,
    });
  });

  it("classifies co-op expiration warnings", () => {
    expect(
      coOpExpirationState({
        expirationDate: "2026-06-30",
        renewalDate: "2026-08-01",
        today: "2026-07-14",
      })
    ).toBe("EXPIRED");
    expect(
      coOpExpirationState({
        expirationDate: "2026-08-01",
        renewalDate: "2026-10-01",
        today: "2026-07-14",
      })
    ).toBe("BEFORE_RENEWAL");
    expect(
      coOpExpirationState({
        expirationDate: "2026-08-15",
        renewalDate: "2026-08-01",
        today: "2026-07-14",
      })
    ).toBe("EXPIRING_SOON");
  });

  it("requires a reason when the approved disposition differs from the recommendation", () => {
    expect(
      requiresDecisionReason({
        decisionStatus: "APPROVED",
        recommendedDisposition: "REPLACE",
        approvedDisposition: "EXTEND_TEMPORARILY",
      })
    ).toBe(true);

    expect(
      requiresDecisionReason({
        decisionStatus: "APPROVED",
        recommendedDisposition: "REPLACE",
        approvedDisposition: "REPLACE",
      })
    ).toBe(false);
  });

  it("requires disposition-specific operational details", () => {
    expect(
      validateDispositionRequirements({
        disposition: "REPLACE",
      })
    ).toEqual(["replacement product or project", "target replacement date"]);

    expect(
      validateDispositionRequirements({
        disposition: "EXTEND_TEMPORARILY",
        temporaryExtensionTerm: "90 days",
      })
    ).toEqual(["temporary extension term and next review date"]);

    expect(
      validateDispositionRequirements({
        disposition: "DO_NOT_RENEW",
        decommissioningRequired: true,
      })
    ).toEqual(["target decommission date"]);
  });
});
