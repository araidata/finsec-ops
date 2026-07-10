import type {
  BudgetAnnualFinancial,
  BudgetPlan,
  BudgetScenario,
  MaintenanceRenewal,
} from "@/types/budget";

export type RollForwardOptions = {
  sourceFiscalYear: string;
  targetPlan: BudgetPlan;
  targetScenario: BudgetScenario;
  defaultInflationPercent: number;
  itemInflationOverrides?: Record<string, number>;
  excludeRetired: boolean;
  carryForwardRenewalQuotes: boolean;
};

export type RollForwardResult = {
  annualFinancials: BudgetAnnualFinancial[];
};

export function rollForwardBudget(
  sourceAnnuals: readonly BudgetAnnualFinancial[],
  renewals: readonly MaintenanceRenewal[],
  options: RollForwardOptions
): RollForwardResult {
  const renewalByAnnualId = new Map(
    renewals
      .filter((renewal) => renewal.linkedAnnualFinancialId)
      .map((renewal) => [renewal.linkedAnnualFinancialId, renewal])
  );

  return {
    annualFinancials: sourceAnnuals
      .filter((line) => line.fiscalYear === options.sourceFiscalYear)
      .filter((line) => (options.excludeRetired ? !line.isRetired : true))
      .filter(
        (line) => line.isRecurring || line.worksheet === "Maintenance Renewals"
      )
      .map((line, index) => {
        const override =
          options.itemInflationOverrides?.[line.budgetItemId] ??
          options.defaultInflationPercent;
        const renewal = renewalByAnnualId.get(line.id);
        const proposedAmountCents =
          options.carryForwardRenewalQuotes && renewal
            ? renewal.negotiatedCostCents
            : applyInflation(line.proposedAmountCents, override);

        return {
          ...line,
          id: `${options.targetPlan.id}-${line.budgetItemId}-${index}`,
          budgetPlanId: options.targetPlan.id,
          scenarioId: options.targetScenario.id,
          fiscalYear: options.targetPlan.fiscalYear,
          priorApprovedAmountCents: line.currentApprovedAmountCents,
          currentApprovedAmountCents: line.proposedAmountCents,
          baseAmountCents: line.proposedAmountCents,
          requestedAmountCents: proposedAmountCents,
          proposedAmountCents,
          approvedAmountCents: 0,
          revisedApprovedAmountCents: 0,
          forecastAmountCents: proposedAmountCents,
          actualAmountCents: 0,
          encumberedAmountCents: 0,
          fundingStatus: "Draft",
          reviewState: "Needs Review",
          comments: "Rolled forward for review.",
        };
      }),
  };
}

export function applyInflation(
  amountCents: number,
  inflationPercent: number
): number {
  return Math.round(amountCents * (1 + inflationPercent / 100));
}
