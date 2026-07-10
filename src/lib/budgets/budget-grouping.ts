import type {
  BudgetAccount,
  BudgetAnnualFinancial,
  BudgetItem,
  BudgetWorksheetType,
  MaintenanceRenewal,
} from "@/types/budget";

export function filterAnnualsByWorksheet(
  annuals: readonly BudgetAnnualFinancial[],
  worksheet: BudgetWorksheetType
): BudgetAnnualFinancial[] {
  if (worksheet === "Summary" || worksheet === "Submission and Export") {
    return [...annuals];
  }

  if (worksheet === "New Requests") {
    return annuals.filter((line) => line.isNewRequest);
  }

  return annuals.filter((line) => line.worksheet === worksheet);
}

export function groupAnnualsByAccount(
  annuals: readonly BudgetAnnualFinancial[]
): Record<string, BudgetAnnualFinancial[]> {
  return annuals.reduce<Record<string, BudgetAnnualFinancial[]>>(
    (result, line) => {
      result[line.accountId] = [...(result[line.accountId] ?? []), line];
      return result;
    },
    {}
  );
}

export function groupAnnualsByVendor(
  annuals: readonly BudgetAnnualFinancial[],
  items: readonly BudgetItem[]
): Record<string, number> {
  const itemById = new Map(items.map((item) => [item.id, item]));

  return annuals.reduce<Record<string, number>>((result, line) => {
    const vendor = itemById.get(line.budgetItemId)?.vendorId ?? "unassigned";
    result[vendor] = (result[vendor] ?? 0) + line.proposedAmountCents;
    return result;
  }, {});
}

export function accountLabel(accountId: string, accounts: readonly BudgetAccount[]) {
  const account = accounts.find((candidate) => candidate.id === accountId);
  return account ? `${account.code} ${account.name}` : accountId;
}

export function renewalAccountExposure(
  renewals: readonly MaintenanceRenewal[]
): Record<string, number> {
  return renewals.reduce<Record<string, number>>((result, renewal) => {
    result[renewal.fundingAccountId] =
      (result[renewal.fundingAccountId] ?? 0) + renewal.negotiatedCostCents;
    return result;
  }, {});
}
