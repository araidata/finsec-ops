import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  saveBudgetRowAction,
  sendBudgetToMaintenanceAction,
} from "@/app/budgets/actions";
import { FieldValidationError } from "@/lib/server/action-result";

const cacheMock = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

const budgetServiceMock = vi.hoisted(() => ({
  createBudgetRow: vi.fn(),
  deleteBudgetRow: vi.fn(),
  duplicateBudgetRow: vi.fn(),
  saveBudgetRow: vi.fn(),
  sendBudgetAnnualToMaintenance: vi.fn(),
}));

vi.mock("next/cache", () => cacheMock);
vi.mock("@/lib/server/budget-service", () => budgetServiceMock);

describe("Budget actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the authoritative Renewal and invalidates only affected modules", async () => {
    const renewal = {
      id: "renewal-1",
      budgetPlanId: "plan-1",
      linkedAnnualFinancialId: "annual-1",
      vendor: "Vendor",
      productOrService: "Security Platform",
      currentCostCents: 10000,
      renewalQuoteCents: 11500,
      negotiatedCostCents: 11500,
      renewalDate: "2027-06-30",
      contractStart: "",
      contractEnd: "",
      noticePeriodDays: 60,
      autoRenewal: false,
      paymentFrequency: "Annual",
      fundingAccountId: "account-1",
      renewalStatus: "Planning",
      procurementStatus: "Not Started",
      renewalOwner: "",
      procurementOwner: "",
      renewalStrategy: "",
      renewalRisk: "Low",
      notes: "",
    };
    budgetServiceMock.sendBudgetAnnualToMaintenance.mockResolvedValue({
      renewal,
      created: true,
    });

    const result = await sendBudgetToMaintenanceAction("annual-1");

    expect(result).toEqual({
      ok: true,
      message: "Maintenance Renewal created and linked.",
      data: { renewal, created: true },
    });
    expect(cacheMock.revalidatePath.mock.calls).toEqual([
      ["/budgets"],
      ["/renewals"],
    ]);
  });

  it("returns a field-level failure without invalidating routes", async () => {
    budgetServiceMock.sendBudgetAnnualToMaintenance.mockRejectedValue(
      new FieldValidationError("Budget row is not eligible.", {
        annualFinancialId: ["Select an eligible annual row."],
      })
    );

    const result = await sendBudgetToMaintenanceAction("annual-1");

    expect(result).toEqual({
      ok: false,
      message: "Budget row is not eligible.",
      fields: {
        annualFinancialId: ["Select an eligible annual row."],
      },
    });
    expect(cacheMock.revalidatePath).not.toHaveBeenCalled();
  });

  it("invalidates only Budget for an ordinary row mutation", async () => {
    budgetServiceMock.saveBudgetRow.mockResolvedValue(undefined);

    const result = await saveBudgetRowAction({} as never);

    expect(result).toEqual({
      ok: true,
      message: "Budget row saved.",
    });
    expect(cacheMock.revalidatePath.mock.calls).toEqual([["/budgets"]]);
  });
});
