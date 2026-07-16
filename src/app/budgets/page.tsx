import { BudgetManagement } from "@/components/portfolio/budget-management";
import { getBudgetWorkspaceData } from "@/lib/server/budget-service";
import { getBudgetResellerOptions } from "@/lib/server/budget-reference-data";
import { budgetWorksheetTypes, type BudgetWorksheetType } from "@/types/budget";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    fy?: string | string[];
    worksheet?: string | string[];
  }>;
}) {
  const [budgetData, resellerOptions] = await Promise.all([
    getBudgetWorkspaceData(),
    getBudgetResellerOptions(),
  ]);
  const params = await searchParams;
  const fiscalYear =
    typeof params?.fy === "string" ? params.fy : (params?.fy?.[0] ?? "");
  const worksheetParam =
    typeof params?.worksheet === "string"
      ? params.worksheet
      : (params?.worksheet?.[0] ?? "");
  const worksheet = budgetWorksheetTypes.includes(
    worksheetParam as BudgetWorksheetType
  )
    ? (worksheetParam as BudgetWorksheetType)
    : undefined;
  const budgetWorkspaceKey = budgetData.annualFinancials
    .map(
      (line) =>
        `${line.id}:${line.budgetPlanId}:${line.proposedAmountCents}:${line.reviewState}`
    )
    .join("|");

  return (
    <BudgetManagement
      key={budgetWorkspaceKey}
      initialData={budgetData}
      initialFiscalYear={fiscalYear}
      initialWorksheet={worksheet}
      resellerOptions={resellerOptions}
    />
  );
}
