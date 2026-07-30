import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCatalogPageData } from "@/lib/server/catalog-service";

const prismaMock = vi.hoisted(() => ({
  company: { findMany: vi.fn() },
  capability: { findMany: vi.fn() },
  product: { findMany: vi.fn() },
  productModule: { findMany: vi.fn() },
  productFeature: { findMany: vi.fn() },
  productSeller: { findMany: vi.fn() },
  purchasingVehicle: { findMany: vi.fn() },
  purchasingVehicleSeller: { findMany: vi.fn() },
  contract: { findMany: vi.fn() },
  purchase: { findMany: vi.fn() },
  renewal: { findMany: vi.fn() },
}));

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => prismaMock,
}));

describe("getCatalogPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const delegate of Object.values(prismaMock)) {
      delegate.findMany.mockResolvedValue([]);
    }
  });

  it("loads only the vendor workspace datasets with explicit projections", async () => {
    const data = await getCatalogPageData("vendors");

    expect(prismaMock.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { roles: { some: { role: "VENDOR" } } },
        select: expect.objectContaining({
          id: true,
          name: true,
          roles: expect.any(Object),
        }),
      })
    );
    expect(prismaMock.capability.findMany).toHaveBeenCalledOnce();
    expect(prismaMock.product.findMany).toHaveBeenCalledOnce();
    expect(prismaMock.productModule.findMany).toHaveBeenCalledOnce();
    expect(prismaMock.productFeature.findMany).toHaveBeenCalledOnce();
    expect(prismaMock.contract.findMany).not.toHaveBeenCalled();
    expect(prismaMock.purchase.findMany).not.toHaveBeenCalled();
    expect(prismaMock.renewal.findMany).not.toHaveBeenCalled();
    expect(prismaMock.productSeller.findMany).not.toHaveBeenCalled();
    expect(prismaMock.purchasingVehicle.findMany).not.toHaveBeenCalled();
    expect(prismaMock.purchasingVehicleSeller.findMany).not.toHaveBeenCalled();
    expect(data).toEqual({
      companies: [],
      capabilities: [],
      products: [],
      modules: [],
      features: [],
      contracts: [],
      purchases: [],
      renewals: [],
    });
  });

  it("loads only reseller summaries and maps values to client-safe DTOs", async () => {
    const renewalDate = new Date("2026-10-01T00:00:00.000Z");
    prismaMock.contract.findMany.mockResolvedValue([
      {
        id: "contract-1",
        title: "Contract",
        sellerCompanyId: "reseller-1",
        annualValue: { toString: () => "1200.00" },
      },
    ]);
    prismaMock.purchase.findMany.mockResolvedValue([
      {
        id: "purchase-1",
        title: "Purchase",
        sellerCompanyId: "reseller-1",
        totalAmount: { toString: () => "300.00" },
      },
    ]);
    prismaMock.renewal.findMany.mockResolvedValue([
      {
        id: "renewal-1",
        title: "Renewal",
        renewalDate,
        contract: { sellerCompanyId: "reseller-1", title: "Contract" },
      },
    ]);

    const data = await getCatalogPageData("resellers");

    expect(prismaMock.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { roles: { some: { role: "RESELLER" } } },
      })
    );
    expect(prismaMock.contract.findMany).toHaveBeenCalledOnce();
    expect(prismaMock.purchase.findMany).toHaveBeenCalledOnce();
    expect(prismaMock.renewal.findMany).toHaveBeenCalledOnce();
    expect(prismaMock.capability.findMany).not.toHaveBeenCalled();
    expect(prismaMock.product.findMany).not.toHaveBeenCalled();
    expect(prismaMock.productModule.findMany).not.toHaveBeenCalled();
    expect(prismaMock.productFeature.findMany).not.toHaveBeenCalled();
    expect(data.contracts[0]?.annualValue).toBe("1200.00");
    expect(data.purchases[0]?.totalAmount).toBe("300.00");
    expect(data.renewals[0]?.renewalDate).toBe(renewalDate.toISOString());
  });
});
