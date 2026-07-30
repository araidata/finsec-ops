import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getCatalogPageData,
  normalizeCatalogPageQuery,
  saveProduct,
} from "@/lib/server/catalog-service";

const transactionMock = vi.hoisted(() => ({
  company: { findFirst: vi.fn() },
  vendor: { upsert: vi.fn() },
  product: {
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  productCapability: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  productModuleCapability: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  productFeatureCapability: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
}));

const prismaMock = vi.hoisted(() => ({
  company: {
    count: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  capability: { findMany: vi.fn() },
  product: {
    count: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    groupBy: vi.fn(),
  },
  productModule: { findMany: vi.fn() },
  productFeature: { findMany: vi.fn() },
  contract: { findMany: vi.fn() },
  purchase: { findMany: vi.fn() },
  renewal: { findMany: vi.fn() },
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
}));

const authorizationMock = vi.hoisted(() => ({
  requirePermission: vi.fn().mockResolvedValue({ actorId: null }),
}));

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => prismaMock,
}));
vi.mock("@/lib/server/authorization", () => authorizationMock);

describe("Product Catalog query contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.company.count.mockResolvedValue(0);
    prismaMock.company.findFirst.mockResolvedValue(null);
    prismaMock.company.findMany.mockResolvedValue([]);
    prismaMock.capability.findMany.mockResolvedValue([]);
    prismaMock.product.count.mockResolvedValue(0);
    prismaMock.product.findFirst.mockResolvedValue(null);
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.product.groupBy.mockResolvedValue([]);
    prismaMock.productModule.findMany.mockResolvedValue([]);
    prismaMock.productFeature.findMany.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValue([]);
    prismaMock.$transaction.mockImplementation(
      (callback: (tx: typeof transactionMock) => unknown) =>
        callback(transactionMock)
    );
    transactionMock.company.findFirst.mockResolvedValue({
      id: "vendor-1",
      name: "Vendor",
      website: null,
      contactEmail: null,
    });
    transactionMock.vendor.upsert.mockResolvedValue({ id: "legacy-vendor-1" });
    transactionMock.product.findFirst.mockResolvedValue(null);
    transactionMock.product.update.mockResolvedValue({ id: "product-1" });
    transactionMock.productCapability.deleteMany.mockResolvedValue({
      count: 1,
    });
    transactionMock.productCapability.createMany.mockResolvedValue({
      count: 2,
    });
  });

  it("replaces Product Capability links in the same transaction as the Product update", async () => {
    await saveProduct({
      id: "product-1",
      vendorCompanyId: "vendor-1",
      name: "Product",
      offeringType: "SAAS",
      productCategory: "OTHER",
      description: "",
      capabilityIds: ["capability-1", "capability-2"],
      active: true,
    });

    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    expect(transactionMock.product.update).toHaveBeenCalledOnce();
    expect(transactionMock.productCapability.deleteMany).toHaveBeenCalledWith({
      where: { productId: "product-1" },
    });
    expect(transactionMock.productCapability.createMany).toHaveBeenCalledWith({
      data: [
        { productId: "product-1", capabilityId: "capability-1" },
        { productId: "product-1", capabilityId: "capability-2" },
      ],
    });
  });

  it("authorizes global Catalog writes before starting persistence", async () => {
    authorizationMock.requirePermission.mockRejectedValueOnce(
      new Error("denied")
    );

    await expect(
      saveProduct({
        id: "product-1",
        vendorCompanyId: "vendor-1",
        name: "Product",
        offeringType: "SAAS",
        productCategory: "OTHER",
        description: "",
        capabilityIds: [],
      })
    ).rejects.toThrow("denied");

    expect(authorizationMock.requirePermission).toHaveBeenCalledWith({
      permission: "catalog.write",
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("normalizes list inputs to stable defaults and a hard maximum", () => {
    expect(normalizeCatalogPageQuery()).toMatchObject({
      search: "",
      status: "active",
      sort: "name-asc",
      page: 1,
      pageSize: 50,
      productPage: 1,
    });
    expect(
      normalizeCatalogPageQuery({
        search: `  ${"x".repeat(250)}  `,
        status: "inactive",
        sort: "name-desc",
        page: "2",
        pageSize: "1000",
      })
    ).toMatchObject({
      search: "x".repeat(200),
      status: "inactive",
      sort: "name-desc",
      page: 2,
      pageSize: 100,
    });
  });

  it("uses a bounded, database-filtered Vendor register query", async () => {
    const data = await getCatalogPageData("vendors", {
      search: "crowd",
      status: "all",
      sort: "name-desc",
      page: 3,
      pageSize: 25,
    });

    expect(prismaMock.company.findMany).toHaveBeenCalledWith({
      where: {
        roles: { some: { role: "VENDOR" } },
        active: undefined,
        name: { contains: "crowd", mode: "insensitive" },
      },
      orderBy: [{ name: "desc" }, { id: "desc" }],
      skip: 50,
      take: 25,
      select: expect.objectContaining({ id: true, name: true }),
    });
    expect(prismaMock.company.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        roles: { some: { role: "VENDOR" } },
      }),
    });
    expect(prismaMock.capability.findMany).not.toHaveBeenCalled();
    expect(prismaMock.contract.findMany).not.toHaveBeenCalled();
    expect(prismaMock.purchase.findMany).not.toHaveBeenCalled();
    expect(prismaMock.renewal.findMany).not.toHaveBeenCalled();
    expect(data).toMatchObject({
      selectedCompany: null,
      selectedProductId: null,
      pagination: { page: 3, pageSize: 25, total: 0 },
      companies: [],
      products: [],
    });
  });

  it("loads only the selected Vendor and Product detail contracts", async () => {
    const company = {
      id: "vendor-1",
      name: "Vendor",
      legalName: null,
      website: null,
      contactEmail: null,
      active: true,
    };
    const productListRow = {
      id: "product-1",
      vendorCompanyId: "vendor-1",
      name: "Product",
      offeringType: "SAAS",
      productCategory: "OTHER",
      description: null,
      active: true,
      _count: { modules: 1, features: 1, sellers: 0 },
    };
    prismaMock.company.count.mockResolvedValue(1);
    prismaMock.company.findMany.mockResolvedValue([company]);
    prismaMock.company.findFirst.mockResolvedValue(company);
    prismaMock.product.groupBy.mockResolvedValue([
      {
        vendorCompanyId: "vendor-1",
        productCategory: "OTHER",
        active: true,
        _count: { _all: 1 },
      },
    ]);
    prismaMock.product.count.mockResolvedValue(1);
    prismaMock.product.findMany.mockResolvedValue([productListRow]);
    prismaMock.product.findFirst.mockResolvedValue({
      ...productListRow,
      capabilities: [],
    });

    const data = await getCatalogPageData("vendors");

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { vendorCompanyId: "vendor-1" },
        take: 50,
        select: expect.not.objectContaining({
          capabilities: expect.anything(),
        }),
      })
    );
    expect(prismaMock.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "product-1", vendorCompanyId: "vendor-1" },
        select: expect.objectContaining({ capabilities: expect.any(Object) }),
      })
    );
    expect(prismaMock.productModule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId: "product-1" },
        take: 100,
      })
    );
    expect(prismaMock.productFeature.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId: "product-1" },
        take: 100,
      })
    );
    expect(data.companies[0]).toMatchObject({
      productCount: 1,
      activeProductCount: 1,
      productCategories: ["OTHER"],
    });
    expect(data.selectedCompany).toEqual(company);
    expect(data.selectedProductId).toBe("product-1");
  });

  it("returns bounded Reseller rows with database-computed summaries", async () => {
    prismaMock.company.count.mockResolvedValue(1);
    prismaMock.company.findMany.mockResolvedValue([
      {
        id: "reseller-1",
        name: "Reseller",
        legalName: null,
        website: null,
        contactEmail: null,
        active: true,
        _count: { sellerContracts: 4, purchaseSellerRecords: 3 },
      },
    ]);
    prismaMock.$queryRaw.mockResolvedValue([
      { sellerCompanyId: "reseller-1", count: 2 },
    ]);

    const data = await getCatalogPageData("resellers", { pageSize: 10 });

    expect(prismaMock.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          roles: { some: { role: "RESELLER" } },
          active: true,
        }),
        take: 10,
        select: expect.objectContaining({
          _count: {
            select: {
              sellerContracts: true,
              purchaseSellerRecords: true,
            },
          },
        }),
      })
    );
    expect(prismaMock.$queryRaw).toHaveBeenCalledOnce();
    expect(prismaMock.contract.findMany).not.toHaveBeenCalled();
    expect(prismaMock.purchase.findMany).not.toHaveBeenCalled();
    expect(prismaMock.renewal.findMany).not.toHaveBeenCalled();
    expect(data.companies[0]).toMatchObject({
      contractCount: 4,
      purchaseCount: 3,
      renewalCount: 2,
    });
    expect(data.products).toEqual([]);
  });
});
