import type {
  BudgetAccount,
  BudgetAnnualFinancial,
  BudgetItem,
  HardwareBudgetDetail,
  MaintenanceRenewal,
  PersonnelBudgetDetail,
  ProfessionalServicesBudgetDetail,
  SavingsRecord,
  TrainingBudgetDetail,
  TravelBudgetDetail,
} from "@/types/budget";

const DAY_MS = 86_400_000;

export type AccountRollup = {
  accountId: string;
  accountCode: string;
  accountName: string;
  priorApprovedCents: number;
  currentApprovedCents: number;
  proposedCents: number;
  approvedCents: number;
  dollarChangeCents: number;
  percentChange: number | null;
  comments: string;
};

export type BudgetTotals = {
  totalPriorApprovedCents: number;
  totalCurrentApprovedCents: number;
  totalProposedCents: number;
  totalApprovedCents: number;
  totalForecastCents: number;
  totalActualCents: number;
  totalIncreaseCents: number;
  totalDecreaseCents: number;
  grossNewInvestmentCents: number;
  grossSavingsCents: number;
  totalCostAvoidanceCents: number;
  netChangeCents: number;
};

export type RenewalExposureWindow = {
  label: "30" | "60" | "90" | "120" | "180";
  count: number;
  exposureCents: number;
};

export function cents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function dollars(centsValue: number): number {
  return centsValue / 100;
}

export function formatCurrencyFromCents(centsValue: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(dollars(centsValue));
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "n/a";
  }

  return `${value.toFixed(1)}%`;
}

export function quantityTimesUnitCost(
  quantity: number,
  unitCostCents: number
): number {
  return Math.max(0, quantity) * Math.max(0, unitCostCents);
}

export function calculateSoftwareLineTotal(
  line: Pick<
    BudgetAnnualFinancial,
    "quantity" | "unitCostCents" | "oneTimeAmountCents" | "recurringAmountCents"
  >
): number {
  const quantityTotal = quantityTimesUnitCost(line.quantity, line.unitCostCents);
  return quantityTotal + line.oneTimeAmountCents + line.recurringAmountCents;
}

export function calculateTrainingLineTotal(
  detail: Pick<TrainingBudgetDetail, "attendees" | "costPerPersonCents">
): number {
  return quantityTimesUnitCost(detail.attendees, detail.costPerPersonCents);
}

export function calculateTravelLineTotal(
  detail: Pick<
    TravelBudgetDetail,
    | "attendees"
    | "registrationCents"
    | "airfareCents"
    | "hotelCents"
    | "perDiemCents"
    | "luggageCents"
    | "parkingCents"
    | "groundCents"
    | "miscellaneousCents"
  >
): number {
  const perAttendee =
    detail.registrationCents +
    detail.airfareCents +
    detail.hotelCents +
    detail.perDiemCents +
    detail.luggageCents +
    detail.parkingCents +
    detail.groundCents +
    detail.miscellaneousCents;

  return quantityTimesUnitCost(detail.attendees, perAttendee);
}

export function calculateProfessionalServicesLineTotal(
  detail: Pick<
    ProfessionalServicesBudgetDetail,
    "quantityOrHours" | "rateCents"
  >
): number {
  return quantityTimesUnitCost(detail.quantityOrHours, detail.rateCents);
}

export function calculateHardwareLineTotal(
  detail: Pick<
    HardwareBudgetDetail,
    "quantity" | "unitCostCents" | "installationCents" | "maintenanceCents"
  >
): number {
  return (
    quantityTimesUnitCost(detail.quantity, detail.unitCostCents) +
    detail.installationCents +
    detail.maintenanceCents
  );
}

export function calculateMembershipLineTotal({
  memberCount,
  costPerMemberCents,
}: {
  memberCount: number;
  costPerMemberCents: number;
}): number {
  return quantityTimesUnitCost(memberCount, costPerMemberCents);
}

export function calculatePersonnelLineTotal(
  detail: Pick<
    PersonnelBudgetDetail,
    "positionCount" | "salaryCents" | "benefitsCents"
  >
): number {
  return quantityTimesUnitCost(
    detail.positionCount,
    detail.salaryCents + detail.benefitsCents
  );
}

