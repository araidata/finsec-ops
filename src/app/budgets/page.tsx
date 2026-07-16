import { BudgetManagement } from "@/components/portfolio/budget-management";
import { getBudgetWorkspaceData } from "@/lib/server/budget-service";
import { getBudgetResellerOptions } from "@/lib/server/budget-reference-data";

export default async function BudgetsPage() {
  const [budgetData, resellerOptions] = await Promise.all([
    getBudgetWorkspaceData(),
    getBudgetResellerOptions(),
  ]);
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
      resellerOptions={resellerOptions}
    />
  );
}
