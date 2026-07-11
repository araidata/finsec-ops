import { describe, expect, it } from "vitest";

import {
  dispositionDefinitionByValue,
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
