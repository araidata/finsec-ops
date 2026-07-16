import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createBudgetRow,
  deleteBudgetRow,
  saveBudgetRow,
} from "@/lib/server/budget-service";
import type {
  BudgetAnnualFinancial,
  BudgetItem,
  SoftwareBudgetDetail,
} from "@/types/budget";

const prismaMock = vi.hoisted(() => ({
  fiscalYear: { findMany: vi.fn() },
  budgetAccount: { findMany: vi.fn(), findFirst: vi.fn() },
  budgetPlan: { findMany: vi.fn(), findUnique: vi.fn() },
  budgetAnnualFinancial: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
  },
  maintenanceRenewal: { findMany: vi.fn() },
  savingsRecord: { findMany: vi.fn() },
  $transaction: vi.fn(),
}));

const txMock = {
  budgetItem: {
    create: vi.fn(),
    update: vi.fn(),
  },
  budgetAnnualFinancial: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
};

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => prismaMock,
}));

describe("budget service persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.budgetPlan.findUnique.mockResolvedValue({
      id: "plan-1",
      fiscalYearId: "fy-1",
      fiscalYear: { label: "FY2027" },
      scenarios: [{ id: "scenario-1", isActive: true }],
    });
    prismaMock.budgetAccount.findFirst.mockResolvedValue({
      id: "account-1",
      code: "62094",
      defaultWorksheet: "SOFTWARE_SAAS",
      active: true,
    });
    prismaMock.budgetAnnualFinancial.count.mockResolvedValue(0);
    txMock.budgetItem.create.mockResolvedValue({ id: "item-1" });
    txMock.budgetAnnualFinancial.count.mockResolvedValue(0);
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback(txMock)
    );
  });

  it("creates persisted budget rows with worksheet details", async () => {
    await createBudgetRow({
      budgetPlanId: "plan-1",
      worksheet: "Software and SaaS",
    });

    expect(txMock.budgetItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "New Software line",
        }),
      })
    );
    expect(txMock.budgetAnnualFinancial.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          budgetPlanId: "plan-1",
          scenarioId: "scenario-1",
          worksheet: "SOFTWARE_SAAS",
          worksheetDetails: expect.objectContaining({
            requestType: "New",
            resellerLabel: "Direct",
          }),
        }),
      })
    );
  });

  it("saves worksheet details with the annual financial row", async () => {
    const line: BudgetAnnualFinancial = {
      id: "annual-1",
      budgetPlanId: "plan-1",
      scenarioId: "scenario-1",
      fiscalYear: "FY2027",
      budgetItemId: "item-1",
      accountId: "account-1",
      worksheet: "Software and SaaS",
      sortOrder: 0,
      priorApprovedAmountCents: 0,
      currentApprovedAmountCents: 0,
      baseAmountCents: 0,
      requestedAmountCents: 12500000,
      proposedAmountCents: 12500000,
      approvedAmountCents: 0,
      revisedApprovedAmountCents: 0,
      forecastAmountCents: 12500000,
      encumberedAmountCents: 0,
      actualAmountCents: 0,
      unitCostCents: 0,
      quantity: 1,
      oneTimeAmountCents: 0,
      recurringAmountCents: 12500000,
      savingsAmountCents: 0,
      costAvoidanceAmountCents: 0,
      fundingStatus: "Requested",
      recurrence: "Recurring",
      reviewState: "Updated",
      isNewRequest: false,
      isRecurring: true,
      isOneTime: false,
      isRetired: false,
      comments: "Existing note",
      businessJustification: "",
      riskIfNotFunded: "",
      owner: "",
    };
    const item: BudgetItem = {
      id: "item-1",
      name: "Contract Budget Row",
      description: "",
      owner: "",
      strategicProgramArea: "Security Operations",
      active: true,
    };
    const detail: SoftwareBudgetDetail = {
      annualFinancialId: "annual-1",
      reseller: "SHI",
      requestType: "Replacement",
      replaces: "Legacy tool",
      notes: "Replacement request",
    };

    await saveBudgetRow({ line, item, detail });

    expect(txMock.budgetAnnualFinancial.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "annual-1" },
        data: expect.objectContaining({
          proposedAmount: "125000.00",
          comments: "Replacement request",
          worksheetDetails: expect.objectContaining({
            resellerLabel: "SHI",
            requestType: "Replacement",
            replaces: "Legacy tool",
          }),
        }),
      })
    );
  });

  it("deletes annual rows and inactivates orphaned budget items", async () => {
    prismaMock.budgetAnnualFinancial.findUnique.mockResolvedValue({
      budgetItemId: "item-1",
    });
    txMock.budgetAnnualFinancial.count.mockResolvedValue(0);

    await deleteBudgetRow("annual-1");

    expect(txMock.budgetAnnualFinancial.delete).toHaveBeenCalledWith({
      where: { id: "annual-1" },
    });
    expect(txMock.budgetItem.update).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: { active: false },
    });
  });
});
