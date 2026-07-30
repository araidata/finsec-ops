import { GlobalContextProvider } from "@/components/app/global-context-provider";
import { BudgetManagement } from "@/components/portfolio/budget-management";
import { getBudgetWorkspaceData } from "@/lib/server/budget-service";
import { getBudgetResellerOptions } from "@/lib/server/budget-reference-data";
import { resolveGlobalContext } from "@/lib/server/global-context";
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
  const context = await resolveGlobalContext({
    departmentId:
      typeof params?.department === "string"
        ? params.department
        : params?.department?.[0],
    fiscalYearId: typeof params?.fy === "string" ? params.fy : params?.fy?.[0],
  });
  const worksheetParam =
    typeof params?.worksheet === "string"
      ? params.worksheet
      : (params?.worksheet?.[0] ?? "");
  const worksheet = budgetWorksheetTypes.includes(
    worksheetParam as BudgetWorksheetType
  )
    ? (worksheetParam as BudgetWorksheetType)
    : undefined;
  const [budgetData, resellerOptions] = await Promise.all([
    getBudgetWorkspaceData(context.serviceSelection),
    getBudgetResellerOptions(),
  ]);
  const budgetWorkspaceKey = [
    context.selection.departmentId,
    context.selection.fiscalYearId,
    worksheet ?? "Summary",
  ].join(":");

  return (
    <GlobalContextProvider
      options={context.options}
      selection={context.selection}
    >
      <BudgetManagement
        key={budgetWorkspaceKey}
        initialData={budgetData}
        initialFiscalYear={
          budgetData.fiscalYears.find(
            (year) => year.id === context.selection.fiscalYearId
          )?.label ?? context.selection.fiscalYearId
        }
        initialWorksheet={worksheet}
        resellerOptions={resellerOptions}
      />
    </GlobalContextProvider>
  );
}
