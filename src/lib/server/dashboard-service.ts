import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { DASHBOARD_CACHE_TAG } from "@/lib/server/dashboard-cache";
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
const titleCase = (value: string) => value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

const DASHBOARD_RENEWAL_LIMIT = 5;
const DASHBOARD_PROCUREMENT_LIMIT = 8;
const DASHBOARD_LIST_MAX = 20;
const DASHBOARD_GROUP_MAX = 100;
const DASHBOARD_TREND_MAX = 20;

export type DashboardReadLimits = {
  renewalLimit?: number;
  procurementLimit?: number;
};

type BudgetMetricRow = {
  approved: unknown;
  actual: unknown;
  forecast: unknown;
  assignedRecords: number;
  totalRecords: number;
};

type SpendCategoryRow = {
  category: string;
  spend: unknown;
};

type ForecastRow = {
  fiscalYear: string;
  startsOn: Date;
  actual: unknown;
  forecast: unknown;
  budget: unknown;
  committed: unknown;
};

type DepartmentComparisonRow = {
  id: string | null;
  name: string;
  approved: unknown;
  forecastVariance: unknown;
  renewalExposure: unknown;
  contractSpend: unknown;
  deploymentProgress: number;
};

function boundedLimit(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? Math.min(value, DASHBOARD_LIST_MAX)
    : fallback;
}

function asNumber(value: unknown) {
  return Number(value ?? 0);
}

function firstNonZero(primary: unknown, fallback: unknown) {
  const value = asNumber(primary);
  return value === 0 ? asNumber(fallback) : value;
}

function emptyDashboard(): DashboardPageData {
  return {
    metrics: { budgetUtilization: "0%", budgetDetail: "$0 of $0", renewalExposure: "$0", renewalDetail: "0 renewals in context", forecastVariance: "$0", forecastDetail: "No forecast data", contractSpend: "$0", contractDetail: "0 active commitments", deploymentProgress: "0%", deploymentDetail: "0 deployment scopes" },
    spendByCategory: [], forecastTrend: [], renewals: [], procurementQueue: [], reportingReadiness: { percentage: 0, assignedRecords: 0, totalRecords: 0, detail: "No records available" }, departmentComparison: [], isAllDepartments: true, contextDepartment: "All Departments", contextFiscalYear: "All Fiscal Years",
  };
}

