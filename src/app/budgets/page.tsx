import { BudgetManagement } from "@/components/portfolio/budget-management";
import { getBudgetWorkspaceData } from "@/lib/server/budget-service";
import { getBudgetResellerOptions } from "@/lib/server/budget-reference-data";
import { budgetWorksheetTypes, type BudgetWorksheetType } from "@/types/budget";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    fy?: string | string[];
    department?: string | string[];
    worksheet?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const resellerOptions = await getBudgetResellerOptions();
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
  const department =
    typeof params?.department === "string"
      ? params.department
      : (params?.department?.[0] ?? "");
  const budgetData = await getBudgetWorkspaceData({
    departmentId: department === "all" ? undefined : department,
    fiscalYearId: fiscalYear === "all" ? undefined : fiscalYear,
  });
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
      initialFiscalYear={
        budgetData.fiscalYears.find((year) => year.id === fiscalYear)?.label ??
        fiscalYear
      }
      initialWorksheet={worksheet}
      resellerOptions={resellerOptions}
    />
  );
}
