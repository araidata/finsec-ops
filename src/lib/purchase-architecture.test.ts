import { describe, expect, it } from "vitest";

import {
  calculatePurchaseBudgetAllocation,
  calculatePurchaseTotal,
  canCreatePurchaseFromRequest,
  clearInvalidChildSelection,
  featureUniquenessKey,
  filterActiveVendors,
  filterEligibleSellersForProduct,
  filterFeaturesByProductAndModule,
  filterModulesByProduct,
  filterProductsByVendor,
  filterVehiclesBySellerAndProduct,
  isCompanyCompatibleWithSellerRelationship,
  isCommittedPurchaseStatus,
  isPermittedSeller,
  latestUsageMeasurement,
  validateFeatureBelongsToSelection,
  validateModuleBelongsToProduct,
  type CompanyOption,
  type ProductFeatureOption,
  type ProductModuleOption,
  type ProductOption,
} from "@/lib/purchase-architecture";

const companies: CompanyOption[] = [
  { id: "microsoft", name: "Microsoft", active: true, roles: ["VENDOR"] },
  { id: "shi", name: "SHI", active: true, roles: ["RESELLER"] },
  {
    id: "unit42",
    name: "Unit 42",
    active: true,
    roles: ["VENDOR", "SERVICE_PROVIDER"],
  },
  {
    id: "presidio",
    name: "Presidio",
    active: false,
    roles: ["RESELLER", "IMPLEMENTATION_PARTNER"],
  },
  { id: "consultant", name: "Consultant", active: true, roles: ["CONSULTANT"] },
];

const products: ProductOption[] = [
  { id: "purview", vendorCompanyId: "microsoft", active: true },
  { id: "defender", vendorCompanyId: "microsoft", active: false },
  { id: "mdr", vendorCompanyId: "unit42", active: true },
];

const modules: ProductModuleOption[] = [
  { id: "dlp", productId: "purview", active: true },
  { id: "irm", productId: "purview", active: false },
  { id: "response", productId: "mdr", active: true },
];

const features: ProductFeatureOption[] = [
  { id: "endpoint-dlp", productId: "purview", moduleId: "dlp", active: true },
  { id: "exchange-dlp", productId: "purview", moduleId: "dlp", active: true },
  { id: "mdr-hunting", productId: "mdr", active: true },
];

