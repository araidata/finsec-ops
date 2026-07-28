import type { GlobalContextSelection } from "@/lib/server/global-context";
import { getPrisma, hasDatabaseUrl } from "@/lib/server/prisma";

export type DashboardMetrics = {
  budgetUtilization: string;
  budgetDetail: string;
  renewalExposure: string;
  renewalDetail: string;
  forecastVariance: string;
  forecastDetail: string;
  contractSpend: string;
  contractDetail: string;
  deploymentProgress: string;
  deploymentDetail: string;
};

const money = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 1 });

export async function getDashboardPageData(
  selection: GlobalContextSelection = {}
): Promise<{ metrics?: DashboardMetrics }> {
  if (!hasDatabaseUrl()) return {};
  const prisma = getPrisma();
  const fiscalYear = selection.fiscalYearId
    ? await prisma.fiscalYear.findUnique({ where: { id: selection.fiscalYearId } })
    : null;
  const budgetWhere = {
    ...(fiscalYear ? { fiscalYearId: fiscalYear.id } : {}),
    ...(selection.departmentId ? { budgetItem: { departmentId: selection.departmentId } } : {}),
  };
  const [budget, renewals, contracts, deployments] = await Promise.all([
    prisma.budgetAnnualFinancial.aggregate({
      where: budgetWhere,
      _sum: { approvedAmount: true, actualAmount: true, forecastAmount: true },
    }),
    prisma.maintenanceRenewal.findMany({
      where: {
        ...(fiscalYear ? { fiscalYearId: fiscalYear.id } : {}),
        ...(selection.departmentId ? { departmentId: selection.departmentId } : {}),
      },
      select: { approvedAmount: true, renewalDate: true },
    }),
    prisma.contract.findMany({
      where: {
        ...(selection.departmentId ? { departmentId: selection.departmentId } : {}),
        ...(fiscalYear
          ? {
              OR: [
                { startsOn: { lte: fiscalYear.endsOn }, endsOn: { gte: fiscalYear.startsOn } },
                { renewalDate: { gte: fiscalYear.startsOn, lte: fiscalYear.endsOn } },
              ],
            }
          : {}),
      },
      select: { annualValue: true },
    }),
    prisma.deployment.findMany({
      where: {
        ...(selection.departmentId ? { departmentId: selection.departmentId } : {}),
        ...(fiscalYear
          ? {
              OR: [
                { targetDate: { gte: fiscalYear.startsOn, lte: fiscalYear.endsOn } },
                { completedDate: { gte: fiscalYear.startsOn, lte: fiscalYear.endsOn } },
              ],
            }
          : {}),
      },
      select: { deploymentPercent: true },
    }),
  ]);
  const approved = Number(budget._sum.approvedAmount ?? 0);
  const actual = Number(budget._sum.actualAmount ?? 0);
  const forecast = Number(budget._sum.forecastAmount ?? 0);
  const renewalExposure = renewals.reduce((sum, item) => sum + Number(item.approvedAmount), 0);
  const contractSpend = contracts.reduce((sum, item) => sum + Number(item.annualValue), 0);
  const deploymentProgress = deployments.length
    ? Math.round(
        deployments.reduce((sum, item) => sum + Number(item.deploymentPercent), 0) /
          deployments.length
      )
    : 0;
  const utilization = approved ? Math.round((actual / approved) * 100) : 0;
  const variance = forecast - approved;
  return {
    metrics: {
      budgetUtilization: `${utilization}%`,
      budgetDetail: `${money(actual)} of ${money(approved)}`,
      renewalExposure: money(renewalExposure),
      renewalDetail: `${renewals.length} renewals in context`,
      forecastVariance: money(variance),
      forecastDetail: variance <= 0 ? "Below approved plan" : "Above approved plan",
      contractSpend: money(contractSpend),
      contractDetail: `${contracts.length} active commitments`,
      deploymentProgress: `${deploymentProgress}%`,
      deploymentDetail: `${deployments.length} deployment scopes`,
    },
  };
}
