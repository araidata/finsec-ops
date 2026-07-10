import type {
  AdoptionLevel,
  BudgetItem,
  Contract,
  FundingStatus,
  Product,
  ProductModule,
  RenewalRiskLevel,
} from "@/types/portfolio";

export type BudgetSummary = {
  totalBudgeted: number;
  totalForecasted: number;
  totalActual: number;
  variance: number;
  approvedFunding: number;
  unfundedAmount: number;
};

export type ContractSummary = {
  activeContracts: number;
  annualContractValue: number;
  expiringIn30Days: number;
  expiringIn60Days: number;
  expiringIn90Days: number;
  highRiskRenewals: number;
};

export type ProductSummary = {
  totalProducts: number;
  activeProducts: number;
  underReview: number;
  retiring: number;
  totalAnnualCost: number;
  underusedModules: number;
  redundancyCandidates: number;
};

export type ContractUrgency = "Critical" | "High" | "Medium" | "Low";

const approvedFundingStatuses = new Set<FundingStatus>([
  "Approved",
  "Partially Approved",
]);

const unfundedStatuses = new Set<FundingStatus>([
  "Requested",
  "Deferred",
  "Rejected",
  "Unfunded",
]);

const highRiskLevels = new Set<RenewalRiskLevel>(["High", "Critical"]);

const lowAdoptionLevels = new Set<AdoptionLevel>(["Not Used", "Low"]);

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateBudgetVariance(item: BudgetItem): number {
  return item.budgetedAmount - item.actualAmount;
}

export function calculateBudgetSummary(
  items: readonly BudgetItem[]
): BudgetSummary {
  return items.reduce<BudgetSummary>(
    (summary, item) => {
      summary.totalBudgeted += item.budgetedAmount;
      summary.totalForecasted += item.forecastedAmount;
      summary.totalActual += item.actualAmount;
      summary.variance += calculateBudgetVariance(item);

      if (approvedFundingStatuses.has(item.fundingStatus)) {
        summary.approvedFunding += item.budgetedAmount;
      }

      if (unfundedStatuses.has(item.fundingStatus)) {
        summary.unfundedAmount += item.forecastedAmount;
      }

      return summary;
    },
    {
      totalBudgeted: 0,
      totalForecasted: 0,
      totalActual: 0,
      variance: 0,
      approvedFunding: 0,
      unfundedAmount: 0,
    }
  );
}

export function getBudgetIndicator(item: BudgetItem): string {
  if (item.fundingStatus === "Unfunded") {
    return "Unfunded";
  }

  if (item.fundingStatus === "Deferred") {
    return "Deferred";
  }

  if (item.fundingStatus === "Rejected") {
    return "Rejected";
  }

  if (item.fundingStatus === "Partially Approved") {
    return "Partially Approved";
  }

  if (item.actualAmount > item.budgetedAmount) {
    return "Over Budget";
  }

  if (item.actualAmount > 0 && item.actualAmount < item.budgetedAmount) {
    return "Under Budget";
  }

  return "On Plan";
}

export function groupBudgetByProgram(items: readonly BudgetItem[]): Array<{
  label: string;
  budgeted: number;
  forecasted: number;
  actual: number;
}> {
  const grouped = new Map<
    string,
    { budgeted: number; forecasted: number; actual: number }
  >();

  for (const item of items) {
    const current = grouped.get(item.budgetCategory) ?? {
      budgeted: 0,
      forecasted: 0,
      actual: 0,
    };

    current.budgeted += item.budgetedAmount;
    current.forecasted += item.forecastedAmount;
    current.actual += item.actualAmount;
    grouped.set(item.budgetCategory, current);
  }

  return [...grouped.entries()]
    .map(([label, value]) => ({ label, ...value }))
    .sort((a, b) => b.budgeted - a.budgeted);
}

export function groupBudgetByExpenseType(items: readonly BudgetItem[]): Array<{
  label: string;
  budgeted: number;
  forecasted: number;
  actual: number;
}> {
  const grouped = new Map<
    string,
    { budgeted: number; forecasted: number; actual: number }
  >();

  for (const item of items) {
    const current = grouped.get(item.expenseType) ?? {
      budgeted: 0,
      forecasted: 0,
      actual: 0,
    };

    current.budgeted += item.budgetedAmount;
    current.forecasted += item.forecastedAmount;
    current.actual += item.actualAmount;
    grouped.set(item.expenseType, current);
  }

  return [...grouped.entries()]
    .map(([label, value]) => ({ label, ...value }))
    .sort((a, b) => b.budgeted - a.budgeted);
}

