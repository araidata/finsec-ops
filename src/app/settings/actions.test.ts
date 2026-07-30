import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveDepartmentAction } from "@/app/settings/actions";
import { emptyActionResult } from "@/lib/server/action-result";

const cacheMock = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

const settingsServiceMock = vi.hoisted(() => ({
  saveBudgetAccount: vi.fn(),
  saveBudgetCategory: vi.fn(),
  saveDepartment: vi.fn(),
  saveDeploymentEnvironment: vi.fn(),
  saveExpenseTypeOption: vi.fn(),
  saveFiscalYear: vi.fn(),
  saveLicenseMetricOption: vi.fn(),
  saveOrganizationSettings: vi.fn(),
  savePaymentFrequencyOption: vi.fn(),
  savePurchasingVehicle: vi.fn(),
  saveRenewalDecisionReason: vi.fn(),
  saveRenewalPriorityOption: vi.fn(),
  saveTeamMember: vi.fn(),
  setReferenceActive: vi.fn(),
}));

vi.mock("next/cache", () => cacheMock);
vi.mock("@/lib/server/settings-service", () => settingsServiceMock);

describe("Settings actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refreshes Settings without eagerly invalidating every consumer route", async () => {
    settingsServiceMock.saveDepartment.mockResolvedValue("department-1");

    const result = await saveDepartmentAction(
      emptyActionResult,
      new FormData()
    );

    expect(result.ok).toBe(true);
    expect(cacheMock.revalidatePath.mock.calls).toEqual([["/settings"]]);
  });
});
