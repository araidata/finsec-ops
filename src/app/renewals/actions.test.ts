import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadRenewalEditorOptionsAction,
  saveRenewalLineItemAction,
} from "@/app/renewals/actions";
import { emptyActionResult } from "@/lib/server/action-result";

const cacheMock = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const authorizationMock = vi.hoisted(() => ({
  requirePermission: vi.fn().mockResolvedValue({
    userId: "user-1",
    role: "PLATFORM_ADMIN",
  }),
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
  getMaintenanceRenewalEditorOptions: vi.fn(),
  saveDecommissionPlan: vi.fn(),
  saveMaintenanceRenewalLineItem: vi.fn(),
  saveReplacementPlan: vi.fn(),
  submitDispositionRecommendation: vi.fn(),
  updateMaintenanceRenewalCase: vi.fn(),
  updateMaintenanceRenewalRegister: vi.fn(),
  updateMaintenanceRenewalTableField: vi.fn(),
}));

vi.mock("next/cache", () => cacheMock);
vi.mock("@/lib/server/authorization", () => authorizationMock);
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
    expect(cacheMock.revalidateTag).toHaveBeenCalledWith(
      "dashboard:reporting",
      "max"
    );
  });

  it("loads editor references only through the explicit read action", async () => {
    renewalServiceMock.getMaintenanceRenewalEditorOptions.mockResolvedValue({
      companies: [],
      products: [],
      modules: [],
      fiscalYears: [],
      budgetPlans: [],
      budgetAccounts: [],
      purchasingVehicles: [],
      teamMembers: [],
    });

    await expect(loadRenewalEditorOptionsAction()).resolves.toMatchObject({
      ok: true,
      data: { products: [], modules: [] },
    });
    expect(cacheMock.revalidatePath).not.toHaveBeenCalled();
    expect(cacheMock.revalidateTag).not.toHaveBeenCalled();
    expect(authorizationMock.requirePermission).toHaveBeenCalledWith(
      "renewal.read"
    );
  });
});
