import { BudgetManagement } from "@/components/portfolio/budget-management";
import { getBudgetResellerOptions } from "@/lib/server/budget-reference-data";

export default async function BudgetsPage() {
  const resellerOptions = await getBudgetResellerOptions();

  return <BudgetManagement resellerOptions={resellerOptions} />;
}