async function readDashboardPageData(
  selection: GlobalContextSelection,
  limits: Required<DashboardReadLimits>
): Promise<DashboardPageData> {
  const prisma = getPrisma();
  const [fiscalYear, department] = await Promise.all([
    selection.fiscalYearId
      ? prisma.fiscalYear.findFirst({
          where: { id: selection.fiscalYearId, active: true },
          select: { id: true, label: true, startsOn: true, endsOn: true },
        })
      : Promise.resolve(null),
    selection.departmentId
      ? prisma.department.findFirst({
          where: { id: selection.departmentId, active: true },
          select: { id: true, name: true },
        })
      : Promise.resolve(null),
  ]);

  if (selection.fiscalYearId && !fiscalYear) {
    throw new Error("Selected Fiscal Year is not available.");
  }
  if (selection.departmentId && !department) {
    throw new Error("Selected Department is not available.");
  }

  const budgetFiscalSql = selection.fiscalYearId
    ? Prisma.sql`AND baf."fiscalYearId" = ${selection.fiscalYearId}`
    : Prisma.empty;
  const budgetDepartmentSql = selection.departmentId
    ? Prisma.sql`AND bi."departmentId" = ${selection.departmentId}`
    : Prisma.empty;
  const contractFiscalSql = fiscalYear
    ? Prisma.sql`AND (
        (c."startsOn" <= ${fiscalYear.endsOn} AND c."endsOn" >= ${fiscalYear.startsOn})
        OR c."renewalDate" BETWEEN ${fiscalYear.startsOn} AND ${fiscalYear.endsOn}
      )`
    : Prisma.empty;
  const deploymentFiscalSql = fiscalYear
    ? Prisma.sql`AND (
        d."targetDate" BETWEEN ${fiscalYear.startsOn} AND ${fiscalYear.endsOn}
        OR d."completedDate" BETWEEN ${fiscalYear.startsOn} AND ${fiscalYear.endsOn}
        OR EXISTS (
          SELECT 1
          FROM "ContractLineItem" cli
          INNER JOIN "Contract" c ON c."id" = cli."contractId"
          WHERE cli."id" = d."contractLineItemId"
            AND c."startsOn" <= ${fiscalYear.endsOn}
            AND c."endsOn" >= ${fiscalYear.startsOn}
        )
      )`
    : Prisma.empty;

  const renewalWhere: Prisma.MaintenanceRenewalWhereInput = {
    fiscalYearId: selection.fiscalYearId,
    departmentId: selection.departmentId,
  };
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const upcomingRenewalWhere: Prisma.MaintenanceRenewalWhereInput = {
    ...renewalWhere,
    renewalDate: { gte: today },
  };
  const contractWhere: Prisma.ContractWhereInput = {
    departmentId: selection.departmentId,
    OR: fiscalYear
      ? [
          {
            startsOn: { lte: fiscalYear.endsOn },
            endsOn: { gte: fiscalYear.startsOn },
          },
          {
            renewalDate: {
              gte: fiscalYear.startsOn,
              lte: fiscalYear.endsOn,
            },
          },
        ]
      : undefined,
  };
  const deploymentWhere: Prisma.DeploymentWhereInput = {
    departmentId: selection.departmentId,
    OR: fiscalYear
      ? [
          {
            targetDate: {
              gte: fiscalYear.startsOn,
              lte: fiscalYear.endsOn,
            },
          },
          {
            completedDate: {
              gte: fiscalYear.startsOn,
              lte: fiscalYear.endsOn,
            },
          },
          {
            contractLineItem: {
              contract: {
                startsOn: { lte: fiscalYear.endsOn },
                endsOn: { gte: fiscalYear.startsOn },
              },
            },
          },
        ]
      : undefined,
  };
  const procurementWhere: Prisma.PurchaseRequestWhereInput = {
    fiscalYearId: selection.fiscalYearId,
    OR: selection.departmentId
      ? [
          { contract: { departmentId: selection.departmentId } },
          {
            contractId: null,
            maintenanceRenewal: { departmentId: selection.departmentId },
          },
          {
            contractId: null,
            maintenanceRenewalId: null,
            budgetLineItems: {
              some: { departmentId: selection.departmentId },
            },
          },
        ]
      : undefined,
  };

  const [
    budgetRows,
    renewalMetrics,
    contractMetrics,
    deploymentMetrics,
    categoryRows,
    trendRows,
    upcomingRenewals,
    procurement,
    comparisonRows,
  ] = await Promise.all([
    prisma.$queryRaw<BudgetMetricRow[]>(Prisma.sql`
      SELECT
        COALESCE(SUM(baf."approvedAmount"), 0) AS "approved",
        COALESCE(SUM(baf."actualAmount"), 0) AS "actual",
        COALESCE(SUM(baf."forecastAmount"), 0) AS "forecast",
        COUNT(*) FILTER (WHERE bi."departmentId" IS NOT NULL)::integer AS "assignedRecords",
        COUNT(*)::integer AS "totalRecords"
      FROM "BudgetAnnualFinancial" baf
      INNER JOIN "BudgetItem" bi ON bi."id" = baf."budgetItemId"
      WHERE 1 = 1
        ${budgetFiscalSql}
        ${budgetDepartmentSql}
    `),
    prisma.maintenanceRenewal.aggregate({
      where: renewalWhere,
      _sum: { approvedAmount: true },
      _count: { _all: true, departmentId: true },
    }),
    prisma.contract.aggregate({
      where: contractWhere,
      _sum: { annualValue: true },
      _count: { _all: true, departmentId: true },
    }),
    prisma.deployment.aggregate({
      where: deploymentWhere,
      _avg: { deploymentPercent: true },
      _count: { _all: true, departmentId: true },
    }),
    prisma.$queryRaw<SpendCategoryRow[]>(Prisma.sql`
      SELECT
        COALESCE(ba."name", 'Uncategorized') AS "category",
        COALESCE(
          SUM(COALESCE(NULLIF(baf."actualAmount", 0), baf."approvedAmount")),
          0
        ) AS "spend"
      FROM "BudgetAnnualFinancial" baf
      INNER JOIN "BudgetItem" bi ON bi."id" = baf."budgetItemId"
      INNER JOIN "BudgetAccount" ba ON ba."id" = baf."accountId"
      WHERE 1 = 1
        ${budgetFiscalSql}
        ${budgetDepartmentSql}
      GROUP BY ba."name"
      ORDER BY "spend" DESC, "category" ASC
      LIMIT ${DASHBOARD_GROUP_MAX}
    `),
    prisma.$queryRaw<ForecastRow[]>(Prisma.sql`
      SELECT
        fy."label" AS "fiscalYear",
        fy."startsOn",
        COALESCE(SUM(baf."actualAmount"), 0) AS "actual",
        COALESCE(SUM(baf."forecastAmount"), 0) AS "forecast",
        COALESCE(SUM(baf."approvedAmount"), 0) AS "budget",
        COALESCE(SUM(baf."encumberedAmount"), 0) AS "committed"
      FROM "BudgetAnnualFinancial" baf
      INNER JOIN "BudgetItem" bi ON bi."id" = baf."budgetItemId"
      INNER JOIN "FiscalYear" fy ON fy."id" = baf."fiscalYearId"
      WHERE 1 = 1
        ${budgetDepartmentSql}
      GROUP BY fy."id", fy."label", fy."startsOn"
      ORDER BY fy."startsOn" DESC
      LIMIT ${DASHBOARD_TREND_MAX}
    `),
    prisma.maintenanceRenewal.findMany({
      where: upcomingRenewalWhere,
      orderBy: [{ renewalDate: "asc" }, { id: "asc" }],
      take: limits.renewalLimit,
      select: {
        id: true,
        productOrService: true,
        renewalOwner: true,
        renewalDate: true,
        approvedAmount: true,
        riskStatus: true,
        vendorCompany: { select: { name: true } },
        product: { select: { name: true } },
        ownerTeamMember: { select: { fullName: true } },
        departmentRef: { select: { name: true } },
      },
    }),
    prisma.purchaseRequest.findMany({
      where: procurementWhere,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limits.procurementLimit,
      select: {
        id: true,
        title: true,
        requestAmount: true,
        approvedAmount: true,
        status: true,
        vendorCompany: { select: { name: true } },
        owner: { select: { name: true } },
        contract: {
          select: {
            departmentId: true,
            department: { select: { name: true } },
          },
        },
        maintenanceRenewal: {
          select: {
            departmentId: true,
            departmentRef: { select: { name: true } },
          },
        },
        budgetLineItems: {
          where: selection.departmentId
            ? { departmentId: selection.departmentId }
            : undefined,
          orderBy: { id: "asc" },
          take: 1,
          select: {
            departmentId: true,
            department: { select: { name: true } },
          },
        },
      },
    }),
    selection.departmentId
      ? Promise.resolve([])
      : prisma.$queryRaw<DepartmentComparisonRow[]>(Prisma.sql`
          WITH budget AS (
            SELECT
              bi."departmentId",
              COALESCE(SUM(baf."approvedAmount"), 0) AS "approved",
              COALESCE(SUM(baf."forecastAmount" - baf."approvedAmount"), 0) AS "forecastVariance"
            FROM "BudgetAnnualFinancial" baf
            INNER JOIN "BudgetItem" bi ON bi."id" = baf."budgetItemId"
            WHERE 1 = 1 ${budgetFiscalSql}
            GROUP BY bi."departmentId"
          ),
          renewal AS (
            SELECT
              mr."departmentId",
              COALESCE(SUM(mr."approvedAmount"), 0) AS "renewalExposure"
            FROM "MaintenanceRenewal" mr
            WHERE 1 = 1
              ${
                selection.fiscalYearId
                  ? Prisma.sql`AND mr."fiscalYearId" = ${selection.fiscalYearId}`
                  : Prisma.empty
              }
            GROUP BY mr."departmentId"
          ),
          contract AS (
            SELECT
              c."departmentId",
              COALESCE(SUM(c."annualValue"), 0) AS "contractSpend"
            FROM "Contract" c
            WHERE 1 = 1 ${contractFiscalSql}
            GROUP BY c."departmentId"
          ),
          deployment AS (
            SELECT
              d."departmentId",
              ROUND(AVG(d."deploymentPercent"))::integer AS "deploymentProgress"
            FROM "Deployment" d
            WHERE 1 = 1 ${deploymentFiscalSql}
            GROUP BY d."departmentId"
          ),
          department_keys AS (
            SELECT "departmentId" FROM budget
            UNION SELECT "departmentId" FROM renewal
            UNION SELECT "departmentId" FROM contract
            UNION SELECT "departmentId" FROM deployment
          )
          SELECT
            dk."departmentId" AS "id",
            COALESCE(dep."name", 'Unassigned') AS "name",
            COALESCE(b."approved", 0) AS "approved",
            COALESCE(b."forecastVariance", 0) AS "forecastVariance",
            COALESCE(r."renewalExposure", 0) AS "renewalExposure",
            COALESCE(c."contractSpend", 0) AS "contractSpend",
            COALESCE(d."deploymentProgress", 0)::integer AS "deploymentProgress"
          FROM department_keys dk
          LEFT JOIN "Department" dep ON dep."id" = dk."departmentId"
          LEFT JOIN budget b ON b."departmentId" IS NOT DISTINCT FROM dk."departmentId"
          LEFT JOIN renewal r ON r."departmentId" IS NOT DISTINCT FROM dk."departmentId"
          LEFT JOIN contract c ON c."departmentId" IS NOT DISTINCT FROM dk."departmentId"
          LEFT JOIN deployment d ON d."departmentId" IS NOT DISTINCT FROM dk."departmentId"
          ORDER BY "name" ASC
          LIMIT ${DASHBOARD_GROUP_MAX}
        `),
  ]);

  const budget = budgetRows[0] ?? {
    approved: 0,
    actual: 0,
    forecast: 0,
    assignedRecords: 0,
    totalRecords: 0,
  };
  const approved = asNumber(budget.approved);
  const actual = asNumber(budget.actual);
  const forecast = asNumber(budget.forecast);
  const variance = forecast - approved;
  const renewalExposure = asNumber(renewalMetrics._sum.approvedAmount);
  const contractSpend = asNumber(contractMetrics._sum.annualValue);
  const deploymentProgress = Math.round(
    asNumber(deploymentMetrics._avg.deploymentPercent)
  );
  const categoryTotal = categoryRows.reduce(
    (sum, row) => sum + asNumber(row.spend),
    0
  );
  const spendByCategory = categoryRows.map((row, index) => {
    const spend = asNumber(row.spend);
    return {
      category: row.category,
      spend,
      share: categoryTotal
        ? `${Math.round((spend / categoryTotal) * 100)}%`
        : "0%",
      fill: categoryColors[index % categoryColors.length],
    };
  });
  const forecastTrend = trendRows.reverse().map((row) => ({
    fiscalYear: row.fiscalYear,
    actual: asNumber(row.actual),
    forecast: asNumber(row.forecast),
    budget: asNumber(row.budget),
    committed: asNumber(row.committed),
  }));
  const renewalCount = renewalMetrics._count._all;
  const contractCount = contractMetrics._count._all;
  const deploymentCount = deploymentMetrics._count._all;
  const assignedRecords =
    budget.assignedRecords +
    renewalMetrics._count.departmentId +
    contractMetrics._count.departmentId +
    deploymentMetrics._count.departmentId;
  const totalRecords =
    budget.totalRecords + renewalCount + contractCount + deploymentCount;
  const readinessPercentage = totalRecords
    ? Math.round((assignedRecords / totalRecords) * 100)
    : 0;

  return {
    metrics: {
      budgetUtilization: `${approved ? Math.round((actual / approved) * 100) : 0}%`,
      budgetDetail: `${money(actual)} of ${money(approved)}`,
      renewalExposure: money(renewalExposure),
      renewalDetail: `${renewalCount} renewals in context`,
      forecastVariance: money(variance),
      forecastDetail:
        variance <= 0 ? "Below approved plan" : "Above approved plan",
      contractSpend: money(contractSpend),
      contractDetail: `${contractCount} active commitments`,
      deploymentProgress: `${deploymentProgress}%`,
      deploymentDetail: `${deploymentCount} deployment scopes`,
    },
    spendByCategory,
    forecastTrend,
    renewals: upcomingRenewals.map((renewal) => ({
      id: renewal.id,
      vendor: renewal.vendorCompany?.name ?? "Unassigned",
      product: renewal.product?.name ?? renewal.productOrService,
      owner:
        renewal.ownerTeamMember?.fullName ??
        renewal.renewalOwner ??
        "Unassigned",
      renewalDate: dateLabel(renewal.renewalDate),
      amount: asNumber(renewal.approvedAmount),
      status: titleCase(renewal.riskStatus),
      department: renewal.departmentRef?.name ?? "Unassigned",
    })),
    procurementQueue: procurement.map((request) => ({
      id: request.id,
      title: request.title,
      category: request.vendorCompany?.name ?? "Uncategorized",
      owner: request.owner?.name ?? "Unassigned",
      amount: firstNonZero(request.requestAmount, request.approvedAmount),
      status: titleCase(request.status),
      department:
        request.contract?.department?.name ??
        request.maintenanceRenewal?.departmentRef?.name ??
        request.budgetLineItems[0]?.department?.name ??
        "Unassigned",
    })),
    reportingReadiness: {
      percentage: readinessPercentage,
      assignedRecords,
      totalRecords,
      detail: `${assignedRecords} of ${totalRecords} scoped records have a department`,
    },
    departmentComparison: comparisonRows.map((row) => ({
      id: row.id,
      name: row.name,
      approved: asNumber(row.approved),
      forecastVariance: asNumber(row.forecastVariance),
      renewalExposure: asNumber(row.renewalExposure),
      contractSpend: asNumber(row.contractSpend),
      deploymentProgress: row.deploymentProgress,
    })),
    isAllDepartments: !selection.departmentId,
    contextDepartment: department?.name ?? "All Departments",
    contextFiscalYear: fiscalYear?.label ?? "All Fiscal Years",
  };
}

const getCachedDashboardPageData = unstable_cache(
  async (
    departmentId: string | undefined,
    fiscalYearId: string | undefined,
    renewalLimit: number,
    procurementLimit: number
  ) =>
    readDashboardPageData(
      { departmentId, fiscalYearId },
      { renewalLimit, procurementLimit }
    ),
  ["dashboard:reporting:v1"],
  {
    revalidate: 60,
    tags: [DASHBOARD_CACHE_TAG],
  }
);

export async function getDashboardPageData(
  selection: GlobalContextSelection = {},
  limits: DashboardReadLimits = {}
): Promise<DashboardPageData> {
  if (!hasDatabaseUrl()) return emptyDashboard();
  const renewalLimit = boundedLimit(
    limits.renewalLimit,
    DASHBOARD_RENEWAL_LIMIT
  );
  const procurementLimit = boundedLimit(
    limits.procurementLimit,
    DASHBOARD_PROCUREMENT_LIMIT
  );
  return getCachedDashboardPageData(
    selection.departmentId,
    selection.fiscalYearId,
    renewalLimit,
    procurementLimit
  );
}
