import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  calculatedAnnualAmount,
  calculatedTotalAmount,
  pushContractToBudget,
  renewalLineVariance,
  resolveLineAmounts,
  saveContractWithLineItems,
  sumContractLineAmounts,
} from "@/lib/server/contract-service";

const prismaMock = vi.hoisted(() => ({
  company: {
    findFirst: vi.fn(),
  },
  product: {
    findFirst: vi.fn(),
  },
  productModule: {
    findUnique: vi.fn(),
  },
  contract: {
    findUnique: vi.fn(),
    update: vi.fn(),
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
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => prismaMock,
}));

describe("contract service financial helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.company.findFirst.mockResolvedValue({ id: "company" });
    prismaMock.product.findFirst.mockResolvedValue({
      id: "product-1",
      vendorCompanyId: "vendor-1",
    });
    prismaMock.productModule.findUnique.mockResolvedValue({
      id: "module-1",
      productId: "product-1",
    });
    prismaMock.contract.findUnique.mockResolvedValue(null);
    prismaMock.contract.update.mockResolvedValue({ id: "contract-1" });
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
            },
            contractLineItem: {
              create: vi.fn(),
              update: vi.fn(),
              deleteMany: vi.fn(),
            },
            budgetItem: prismaMock.budgetItem,
            budgetAnnualFinancial: prismaMock.budgetAnnualFinancial,
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

    expect(prismaMock.product.findFirst).toHaveBeenCalledTimes(2);
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
    prismaMock.product.findFirst.mockResolvedValue({
      id: "product-2",
      vendorCompanyId: "other-vendor",
    });

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
    prismaMock.productModule.findUnique.mockResolvedValue({
      id: "module-2",
      productId: "another-product",
    });

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
      lineItems: [{ id: "line-1" }, { id: "line-2" }],
    });

    await saveContractWithLineItems({
      id: "contract-1",
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
      vendorCompanyId: "vendor-1",
      sellerCompanyId: "seller-that-is-historical",
      lineItems: [{ id: "line-1" }],
    });

    await expect(
      saveContractWithLineItems({
        id: "contract-1",
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

    expect(prismaMock.contract.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
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
        }),
      })
    );
  });
});