export function dollarChange(
  fromCents: number,
  toCents: number
): number {
  return toCents - fromCents;
}

export function percentageChange(
  fromCents: number,
  toCents: number
): number | null {
  if (fromCents === 0) {
    return toCents === 0 ? 0 : null;
  }

  return ((toCents - fromCents) / Math.abs(fromCents)) * 100;
}

export function calculateSavings(
  baselineCents: number,
  finalCents: number
): number {
  return Math.max(0, baselineCents - finalCents);
}

export function calculateCostAvoidance(
  avoidedCents: number,
  actualCents: number
): number {
  return Math.max(0, avoidedCents - actualCents);
}

export function calculateBudgetToActualVariance(
  approvedCents: number,
  actualCents: number
): number {
  return approvedCents - actualCents;
}

export function calculateForecastToApprovedVariance(
  forecastCents: number,
  approvedCents: number
): number {
  return forecastCents - approvedCents;
}

export function calculateRenewalIncrease(
  renewal: Pick<MaintenanceRenewal, "currentCostCents" | "renewalQuoteCents">
): number {
  return renewal.renewalQuoteCents - renewal.currentCostCents;
}

export function calculateRenewalPercentageIncrease(
  renewal: Pick<MaintenanceRenewal, "currentCostCents" | "renewalQuoteCents">
): number | null {
  return percentageChange(renewal.currentCostCents, renewal.renewalQuoteCents);
}

export function calculateRenewalSavings(
  renewal: Pick<
    MaintenanceRenewal,
    "renewalQuoteCents" | "negotiatedCostCents"
  >
): number {
  return calculateSavings(
    renewal.renewalQuoteCents,
    renewal.negotiatedCostCents
  );
}

export function calculateNetRenewalChange(
  renewal: Pick<MaintenanceRenewal, "currentCostCents" | "negotiatedCostCents">
): number {
  return renewal.negotiatedCostCents - renewal.currentCostCents;
}

