export type CompanyRoleType =
  | "VENDOR"
  | "RESELLER"
  | "SERVICE_PROVIDER"
  | "IMPLEMENTATION_PARTNER"
  | "CONSULTANT";

export type PurchaseStatus =
  "APPROVED" | "ORDERED" | "COMMITTED" | "RECEIVED" | "COMPLETED" | "CANCELED";

export type PurchaseRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ORDERED"
  | "CANCELED";

export type CompanyOption = {
  id: string;
  name: string;
  active: boolean;
  roles: CompanyRoleType[];
};

export type ProductOption = {
  id: string;
  vendorCompanyId: string;
  active: boolean;
};

export type ProductModuleOption = {
  id: string;
  productId: string;
  active: boolean;
};

export type ProductFeatureOption = {
  id: string;
  productId: string;
  moduleId?: string;
  active: boolean;
};

export type ProductSellerOption = {
  id: string;
  productId: string;
  sellerCompanyId: string;
  active: boolean;
  preferred: boolean;
};

export type PurchasingVehicleSellerOption = {
  id: string;
  purchasingVehicleId: string;
  sellerCompanyId: string;
  active: boolean;
};

export type PurchasingVehicleProductEligibilityOption = {
  id: string;
  purchasingVehicleSellerId: string;
  productId?: string;
  productModuleId?: string;
  active: boolean;
};

export type PurchaseItemCost = {
  totalCost: number;
  recurringCost?: number;
  implementationCost?: number;
};

export type BudgetAllocation = {
  purchaseId: string;
  purchaseItemId?: string;
  allocatedAmount: number;
};

export const permittedSellerRoles = new Set<CompanyRoleType>([
  "VENDOR",
  "RESELLER",
  "SERVICE_PROVIDER",
]);

export function isPermittedSeller(company: CompanyOption): boolean {
  return company.roles.some((role) => permittedSellerRoles.has(role));
}

export function filterActiveVendors(
  companies: readonly CompanyOption[]
): CompanyOption[] {
  return companies.filter(
    (company) => company.active && company.roles.includes("VENDOR")
  );
}

export function filterProductsByVendor(
  products: readonly ProductOption[],
  vendorCompanyId: string
): ProductOption[] {
  return products.filter(
    (product) => product.active && product.vendorCompanyId === vendorCompanyId
  );
}

export function filterModulesByProduct(
  modules: readonly ProductModuleOption[],
  productId: string
): ProductModuleOption[] {
  return modules.filter(
    (productModule) =>
      productModule.active && productModule.productId === productId
  );
}

export function filterFeaturesByProductAndModule(
  features: readonly ProductFeatureOption[],
  productId: string,
  moduleId?: string
): ProductFeatureOption[] {
  return features.filter((feature) => {
    if (!feature.active || feature.productId !== productId) {
      return false;
    }

    return moduleId ? feature.moduleId === moduleId : true;
  });
}

export function filterEligibleSellersForProduct(
  companies: readonly CompanyOption[],
  productSellers: readonly ProductSellerOption[],
  productId: string
): CompanyOption[] {
  const eligibleSellerIds = new Set(
    productSellers
      .filter((seller) => seller.active && seller.productId === productId)
      .sort((a, b) => Number(b.preferred) - Number(a.preferred))
      .map((seller) => seller.sellerCompanyId)
  );

  return companies.filter(
    (company) =>
      company.active &&
      eligibleSellerIds.has(company.id) &&
      isPermittedSeller(company)
  );
}

export function filterVehiclesBySellerAndProduct({
  vehicleSellers,
  productEligibility,
  sellerCompanyId,
  productId,
  productModuleId,
}: {
  vehicleSellers: readonly PurchasingVehicleSellerOption[];
  productEligibility: readonly PurchasingVehicleProductEligibilityOption[];
  sellerCompanyId: string;
  productId?: string;
  productModuleId?: string;
}): string[] {
  const activeVehicleSellerIds = new Set(
    vehicleSellers
      .filter(
        (vehicleSeller) =>
          vehicleSeller.active &&
          vehicleSeller.sellerCompanyId === sellerCompanyId
      )
      .map((vehicleSeller) => vehicleSeller.id)
  );

  const matchingEligibility = productEligibility.filter((eligibility) => {
    if (
      !eligibility.active ||
      !activeVehicleSellerIds.has(eligibility.purchasingVehicleSellerId)
    ) {
      return false;
    }

    const productMatches =
      !eligibility.productId || eligibility.productId === productId;
    const moduleMatches =
      !eligibility.productModuleId ||
      eligibility.productModuleId === productModuleId;

    return productMatches && moduleMatches;
  });

  return [
    ...new Set(
      matchingEligibility
        .map(
          (eligibility) =>
            vehicleSellers.find(
              (vehicleSeller) =>
                vehicleSeller.id === eligibility.purchasingVehicleSellerId
            )?.purchasingVehicleId
        )
        .filter((id): id is string => Boolean(id))
    ),
  ];
}

export function validateModuleBelongsToProduct(
  productModule: ProductModuleOption | undefined,
  productId: string
): boolean {
  return Boolean(productModule && productModule.productId === productId);
}

export function validateFeatureBelongsToSelection(
  feature: ProductFeatureOption | undefined,
  productId: string,
  moduleId?: string
): boolean {
  if (!feature || feature.productId !== productId) {
    return false;
  }

  return moduleId ? feature.moduleId === moduleId : true;
}

export function calculatePurchaseTotal(
  items: readonly PurchaseItemCost[]
): number {
  return items.reduce((total, item) => total + item.totalCost, 0);
}

export function calculatePurchaseBudgetAllocation(
  allocations: readonly BudgetAllocation[],
  purchaseId: string
): number {
  return allocations
    .filter((allocation) => allocation.purchaseId === purchaseId)
    .reduce((total, allocation) => total + allocation.allocatedAmount, 0);
}

export function isCommittedPurchaseStatus(status: PurchaseStatus): boolean {
  return status !== "CANCELED";
}

export function canCreatePurchaseFromRequest(
  status: PurchaseRequestStatus
): boolean {
  return status === "APPROVED" || status === "ORDERED";
}

export function featureUniquenessKey({
  productId,
  moduleId,
  name,
}: {
  productId: string;
  moduleId?: string;
  name: string;
}): string {
  const normalizedName = name.trim().toLowerCase();
  return moduleId
    ? `${productId}:module:${moduleId}:${normalizedName}`
    : `${productId}:product:${normalizedName}`;
}
