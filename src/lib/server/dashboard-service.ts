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

export type DashboardRenewal = { id: string; vendor: string; product: string; owner: string; renewalDate: string; amount: number; status: string; department: string };
export type DashboardProcurementItem = { id: string; title: string; category: string; owner: string; amount: number; status: string; department: string };
export type DashboardSpendCategory = { category: string; spend: number; share: string; fill: string };
export type DashboardForecastPoint = { fiscalYear: string; actual: number; forecast: number; budget: number; committed: number };
export type DashboardDepartmentComparison = { id: string | null; name: string; approved: number; forecastVariance: number; renewalExposure: number; contractSpend: number; deploymentProgress: number };
export type DashboardReportingReadiness = { percentage: number; assignedRecords: number; totalRecords: number; detail: string };

export type DashboardPageData = {
  metrics: DashboardMetrics;
  spendByCategory: DashboardSpendCategory[];
  forecastTrend: DashboardForecastPoint[];
  renewals: DashboardRenewal[];
  procurementQueue: DashboardProcurementItem[];
  reportingReadiness: DashboardReportingReadiness;
  departmentComparison: DashboardDepartmentComparison[];
  isAllDepartments: boolean;
  contextDepartment: string;
  contextFiscalYear: string;
};

const categoryColors = ["#22c7d9", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#64748b"];
const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const dateLabel = (value: Date) => value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const titleCase = (value: string) => value.toLowerCase().split("_").map((part) => part.charAt(0) + part.slice(1)).join(" ");

export type DashboardAggregationInput = {
  annuals: Array<{ departmentId: string | null; approved: number; forecast: number }>;
  renewals: Array<{ departmentId: string | null; amount: number }>;
  contracts: Array<{ departmentId: string | null; annualValue: number }>;
  deployments: Array<{ departmentId: string | null; progress: number }>;
  departments: Array<{ id: string; name: string }>;
};

export function aggregateDepartmentComparison(input: DashboardAggregationInput): DashboardDepartmentComparison[] {
  const rows = new Map<string | null, DashboardDepartmentComparison>();
  const get = (departmentId: string | null) => {
    const existing = rows.get(departmentId);
    if (existing) return existing;
    const row: DashboardDepartmentComparison = {
      id: departmentId,
      name: input.departments.find((department) => department.id === departmentId)?.name ?? "Unassigned",
      approved: 0,
      forecastVariance: 0,
      renewalExposure: 0,
      contractSpend: 0,
      deploymentProgress: 0,
    };
    rows.set(departmentId, row);
    return row;
  };
  for (const annual of input.annuals) {
    const row = get(annual.departmentId);
    row.approved += annual.approved;
    row.forecastVariance += annual.forecast - annual.approved;
  }
  for (const renewal of input.renewals) get(renewal.departmentId).renewalExposure += renewal.amount;
  for (const contract of input.contracts) get(contract.departmentId).contractSpend += contract.annualValue;
  const deploymentTotals = new Map<string | null, { total: number; count: number }>();
  for (const deployment of input.deployments) {
    const total = deploymentTotals.get(deployment.departmentId) ?? { total: 0, count: 0 };
    total.total += deployment.progress;
    total.count += 1;
    deploymentTotals.set(deployment.departmentId, total);
  }
  for (const [departmentId, total] of deploymentTotals) get(departmentId).deploymentProgress = total.count ? Math.round(total.total / total.count) : 0;
  return [...rows.values()].filter((row) => row.approved || row.renewalExposure || row.contractSpend || row.deploymentProgress).sort((a, b) => a.name.localeCompare(b.name));
}

function emptyDashboard(): DashboardPageData {
  return {
    metrics: { budgetUtilization: "0%", budgetDetail: "$0 of $0", renewalExposure: "$0", renewalDetail: "0 renewals in context", forecastVariance: "$0", forecastDetail: "No forecast data", contractSpend: "$0", contractDetail: "0 active commitments", deploymentProgress: "0%", deploymentDetail: "0 deployment scopes" },
    spendByCategory: [], forecastTrend: [], renewals: [], procurementQueue: [], reportingReadiness: { percentage: 0, assignedRecords: 0, totalRecords: 0, detail: "No records available" }, departmentComparison: [], isAllDepartments: true, contextDepartment: "All Departments", contextFiscalYear: "All Fiscal Years",
  };
}

export async function getDashboardPageData(selection: GlobalContextSelection = {}): Promise<DashboardPageData> {
  if (!hasDatabaseUrl()) return emptyDashboard();
  const prisma = getPrisma();
  const fiscalYear = selection.fiscalYearId ? await prisma.fiscalYear.findUnique({ where: { id: selection.fiscalYearId }, select: { id: true, label: true, startsOn: true, endsOn: true } }) : null;
  const [departments, fiscalYears, annuals, renewals, contracts, deployments, procurement] = await Promise.all([
    prisma.department.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.fiscalYear.findMany({ orderBy: { startsOn: "asc" }, select: { id: true, label: true } }),
    prisma.budgetAnnualFinancial.findMany({ where: fiscalYear ? { fiscalYearId: fiscalYear.id } : {}, include: { fiscalYear: { select: { id: true, label: true } }, budgetItem: { select: { departmentId: true } }, account: { select: { name: true } } } }),
    prisma.maintenanceRenewal.findMany({ where: fiscalYear ? { fiscalYearId: fiscalYear.id } : {}, include: { vendorCompany: { select: { name: true } }, product: { select: { name: true } }, ownerTeamMember: { select: { fullName: true } }, departmentRef: { select: { id: true, name: true } } } }),
    prisma.contract.findMany({ where: fiscalYear ? { OR: [{ startsOn: { lte: fiscalYear.endsOn }, endsOn: { gte: fiscalYear.startsOn } }, { renewalDate: { gte: fiscalYear.startsOn, lte: fiscalYear.endsOn } }] } : {}, select: { departmentId: true, annualValue: true } }),
    prisma.deployment.findMany({ where: fiscalYear ? { OR: [{ targetDate: { gte: fiscalYear.startsOn, lte: fiscalYear.endsOn } }, { completedDate: { gte: fiscalYear.startsOn, lte: fiscalYear.endsOn } }, { contractLineItem: { contract: { startsOn: { lte: fiscalYear.endsOn }, endsOn: { gte: fiscalYear.startsOn } } } }] } : {}, select: { departmentId: true, deploymentPercent: true } }),
    prisma.purchaseRequest.findMany({ where: fiscalYear ? { fiscalYearId: fiscalYear.id } : {}, orderBy: { createdAt: "desc" }, take: 8, include: { vendorCompany: { select: { name: true } }, owner: { select: { name: true } }, contract: { select: { departmentId: true } }, maintenanceRenewal: { select: { departmentId: true } }, budgetLineItems: { select: { departmentId: true } } } }),
  ]);
  const asNumber = (value: unknown) => Number(value ?? 0);
  const financialRows = annuals.filter((annual) => !selection.departmentId || annual.budgetItem.departmentId === selection.departmentId);
  const scopedRenewals = renewals.filter((renewal) => !selection.departmentId || renewal.departmentId === selection.departmentId);
  const scopedContracts = contracts.filter((contract) => !selection.departmentId || contract.departmentId === selection.departmentId);
  const scopedDeployments = deployments.filter((deployment) => !selection.departmentId || deployment.departmentId === selection.departmentId);
  const approved = financialRows.reduce((sum, item) => sum + asNumber(item.approvedAmount), 0);
  const actual = financialRows.reduce((sum, item) => sum + asNumber(item.actualAmount), 0);
  const forecast = financialRows.reduce((sum, item) => sum + asNumber(item.forecastAmount), 0);
  const renewalExposure = scopedRenewals.reduce((sum, item) => sum + asNumber(item.approvedAmount), 0);
  const contractSpend = scopedContracts.reduce((sum, item) => sum + asNumber(item.annualValue), 0);
  const deploymentProgress = scopedDeployments.length ? Math.round(scopedDeployments.reduce((sum, item) => sum + asNumber(item.deploymentPercent), 0) / scopedDeployments.length) : 0;
  const variance = forecast - approved;
  const categoryTotals = new Map<string, number>();
  for (const annual of financialRows) {
    const category = annual.account.name || "Uncategorized";
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + asNumber(annual.actualAmount || annual.approvedAmount));
  }
  const categoryTotal = [...categoryTotals.values()].reduce((sum, value) => sum + value, 0);
  const spendByCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]).map(([category, spend], index) => ({ category, spend, share: categoryTotal ? `${Math.round((spend / categoryTotal) * 100)}%` : "0%", fill: categoryColors[index % categoryColors.length] }));
  const forecastTrend = fiscalYears.map((year) => {
    const rows = annuals.filter((annual) => annual.fiscalYearId === year.id && (!selection.departmentId || annual.budgetItem.departmentId === selection.departmentId));
    return { fiscalYear: year.label, actual: rows.reduce((sum, item) => sum + asNumber(item.actualAmount), 0), forecast: rows.reduce((sum, item) => sum + asNumber(item.forecastAmount), 0), budget: rows.reduce((sum, item) => sum + asNumber(item.approvedAmount), 0), committed: rows.reduce((sum, item) => sum + asNumber(item.encumberedAmount), 0) };
  }).filter((point) => point.actual || point.forecast || point.budget || point.committed);
  const departmentComparison = aggregateDepartmentComparison({ annuals: annuals.map((item) => ({ departmentId: item.budgetItem.departmentId, approved: asNumber(item.approvedAmount), forecast: asNumber(item.forecastAmount) })), renewals: renewals.map((item) => ({ departmentId: item.departmentId, amount: asNumber(item.approvedAmount) })), contracts: contracts.map((item) => ({ departmentId: item.departmentId, annualValue: asNumber(item.annualValue) })), deployments: deployments.map((item) => ({ departmentId: item.departmentId, progress: asNumber(item.deploymentPercent) })), departments });
  const procurementQueue = procurement.map((request) => {
    const departmentId = request.contract?.departmentId ?? request.maintenanceRenewal?.departmentId ?? request.budgetLineItems[0]?.departmentId ?? null;
    return { id: request.id, title: request.title, category: request.vendorCompany?.name ?? "Uncategorized", owner: request.owner?.name ?? "Unassigned", amount: asNumber(request.requestAmount || request.approvedAmount), status: titleCase(request.status), department: departments.find((department) => department.id === departmentId)?.name ?? "Unassigned", departmentId };
  }).filter((request) => !selection.departmentId || request.departmentId === selection.departmentId).map((request) => ({ id: request.id, title: request.title, category: request.category, owner: request.owner, amount: request.amount, status: request.status, department: request.department }));
  const readinessRecords = [...financialRows.map((item) => item.budgetItem.departmentId), ...scopedRenewals.map((item) => item.departmentId), ...scopedContracts.map((item) => item.departmentId), ...scopedDeployments.map((item) => item.departmentId)];
  const assignedRecords = readinessRecords.filter(Boolean).length;
  const readinessPercentage = readinessRecords.length ? Math.round((assignedRecords / readinessRecords.length) * 100) : 0;
  return {
    metrics: { budgetUtilization: `${approved ? Math.round((actual / approved) * 100) : 0}%`, budgetDetail: `${money(actual)} of ${money(approved)}`, renewalExposure: money(renewalExposure), renewalDetail: `${scopedRenewals.length} renewals in context`, forecastVariance: money(variance), forecastDetail: variance <= 0 ? "Below approved plan" : "Above approved plan", contractSpend: money(contractSpend), contractDetail: `${scopedContracts.length} active commitments`, deploymentProgress: `${deploymentProgress}%`, deploymentDetail: `${scopedDeployments.length} deployment scopes` },
    spendByCategory,
    forecastTrend,
    renewals: scopedRenewals.sort((a, b) => a.renewalDate.getTime() - b.renewalDate.getTime()).slice(0, 5).map((renewal) => ({ id: renewal.id, vendor: renewal.vendorCompany?.name ?? "Unassigned", product: renewal.product?.name ?? renewal.productOrService, owner: renewal.ownerTeamMember?.fullName ?? renewal.renewalOwner ?? "Unassigned", renewalDate: dateLabel(renewal.renewalDate), amount: asNumber(renewal.approvedAmount), status: titleCase(renewal.riskStatus), department: renewal.departmentRef?.name ?? "Unassigned" })),
    procurementQueue,
    reportingReadiness: { percentage: readinessPercentage, assignedRecords, totalRecords: readinessRecords.length, detail: `${assignedRecords} of ${readinessRecords.length} scoped records have a department` },
    departmentComparison,
    isAllDepartments: !selection.departmentId,
    contextDepartment: departments.find((department) => department.id === selection.departmentId)?.name ?? "All Departments",
    contextFiscalYear: fiscalYear?.label ?? "All Fiscal Years",
  };
}