export function calculateNoticeDate(
  renewalDate: string,
  noticePeriodDays: number
): string {
  const date = new Date(`${renewalDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - noticePeriodDays);
  return date.toISOString().slice(0, 10);
}

export function daysUntil(date: string, today = new Date()): number {
  const target = new Date(`${date}T00:00:00.000Z`);
  const baseline = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  return Math.ceil((target.getTime() - baseline.getTime()) / DAY_MS);
}

export function calculateAccountRollups(
  accounts: readonly BudgetAccount[],
  annuals: readonly BudgetAnnualFinancial[]
): AccountRollup[] {
  return accounts
    .map((account) => {
      const accountLines = annuals.filter(
        (line) => line.accountId === account.id && !line.isRetired
      );
      const priorApprovedCents = sumBy(
        accountLines,
        (line) => line.priorApprovedAmountCents
      );
      const currentApprovedCents = sumBy(
        accountLines,
        (line) => line.currentApprovedAmountCents
      );
      const proposedCents = sumBy(
        accountLines,
        (line) => line.proposedAmountCents
      );
      const approvedCents = sumBy(
        accountLines,
        (line) => line.approvedAmountCents
      );

      return {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        priorApprovedCents,
        currentApprovedCents,
        proposedCents,
        approvedCents,
        dollarChangeCents: dollarChange(currentApprovedCents, proposedCents),
        percentChange: percentageChange(currentApprovedCents, proposedCents),
        comments:
          accountLines.find((line) => line.comments.trim().length > 0)
            ?.comments ?? "",
      };
    })
    .filter(
      (rollup) =>
        rollup.priorApprovedCents !== 0 ||
        rollup.currentApprovedCents !== 0 ||
        rollup.proposedCents !== 0
    )
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
}

export function calculateBudgetTotals(
  annuals: readonly BudgetAnnualFinancial[],
  savingsRecords: readonly SavingsRecord[] = []
): BudgetTotals {
  const activeLines = annuals.filter((line) => !line.isRetired);
  const totalCurrentApprovedCents = sumBy(
    activeLines,
    (line) => line.currentApprovedAmountCents
  );
  const totalProposedCents = sumBy(
    activeLines,
    (line) => line.proposedAmountCents
  );

  return {
    totalPriorApprovedCents: sumBy(
      activeLines,
      (line) => line.priorApprovedAmountCents
    ),
    totalCurrentApprovedCents,
    totalProposedCents,
    totalApprovedCents: sumBy(activeLines, (line) => line.approvedAmountCents),
    totalForecastCents: sumBy(activeLines, (line) => line.forecastAmountCents),
    totalActualCents: sumBy(activeLines, (line) => line.actualAmountCents),
    totalIncreaseCents: sumBy(activeLines, (line) =>
      Math.max(0, line.proposedAmountCents - line.currentApprovedAmountCents)
    ),
    totalDecreaseCents: sumBy(activeLines, (line) =>
      Math.max(0, line.currentApprovedAmountCents - line.proposedAmountCents)
    ),
    grossNewInvestmentCents: sumBy(activeLines, (line) =>
      line.isNewRequest ? line.proposedAmountCents : 0
    ),
    grossSavingsCents:
      sumBy(activeLines, (line) => line.savingsAmountCents) +
      sumBy(savingsRecords, (record) =>
        record.isBudgetReduction ? record.amountCents : 0
      ),
    totalCostAvoidanceCents:
      sumBy(activeLines, (line) => line.costAvoidanceAmountCents) +
      sumBy(savingsRecords, (record) => record.costAvoidanceCents),
    netChangeCents: totalProposedCents - totalCurrentApprovedCents,
  };
}

export function calculateRenewalExposureByWindow(
  renewals: readonly MaintenanceRenewal[],
  today = new Date()
): RenewalExposureWindow[] {
  return ([30, 60, 90, 120, 180] as const).map((days) => {
    const inWindow = renewals.filter((renewal) => {
      const dueDays = daysUntil(renewal.renewalDate, today);
      return dueDays >= 0 && dueDays <= days;
    });

    return {
      label: String(days) as RenewalExposureWindow["label"],
      count: inWindow.length,
      exposureCents: sumBy(inWindow, (renewal) => renewal.negotiatedCostCents),
    };
  });
}

export function calculateRenewalSpendByFiscalYear(
  renewals: readonly MaintenanceRenewal[]
): Record<string, number> {
  return renewals.reduce<Record<string, number>>((result, renewal) => {
    const fiscalYear = dateToFiscalYear(renewal.renewalDate);
    result[fiscalYear] = (result[fiscalYear] ?? 0) + renewal.negotiatedCostCents;
    return result;
  }, {});
}

export function calculateItemHistory(
  budgetItemId: string,
  annuals: readonly BudgetAnnualFinancial[]
): Array<{
  fiscalYear: string;
  approvedCents: number;
  actualCents: number;
  finalVarianceCents: number;
}> {
  return annuals
    .filter((line) => line.budgetItemId === budgetItemId)
    .map((line) => ({
      fiscalYear: line.fiscalYear,
      approvedCents: line.approvedAmountCents || line.currentApprovedAmountCents,
      actualCents: line.actualAmountCents,
      finalVarianceCents: calculateBudgetToActualVariance(
        line.approvedAmountCents || line.currentApprovedAmountCents,
        line.actualAmountCents
      ),
    }))
    .sort((a, b) => a.fiscalYear.localeCompare(b.fiscalYear));
}

export function lineDisplayName(
  line: BudgetAnnualFinancial,
  items: readonly BudgetItem[]
): string {
  return items.find((item) => item.id === line.budgetItemId)?.name ?? line.id;
}

function dateToFiscalYear(date: string): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  const year = parsed.getUTCMonth() >= 6 ? parsed.getUTCFullYear() + 1 : parsed.getUTCFullYear();
  return `FY${year}`;
}

function sumBy<T>(items: readonly T[], value: (item: T) => number): number {
  return items.reduce((total, item) => total + value(item), 0);
}
