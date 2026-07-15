import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateMaintenanceRenewalRegister } from "@/lib/server/maintenance-renewal-service";

const prismaMock = vi.hoisted(() => ({
  company: { findFirst: vi.fn() },
  product: { findFirst: vi.fn() },
  teamMember: { findFirst: vi.fn() },
  maintenanceRenewal: { findUnique: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => prismaMock,
}));

const input = {
  id: "renewal-1",
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
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback({
        maintenanceRenewal: { update: vi.fn() },
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
});
