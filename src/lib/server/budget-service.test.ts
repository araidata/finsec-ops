import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createBudgetRow,
  deleteBudgetRow,
  getBudgetWorkspaceData,
  saveBudgetRow,
  sendBudgetAnnualToMaintenance,
} from "@/lib/server/budget-service";
import type {
  BudgetAnnualFinancial,
  BudgetItem,
  SoftwareBudgetDetail,
} from "@/types/budget";

const prismaMock = vi.hoisted(() => ({
  fiscalYear: { findMany: vi.fn() },
  budgetAccount: { findMany: vi.fn(), findFirst: vi.fn() },
  budgetPlan: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  budgetAnnualFinancial: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
  },
  department: { findUnique: vi.fn() },
  maintenanceRenewal: { findMany: vi.fn(), findUnique: vi.fn() },
  savingsRecord: { findMany: vi.fn() },
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
}));

const authorizationMock = vi.hoisted(() => ({
  requirePermission: vi.fn(),
}));

const txMock = {
  budgetItem: {
    create: vi.fn(),
    update: vi.fn(),
  },
  budgetAnnualFinancial: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  maintenanceRenewal: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  activityLog: {
    create: vi.fn(),
  },
};

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => prismaMock,
}));

vi.mock("@/lib/server/authorization", () => ({
  requirePermission: authorizationMock.requirePermission,
}));

function annualForMaintenance(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    id: "annual-1",
    budgetPlanId: "plan-1",
    fiscalYearId: "fy-1",
    budgetItemId: "item-1",
    accountId: "account-1",
    worksheet: "SOFTWARE_SAAS",
    isRetired: false,
    currentApprovedAmount: "100.00",
    proposedAmount: "115.00",
    approvedAmount: "0.00",
    currencyCode: "USD",
    owner: "Budget Owner",
    account: { id: "account-1", code: "62094" },
    budgetPlan: { id: "plan-1", fiscalYearId: "fy-1" },
    fiscalYear: {
      id: "fy-1",
      label: "FY2027",
      endsOn: new Date("2027-06-30T00:00:00.000Z"),
    },
    budgetItem: {
      id: "item-1",
      departmentId: "department-1",
      ownerTeamMemberId: "owner-1",
      vendorId: null,
      resellerId: null,
      vendorCompanyId: "vendor-1",
      sellerCompanyId: "seller-1",
      contractId: null,
      productId: "product-1",
      name: "Security Platform",
      owner: "Budget Owner",
      strategicProgramArea: "Security Operations",
      active: true,
      department: { id: "department-1", name: "Cybersecurity" },
      ownerTeamMember: { id: "owner-1", fullName: "Renewal Owner" },
      contract: null,
    },
    ...overrides,
  };
}