describe("purchase architecture rules", () => {
  it("filters vendors, products, modules, and features by active parent records", () => {
    expect(filterActiveVendors(companies).map((company) => company.id)).toEqual(
      ["microsoft", "unit42"]
    );
    expect(
      filterProductsByVendor(products, "microsoft").map((product) => product.id)
    ).toEqual(["purview"]);
    expect(
      filterModulesByProduct(modules, "purview").map((module) => module.id)
    ).toEqual(["dlp"]);
    expect(
      filterFeaturesByProductAndModule(features, "purview", "dlp").map(
        (feature) => feature.id
      )
    ).toEqual(["endpoint-dlp", "exchange-dlp"]);
  });

  it("validates parent-child selections server-side", () => {
    expect(validateModuleBelongsToProduct(modules[0], "purview")).toBe(true);
    expect(validateModuleBelongsToProduct(modules[0], "mdr")).toBe(false);
    expect(
      validateFeatureBelongsToSelection(features[0], "purview", "dlp")
    ).toBe(true);
    expect(
      validateFeatureBelongsToSelection(features[0], "purview", "response")
    ).toBe(false);
  });

  it("filters sellers by product relationship and permitted company role", () => {
    expect(isPermittedSeller(companies[0])).toBe(true);
    expect(isPermittedSeller(companies[4])).toBe(false);

    const sellers = filterEligibleSellersForProduct(
      companies,
      [
        {
          id: "purview-shi",
          productId: "purview",
          sellerCompanyId: "shi",
          active: true,
          preferred: true,
        },
        {
          id: "purview-consultant",
          productId: "purview",
          sellerCompanyId: "consultant",
          active: true,
          preferred: false,
        },
      ],
      "purview"
    );

    expect(sellers.map((seller) => seller.id)).toEqual(["shi"]);
  });

  it("validates seller relationship role compatibility", () => {
    expect(
      isCompanyCompatibleWithSellerRelationship(companies[0], "DIRECT_VENDOR")
    ).toBe(true);
    expect(
      isCompanyCompatibleWithSellerRelationship(companies[1], "RESELLER")
    ).toBe(true);
    expect(
      isCompanyCompatibleWithSellerRelationship(
        companies[2],
        "SERVICE_PROVIDER"
      )
    ).toBe(true);
    expect(
      isCompanyCompatibleWithSellerRelationship(companies[4], "RESELLER")
    ).toBe(false);
  });

  it("filters purchasing vehicles by seller and product eligibility", () => {
    expect(
      filterVehiclesBySellerAndProduct({
        vehicleSellers: [
          {
            id: "dir-shi",
            purchasingVehicleId: "dir",
            sellerCompanyId: "shi",
            active: true,
          },
          {
            id: "buyboard-shi",
            purchasingVehicleId: "buyboard",
            sellerCompanyId: "shi",
            active: true,
          },
        ],
        productEligibility: [
          {
            id: "dir-purview",
            purchasingVehicleSellerId: "dir-shi",
            productId: "purview",
            active: true,
          },
          {
            id: "buyboard-mdr",
            purchasingVehicleSellerId: "buyboard-shi",
            productId: "mdr",
            active: true,
          },
        ],
        sellerCompanyId: "shi",
        productId: "purview",
      })
    ).toEqual(["dir"]);
  });

  it("keeps purchase lifecycle separate from request workflow", () => {
    expect(canCreatePurchaseFromRequest("DRAFT")).toBe(false);
    expect(canCreatePurchaseFromRequest("UNDER_REVIEW")).toBe(false);
    expect(canCreatePurchaseFromRequest("APPROVED")).toBe(true);
    expect(isCommittedPurchaseStatus("COMMITTED")).toBe(true);
    expect(isCommittedPurchaseStatus("CANCELED")).toBe(false);
  });

  it("derives purchase totals and allows split budget allocations", () => {
    expect(
      calculatePurchaseTotal([
        { totalCost: 1000, recurringCost: 1000 },
        { totalCost: 250, implementationCost: 250 },
      ])
    ).toBe(1250);

    expect(
      calculatePurchaseBudgetAllocation(
        [
          {
            purchaseId: "purchase-1",
            purchaseItemId: "item-1",
            allocatedAmount: 700,
          },
          {
            purchaseId: "purchase-1",
            purchaseItemId: "item-2",
            allocatedAmount: 300,
          },
          { purchaseId: "purchase-2", allocatedAmount: 200 },
        ],
        "purchase-1"
      )
    ).toBe(1000);
  });

  it("builds distinct uniqueness keys for product-level and module-level features", () => {
    expect(
      featureUniquenessKey({
        productId: "purview",
        name: "Endpoint DLP",
      })
    ).toBe("purview:product:endpoint dlp");
    expect(
      featureUniquenessKey({
        productId: "purview",
        moduleId: "dlp",
        name: "Endpoint DLP",
      })
    ).toBe("purview:module:dlp:endpoint dlp");
  });

  it("clears invalid dependent selections and keeps inactive historical values readable upstream", () => {
    expect(clearInvalidChildSelection("dlp", modules)).toBe("dlp");
    expect(
      clearInvalidChildSelection("dlp", filterModulesByProduct(modules, "mdr"))
    ).toBeUndefined();
  });

  it("calculates the latest usage measurement without overwriting history", () => {
    const latest = latestUsageMeasurement([
      {
        id: "old",
        deploymentId: "deployment",
        measuredAt: "2026-09-30",
        utilizationPercent: 60,
      },
      {
        id: "new",
        deploymentId: "deployment",
        measuredAt: "2026-12-31",
        utilizationPercent: 82,
      },
    ]);

    expect(latest?.id).toBe("new");
  });
});
