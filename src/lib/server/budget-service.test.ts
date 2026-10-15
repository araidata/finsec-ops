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
  HardwareBudgetDetail,
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

  it("creates Hardware with the active Department account 62093", async () => {
    prismaMock.department.findUnique.mockResolvedValue({ id: "department-1" });
    prismaMock.budgetAccount.findFirst.mockResolvedValue({
      id: "hardware-account",
      code: "62093",
    });

    await createBudgetRow({
      budgetPlanId: "plan-1",
      worksheet: "Hardware",
      departmentId: "department-1",
    });

    expect(prismaMock.budgetAccount.findFirst).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        where: { departmentId: "department-1", code: "62093", active: true },
      })
    );
    expect(txMock.budgetAnnualFinancial.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountId: "hardware-account",
          worksheet: "HARDWARE",
          quantity: "1.00",
          unitCost: "0.00",
          worksheetDetails: expect.objectContaining({
            quantity: 1,
            unitCostCents: 0,
          }),
        }),
      })
    );
    expect(txMock.budgetItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "New Hardware line" }),
      })
    );
  });

  it("falls back to the active global Hardware account 62093", async () => {
    prismaMock.department.findUnique.mockResolvedValue({ id: "department-1" });
    prismaMock.budgetAccount.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "global-hardware", code: "62093" });

    await createBudgetRow({
      budgetPlanId: "plan-1",
      worksheet: "Hardware",
      departmentId: "department-1",
    });

    expect(prismaMock.budgetAccount.findFirst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { code: "62093", departmentId: null, active: true },
      })
    );
    expect(txMock.budgetAnnualFinancial.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ accountId: "global-hardware" }),
      })
    );
  });

  it("rejects Hardware creation when account 62093 is unavailable", async () => {
    prismaMock.budgetAccount.findFirst.mockResolvedValue(null);

    await expect(
      createBudgetRow({ budgetPlanId: "plan-1", worksheet: "Hardware" })
    ).rejects.toThrow(/62093/);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it.each(["Software and SaaS", "Hardware"] as const)(
    "saves %s details with the annual financial row",
    async (worksheet) => {
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
        worksheet,
        sortOrder: 0,
        priorApprovedAmountCents: 0,
        currentApprovedAmountCents: 0,
        baseAmountCents: 0,
        requestedAmountCents: 12500000,
        proposedAmountCents: worksheet === "Hardware" ? 999999999 : 12500000,
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
      const detail: SoftwareBudgetDetail | HardwareBudgetDetail =
        worksheet === "Hardware"
          ? {
              annualFinancialId: "annual-1",
              equipment: "Laptop",
              vendor: "Hardware vendor",
              quantity: 5,
              unitCostCents: 2500000,
              installationCents: 15000,
              maintenanceCents: 20000,
              replacementOrNew: "Replacement",
              replaces: "Legacy laptop",
            }
          : {
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
            comments:
              worksheet === "Hardware"
                ? "Existing note"
                : "Replacement request",
            ...(worksheet === "Hardware"
              ? { quantity: "5.00", unitCost: "25000.00" }
              : {}),
            worksheetDetails: expect.objectContaining(
              worksheet === "Hardware"
                ? {
                    equipment: "Laptop",
                    vendor: "Hardware vendor",
                    quantity: 5,
                    unitCostCents: 2500000,
                    installationCents: 15000,
                    maintenanceCents: 20000,
                    replacementOrNew: "Replacement",
                    replaces: "Legacy laptop",
                  }
                : {
                    resellerLabel: "SHI",
                    requestType: "Replacement",
                    replaces: "Legacy tool",
                  }
            ),
          }),
        })
      );

      if (worksheet === "Hardware") {
        prismaMock.$transaction.mockClear();
        for (const field of ["quantity", "unitCostCents"] as const) {
          for (const value of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
            await expect(
              saveBudgetRow({
                line,
                item,
                detail: { ...detail, [field]: value },
              })
            ).rejects.toThrow(/valid non-negative numbers/);
          }
        }
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
      }
    }
  );

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

  it("keeps the zero-valued Hardware account in the server Summary rollup", async () => {
    prismaMock.$queryRaw.mockImplementation(async (query: { sql: string }) =>
      query.sql.includes("WITH totals AS")
        ? [
            {
              accountId: "hardware-account",
              accountCode: "62093",
              accountName: "Computer Hardware",
              priorApproved: "0",
              currentApproved: "0",
              proposed: "0",
              approved: "0",
            },
          ]
        : []
    );
    const data = await getBudgetWorkspaceData({
      departmentId: "department-1",
      fiscalYearId: "fy-1",
      worksheet: "Summary",
    });
    expect(data.baseline?.rollups).toContainEqual({
      accountId: "hardware-account",
      accountCode: "62093",
      accountName: "Computer Hardware",
      priorApprovedCents: 0,
      currentApprovedCents: 0,
      proposedCents: 0,
      approvedCents: 0,
      comments: "",
    });
    expect(prismaMock.budgetAnnualFinancial.findMany).not.toHaveBeenCalled();
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

  it.each([true, false])(
    "loads Hardware details with JSON present: %s",
    async (hasDetails) => {
      prismaMock.budgetAnnualFinancial.count.mockResolvedValue(1);
      prismaMock.budgetAnnualFinancial.findMany.mockResolvedValue([
        annualForMaintenance({
          worksheet: "HARDWARE",
          account: { id: "account-1", code: "62093" },
          unitCost: "1250.50",
          quantity: "3.00",
          comments: "Hardware note",
          budgetItem: {
            ...(annualForMaintenance().budgetItem as Record<string, unknown>),
            description: "Stored hardware description",
          },
          worksheetDetails: hasDetails
            ? {
                equipment: "Laptop",
                quantity: 4,
                unitCostCents: 150000,
                vendor: "Hardware vendor",
                installationCents: 15000,
                maintenanceCents: 20000,
                replacementOrNew: "Replacement",
                replaces: "Legacy laptop",
              }
            : null,
        }),
      ]);

      const data = await getBudgetWorkspaceData({
        fiscalYearId: "fy-1",
        worksheet: "Hardware",
      });

      expect(data.annualFinancials[0]).toEqual(
        expect.objectContaining({
          worksheet: "Hardware",
          quantity: 3,
          unitCostCents: 125050,
          comments: "Hardware note",
        })
      );
      expect(data.hardwareDetails).toEqual([
        {
          annualFinancialId: "annual-1",
          equipment: hasDetails ? "Laptop" : "Stored hardware description",
          quantity: hasDetails ? 4 : 3,
          unitCostCents: hasDetails ? 150000 : 125050,
          vendor: hasDetails ? "Hardware vendor" : "",
          installationCents: hasDetails ? 15000 : 0,
          maintenanceCents: hasDetails ? 20000 : 0,
          replacementOrNew: hasDetails ? "Replacement" : "New",
          replaces: hasDetails ? "Legacy laptop" : undefined,
        },
      ]);
    }
  );

  it("includes Hardware aggregates in Summary comparisons", async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          worksheet: "HARDWARE",
          accountCode: "62093",
          proposed: "3751.50",
          lineCount: 2,
        },
      ])
      .mockResolvedValueOnce([]);

    const data = await getBudgetWorkspaceData({
      fiscalYearId: "fy-1",
      worksheet: "Summary",
    });

    expect(data.baseline?.comparisons).toContainEqual({
      worksheet: "Hardware",
      currentTotal: 375150,
      priorTotal: 0,
      lineCount: 2,
    });
  });

  it.each(["Software and SaaS", "Hardware"] as const)(
    "pages, scopes, searches, and sorts %s rows in PostgreSQL",
    async (worksheet) => {
      prismaMock.budgetAnnualFinancial.count.mockResolvedValue(120);

      const data = await getBudgetWorkspaceData({
        departmentId: "department-1",
        fiscalYearId: "fy-1",
        worksheet,
        page: 2,
        pageSize: 500,
        search: "sentinel",
        sort: "amount",
      });

      expect(prismaMock.budgetAnnualFinancial.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          budgetPlanId: { in: ["plan-1"] },
          budgetItem: { departmentId: "department-1" },
          worksheet: worksheet === "Hardware" ? "HARDWARE" : "SOFTWARE_SAAS",
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
    }
  );
});
