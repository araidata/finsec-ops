import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  calculatedAnnualAmount,
  calculatedTotalAmount,
  deleteContract,
  getContractDetail,
  getContractEditorOptions,
  getContractPageData,
  listContracts,
  pushContractToBudget,
  renewalLineVariance,
  resolveLineAmounts,
  saveContractWithLineItems,
  reorderContractLineItems,
  sumContractLineAmounts,
} from "@/lib/server/contract-service";

const prismaMock = vi.hoisted(() => ({
  company: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  product: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  productModule: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  contract: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  contractLineItem: {
    count: vi.fn(),
  },
  fiscalYear: {
    findUnique: vi.fn(),
  },
  paymentFrequencyOption: {
    findMany: vi.fn(),
  },
  licenseMetricOption: {
    findMany: vi.fn(),
  },
  budgetPlan: {
    findUnique: vi.fn(),
  },
  budgetAccount: {
    findUnique: vi.fn(),
  },
  budgetItem: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  budgetAnnualFinancial: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  activityLog: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => prismaMock,
}));

vi.mock("@/lib/server/authorization", () => ({
  requirePermission: vi.fn().mockResolvedValue({ actorId: null }),
}));

describe("contract service financial helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.company.findFirst.mockResolvedValue({ id: "company" });
    prismaMock.company.findMany.mockResolvedValue([]);
    prismaMock.product.findFirst.mockResolvedValue({
      id: "product-1",
      vendorCompanyId: "vendor-1",
    });
    prismaMock.product.findMany.mockResolvedValue([
      { id: "product-1", vendorCompanyId: "vendor-1" },
    ]);
    prismaMock.productModule.findUnique.mockResolvedValue({
      id: "module-1",
      productId: "product-1",
    });
    prismaMock.productModule.findMany.mockResolvedValue([
      { id: "module-1", productId: "product-1" },
    ]);
    prismaMock.contract.findUnique.mockResolvedValue(null);
    prismaMock.contract.findMany.mockResolvedValue([]);
    prismaMock.contract.findFirst.mockResolvedValue(null);
    prismaMock.contract.count.mockResolvedValue(0);
    prismaMock.contract.aggregate.mockResolvedValue({
      _sum: { annualValue: null, totalValue: null },
    });
    prismaMock.contract.delete.mockResolvedValue({ id: "contract-1" });
    prismaMock.contract.update.mockResolvedValue({ id: "contract-1" });
    prismaMock.contract.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.contractLineItem.count.mockResolvedValue(0);
    prismaMock.paymentFrequencyOption.findMany.mockResolvedValue([
      { key: "MONTHLY" },
    ]);
    prismaMock.licenseMetricOption.findMany.mockResolvedValue([
      { key: "USERS" },
    ]);
    prismaMock.budgetPlan.findUnique.mockResolvedValue({
      id: "plan-1",
      fiscalYearId: "fy-1",
      scenarios: [{ id: "scenario-1", isActive: true }],
    });
    prismaMock.budgetAccount.findUnique.mockResolvedValue({
      id: "account-1",
      active: true,
      defaultWorksheet: "MAINTENANCE_RENEWALS",
    });
    prismaMock.budgetItem.findFirst.mockResolvedValue(null);
    prismaMock.budgetItem.create.mockResolvedValue({ id: "budget-item-1" });
    prismaMock.budgetAnnualFinancial.findFirst.mockResolvedValue(null);
    prismaMock.budgetAnnualFinancial.create.mockResolvedValue({
      id: "annual-1",
    });
    prismaMock.budgetAnnualFinancial.update.mockResolvedValue({
      id: "annual-1",
    });
    prismaMock.budgetAnnualFinancial.count.mockResolvedValue(0);
    prismaMock.$transaction.mockImplementation(async (callback) =>
      typeof callback === "function"
        ? callback({
            contract: {
              create: vi.fn().mockResolvedValue({ id: "contract-1" }),
              update: vi.fn().mockResolvedValue({ id: "contract-1" }),
              updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            },
            contractLineItem: {
              create: vi.fn(),
              createMany: vi.fn(),
              update: vi.fn(),
              deleteMany: vi.fn(),
              findMany: vi.fn().mockResolvedValue([]),
            },
            $executeRaw: vi.fn(),
            budgetItem: prismaMock.budgetItem,
            budgetAnnualFinancial: prismaMock.budgetAnnualFinancial,
            activityLog: prismaMock.activityLog,
          })
        : Promise.all(callback)
    );
  });

  it("sums contract header totals from line items", () => {
    expect(
      sumContractLineAmounts([
        { annualAmount: "456000.00", totalAmount: "456000.00" },
        { annualAmount: "336000.00", totalAmount: "336000.00" },
        { annualAmount: "458000.00", totalAmount: "458000.00" },
      ])
    ).toEqual({
      annualValue: 1250000,
      totalValue: 1250000,
    });
  });

  it("calculates quoted and final renewal variance", () => {
    expect(
      renewalLineVariance({
        currentAnnualAmount: "100000.00",
        quotedAnnualAmount: "112000.00",
        finalAmount: "106000.00",
      })
    ).toEqual({
      quotedVariance: 12000,
      finalVariance: 6000,
      quotedVariancePercent: 0.12,
      finalVariancePercent: 0.06,
    });
  });

  it("handles zero current amount safely", () => {
    expect(
      renewalLineVariance({
        currentAnnualAmount: "0.00",
        quotedAnnualAmount: "5000.00",
        finalAmount: "4500.00",
      })
    ).toEqual({
      quotedVariance: 5000,
      finalVariance: 4500,
      quotedVariancePercent: 0,
      finalVariancePercent: 0,
    });
  });

  it("defaults annual and total amounts from quantity, price, and term", () => {
    const startsOn = new Date("2026-01-01T00:00:00.000Z");
    const endsOn = new Date("2026-12-31T00:00:00.000Z");

    expect(calculatedAnnualAmount({ quantity: 10, unitPrice: 25 })).toBe(250);
    expect(
      Math.round(
        calculatedTotalAmount({
          annualAmount: 250,
          startsOn,
          endsOn,
        })
      )
    ).toBe(250);
    expect(
      resolveLineAmounts({
        quantity: 2,
        unitPrice: 100,
        annualAmount: "",
        totalAmount: "",
        startsOn,
        endsOn,
      })
    ).toEqual({
      annualAmount: 200,
      totalAmount: 200,
    });
  });

  it("creates a contract with one product in one transaction", async () => {
    await expect(
      saveContractWithLineItems({
        title: "Endpoint Suite",
        vendorCompanyId: "vendor-1",
        contractType: "SAAS",
        startsOn: "2026-01-01",
        endsOn: "2026-12-31",
        paymentFrequency: "ANNUAL",
        status: "ACTIVE",
        renewalRiskLevel: "LOW",
        lines: [
          {
            productId: "product-1",
            productModuleId: "module-1",
            description: "Endpoint seats",
            quantity: "10",
            unitPrice: "100",
            annualAmount: "",
            totalAmount: "",
            startsOn: "2026-01-01",
            endsOn: "2026-12-31",
            renewable: true,
            sortOrder: "0",
          },
        ],
      })
    ).resolves.toBe("contract-1");

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it("creates a contract with multiple products", async () => {
    await saveContractWithLineItems({
      title: "Platform Suite",
      vendorCompanyId: "vendor-1",
      contractType: "SAAS",
      startsOn: "2026-01-01",
      endsOn: "2026-12-31",
      paymentFrequency: "ANNUAL",
      status: "ACTIVE",
      renewalRiskLevel: "LOW",
      lines: [
        {
          productId: "product-1",
          description: "Core platform",
          quantity: "1",
          unitPrice: "50000",
          annualAmount: "",
          totalAmount: "",
          renewable: true,
          sortOrder: "0",
        },
        {
          productId: "product-1",
          description: "Support",
          quantity: "1",
          unitPrice: "5000",
          annualAmount: "",
          totalAmount: "",
          renewable: true,
          sortOrder: "1",
        },
      ],
    });

    expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it("does not create the contract when one product row is invalid", async () => {
    await expect(
      saveContractWithLineItems({
        title: "Broken Suite",
        vendorCompanyId: "vendor-1",
        contractType: "SAAS",
        startsOn: "2026-01-01",
        endsOn: "2026-12-31",
        paymentFrequency: "ANNUAL",
        status: "ACTIVE",
        renewalRiskLevel: "LOW",
        lines: [
          {
            productId: "product-1",
            description: "",
            quantity: "1",
            unitPrice: "100",
            annualAmount: "",
            totalAmount: "",
            renewable: true,
            sortOrder: "0",
          },
        ],
      })
    ).rejects.toThrow("Review the highlighted fields.");

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects product selections outside the contract vendor", async () => {
    prismaMock.product.findMany.mockResolvedValue([
      { id: "product-2", vendorCompanyId: "other-vendor" },
    ]);

    await expect(
      saveContractWithLineItems({
        title: "Wrong Vendor",
        vendorCompanyId: "vendor-1",
        contractType: "SAAS",
        startsOn: "2026-01-01",
        endsOn: "2026-12-31",
        paymentFrequency: "ANNUAL",
        status: "ACTIVE",
        renewalRiskLevel: "LOW",
        lines: [
          {
            productId: "product-2",
            description: "Wrong product",
            quantity: "1",
            unitPrice: "100",
            annualAmount: "",
            totalAmount: "",
            renewable: true,
            sortOrder: "0",
          },
        ],
      })
    ).rejects.toThrow("Product does not match vendor.");
  });

  it("requires a product for every submitted pricing row", async () => {
    await expect(
      saveContractWithLineItems({
        title: "Missing Product",
        vendorCompanyId: "vendor-1",
        contractType: "SAAS",
        startsOn: "2026-01-01",
        endsOn: "2026-12-31",
        paymentFrequency: "ANNUAL",
        status: "ACTIVE",
        renewalRiskLevel: "LOW",
        lines: [
          {
            description: "Endpoint seats",
            quantity: "10",
            unitPrice: "100",
            annualAmount: "",
            totalAmount: "",
            renewable: true,
            sortOrder: "0",
          },
        ],
      })
    ).rejects.toThrow("Select a product for each pricing row.");

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects components outside the selected product", async () => {
    prismaMock.productModule.findMany.mockResolvedValue([
      { id: "module-2", productId: "another-product" },
    ]);

    await expect(
      saveContractWithLineItems({
        title: "Wrong Module",
        vendorCompanyId: "vendor-1",
        contractType: "SAAS",
        startsOn: "2026-01-01",
        endsOn: "2026-12-31",
        paymentFrequency: "ANNUAL",
        status: "ACTIVE",
        renewalRiskLevel: "LOW",
        lines: [
          {
            productId: "product-1",
            productModuleId: "module-2",
            description: "Wrong component",
            quantity: "1",
            unitPrice: "100",
            annualAmount: "",
            totalAmount: "",
            renewable: true,
            sortOrder: "0",
          },
        ],
      })
    ).rejects.toThrow("Product Component does not match.");
  });

  it("reconciles edited product rows", async () => {
    prismaMock.contract.findUnique.mockResolvedValue({
      id: "contract-1",
      updatedAt: new Date("2026-07-29T12:00:00.000Z"),
      lineItems: [{ id: "line-1" }, { id: "line-2" }],
    });

    await saveContractWithLineItems({
      id: "contract-1",
      expectedUpdatedAt: "2026-07-29T12:00:00.000Z",
      title: "Edited Suite",
      vendorCompanyId: "vendor-1",
      contractType: "SAAS",
      startsOn: "2026-01-01",
      endsOn: "2026-12-31",
      paymentFrequency: "ANNUAL",
      status: "ACTIVE",
      renewalRiskLevel: "LOW",
      lines: [
        {
          id: "line-1",
          productId: "product-1",
          description: "Updated line",
          quantity: "2",
          unitPrice: "100",
          annualAmount: "",
          totalAmount: "",
          renewable: true,
          sortOrder: "0",
        },
      ],
    });

    expect(prismaMock.contract.findUnique).toHaveBeenCalled();
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it("preserves existing product rows when an existing header submits no rows", async () => {
    prismaMock.contract.findUnique.mockResolvedValue({
      id: "contract-1",
      updatedAt: new Date("2026-07-29T12:00:00.000Z"),
      vendorCompanyId: "vendor-1",
      sellerCompanyId: "seller-that-is-historical",
      lineItems: [{ id: "line-1" }],
    });

    await expect(
      saveContractWithLineItems({
        id: "contract-1",
        expectedUpdatedAt: "2026-07-29T12:00:00.000Z",
        title: "Header Only",
        vendorCompanyId: "vendor-1",
        sellerCompanyId: "seller-that-is-historical",
        contractType: "SAAS",
        startsOn: "2026-01-01",
        endsOn: "2026-12-31",
        paymentFrequency: "ANNUAL",
        status: "ACTIVE",
        renewalRiskLevel: "LOW",
        lines: [],
      })
    ).resolves.toBe("contract-1");

    expect(prismaMock.contract.updateMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("bounds and scopes the Contract register query in PostgreSQL", async () => {
    await listContracts(
      { departmentId: "department-1" },
      {
        search: "endpoint",
        vendorCompanyId: "vendor-1",
        status: "ACTIVE",
        sortBy: "annualValue",
        sortDirection: "desc",
        pageSize: 500,
      }
    );

    expect(prismaMock.contract.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 101,
        orderBy: [{ annualValue: "desc" }, { title: "asc" }, { id: "asc" }],
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { departmentId: "department-1" },
            { vendorCompanyId: "vendor-1" },
            { status: "ACTIVE" },
          ]),
        }),
      })
    );
    const query = prismaMock.contract.findMany.mock.calls[0]?.[0];
    expect(query.select.lineItems).toBeUndefined();
    expect(query.select.documents).toBeUndefined();
    expect(query.select.maintenanceRenewals.select.lineItems).toBeUndefined();
    expect(query.select.maintenanceRenewals.take).toBe(1);
  });

  it("keeps selected Contract child collections independently bounded", async () => {
    await getContractDetail("contract-1", { departmentId: "department-1" });

    expect(prismaMock.contract.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [{ id: "contract-1" }, { departmentId: "department-1" }],
        },
        select: expect.objectContaining({
          lineItems: expect.objectContaining({ take: 100 }),
          maintenanceRenewals: expect.objectContaining({ take: 20 }),
          documents: expect.objectContaining({ take: 20 }),
        }),
      })
    );
  });

  it("loads editor references by selected vendor and Products", async () => {
    const options = await getContractEditorOptions({
      vendorCompanyId: "vendor-1",
      productIds: ["product-1"],
    });

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          active: true,
          OR: expect.arrayContaining([{ vendorCompanyId: "vendor-1" }]),
        }),
        take: 100,
      })
    );
    expect(prismaMock.productModule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          active: true,
          productId: { in: ["product-1"] },
        },
        take: 100,
      })
    );
    expect(options.paymentFrequencies).toEqual(["MONTHLY"]);
    expect(options.licenseMetrics).toEqual(["USERS"]);
  });

  it("does not load editor or handoff references on a register visit", async () => {
    await getContractPageData();

    expect(prismaMock.paymentFrequencyOption.findMany).not.toHaveBeenCalled();
    expect(prismaMock.licenseMetricOption.findMany).not.toHaveBeenCalled();
    expect(prismaMock.product.findMany).not.toHaveBeenCalled();
    expect(prismaMock.productModule.findMany).not.toHaveBeenCalled();
    expect(prismaMock.budgetAnnualFinancial.findMany).not.toHaveBeenCalled();
  });

  it("rejects a stale composite save before reconciling product rows", async () => {
    prismaMock.contract.findUnique.mockResolvedValue({
      id: "contract-1",
      updatedAt: new Date("2026-07-29T12:00:00.000Z"),
      vendorCompanyId: "vendor-1",
      sellerCompanyId: null,
      lineItems: [{ id: "line-1" }],
    });
    const deleteMany = vi.fn();
    prismaMock.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        contract: {
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        contractLineItem: { deleteMany },
      })
    );

    await expect(
      saveContractWithLineItems({
        id: "contract-1",
        expectedUpdatedAt: "2026-07-29T12:00:00.000Z",
        title: "Stale Suite",
        vendorCompanyId: "vendor-1",
        contractType: "SAAS",
        startsOn: "2026-01-01",
        endsOn: "2026-12-31",
        paymentFrequency: "ANNUAL",
        status: "ACTIVE",
        renewalRiskLevel: "LOW",
        lines: [
          {
            id: "line-1",
            productId: "product-1",
            description: "Core platform",
            quantity: "1",
            unitPrice: "100",
            annualAmount: "100",
            totalAmount: "100",
            renewable: true,
            sortOrder: "0",
          },
        ],
      })
    ).rejects.toThrow("This contract changed after you opened it.");
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("reorders only the complete line set for the selected contract", async () => {
    prismaMock.contract.findUnique.mockResolvedValue({
      id: "contract-1",
      departmentId: "department-1",
    });
    const executeRaw = vi.fn().mockResolvedValue(2);
    prismaMock.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        contract: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        contractLineItem: {
          findMany: vi
            .fn()
            .mockResolvedValue([{ id: "line-1" }, { id: "line-2" }]),
        },
        $executeRaw: executeRaw,
      })
    );

    await expect(
      reorderContractLineItems({
        contractId: "contract-1",
        expectedUpdatedAt: "2026-07-29T12:00:00.000Z",
        orderedIds: ["line-2", "line-1"],
      })
    ).resolves.toBe("contract-1");
    expect(executeRaw).toHaveBeenCalledOnce();
  });

  it("rejects reorder IDs that do not belong to the contract", async () => {
    prismaMock.contract.findUnique.mockResolvedValue({
      id: "contract-1",
      departmentId: "department-1",
    });
    const executeRaw = vi.fn();
    prismaMock.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        contract: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        contractLineItem: {
          findMany: vi
            .fn()
            .mockResolvedValue([{ id: "line-1" }, { id: "line-2" }]),
        },
        $executeRaw: executeRaw,
      })
    );

    await expect(
      reorderContractLineItems({
        contractId: "contract-1",
        expectedUpdatedAt: "2026-07-29T12:00:00.000Z",
        orderedIds: ["line-1", "line-from-another-contract"],
      })
    ).rejects.toThrow(
      "The contract product rows changed while they were being reordered."
    );
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it("deletes a contract when it has no operational or financial dependencies", async () => {
    prismaMock.contract.findUnique.mockResolvedValue({
      _count: {
        maintenanceRenewals: 0,
        renewals: 0,
        purchases: 0,
        purchaseRequests: 0,
        invoices: 0,
        payments: 0,
        budgetItems: 0,
        budgetLineItems: 0,
      },
    });

    await expect(deleteContract("contract-1")).resolves.toEqual({
      id: "contract-1",
      mode: "deleted",
    });

    expect(prismaMock.contractLineItem.count).toHaveBeenCalledWith({
      where: { contractId: "contract-1", deployments: { some: {} } },
    });
    expect(prismaMock.contract.delete).toHaveBeenCalledWith({
      where: { id: "contract-1" },
    });
    expect(prismaMock.contract.update).not.toHaveBeenCalled();
  });

  it("terminates a contract instead of deleting it when linked records exist", async () => {
    prismaMock.contract.findUnique.mockResolvedValue({
      _count: {
        maintenanceRenewals: 1,
        renewals: 0,
        purchases: 0,
        purchaseRequests: 0,
        invoices: 0,
        payments: 0,
        budgetItems: 0,
        budgetLineItems: 0,
      },
    });

    await expect(deleteContract("contract-1")).resolves.toEqual({
      id: "contract-1",
      mode: "terminated",
    });

    expect(prismaMock.contract.update).toHaveBeenCalledWith({
      where: { id: "contract-1" },
      data: { status: "TERMINATED" },
    });
    expect(prismaMock.contract.delete).not.toHaveBeenCalled();
  });

  it("terminates a contract instead of deleting deployed contract lines", async () => {
    prismaMock.contract.findUnique.mockResolvedValue({
      _count: {
        maintenanceRenewals: 0,
        renewals: 0,
        purchases: 0,
        purchaseRequests: 0,
        invoices: 0,
        payments: 0,
        budgetItems: 0,
        budgetLineItems: 0,
      },
    });
    prismaMock.contractLineItem.count.mockResolvedValue(1);

    await expect(deleteContract("contract-1")).resolves.toEqual({
      id: "contract-1",
      mode: "terminated",
    });

    expect(prismaMock.contract.update).toHaveBeenCalledWith({
      where: { id: "contract-1" },
      data: { status: "TERMINATED" },
    });
    expect(prismaMock.contract.delete).not.toHaveBeenCalled();
  });

  it("pushes a contract into a budget annual financial row", async () => {
    prismaMock.contract.findUnique.mockResolvedValue({
      id: "contract-1",
      vendorId: "vendor-1",
      resellerId: "seller-1",
      vendorCompanyId: "vendor-company-1",
      sellerCompanyId: "seller-company-1",
      contractNumber: "CT-1",
      title: "Contract Budget Row",
      annualValue: "250000",
      businessOwner: "Security Operations",
      contractOwner: "CISO",
      securityOwner: "Endpoint Security",
      renewalStrategy: "Renew after usage review.",
      lineItems: [{ productId: "product-1", productModuleId: "module-1" }],
      products: [],
      productModules: [],
    });

    await expect(
      pushContractToBudget({
        contractId: "contract-1",
        fiscalYearId: "fy-1",
        budgetPlanId: "plan-1",
        accountId: "account-1",
      })
    ).resolves.toBe("annual-1");

    expect(prismaMock.budgetItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contractId: "contract-1",
          productId: "product-1",
          productModuleId: "module-1",
        }),
      })
    );
    expect(prismaMock.budgetAnnualFinancial.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestedAmount: "250000",
          proposedAmount: "250000",
          forecastAmount: "250000",
          worksheet: "SOFTWARE_SAAS",
          worksheetDetails: expect.objectContaining({
            requestType: "New",
            resellerLabel: "seller-1",
          }),
        }),
      })
    );
  });
});
