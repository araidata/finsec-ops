import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveRenewalLineItemAction } from "@/app/renewals/actions";
import { emptyActionResult } from "@/lib/server/action-result";

const cacheMock = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

const renewalServiceMock = vi.hoisted(() => ({
  addRenewalComment: vi.fn(),
  addRenewalFundingAllocation: vi.fn(),
  addRenewalQuote: vi.fn(),
  addRenewalTask: vi.fn(),
  advanceRenewalStage: vi.fn(),
  createMaintenanceRenewal: vi.fn(),
  createNextRenewalCycle: vi.fn(),
  decideDisposition: vi.fn(),
  deleteMaintenanceRenewalLineItem: vi.fn(),
  saveDecommissionPlan: vi.fn(),
  saveMaintenanceRenewalLineItem: vi.fn(),
  saveReplacementPlan: vi.fn(),
  submitDispositionRecommendation: vi.fn(),
  updateMaintenanceRenewalCase: vi.fn(),
  updateMaintenanceRenewalRegister: vi.fn(),
  updateMaintenanceRenewalTableField: vi.fn(),
}));

vi.mock("next/cache", () => cacheMock);
vi.mock("@/lib/server/maintenance-renewal-service", () => renewalServiceMock);

describe("Renewal actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the owning Renewal route as the single refresh path", async () => {
    renewalServiceMock.saveMaintenanceRenewalLineItem.mockResolvedValue(
      "line-1"
    );
    const formData = new FormData();

    const result = await saveRenewalLineItemAction(emptyActionResult, formData);

    expect(result.ok).toBe(true);
    expect(cacheMock.revalidatePath.mock.calls).toEqual([["/renewals"]]);
  });
});
