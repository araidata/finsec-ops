import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteMaintenanceRenewalLineItem,
  getMaintenanceRenewalPageData,
  saveMaintenanceRenewalLineItem,
  updateMaintenanceRenewalRegister,
} from "@/lib/server/maintenance-renewal-service";

const prismaMock = vi.hoisted(() => ({
  company: { findFirst: vi.fn(), findMany: vi.fn() },
  product: { findFirst: vi.fn(), findMany: vi.fn() },
  productModule: { findFirst: vi.fn(), findMany: vi.fn() },
  fiscalYear: { findMany: vi.fn() },
  budgetPlan: { findMany: vi.fn() },
  budgetAccount: { findMany: vi.fn() },
  purchasingVehicle: { findMany: vi.fn() },
  teamMember: { findFirst: vi.fn(), findMany: vi.fn() },
  department: { findFirst: vi.fn() },
  activityLog: { findMany: vi.fn() },
  maintenanceRenewal: {
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
  },
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => prismaMock,
}));

vi.mock("@/lib/server/authorization", () => ({
  requirePermission: vi.fn().mockResolvedValue({ actorId: null }),
}));

const input = {
  id: "renewal-1",
  expectedUpdatedAt: "2026-07-29T12:00:00.000Z",
  vendorCompanyId: "vendor-1",
  productId: "product-1",
  sellerCompanyId: "reseller-1",
  renewalDate: "2027-08-31",
  currentAnnualCost: "100000",
  renewalAmount: "108500",
  renewalStatus: "QUOTE_RECEIVED",
  ownerTeamMemberId: "owner-1",
  renewalOwner: "Alex Morgan",
  coOpAgreement: "DIR",
  coOpContractNumber: "DIR-CPO-5237",
  coOpAgreementExpirationDate: "2027-08-31",
};

