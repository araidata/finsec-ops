import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteMaintenanceRenewalLineItem,
  saveMaintenanceRenewalLineItem,
  updateMaintenanceRenewalRegister,
} from "@/lib/server/maintenance-renewal-service";

const prismaMock = vi.hoisted(() => ({
  company: { findFirst: vi.fn() },
  product: { findFirst: vi.fn() },
  productModule: { findFirst: vi.fn() },
  teamMember: { findFirst: vi.fn() },
  department: { findFirst: vi.fn() },
  maintenanceRenewal: { findUnique: vi.fn() },
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
    prismaMock.company.findFirst.mockResolvedValue({ id: "company", active: true });
    prismaMock.product.findFirst.mockResolvedValue({
      id: "product-1",
      name: "Security Platform",
      active: true,
      vendorCompanyId: "vendor-1",
    });
    prismaMock.teamMember.findFirst.mockResolvedValue({ id: "owner-1", active: true });
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

  it("saves active vendor, product, reseller, co-op, amount, and status fields", async () => {
    await expect(updateMaintenanceRenewalRegister(input)).resolves.toBe("renewal-1");
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
    await expect(updateMaintenanceRenewalRegister(input)).rejects.toMatchObject({
      message: "Selected company is not eligible.",
      fields: { vendorCompanyId: ["Company must be active with the VENDOR role."] },
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a product that does not belong to the selected vendor", async () => {
    prismaMock.product.findFirst.mockResolvedValue({
      id: "product-1",
      name: "Security Platform",
      active: true,
      vendorCompanyId: "vendor-2",
    });
    await expect(updateMaintenanceRenewalRegister(input)).rejects.toMatchObject({
      fields: { productId: ["Select a product offered by the selected vendor."] },
    });
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

    await expect(updateMaintenanceRenewalRegister(input)).rejects.toMatchObject({
      message: "This renewal changed after you opened it.",
    });
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
