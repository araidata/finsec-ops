export type BudgetCalculationStatus =
  "DRAFT" | "PROPOSED" | "APPROVED" | "COMMITTED" | "CLOSED" | "CANCELED";

export type RenewalCalculationStatus =
  "PLANNED" | "IN_PROGRESS" | "APPROVED" | "RENEWED" | "DEFERRED" | "CANCELED";

export type BudgetCalculationLineItem = {
  status: BudgetCalculationStatus;
  approvedAmount: number;
  forecastAmount: number;
  committedAmount: number;
  actualAmount: number;
};

export type RenewalExposureLineItem = {
  fiscalYearId: string;
  status: RenewalCalculationStatus;
  exposureAmount: number;
};

const approvedBudgetStatuses = new Set<BudgetCalculationStatus>([
  "APPROVED",
  "COMMITTED",
  "CLOSED",
]);

const activeBudgetStatuses = new Set<BudgetCalculationStatus>([
  "DRAFT",
  "PROPOSED",
  "APPROVED",
  "COMMITTED",
  "CLOSED",
]);

const activeRenewalStatuses = new Set<RenewalCalculationStatus>([
  "PLANNED",
  "IN_PROGRESS",
  "APPROVED",
  "RENEWED",
]);

function sumBy<T>(items: readonly T[], amount: (item: T) => number): number {
  return items.reduce((total, item) => total + amount(item), 0);
}

export function calculateApprovedBudgetTotal(
  lineItems: readonly BudgetCalculationLineItem[]
): number {
  return sumBy(lineItems, (lineItem) =>
    approvedBudgetStatuses.has(lineItem.status) ? lineItem.approvedAmount : 0
  );
}

export function calculateForecastTotal(
  lineItems: readonly BudgetCalculationLineItem[]
): number {
  return sumBy(lineItems, (lineItem) =>
    activeBudgetStatuses.has(lineItem.status) ? lineItem.forecastAmount : 0
  );
}

export function calculateCommittedSpendTotal(
  lineItems: readonly BudgetCalculationLineItem[]
): number {
  return sumBy(lineItems, (lineItem) =>
    activeBudgetStatuses.has(lineItem.status) ? lineItem.committedAmount : 0
  );
}

export function calculateActualSpendTotal(
  lineItems: readonly BudgetCalculationLineItem[]
): number {
  return sumBy(lineItems, (lineItem) =>
    activeBudgetStatuses.has(lineItem.status) ? lineItem.actualAmount : 0
  );
}

export function calculateRemainingBudget(
  lineItems: readonly BudgetCalculationLineItem[]
): number {
  return (
    calculateApprovedBudgetTotal(lineItems) -
    calculateCommittedSpendTotal(lineItems) -
    calculateActualSpendTotal(lineItems)
  );
}

export function calculateRenewalExposureByFiscalYear(
  renewals: readonly RenewalExposureLineItem[]
): Record<string, number> {
  return renewals.reduce<Record<string, number>>((exposure, renewal) => {
    if (!activeRenewalStatuses.has(renewal.status)) {
      return exposure;
    }

    exposure[renewal.fiscalYearId] =
      (exposure[renewal.fiscalYearId] ?? 0) + renewal.exposureAmount;

    return exposure;
  }, {});
}