function maintenanceRenewalRecord(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    id: "renewal-1",
    departmentId: "department-1",
    budgetPlanId: "plan-1",
    linkedAnnualFinancialId: "annual-1",
    vendorId: null,
    resellerId: null,
    contractId: null,
    productId: "product-1",
    productOrService: "Security Platform",
    currentAnnualCost: "100.00",
    renewalQuote: "115.00",
    negotiatedCost: "115.00",
    renewalDate: new Date("2027-06-30T00:00:00.000Z"),
    contractStart: null,
    contractEnd: null,
    noticePeriodDays: 60,
    autoRenewal: false,
    paymentFrequency: "ANNUAL",
    fundingAccountId: "account-1",
    renewalStatus: "PLANNING",
    procurementStatus: "NOT_STARTED",
    quoteReceivedDate: null,
    purchaseRequestNumber: null,
    purchaseOrderNumber: null,
    expectedPaymentDate: null,
    renewalOwner: "Renewal Owner",
    procurementOwner: null,
    renewalStrategy: null,
    renewalRisk: "LOW",
    notesText: "Created from FY2027 Budget row annual-1.",
    vendor: null,
    reseller: null,
    vendorCompany: { name: "Vendor Co" },
    sellerCompany: { name: "Seller Co" },
    ...overrides,
  };
}

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
    authorizationMock.requirePermission.mockResolvedValue({
      actorId: "user-1",
    });
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

  it("does not create a regular Budget row when authorization is denied", async () => {
    authorizationMock.requirePermission.mockRejectedValue(
      new Error("Permission denied")
    );

    await expect(
      createBudgetRow({
        budgetPlanId: "plan-1",
        worksheet: "Software and SaaS",
      })
    ).rejects.toThrow("Permission denied");

    expect(authorizationMock.requirePermission).toHaveBeenCalledWith({
      permission: "budget.write",
      departmentId: null,
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("saves worksheet details with the annual financial row", async () => {
    prismaMock.budgetAnnualFinancial.findUnique.mockResolvedValue({
      budgetItem: { departmentId: "department-1" },
    });
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

  it("creates and audits an authoritative Maintenance Renewal transactionally", async () => {
    prismaMock.budgetAnnualFinancial.findUnique.mockResolvedValue({
      budgetItem: { departmentId: "department-1" },
    });
    txMock.budgetAnnualFinancial.findUnique.mockResolvedValue(
      annualForMaintenance()
    );
    txMock.maintenanceRenewal.findUnique.mockResolvedValue(null);
    txMock.maintenanceRenewal.findFirst.mockResolvedValue(null);
    txMock.maintenanceRenewal.create.mockResolvedValue(
      maintenanceRenewalRecord()
    );

    const result = await sendBudgetAnnualToMaintenance("annual-1");

    expect(authorizationMock.requirePermission).toHaveBeenCalledWith({
      permission: "budget.maintenance.create",
      departmentId: "department-1",
    });
    expect(txMock.maintenanceRenewal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          linkedAnnualFinancialId: "annual-1",
          budgetItemId: "item-1",
          renewalStatus: "PLANNING",
          currentAnnualCost: "100.00",
          renewalQuote: "115.00",
        }),
      })
    );
    expect(txMock.budgetAnnualFinancial.update).toHaveBeenCalledWith({
      where: { id: "annual-1" },
      data: { reviewState: "UPDATED" },
    });
    expect(txMock.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: "user-1",
        action: "CREATE",
        entityType: "MaintenanceRenewal",
        entityId: "renewal-1",
        newValue: "annual-1",
      }),
    });
    expect(result).toEqual(
      expect.objectContaining({
        created: true,
        renewal: expect.objectContaining({
          id: "renewal-1",
          linkedAnnualFinancialId: "annual-1",
          renewalQuoteCents: 11500,
        }),
      })
    );
  });

  it("returns the existing annual-linked Renewal without creating a duplicate", async () => {
    prismaMock.budgetAnnualFinancial.findUnique.mockResolvedValue({
      budgetItem: { departmentId: "department-1" },
    });
    txMock.budgetAnnualFinancial.findUnique.mockResolvedValue(
      annualForMaintenance()
    );
    txMock.maintenanceRenewal.findUnique.mockResolvedValue(
      maintenanceRenewalRecord()
    );

    const result = await sendBudgetAnnualToMaintenance("annual-1");

    expect(result.created).toBe(false);
    expect(result.renewal.id).toBe("renewal-1");
    expect(txMock.maintenanceRenewal.create).not.toHaveBeenCalled();
    expect(txMock.activityLog.create).not.toHaveBeenCalled();
  });

  it("recovers idempotently when a concurrent transfer wins the unique-link race", async () => {
    prismaMock.budgetAnnualFinancial.findUnique.mockResolvedValue({
      budgetItem: { departmentId: "department-1" },
    });
    prismaMock.$transaction.mockRejectedValue({ code: "P2002" });
    prismaMock.maintenanceRenewal.findUnique.mockResolvedValue(
      maintenanceRenewalRecord()
    );

    const result = await sendBudgetAnnualToMaintenance("annual-1");

    expect(result.created).toBe(false);
    expect(result.renewal.id).toBe("renewal-1");
    expect(prismaMock.maintenanceRenewal.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { linkedAnnualFinancialId: "annual-1" },
      })
    );
  });

  it("links an existing Contract/Fiscal Year Renewal instead of creating another case", async () => {
    prismaMock.budgetAnnualFinancial.findUnique.mockResolvedValue({
      budgetItem: { departmentId: "department-1" },
    });
    txMock.budgetAnnualFinancial.findUnique.mockResolvedValue(
      annualForMaintenance({
        budgetItem: {
          ...(annualForMaintenance().budgetItem as Record<string, unknown>),
          contractId: "contract-1",
          contract: {
            startsOn: new Date("2026-07-01T00:00:00.000Z"),
            endsOn: new Date("2027-06-30T00:00:00.000Z"),
            renewalDate: null,
            noticePeriodDays: 60,
            autoRenewal: false,
            paymentFrequency: "ANNUAL",
          },
        },
      })
    );
    txMock.maintenanceRenewal.findUnique.mockResolvedValue(null);
    txMock.maintenanceRenewal.findFirst.mockResolvedValue(
      maintenanceRenewalRecord({
        linkedAnnualFinancialId: null,
        contractId: "contract-1",
      })
    );
    txMock.maintenanceRenewal.update.mockResolvedValue(
      maintenanceRenewalRecord({ contractId: "contract-1" })
    );

    const result = await sendBudgetAnnualToMaintenance("annual-1");

    expect(txMock.maintenanceRenewal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "renewal-1" },
        data: {
          departmentId: "department-1",
          linkedAnnualFinancialId: "annual-1",
          budgetItemId: "item-1",
        },
      })
    );
    expect(txMock.maintenanceRenewal.create).not.toHaveBeenCalled();
    expect(txMock.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: "user-1",
        action: "UPDATE",
        entityId: "renewal-1",
      }),
    });
    expect(result.created).toBe(false);
  });

  it("does not start the transaction when authorization is denied", async () => {
    prismaMock.budgetAnnualFinancial.findUnique.mockResolvedValue({
      budgetItem: { departmentId: "department-1" },
    });
    authorizationMock.requirePermission.mockRejectedValue(
      new Error("Not authorized.")
    );

    await expect(sendBudgetAnnualToMaintenance("annual-1")).rejects.toThrow(
      "Not authorized."
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects annual rows outside the supported Maintenance eligibility rules", async () => {
    prismaMock.budgetAnnualFinancial.findUnique.mockResolvedValue({
      budgetItem: { departmentId: "department-1" },
    });
    txMock.budgetAnnualFinancial.findUnique.mockResolvedValue(
      annualForMaintenance({
        worksheet: "TRAINING",
        account: { id: "account-1", code: "62460" },
      })
    );
    txMock.maintenanceRenewal.findUnique.mockResolvedValue(null);

    await expect(
      sendBudgetAnnualToMaintenance("annual-1")
    ).rejects.toMatchObject({
      message: "This Budget row is not eligible for Maintenance Renewals.",
      fields: {
        annualFinancialId: [
          "Select a Software, Maintenance account, or Contract-backed annual row.",
        ],
      },
    });
    expect(txMock.maintenanceRenewal.create).not.toHaveBeenCalled();
    expect(txMock.activityLog.create).not.toHaveBeenCalled();
  });

  it("deletes annual rows and inactivates orphaned budget items", async () => {
    prismaMock.budgetAnnualFinancial.findUnique.mockResolvedValue({
      budgetItemId: "item-1",
      budgetItem: { departmentId: "department-1" },
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

describe("budget workspace query bounds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.fiscalYear.findMany.mockResolvedValue([
      {
        id: "fy-1",
        label: "FY2027",
        startsOn: new Date("2026-07-01T00:00:00.000Z"),
        endsOn: new Date("2027-06-30T00:00:00.000Z"),
        isCurrent: true,
      },
    ]);
    prismaMock.budgetAccount.findMany.mockResolvedValue([]);
    prismaMock.budgetPlan.findMany.mockResolvedValue([
      {
        id: "plan-1",
        fiscalYearId: "fy-1",
        name: "FY2027 Plan",
        status: "DRAFT",
        version: "1",
        priorFiscalYear: null,
        planningOwner: "Finance",
        submissionDueDate: null,
        assumptions: null,
        executiveNarrative: null,
        createdAt: new Date("2026-07-01T00:00:00.000Z"),
        updatedAt: new Date("2026-07-01T00:00:00.000Z"),
        fiscalYear: {
          id: "fy-1",
          label: "FY2027",
          startsOn: new Date("2026-07-01T00:00:00.000Z"),
        },
      },
    ]);
    prismaMock.budgetPlan.findFirst.mockResolvedValue(null);
    prismaMock.budgetAnnualFinancial.count.mockResolvedValue(0);
    prismaMock.budgetAnnualFinancial.findMany.mockResolvedValue([]);
    prismaMock.maintenanceRenewal.findMany.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValue([]);
  });

  it("uses aggregate-only data for the Summary worksheet", async () => {
    const data = await getBudgetWorkspaceData({
      departmentId: "department-1",
      fiscalYearId: "fy-1",
      worksheet: "Summary",
    });

    expect(prismaMock.budgetAnnualFinancial.findMany).not.toHaveBeenCalled();
    expect(prismaMock.budgetAnnualFinancial.count).not.toHaveBeenCalled();
    expect(prismaMock.maintenanceRenewal.findMany).not.toHaveBeenCalled();
    expect(data.annualFinancials).toEqual([]);
    expect(data.baseline).toBeDefined();
  });

  it("pages, scopes, searches, and sorts worksheet rows in PostgreSQL", async () => {
    prismaMock.budgetAnnualFinancial.count.mockResolvedValue(120);

    const data = await getBudgetWorkspaceData({
      departmentId: "department-1",
      fiscalYearId: "fy-1",
      worksheet: "Software and SaaS",
      page: 2,
      pageSize: 500,
      search: "sentinel",
      sort: "amount",
    });

    expect(prismaMock.budgetAnnualFinancial.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        budgetPlanId: { in: ["plan-1"] },
        budgetItem: { departmentId: "department-1" },
        worksheet: "SOFTWARE_SAAS",
        OR: expect.any(Array),
      }),
    });
    expect(prismaMock.budgetAnnualFinancial.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 100,
        take: 100,
        orderBy: [{ proposedAmount: "desc" }, { id: "asc" }],
        select: expect.any(Object),
      })
    );
    expect(data.listState).toEqual(
      expect.objectContaining({
        page: 2,
        pageSize: 100,
        totalItems: 120,
        totalPages: 2,
      })
    );
  });
});