describe("maintenance renewal register service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.maintenanceRenewal.findUnique.mockResolvedValue({
      id: "renewal-1",
      updatedAt: new Date("2026-07-29T12:00:00.000Z"),
      departmentId: null,
      vendorCompanyId: "vendor-1",
      productId: "product-1",
      sellerCompanyId: null,
      renewalDate: new Date("2027-07-31T00:00:00.000Z"),
      currentAnnualCost: "100000",
      approvedAmount: "100000",
      renewalStatus: "PLANNING",
      ownerTeamMemberId: null,
      renewalOwner: null,
      coOpAgreement: null,
      coOpContractNumber: null,
      coOpAgreementExpirationDate: null,
    });
    prismaMock.company.findFirst.mockResolvedValue({
      id: "company",
      active: true,
    });
    prismaMock.product.findFirst.mockResolvedValue({
      id: "product-1",
      name: "Security Platform",
      active: true,
      vendorCompanyId: "vendor-1",
    });
    prismaMock.teamMember.findFirst.mockResolvedValue({
      id: "owner-1",
      active: true,
    });
    prismaMock.productModule.findFirst.mockResolvedValue({
      id: "module-1",
      productId: "product-1",
      active: true,
    });
    prismaMock.department.findFirst.mockResolvedValue(null);
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback({
        maintenanceRenewal: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findUnique: vi.fn(),
        },
        activityLog: { createMany: vi.fn() },
      })
    );
  });

  it("bounds the register, scopes in PostgreSQL, and reads comment previews set-wise", async () => {
    prismaMock.company.findMany.mockResolvedValue([]);
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.productModule.findMany.mockResolvedValue([]);
    prismaMock.fiscalYear.findMany.mockResolvedValue([]);
    prismaMock.budgetPlan.findMany.mockResolvedValue([]);
    prismaMock.budgetAccount.findMany.mockResolvedValue([]);
    prismaMock.purchasingVehicle.findMany.mockResolvedValue([]);
    prismaMock.teamMember.findMany.mockResolvedValue([]);
    prismaMock.maintenanceRenewal.count.mockResolvedValue(125);
    prismaMock.maintenanceRenewal.findMany.mockResolvedValue([
      {
        id: "renewal-page-row",
        departmentId: "department-1",
        departmentRef: { name: "Security" },
        renewalName: "Security Platform renewal",
        productOrService: "Security Platform",
        vendorCompanyId: "vendor-1",
        sellerCompanyId: null,
        productId: "product-1",
        vendorCompany: { id: "vendor-1", name: "Vendor", active: true },
        sellerCompany: null,
        product: {
          id: "product-1",
          name: "Security Platform",
          active: true,
          vendorCompanyId: "vendor-1",
        },
        ownerTeamMemberId: null,
        ownerTeamMember: null,
        renewalOwner: null,
        renewalDate: new Date("2027-08-31T00:00:00.000Z"),
        currentAnnualCost: "100",
        approvedAmount: "110",
        renewalStatus: "PLANNING",
        coOpAgreement: null,
        coOpContractNumber: null,
        coOpAgreementExpirationDate: null,
        purchasingVehicle: null,
        purchasingAgreement: null,
        createdAt: new Date("2026-07-01T00:00:00.000Z"),
        updatedAt: new Date("2026-07-29T00:00:00.000Z"),
      },
    ]);
    prismaMock.$queryRaw.mockResolvedValue([
      {
        id: "note-1",
        maintenanceRenewalId: "renewal-page-row",
        body: "Latest update",
        createdAt: new Date("2026-07-29T00:00:00.000Z"),
        authorName: null,
      },
    ]);
    prismaMock.maintenanceRenewal.findFirst.mockResolvedValue(null);
    prismaMock.activityLog.findMany.mockResolvedValue([]);

    const result = await getMaintenanceRenewalPageData({
      departmentId: "department-1",
      fiscalYearId: "fy-2027",
      page: 3,
      pageSize: 500,
      search: "platform",
    });

    expect(prismaMock.maintenanceRenewal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 200,
        take: 100,
        where: expect.objectContaining({
          departmentId: "department-1",
          fiscalYearId: "fy-2027",
        }),
      })
    );
    expect(prismaMock.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 500 })
    );
    expect(prismaMock.product.findMany).not.toHaveBeenCalled();
    expect(prismaMock.productModule.findMany).not.toHaveBeenCalled();
    expect(prismaMock.fiscalYear.findMany).not.toHaveBeenCalled();
    expect(prismaMock.budgetPlan.findMany).not.toHaveBeenCalled();
    expect(prismaMock.budgetAccount.findMany).not.toHaveBeenCalled();
    expect(prismaMock.$queryRaw).toHaveBeenCalledOnce();
    expect(prismaMock.maintenanceRenewal.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          notes: expect.objectContaining({ take: 50 }),
          decisionHistory: expect.objectContaining({ take: 50 }),
          lineItems: expect.objectContaining({ take: 100 }),
        }),
      })
    );
    expect(prismaMock.activityLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          entityType: "MaintenanceRenewal",
          entityId: "renewal-page-row",
        },
        take: 50,
      })
    );
    expect(result.renewals[0]?.notes[0]?.body).toBe("Latest update");
    expect(result.pagination).toEqual({
      page: 3,
      pageSize: 100,
      totalCount: 125,
      totalPages: 2,
    });
  });

  it("saves active vendor, product, reseller, co-op, amount, and status fields", async () => {
    await expect(updateMaintenanceRenewalRegister(input)).resolves.toBe(
      "renewal-1"
    );
    expect(prismaMock.company.findFirst).toHaveBeenCalledWith({
      where: {
        id: "vendor-1",
        active: true,
        roles: { some: { role: "VENDOR" } },
      },
    });
    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
  });

  it("rejects a newly selected inactive vendor on the server", async () => {
    prismaMock.company.findFirst.mockResolvedValueOnce(null);
    await expect(updateMaintenanceRenewalRegister(input)).rejects.toMatchObject(
      {
        message: "Selected company is not eligible.",
        fields: {
          vendorCompanyId: ["Company must be active with the VENDOR role."],
        },
      }
    );
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a product that does not belong to the selected vendor", async () => {
    prismaMock.product.findFirst.mockResolvedValue({
      id: "product-1",
      name: "Security Platform",
      active: true,
      vendorCompanyId: "vendor-2",
    });
    await expect(updateMaintenanceRenewalRegister(input)).rejects.toMatchObject(
      {
        fields: {
          productId: ["Select a product offered by the selected vendor."],
        },
      }
    );
  });

  it("rejects a stale register edit without writing audit history", async () => {
    const createMany = vi.fn();
    prismaMock.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        maintenanceRenewal: {
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          findUnique: vi.fn().mockResolvedValue({
            ...input,
            approvedAmount: "125000",
          }),
        },
        activityLog: { createMany },
      })
    );

    await expect(updateMaintenanceRenewalRegister(input)).rejects.toMatchObject(
      {
        message: "This renewal changed after you opened it.",
      }
    );
    expect(createMany).not.toHaveBeenCalled();
  });

  it("does not move an edited product line to a different renewal", async () => {
    const create = vi.fn();
    prismaMock.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        maintenanceRenewalLineItem: {
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          findUnique: vi.fn().mockResolvedValue({
            id: "line-1",
            maintenanceRenewalId: "renewal-2",
          }),
        },
        activityLog: { create },
      })
    );

    await expect(
      saveMaintenanceRenewalLineItem({
        id: "line-1",
        expectedUpdatedAt: "2026-07-29T12:00:00.000Z",
        maintenanceRenewalId: "renewal-1",
        productId: "product-1",
        productModuleId: "module-1",
        description: "Security Platform",
        currentQuantity: "10",
        proposedQuantity: "12",
        currentUnitPrice: "100",
        proposedUnitPrice: "110",
        currentAnnualAmount: "1000",
        quotedAnnualAmount: "1320",
        negotiatedAmount: "1250",
        finalAmount: "1250",
        action: "CHANGE",
        sortOrder: "0",
      })
    ).rejects.toMatchObject({
      message: "Renewal product does not belong to this renewal.",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("preserves a product line that has deployment history", async () => {
    const remove = vi.fn();
    prismaMock.$transaction.mockImplementationOnce(async (callback) =>
      callback({
        maintenanceRenewalLineItem: {
          findUnique: vi.fn().mockResolvedValue({
            maintenanceRenewalId: "renewal-1",
            updatedAt: new Date("2026-07-29T12:00:00.000Z"),
            _count: { deployments: 1 },
          }),
          delete: remove,
        },
        activityLog: { create: vi.fn() },
      })
    );

    await expect(
      deleteMaintenanceRenewalLineItem({
        id: "line-1",
        maintenanceRenewalId: "renewal-1",
        expectedUpdatedAt: "2026-07-29T12:00:00.000Z",
      })
    ).rejects.toMatchObject({
      message:
        "This renewal product has deployment history and cannot be removed.",
    });
    expect(remove).not.toHaveBeenCalled();
  });
});