export function daysUntil(date: string, today = new Date()): number {
  const target = new Date(`${date}T00:00:00.000Z`);
  const baseline = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );

  return Math.ceil((target.getTime() - baseline.getTime()) / 86_400_000);
}

export function getNoticeDeadline(contract: Contract): string {
  const renewal = new Date(`${contract.renewalDate}T00:00:00.000Z`);
  renewal.setUTCDate(renewal.getUTCDate() - contract.noticePeriodDays);
  return renewal.toISOString().slice(0, 10);
}

export function getRenewalUrgency(
  contract: Contract,
  today = new Date()
): ContractUrgency {
  const renewalDays = daysUntil(contract.renewalDate, today);
  const noticeDays = daysUntil(getNoticeDeadline(contract), today);
  const controllingDays = Math.min(renewalDays, noticeDays);

  if (controllingDays <= 30) {
    return "Critical";
  }

  if (controllingDays <= 60) {
    return "High";
  }

  if (controllingDays <= 90) {
    return "Medium";
  }

  return "Low";
}

export function calculateContractSummary(
  contracts: readonly Contract[],
  today = new Date()
): ContractSummary {
  return contracts.reduce<ContractSummary>(
    (summary, contract) => {
      const daysToEnd = daysUntil(contract.endDate, today);

      if (contract.contractStatus === "Active") {
        summary.activeContracts += 1;
      }

      summary.annualContractValue += contract.annualContractValue;

      if (daysToEnd <= 30) {
        summary.expiringIn30Days += 1;
      }

      if (daysToEnd <= 60) {
        summary.expiringIn60Days += 1;
      }

      if (daysToEnd <= 90) {
        summary.expiringIn90Days += 1;
      }

      if (
        highRiskLevels.has(contract.renewalRiskLevel) ||
        getRenewalUrgency(contract, today) === "Critical"
      ) {
        summary.highRiskRenewals += 1;
      }

      return summary;
    },
    {
      activeContracts: 0,
      annualContractValue: 0,
      expiringIn30Days: 0,
      expiringIn60Days: 0,
      expiringIn90Days: 0,
      highRiskRenewals: 0,
    }
  );
}

export function getUpcomingRenewals(
  contracts: readonly Contract[],
  today = new Date()
): Contract[] {
  return [...contracts].sort((a, b) => {
    const aDays = Math.min(
      daysUntil(a.renewalDate, today),
      daysUntil(getNoticeDeadline(a), today)
    );
    const bDays = Math.min(
      daysUntil(b.renewalDate, today),
      daysUntil(getNoticeDeadline(b), today)
    );

    return aDays - bDays;
  });
}

export function isUnderusedModule(module: ProductModule): boolean {
  if (!module.enabled) {
    return false;
  }

  if (lowAdoptionLevels.has(module.adoptionLevel)) {
    return true;
  }

  return (
    module.licenseCount > 0 && module.usedCount / module.licenseCount < 0.55
  );
}

export function getRedundancyCandidates(
  products: readonly Product[]
): Array<{ product: Product; overlaps: Product[] }> {
  return products
    .map((product) => {
      const overlaps = products.filter((candidate) => {
        if (candidate.id === product.id) {
          return false;
        }

        const sameCategory =
          candidate.productCategory === product.productCategory;
        const overlappingCapability =
          candidate.capabilityCategory === product.capabilityCategory;
        const overlappingUseCase =
          candidate.primaryUseCase.toLowerCase().includes("secure web") &&
          product.primaryUseCase.toLowerCase().includes("secure web");

        return sameCategory && (overlappingCapability || overlappingUseCase);
      });

      return { product, overlaps };
    })
    .filter((candidate) => candidate.overlaps.length > 0);
}

export function calculateProductSummary(
  products: readonly Product[],
  modules: readonly ProductModule[]
): ProductSummary {
  return {
    totalProducts: products.length,
    activeProducts: products.filter(
      (product) => product.deploymentStatus === "Active"
    ).length,
    underReview: products.filter(
      (product) => product.deploymentStatus === "Under Review"
    ).length,
    retiring: products.filter(
      (product) => product.deploymentStatus === "Retiring"
    ).length,
    totalAnnualCost: products.reduce(
      (total, product) => total + product.annualCost,
      0
    ),
    underusedModules: modules.filter(isUnderusedModule).length,
    redundancyCandidates: getRedundancyCandidates(products).length,
  };
}
