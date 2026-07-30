import {
  BudgetFundingStatus as PrismaBudgetFundingStatus,
  BudgetWorksheetType as PrismaBudgetWorksheetType,
  Prisma,
  RecurringClassification as PrismaRecurringClassification,
  RowReviewState as PrismaRowReviewState,
} from "@prisma/client";

import type {
  BudgetAccount,
  BudgetAnnualFinancial,
  BudgetItem,
  BudgetServerBaseline,
  BudgetWorkspaceData,
  BudgetWorksheetType,
  ConferenceBudgetDetail,
  MaintenanceRenewal,
  MembershipBudgetDetail,
  ProfessionalServicesBudgetDetail,
  SoftwareBudgetDetail,
  TrainingBudgetDetail,
  TravelBudgetDetail,
} from "@/types/budget";

import { FieldValidationError } from "@/lib/server/action-result";
import { requirePermission } from "@/lib/server/authorization";
import { getPrisma } from "@/lib/server/prisma";
import type { GlobalContextSelection } from "@/lib/server/global-context";

const worksheetToDatabase: Record<string, PrismaBudgetWorksheetType> = {
  "Software and SaaS": PrismaBudgetWorksheetType.SOFTWARE_SAAS,
  Conferences: PrismaBudgetWorksheetType.TRAVEL_CONFERENCES,
  Travel: PrismaBudgetWorksheetType.TRAVEL_CONFERENCES,
  Training: PrismaBudgetWorksheetType.TRAINING,
  "Organizational Dues": PrismaBudgetWorksheetType.ORGANIZATIONAL_DUES,
  "Professional Services": PrismaBudgetWorksheetType.PROFESSIONAL_SERVICES,
  Hardware: PrismaBudgetWorksheetType.HARDWARE,
  Personnel: PrismaBudgetWorksheetType.PERSONNEL,
};

const defaultAccountCodes: Record<string, string> = {
  "Software and SaaS": "62094",
  Conferences: "62050",
  Travel: "62026",
  Training: "62460",
  "Organizational Dues": "62081",
  "Professional Services": "62225",
};

const budgetRenewalRelations = {
  vendor: true,
  reseller: true,
  vendorCompany: true,
  sellerCompany: true,
} satisfies Prisma.MaintenanceRenewalInclude;

const budgetPlanSelect = {
  id: true,
  fiscalYearId: true,
  name: true,
  status: true,
  version: true,
  priorFiscalYear: true,
  planningOwner: true,
  submissionDueDate: true,
  assumptions: true,
  executiveNarrative: true,
  createdAt: true,
  updatedAt: true,
  fiscalYear: { select: { id: true, label: true, startsOn: true } },
} satisfies Prisma.BudgetPlanSelect;

const budgetAnnualSelect = {
  id: true,
  budgetPlanId: true,
  scenarioId: true,
  fiscalYearId: true,
  budgetItemId: true,
  accountId: true,
  worksheet: true,
  sortOrder: true,
  priorApprovedAmount: true,
  currentApprovedAmount: true,
  baseAmount: true,
  requestedAmount: true,
  proposedAmount: true,
  approvedAmount: true,
  revisedApprovedAmount: true,
  forecastAmount: true,
  encumberedAmount: true,
  actualAmount: true,
  unitCost: true,
  quantity: true,
  oneTimeAmount: true,
  recurringAmount: true,
  savingsAmount: true,
  costAvoidanceAmount: true,
  fundingStatus: true,
  recurrence: true,
  reviewState: true,
  isNewRequest: true,
  isRecurring: true,
  isOneTime: true,
  isRetired: true,
  comments: true,
  businessJustification: true,
  riskIfNotFunded: true,
  complianceRequirement: true,
  owner: true,
  worksheetDetails: true,
  linkedMaintenanceRenewal: { select: { id: true } },
  account: { select: { code: true } },
  fiscalYear: { select: { label: true } },
  budgetItem: {
    select: {
      id: true,
      departmentId: true,
      name: true,
      description: true,
      vendorId: true,
      resellerId: true,
      contractId: true,
      productId: true,
      productModuleId: true,
      owner: true,
      strategicProgramArea: true,
      active: true,
      department: { select: { name: true } },
      vendor: { select: { name: true } },
      reseller: { select: { name: true } },
      vendorCompany: { select: { name: true } },
      sellerCompany: { select: { name: true } },
    },
  },
} satisfies Prisma.BudgetAnnualFinancialSelect;

type JsonRecord = Record<string, unknown>;
type NamedRelation = { name: string } | null;
type BudgetItemRecord = {
  id: string;
  departmentId: string | null;
  name: string;
  description: string | null;
  vendorId: string | null;
  resellerId: string | null;
  contractId: string | null;
  productId: string | null;
  productModuleId: string | null;
  owner: string | null;
  strategicProgramArea: string | null;
  active: boolean;
  department?: NamedRelation;
  vendor?: NamedRelation;
  reseller?: NamedRelation;
  vendorCompany?: NamedRelation;
  sellerCompany?: NamedRelation;
};
type BudgetAnnualRecord = {
  id: string;
  budgetPlanId: string;
  scenarioId: string;
  fiscalYear: { label: string };
  budgetItemId: string;
  accountId: string;
  sortOrder: number;
  priorApprovedAmount: unknown;
  currentApprovedAmount: unknown;
  baseAmount: unknown;
  requestedAmount: unknown;
  proposedAmount: unknown;
  approvedAmount: unknown;
  revisedApprovedAmount: unknown;
  forecastAmount: unknown;
  encumberedAmount: unknown;
  actualAmount: unknown;
  unitCost: unknown;
  quantity: unknown;
  oneTimeAmount: unknown;
  recurringAmount: unknown;
  savingsAmount: unknown;
  costAvoidanceAmount: unknown;
  fundingStatus: unknown;
  recurrence: unknown;
  reviewState: unknown;
  isNewRequest: boolean;
  isRecurring: boolean;
  isOneTime: boolean;
  isRetired: boolean;
  comments: string | null;
  businessJustification: string | null;
  riskIfNotFunded: string | null;
  complianceRequirement: string | null;
  owner: string | null;
  linkedMaintenanceRenewalId?: string | null;
};
type BudgetAccountRecord = {
  id: string;
  departmentId: string | null;
  code: string;
  name: string;
  defaultWorksheet: unknown;
  active: boolean;
  sortOrder: number;
  department?: { id: string; name: string } | null;
};
type BudgetRenewalRecord = {
  id: string;
  departmentId: string | null;
  budgetPlanId: string;
  linkedAnnualFinancialId: string | null;
  vendorId: string | null;
  resellerId: string | null;
  contractId: string | null;
  productId: string | null;
  productOrService: string;
  currentAnnualCost: unknown;
  renewalQuote: unknown;
  negotiatedCost: unknown;
  renewalDate: Date;
  contractStart: Date | null;
  contractEnd: Date | null;
  noticePeriodDays: number;
  autoRenewal: boolean;
  paymentFrequency: unknown;
  fundingAccountId: string;
  renewalStatus: unknown;
  procurementStatus: unknown;
  quoteReceivedDate: Date | null;
  purchaseRequestNumber: string | null;
  purchaseOrderNumber: string | null;
  expectedPaymentDate: Date | null;
  renewalOwner: string | null;
  procurementOwner: string | null;
  renewalStrategy: string | null;
  renewalRisk: unknown;
  notesText: string | null;
  vendor?: NamedRelation;
  reseller?: NamedRelation;
  vendorCompany?: NamedRelation;
  sellerCompany?: NamedRelation;
};

export type BudgetRowSaveInput = {
  line: BudgetAnnualFinancial;
  item: BudgetItem;
  detail?:
    | SoftwareBudgetDetail
    | TrainingBudgetDetail
    | ConferenceBudgetDetail
    | TravelBudgetDetail
    | MembershipBudgetDetail
    | ProfessionalServicesBudgetDetail;
};

export type BudgetRowCreateInput = {
  budgetPlanId: string;
  worksheet: BudgetWorksheetType;
  departmentId?: string;
};

export type BudgetMaintenanceTransferOutcome = {
  renewal: MaintenanceRenewal;
  created: boolean;
};

export type BudgetWorkspaceQuery = GlobalContextSelection & {
  worksheet?: BudgetWorksheetType;
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: "order" | "name" | "amount";
};

export async function getBudgetWorkspaceData(
  query: BudgetWorkspaceQuery = {}
): Promise<BudgetWorkspaceData> {
  const prisma = getPrisma();
  const pageSizeInput = Number.isFinite(query.pageSize) ? query.pageSize! : 50;
  const pageInput = Number.isFinite(query.page) ? query.page! : 1;
  const pageSize = Math.min(100, Math.max(1, Math.floor(pageSizeInput)));
  const requestedPage = Math.max(1, Math.floor(pageInput));
  const search = query.search?.trim().slice(0, 100) ?? "";
  const sort = query.sort ?? "order";
  const worksheet = query.worksheet ?? "Summary";

  const [fiscalYears, accounts, availablePlans] = await Promise.all([
    prisma.fiscalYear.findMany({
      where: { active: true },
      orderBy: { startsOn: "desc" },
      take: 100,
      select: {
        id: true,
        label: true,
        startsOn: true,
        endsOn: true,
        isCurrent: true,
      },
    }),
    prisma.budgetAccount.findMany({
      where: {
        active: true,
        ...(query.departmentId
          ? { departmentId: query.departmentId }
          : undefined),
      },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      take: 100,
      select: {
        id: true,
        departmentId: true,
        code: true,
        name: true,
        defaultWorksheet: true,
        active: true,
        sortOrder: true,
        department: { select: { id: true, name: true } },
      },
    }),
    prisma.budgetPlan.findMany({
      where: query.fiscalYearId
        ? { fiscalYearId: query.fiscalYearId }
        : { fiscalYear: { active: true } },
      orderBy: [{ fiscalYear: { startsOn: "desc" } }, { version: "asc" }],
      take: 100,
      select: budgetPlanSelect,
    }),
  ]);

  const currentPlans = firstPlanPerFiscalYear(availablePlans);
  const priorPlan = await getPriorPlan(
    prisma,
    currentPlans[0]?.priorFiscalYear,
    currentPlans.map((plan) => plan.id)
  );
  const plans = priorPlan ? [...currentPlans, priorPlan] : currentPlans;
  const currentPlanIds = currentPlans.map((plan) => plan.id);
  const priorPlanIds = priorPlan ? [priorPlan.id] : [];
  const annualWhere = budgetAnnualWhere({
    planIds: currentPlanIds,
    departmentId: query.departmentId,
    worksheet,
    search,
  });
  const loadsWorksheetRows = worksheet !== "Summary";
  const totalItems =
    currentPlanIds.length && loadsWorksheetRows
      ? await prisma.budgetAnnualFinancial.count({ where: annualWhere })
      : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(requestedPage, totalPages);

  const [annuals, baseline] = currentPlanIds.length
    ? await Promise.all([
        loadsWorksheetRows
          ? prisma.budgetAnnualFinancial.findMany({
              where: annualWhere,
              orderBy: budgetAnnualOrderBy(sort),
              skip: (page - 1) * pageSize,
              take: pageSize,
              select: budgetAnnualSelect,
            })
          : Promise.resolve([]),
        getBudgetServerBaseline(prisma, {
          currentPlanIds,
          priorPlanIds,
          departmentId: query.departmentId,
        }),
      ])
    : [[], emptyBudgetBaseline()];

  const itemsById = new Map<string, BudgetItem>();
  const softwareDetails: SoftwareBudgetDetail[] = [];
  const trainingDetails: TrainingBudgetDetail[] = [];
  const conferenceDetails: ConferenceBudgetDetail[] = [];
  const travelDetails: TravelBudgetDetail[] = [];
  const membershipDetails: MembershipBudgetDetail[] = [];
  const professionalServicesDetails: ProfessionalServicesBudgetDetail[] = [];

  const annualFinancials = annuals.map((annual) => {
    const item = mapBudgetItem(annual.budgetItem);
    itemsById.set(item.id, item);

    const worksheet = databaseWorksheetToUi(
      String(annual.worksheet),
      annual.account.code
    );
    const details = jsonRecord(annual.worksheetDetails);
    const mappedAnnual = mapAnnualFinancial(
      {
        ...annual,
        linkedMaintenanceRenewalId: annual.linkedMaintenanceRenewal?.id ?? null,
      },
      worksheet
    );

    if (worksheet === "Software and SaaS") {
      softwareDetails.push(softwareDetail(mappedAnnual, item, details));
    }
    if (worksheet === "Training") {
      trainingDetails.push(trainingDetail(mappedAnnual, item, details));
    }
    if (worksheet === "Conferences") {
      conferenceDetails.push(conferenceDetail(mappedAnnual, item, details));
    }
    if (worksheet === "Travel") {
      travelDetails.push(travelDetail(mappedAnnual, item, details));
    }
    if (worksheet === "Organizational Dues") {
      membershipDetails.push(membershipDetail(mappedAnnual, item, details));
    }
    if (worksheet === "Professional Services") {
      professionalServicesDetails.push(
        professionalDetail(mappedAnnual, item, details)
      );
    }

    return mappedAnnual;
  });
  const annualIds = annualFinancials.map((annual) => annual.id);
  const maintenanceRenewals = annualIds.length
    ? await prisma.maintenanceRenewal.findMany({
        where: { linkedAnnualFinancialId: { in: annualIds } },
        orderBy: [{ renewalDate: "asc" }, { createdAt: "asc" }],
        include: budgetRenewalRelations,
      })
    : [];

  return {
    fiscalYears: fiscalYears.map((year) => ({
      id: year.id,
      label: year.label,
      startsOn: dateOnly(year.startsOn),
      endsOn: dateOnly(year.endsOn),
    })),
    accounts: accounts.map(mapAccount),
    plans: plans.map((plan) => ({
      id: plan.id,
      fiscalYearId: plan.fiscalYearId,
      fiscalYear: plan.fiscalYear.label,
      name: plan.name,
      status: titleCaseEnum(
        String(plan.status)
      ) as BudgetWorkspaceData["plans"][number]["status"],
      version: plan.version,
      priorFiscalYear: plan.priorFiscalYear ?? undefined,
      planningOwner: plan.planningOwner,
      submissionDueDate: plan.submissionDueDate
        ? dateOnly(plan.submissionDueDate)
        : "",
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      assumptions: plan.assumptions ?? "",
      executiveNarrative: plan.executiveNarrative ?? "",
    })),
    items: Array.from(itemsById.values()),
    annualFinancials,
    softwareDetails,
    trainingDetails,
    conferenceDetails,
    travelDetails,
    professionalServicesDetails,
    hardwareDetails: [],
    membershipDetails,
    personnelDetails: [],
    maintenanceRenewals: maintenanceRenewals.map(mapMaintenanceRenewal),
    savingsRecords: [],
    baseline,
    listState: {
      page,
      pageSize,
      totalItems,
      totalPages,
      search,
      sort,
    },
  };
}

function firstPlanPerFiscalYear<T extends { fiscalYearId: string }>(
  plans: readonly T[]
): T[] {
  const selected = new Map<string, T>();
  for (const plan of plans) {
    if (!selected.has(plan.fiscalYearId)) selected.set(plan.fiscalYearId, plan);
  }
  return Array.from(selected.values());
}

async function getPriorPlan(
  prisma: ReturnType<typeof getPrisma>,
  priorFiscalYear: string | null | undefined,
  excludedIds: string[]
) {
  if (!priorFiscalYear) return null;
  return prisma.budgetPlan.findFirst({
    where: {
      id: excludedIds.length ? { notIn: excludedIds } : undefined,
      fiscalYear: { label: priorFiscalYear },
    },
    orderBy: { version: "asc" },
    select: budgetPlanSelect,
  });
}

function budgetAnnualWhere({
  planIds,
  departmentId,
  worksheet,
  search,
}: {
  planIds: string[];
  departmentId?: string;
  worksheet: BudgetWorksheetType;
  search: string;
}): Prisma.BudgetAnnualFinancialWhereInput {
  const worksheetFilter =
    worksheet === "Summary"
      ? {}
      : {
          worksheet: uiWorksheetToDatabase(worksheet),
          ...(worksheet === "Travel" || worksheet === "Conferences"
            ? { account: { code: defaultAccountCodes[worksheet] } }
            : {}),
        };
  const searchFilter: Prisma.BudgetAnnualFinancialWhereInput = search
    ? {
        OR: [
          {
            budgetItem: {
              name: { contains: search, mode: "insensitive" },
            },
          },
          {
            budgetItem: {
              description: { contains: search, mode: "insensitive" },
            },
          },
          {
            budgetItem: {
              vendorCompany: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          },
          { owner: { contains: search, mode: "insensitive" } },
          { comments: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  return {
    budgetPlanId: { in: planIds },
    ...(departmentId ? { budgetItem: { departmentId } } : undefined),
    ...worksheetFilter,
    ...searchFilter,
  };
}

function budgetAnnualOrderBy(
  sort: NonNullable<BudgetWorkspaceQuery["sort"]>
): Prisma.BudgetAnnualFinancialOrderByWithRelationInput[] {
  if (sort === "name") {
    return [{ budgetItem: { name: "asc" } }, { id: "asc" }];
  }
  if (sort === "amount") {
    return [{ proposedAmount: "desc" }, { id: "asc" }];
  }
  return [
    { budgetPlan: { fiscalYear: { startsOn: "desc" } } },
    { sortOrder: "asc" },
    { createdAt: "asc" },
    { id: "asc" },
  ];
}

type BudgetTotalsSqlRow = {
  totalPriorApproved: unknown;
  totalCurrentApproved: unknown;
  totalProposed: unknown;
  totalApproved: unknown;
  totalForecast: unknown;
  totalActual: unknown;
  totalIncrease: unknown;
  totalDecrease: unknown;
  grossNewInvestment: unknown;
  annualSavings: unknown;
  annualCostAvoidance: unknown;
};

type BudgetSavingsSqlRow = {
  grossSavings: unknown;
  costAvoidance: unknown;
};

type BudgetComparisonSqlRow = {
  worksheet: string;
  accountCode: string;
  proposed: unknown;
  lineCount: unknown;
};

type BudgetRollupSqlRow = {
  accountId: string;
  accountCode: string;
  accountName: string;
  priorApproved: unknown;
  currentApproved: unknown;
  proposed: unknown;
  approved: unknown;
};

async function getBudgetServerBaseline(
  prisma: ReturnType<typeof getPrisma>,
  {
    currentPlanIds,
    priorPlanIds,
    departmentId,
  }: {
    currentPlanIds: string[];
    priorPlanIds: string[];
    departmentId?: string;
  }
): Promise<BudgetServerBaseline> {
  const [
    currentTotals,
    priorTotals,
    currentSavings,
    priorSavings,
    currentComparisons,
    priorComparisons,
    rollups,
  ] = await Promise.all([
    readBudgetTotals(prisma, currentPlanIds, departmentId),
    readBudgetTotals(prisma, priorPlanIds, departmentId),
    readBudgetSavings(prisma, currentPlanIds, departmentId),
    readBudgetSavings(prisma, priorPlanIds, departmentId),
    readBudgetComparisons(prisma, currentPlanIds, departmentId),
    readBudgetComparisons(prisma, priorPlanIds, departmentId),
    readBudgetRollups(prisma, currentPlanIds, departmentId),
  ]);

  const currentByWorksheet = new Map(
    currentComparisons.map((row) => [row.worksheet, row])
  );
  const priorByWorksheet = new Map(
    priorComparisons.map((row) => [row.worksheet, row])
  );
  const comparisons = (
    [
      "Software and SaaS",
      "Training",
      "Conferences",
      "Travel",
      "Organizational Dues",
      "Professional Services",
    ] satisfies BudgetWorksheetType[]
  ).map((worksheet) => ({
    worksheet,
    currentTotal: currentByWorksheet.get(worksheet)?.currentTotal ?? 0,
    priorTotal: priorByWorksheet.get(worksheet)?.currentTotal ?? 0,
    lineCount: currentByWorksheet.get(worksheet)?.lineCount ?? 0,
  }));

  return {
    totals: withSavings(currentTotals, currentSavings),
    priorTotals: withSavings(priorTotals, priorSavings),
    comparisons,
    rollups,
  };
}

function scopedBudgetSql(planIds: string[], departmentId?: string) {
  return Prisma.sql`
    baf."budgetPlanId" IN (${Prisma.join(planIds)})
    ${departmentId ? Prisma.sql`AND bi."departmentId" = ${departmentId}` : Prisma.empty}
  `;
}

async function readBudgetTotals(
  prisma: ReturnType<typeof getPrisma>,
  planIds: string[],
  departmentId?: string
) {
  if (!planIds.length) return emptyBudgetTotals();
  const rows = await prisma.$queryRaw<BudgetTotalsSqlRow[]>(Prisma.sql`
    SELECT
      COALESCE(SUM(baf."priorApprovedAmount"), 0) AS "totalPriorApproved",
      COALESCE(SUM(baf."currentApprovedAmount"), 0) AS "totalCurrentApproved",
      COALESCE(SUM(baf."proposedAmount"), 0) AS "totalProposed",
      COALESCE(SUM(baf."approvedAmount"), 0) AS "totalApproved",
      COALESCE(SUM(baf."forecastAmount"), 0) AS "totalForecast",
      COALESCE(SUM(baf."actualAmount"), 0) AS "totalActual",
      COALESCE(SUM(GREATEST(baf."proposedAmount" - baf."currentApprovedAmount", 0)), 0) AS "totalIncrease",
      COALESCE(SUM(GREATEST(baf."currentApprovedAmount" - baf."proposedAmount", 0)), 0) AS "totalDecrease",
      COALESCE(SUM(CASE WHEN baf."isNewRequest" THEN baf."proposedAmount" ELSE 0 END), 0) AS "grossNewInvestment",
      COALESCE(SUM(baf."savingsAmount"), 0) AS "annualSavings",
      COALESCE(SUM(baf."costAvoidanceAmount"), 0) AS "annualCostAvoidance"
    FROM "BudgetAnnualFinancial" baf
    INNER JOIN "BudgetItem" bi ON bi.id = baf."budgetItemId"
    WHERE ${scopedBudgetSql(planIds, departmentId)}
      AND baf."isRetired" = false
  `);
  const row = rows[0];
  if (!row) return emptyBudgetTotals();
  const totalCurrentApprovedCents = cents(row.totalCurrentApproved);
  const totalProposedCents = cents(row.totalProposed);
  return {
    totalPriorApprovedCents: cents(row.totalPriorApproved),
    totalCurrentApprovedCents,
    totalProposedCents,
    totalApprovedCents: cents(row.totalApproved),
    totalForecastCents: cents(row.totalForecast),
    totalActualCents: cents(row.totalActual),
    totalIncreaseCents: cents(row.totalIncrease),
    totalDecreaseCents: cents(row.totalDecrease),
    grossNewInvestmentCents: cents(row.grossNewInvestment),
    grossSavingsCents: cents(row.annualSavings),
    totalCostAvoidanceCents: cents(row.annualCostAvoidance),
    netChangeCents: totalProposedCents - totalCurrentApprovedCents,
  };
}

async function readBudgetSavings(
  prisma: ReturnType<typeof getPrisma>,
  planIds: string[],
  departmentId?: string
) {
  if (!planIds.length) return { grossSavingsCents: 0, costAvoidanceCents: 0 };
  const rows = await prisma.$queryRaw<BudgetSavingsSqlRow[]>(Prisma.sql`
    SELECT
      COALESCE(SUM(CASE WHEN sr."isBudgetReduction" THEN sr.amount ELSE 0 END), 0) AS "grossSavings",
      COALESCE(SUM(sr."costAvoidanceAmount"), 0) AS "costAvoidance"
    FROM "SavingsRecord" sr
    LEFT JOIN "BudgetAnnualFinancial" baf ON baf.id = sr."annualFinancialId"
    LEFT JOIN "BudgetItem" bi ON bi.id = baf."budgetItemId"
    WHERE sr."budgetPlanId" IN (${Prisma.join(planIds)})
      ${departmentId ? Prisma.sql`AND bi."departmentId" = ${departmentId}` : Prisma.empty}
  `);
  return {
    grossSavingsCents: cents(rows[0]?.grossSavings),
    costAvoidanceCents: cents(rows[0]?.costAvoidance),
  };
}

async function readBudgetComparisons(
  prisma: ReturnType<typeof getPrisma>,
  planIds: string[],
  departmentId?: string
): Promise<
  Array<{
    worksheet: BudgetWorksheetType;
    currentTotal: number;
    lineCount: number;
  }>
> {
  if (!planIds.length) return [];
  const rows = await prisma.$queryRaw<BudgetComparisonSqlRow[]>(Prisma.sql`
    SELECT
      baf.worksheet::text AS worksheet,
      ba.code AS "accountCode",
      COALESCE(SUM(baf."proposedAmount"), 0) AS proposed,
      COUNT(*)::int AS "lineCount"
    FROM "BudgetAnnualFinancial" baf
    INNER JOIN "BudgetItem" bi ON bi.id = baf."budgetItemId"
    INNER JOIN "BudgetAccount" ba ON ba.id = baf."accountId"
    WHERE ${scopedBudgetSql(planIds, departmentId)}
      AND baf."isRetired" = false
    GROUP BY baf.worksheet, ba.code
  `);
  const combined = new Map<
    BudgetWorksheetType,
    { currentTotal: number; lineCount: number }
  >();
  for (const row of rows) {
    const worksheet = databaseWorksheetToUi(row.worksheet, row.accountCode);
    const current = combined.get(worksheet) ?? {
      currentTotal: 0,
      lineCount: 0,
    };
    current.currentTotal += cents(row.proposed);
    current.lineCount += numberValue(row.lineCount);
    combined.set(worksheet, current);
  }
  return Array.from(combined, ([worksheet, value]) => ({
    worksheet,
    ...value,
  }));
}

async function readBudgetRollups(
  prisma: ReturnType<typeof getPrisma>,
  planIds: string[],
  departmentId?: string
): Promise<BudgetServerBaseline["rollups"]> {
  if (!planIds.length) return [];
  const rows = await prisma.$queryRaw<BudgetRollupSqlRow[]>(Prisma.sql`
    SELECT
      ba.id AS "accountId",
      ba.code AS "accountCode",
      ba.name AS "accountName",
      COALESCE(SUM(baf."priorApprovedAmount"), 0) AS "priorApproved",
      COALESCE(SUM(baf."currentApprovedAmount"), 0) AS "currentApproved",
      COALESCE(SUM(baf."proposedAmount"), 0) AS proposed,
      COALESCE(SUM(baf."approvedAmount"), 0) AS approved
    FROM "BudgetAnnualFinancial" baf
    INNER JOIN "BudgetItem" bi ON bi.id = baf."budgetItemId"
    INNER JOIN "BudgetAccount" ba ON ba.id = baf."accountId"
    WHERE ${scopedBudgetSql(planIds, departmentId)}
      AND baf."isRetired" = false
    GROUP BY ba.id, ba.code, ba.name
    ORDER BY ba.code
  `);
  return rows.map((row) => ({
    accountId: row.accountId,
    accountCode: row.accountCode,
    accountName: row.accountName,
    priorApprovedCents: cents(row.priorApproved),
    currentApprovedCents: cents(row.currentApproved),
    proposedCents: cents(row.proposed),
    approvedCents: cents(row.approved),
    comments: "",
  }));
}

function withSavings(
  totals: BudgetServerBaseline["totals"],
  savings: { grossSavingsCents: number; costAvoidanceCents: number }
) {
  return {
    ...totals,
    grossSavingsCents: totals.grossSavingsCents + savings.grossSavingsCents,
    totalCostAvoidanceCents:
      totals.totalCostAvoidanceCents + savings.costAvoidanceCents,
  };
}

function emptyBudgetBaseline(): BudgetServerBaseline {
  return {
    totals: emptyBudgetTotals(),
    priorTotals: emptyBudgetTotals(),
    comparisons: [],
    rollups: [],
  };
}

function emptyBudgetTotals(): BudgetServerBaseline["totals"] {
  return {
    totalPriorApprovedCents: 0,
    totalCurrentApprovedCents: 0,
    totalProposedCents: 0,
    totalApprovedCents: 0,
    totalForecastCents: 0,
    totalActualCents: 0,
    totalIncreaseCents: 0,
    totalDecreaseCents: 0,
    grossNewInvestmentCents: 0,
    grossSavingsCents: 0,
    totalCostAvoidanceCents: 0,
    netChangeCents: 0,
  };
}

export async function sendBudgetAnnualToMaintenance(
  annualFinancialId: string
): Promise<BudgetMaintenanceTransferOutcome> {
  const parsedId = annualFinancialId.trim();
  if (!parsedId) {
    throw new FieldValidationError("Budget row is required.", {
      annualFinancialId: ["Select an existing annual budget row."],
    });
  }

  const prisma = getPrisma();
  const scope = await prisma.budgetAnnualFinancial.findUnique({
    where: { id: parsedId },
    select: {
      budgetItem: {
        select: { departmentId: true },
      },
    },
  });
  if (!scope) {
    throw new FieldValidationError("Budget row was not found.", {
      annualFinancialId: ["Select an existing annual budget row."],
    });
  }

  const { actorId } = await requirePermission({
    permission: "budget.maintenance.create",
    departmentId: scope.budgetItem.departmentId,
  });

  try {
    return await prisma.$transaction(
      async (tx) => {
        const annual = await tx.budgetAnnualFinancial.findUnique({
          where: { id: parsedId },
          select: {
            id: true,
            budgetPlanId: true,
            fiscalYearId: true,
            budgetItemId: true,
            accountId: true,
            worksheet: true,
            currencyCode: true,
            currentApprovedAmount: true,
            proposedAmount: true,
            approvedAmount: true,
            isRetired: true,
            owner: true,
            account: {
              select: { code: true },
            },
            budgetPlan: {
              select: { fiscalYearId: true },
            },
            fiscalYear: {
              select: { label: true, endsOn: true },
            },
            budgetItem: {
              select: {
                id: true,
                departmentId: true,
                ownerTeamMemberId: true,
                vendorId: true,
                resellerId: true,
                vendorCompanyId: true,
                sellerCompanyId: true,
                contractId: true,
                productId: true,
                name: true,
                owner: true,
                strategicProgramArea: true,
                active: true,
                department: {
                  select: { name: true },
                },
                ownerTeamMember: {
                  select: { fullName: true },
                },
                contract: {
                  select: {
                    startsOn: true,
                    endsOn: true,
                    renewalDate: true,
                    noticePeriodDays: true,
                    autoRenewal: true,
                    paymentFrequency: true,
                  },
                },
              },
            },
          },
        });
        if (!annual) {
          throw new FieldValidationError("Budget row was not found.", {
            annualFinancialId: ["Select an existing annual budget row."],
          });
        }
        if (annual.budgetItem.departmentId !== scope.budgetItem.departmentId) {
          throw new FieldValidationError(
            "The Budget row changed while the Maintenance link was being created.",
            {
              annualFinancialId: [
                "Refresh the Budget workspace and try the transfer again.",
              ],
            }
          );
        }

        const existingForAnnual = await tx.maintenanceRenewal.findUnique({
          where: { linkedAnnualFinancialId: annual.id },
          include: budgetRenewalRelations,
        });
        if (existingForAnnual) {
          return {
            renewal: mapMaintenanceRenewal(existingForAnnual),
            created: false,
          };
        }

        assertMaintenanceEligible(annual);

        if (annual.budgetPlan.fiscalYearId !== annual.fiscalYearId) {
          throw new FieldValidationError(
            "Budget Plan and annual Fiscal Year do not match.",
            {
              annualFinancialId: [
                "Correct the Budget row Fiscal Year before sending it to Maintenance.",
              ],
            }
          );
        }

        const existingForContract = annual.budgetItem.contractId
          ? await tx.maintenanceRenewal.findFirst({
              where: {
                contractId: annual.budgetItem.contractId,
                fiscalYearId: annual.fiscalYearId,
                overallStatus: { notIn: ["CANCELLED", "ARCHIVED"] },
              },
              orderBy: [{ createdAt: "asc" }, { id: "asc" }],
              include: budgetRenewalRelations,
            })
          : null;

        if (
          existingForContract?.linkedAnnualFinancialId &&
          existingForContract.linkedAnnualFinancialId !== annual.id
        ) {
          throw new FieldValidationError(
            "This Contract already has a Maintenance Renewal linked to another Budget row.",
            {
              annualFinancialId: [
                "Use the existing linked Budget row or review the Maintenance Renewal before retrying.",
              ],
            }
          );
        }
        if (
          existingForContract &&
          existingForContract.budgetPlanId !== annual.budgetPlanId
        ) {
          throw new FieldValidationError(
            "This Contract already has a Maintenance Renewal in another Budget Plan.",
            {
              annualFinancialId: [
                "Review the existing Maintenance Renewal before linking this Budget row.",
              ],
            }
          );
        }
        if (
          existingForContract?.departmentId &&
          existingForContract.departmentId !== annual.budgetItem.departmentId
        ) {
          throw new FieldValidationError(
            "This Contract already has a Maintenance Renewal in another Department.",
            {
              annualFinancialId: [
                "Review the existing Maintenance Renewal Department before linking this Budget row.",
              ],
            }
          );
        }

        const auditMetadata = {
          sourceEntityType: "BudgetAnnualFinancial",
          sourceEntityId: annual.id,
          budgetPlanId: annual.budgetPlanId,
          budgetItemId: annual.budgetItemId,
        } satisfies Prisma.InputJsonObject;

        if (existingForContract) {
          const linked = await tx.maintenanceRenewal.update({
            where: { id: existingForContract.id },
            data: {
              departmentId:
                existingForContract.departmentId ??
                annual.budgetItem.departmentId,
              linkedAnnualFinancialId: annual.id,
              budgetItemId: annual.budgetItemId,
            },
            include: budgetRenewalRelations,
          });
          await tx.budgetAnnualFinancial.update({
            where: { id: annual.id },
            data: { reviewState: PrismaRowReviewState.UPDATED },
          });
          await tx.activityLog.create({
            data: {
              actorId,
              action: "UPDATE",
              entityType: "MaintenanceRenewal",
              entityId: linked.id,
              fieldName: "linkedAnnualFinancialId",
              newValue: annual.id,
              metadata: auditMetadata,
            },
          });
          return {
            renewal: mapMaintenanceRenewal(linked),
            created: false,
          };
        }

        const contract = annual.budgetItem.contract;
        const proposedAmount = annual.proposedAmount;
        const created = await tx.maintenanceRenewal.create({
          data: {
            departmentId: annual.budgetItem.departmentId,
            ownerTeamMemberId: annual.budgetItem.ownerTeamMemberId,
            budgetPlanId: annual.budgetPlanId,
            fiscalYearId: annual.fiscalYearId,
            linkedAnnualFinancialId: annual.id,
            budgetItemId: annual.budgetItemId,
            vendorId: annual.budgetItem.vendorId,
            resellerId: annual.budgetItem.resellerId,
            vendorCompanyId: annual.budgetItem.vendorCompanyId,
            sellerCompanyId: annual.budgetItem.sellerCompanyId,
            contractId: annual.budgetItem.contractId,
            productId: annual.budgetItem.productId,
            fundingAccountId: annual.accountId,
            renewalName: `${annual.budgetItem.name} renewal`,
            productOrService: annual.budgetItem.name,
            department: annual.budgetItem.department?.name,
            costCenter: annual.budgetItem.strategicProgramArea,
            currentAnnualCost: annual.currentApprovedAmount,
            forecastedRenewalCost: proposedAmount,
            approvedAmount: annual.approvedAmount,
            renewalQuote: proposedAmount,
            negotiatedCost: proposedAmount,
            currencyCode: annual.currencyCode,
            currentContractStart: contract?.startsOn,
            currentContractEnd: contract?.endsOn,
            contractStart: contract?.startsOn,
            contractEnd: contract?.endsOn,
            renewalDate:
              contract?.renewalDate ??
              contract?.endsOn ??
              annual.fiscalYear.endsOn,
            renewalExpirationDate: contract?.endsOn ?? annual.fiscalYear.endsOn,
            noticePeriodDays: contract?.noticePeriodDays ?? 60,
            autoRenewal: contract?.autoRenewal ?? false,
            paymentFrequency: contract?.paymentFrequency ?? "ANNUAL",
            renewalStatus: "PLANNING",
            renewalOwner:
              annual.budgetItem.ownerTeamMember?.fullName ??
              annual.budgetItem.owner ??
              annual.owner,
            notesText: `Created from ${annual.fiscalYear.label} Budget row ${annual.id}.`,
          },
          include: budgetRenewalRelations,
        });
        await tx.budgetAnnualFinancial.update({
          where: { id: annual.id },
          data: { reviewState: PrismaRowReviewState.UPDATED },
        });
        await tx.activityLog.create({
          data: {
            actorId,
            action: "CREATE",
            entityType: "MaintenanceRenewal",
            entityId: created.id,
            fieldName: "linkedAnnualFinancialId",
            newValue: annual.id,
            metadata: auditMetadata,
          },
        });

        return {
          renewal: mapMaintenanceRenewal(created),
          created: true,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const existing = await prisma.maintenanceRenewal.findUnique({
        where: { linkedAnnualFinancialId: parsedId },
        include: budgetRenewalRelations,
      });
      if (existing) {
        return {
          renewal: mapMaintenanceRenewal(existing),
          created: false,
        };
      }
    }
    if (isPrismaErrorCode(error, "P2034")) {
      throw new FieldValidationError(
        "The Budget row or Maintenance Renewal changed during the transfer.",
        {
          annualFinancialId: ["Refresh the workspace and retry the transfer."],
        }
      );
    }
    throw error;
  }
}

export async function createBudgetRow(input: BudgetRowCreateInput) {
  const prisma = getPrisma();
  const plan = await prisma.budgetPlan.findUnique({
    where: { id: input.budgetPlanId },
    include: { fiscalYear: true, scenarios: { orderBy: { createdAt: "asc" } } },
  });
  if (!plan) {
    throw new FieldValidationError("Budget plan was not found.", {
      budgetPlanId: ["Select an existing budget plan."],
    });
  }
  const scenario = activeScenario(plan.scenarios);
  const account = await defaultAccountForWorksheet(
    input.worksheet,
    input.departmentId
  );
  const sortOrder = await prisma.budgetAnnualFinancial.count({
    where: { budgetPlanId: plan.id, scenarioId: scenario.id },
  });
  const itemName = `New ${input.worksheet === "Software and SaaS" ? "Software" : input.worksheet} line`;
  const details = defaultWorksheetDetails(input.worksheet, itemName);

  await prisma.$transaction(async (tx) => {
    const item = await tx.budgetItem.create({
      data: {
        name: itemName,
        description: "",
        departmentId: input.departmentId,
        owner: "",
        strategicProgramArea: "Budget Tracking",
      },
    });
    await tx.budgetAnnualFinancial.create({
      data: {
        budgetPlanId: plan.id,
        scenarioId: scenario.id,
        fiscalYearId: plan.fiscalYearId,
        budgetItemId: item.id,
        accountId: account.id,
        worksheet: uiWorksheetToDatabase(input.worksheet),
        sortOrder,
        requestedAmount: "0.00",
        proposedAmount: "0.00",
        forecastAmount: "0.00",
        unitCost: "0.00",
        quantity: "1.00",
        recurringAmount: "0.00",
        fundingStatus: "REQUESTED",
        reviewState: "NEEDS_REVIEW",
        comments: details.notes ?? "",
        worksheetDetails: details as Prisma.InputJsonObject,
      },
    });
  });
}

export async function saveBudgetRow(input: BudgetRowSaveInput) {
  const prisma = getPrisma();
  const line = input.line;
  const detail = input.detail;
  const annualData = annualPersistenceData(line, detail);

  await prisma.$transaction(async (tx) => {
    await tx.budgetItem.update({
      where: { id: input.item.id },
      data: {
        name: input.item.name,
        description: input.item.description,
        owner: input.item.owner,
        strategicProgramArea: input.item.strategicProgramArea,
      },
    });
    await tx.budgetAnnualFinancial.update({
      where: { id: line.id },
      data: annualData,
    });
  });
}

export async function duplicateBudgetRow(lineId: string) {
  const prisma = getPrisma();
  const source = await prisma.budgetAnnualFinancial.findUnique({
    where: { id: lineId },
    include: { budgetItem: true },
  });
  if (!source) {
    throw new FieldValidationError("Budget row was not found.", {
      lineId: ["Select an existing budget row."],
    });
  }
  const sortOrder = await prisma.budgetAnnualFinancial.count({
    where: { budgetPlanId: source.budgetPlanId, scenarioId: source.scenarioId },
  });

  await prisma.$transaction(async (tx) => {
    const item = await tx.budgetItem.create({
      data: {
        departmentId: source.budgetItem.departmentId,
        ownerTeamMemberId: source.budgetItem.ownerTeamMemberId,
        vendorId: source.budgetItem.vendorId,
        resellerId: source.budgetItem.resellerId,
        vendorCompanyId: source.budgetItem.vendorCompanyId,
        sellerCompanyId: source.budgetItem.sellerCompanyId,
        contractId: source.budgetItem.contractId,
        productId: source.budgetItem.productId,
        productModuleId: source.budgetItem.productModuleId,
        name: `${source.budgetItem.name} Copy`,
        description: source.budgetItem.description,
        owner: source.budgetItem.owner,
        strategicProgramArea: source.budgetItem.strategicProgramArea,
      },
    });
    await tx.budgetAnnualFinancial.create({
      data: {
        budgetPlanId: source.budgetPlanId,
        scenarioId: source.scenarioId,
        fiscalYearId: source.fiscalYearId,
        budgetItemId: item.id,
        accountId: source.accountId,
        worksheet: source.worksheet,
        sortOrder,
        currencyCode: source.currencyCode,
        priorApprovedAmount: source.priorApprovedAmount,
        currentApprovedAmount: source.currentApprovedAmount,
        baseAmount: source.baseAmount,
        requestedAmount: source.requestedAmount,
        proposedAmount: source.proposedAmount,
        approvedAmount: source.approvedAmount,
        revisedApprovedAmount: source.revisedApprovedAmount,
        forecastAmount: source.forecastAmount,
        encumberedAmount: source.encumberedAmount,
        actualAmount: source.actualAmount,
        unitCost: source.unitCost,
        quantity: source.quantity,
        oneTimeAmount: source.oneTimeAmount,
        recurringAmount: source.recurringAmount,
        savingsAmount: source.savingsAmount,
        costAvoidanceAmount: source.costAvoidanceAmount,
        fundingStatus: source.fundingStatus,
        recurrence: source.recurrence,
        reviewState: "UPDATED",
        isNewRequest: source.isNewRequest,
        isRecurring: source.isRecurring,
        isOneTime: source.isOneTime,
        isRetired: source.isRetired,
        comments: source.comments,
        businessJustification: source.businessJustification,
        riskIfNotFunded: source.riskIfNotFunded,
        complianceRequirement: source.complianceRequirement,
        owner: source.owner,
        worksheetDetails: source.worksheetDetails as Prisma.InputJsonValue,
      },
    });
  });
}

export async function deleteBudgetRow(lineId: string) {
  const prisma = getPrisma();
  const line = await prisma.budgetAnnualFinancial.findUnique({
    where: { id: lineId },
    select: { budgetItemId: true },
  });
  if (!line) return;

  await prisma.$transaction(async (tx) => {
    await tx.budgetAnnualFinancial.delete({ where: { id: lineId } });
    const remaining = await tx.budgetAnnualFinancial.count({
      where: { budgetItemId: line.budgetItemId },
    });
    if (remaining === 0) {
      await tx.budgetItem.update({
        where: { id: line.budgetItemId },
        data: { active: false },
      });
    }
  });
}

export function worksheetDetailsForContract({
  contractTitle,
  resellerLabel,
}: {
  contractTitle: string;
  resellerLabel?: string | null;
}) {
  return {
    resellerLabel: resellerLabel || "Direct",
    requestType: "New",
    replaces: "",
    notes: `Created from contract ${contractTitle}.`,
  };
}

export function budgetWorksheetForAccount(
  defaultWorksheet: string
): PrismaBudgetWorksheetType {
  return defaultWorksheet === "MAINTENANCE_RENEWALS"
    ? PrismaBudgetWorksheetType.SOFTWARE_SAAS
    : (defaultWorksheet as PrismaBudgetWorksheetType);
}

function mapBudgetItem(item: BudgetItemRecord): BudgetItem {
  return {
    id: item.id,
    departmentId: item.departmentId ?? undefined,
    departmentName: item.department?.name ?? undefined,
    name: item.name,
    description: item.description ?? "",
    vendorId:
      item.vendorCompany?.name ??
      item.vendor?.name ??
      item.vendorId ??
      undefined,
    resellerId:
      item.sellerCompany?.name ??
      item.reseller?.name ??
      item.resellerId ??
      undefined,
    contractId: item.contractId ?? undefined,
    productId: item.productId ?? undefined,
    productModuleId: item.productModuleId ?? undefined,
    owner: item.owner ?? "",
    strategicProgramArea: item.strategicProgramArea ?? "",
    active: item.active,
  };
}

function mapMaintenanceRenewal(
  renewal: BudgetRenewalRecord
): MaintenanceRenewal {
  const vendorName = renewal.vendorCompany?.name ?? renewal.vendor?.name ?? "";
  const resellerName =
    renewal.sellerCompany?.name ?? renewal.reseller?.name ?? undefined;

  return {
    id: renewal.id,
    budgetPlanId: renewal.budgetPlanId,
    linkedAnnualFinancialId: renewal.linkedAnnualFinancialId ?? undefined,
    vendorId: vendorName || renewal.vendorId || undefined,
    resellerId: resellerName || renewal.resellerId || undefined,
    contractId: renewal.contractId ?? undefined,
    productId: renewal.productId ?? undefined,
    vendor: vendorName,
    productOrService: renewal.productOrService,
    reseller: resellerName,
    currentCostCents: cents(renewal.currentAnnualCost),
    renewalQuoteCents: cents(renewal.renewalQuote),
    negotiatedCostCents: cents(renewal.negotiatedCost),
    renewalDate: dateOnly(renewal.renewalDate),
    contractStart: renewal.contractStart ? dateOnly(renewal.contractStart) : "",
    contractEnd: renewal.contractEnd ? dateOnly(renewal.contractEnd) : "",
    noticePeriodDays: renewal.noticePeriodDays,
    autoRenewal: renewal.autoRenewal,
    paymentFrequency: titleCaseEnum(String(renewal.paymentFrequency)),
    fundingAccountId: renewal.fundingAccountId,
    renewalStatus: titleCaseEnum(
      String(renewal.renewalStatus)
    ) as MaintenanceRenewal["renewalStatus"],
    procurementStatus: titleCaseEnum(
      String(renewal.procurementStatus)
    ) as MaintenanceRenewal["procurementStatus"],
    quoteReceivedDate: renewal.quoteReceivedDate
      ? dateOnly(renewal.quoteReceivedDate)
      : undefined,
    purchaseRequestNumber: renewal.purchaseRequestNumber ?? undefined,
    purchaseOrderNumber: renewal.purchaseOrderNumber ?? undefined,
    expectedPaymentDate: renewal.expectedPaymentDate
      ? dateOnly(renewal.expectedPaymentDate)
      : undefined,
    renewalOwner: renewal.renewalOwner ?? "",
    procurementOwner: renewal.procurementOwner ?? "",
    renewalStrategy: renewal.renewalStrategy ?? "",
    renewalRisk: titleCaseEnum(
      String(renewal.renewalRisk)
    ) as MaintenanceRenewal["renewalRisk"],
    notes: renewal.notesText ?? "",
  };
}

function assertMaintenanceEligible(annual: {
  worksheet: PrismaBudgetWorksheetType;
  isRetired: boolean;
  account: { code: string };
  budgetItem: { active: boolean; contractId: string | null };
}) {
  if (!annual.budgetItem.active || annual.isRetired) {
    throw new FieldValidationError(
      "Retired or inactive Budget rows cannot be sent to Maintenance.",
      {
        annualFinancialId: ["Select an active annual Budget row."],
      }
    );
  }
  if (
    annual.worksheet !== PrismaBudgetWorksheetType.SOFTWARE_SAAS &&
    annual.account.code !== "63256" &&
    !annual.budgetItem.contractId
  ) {
    throw new FieldValidationError(
      "This Budget row is not eligible for Maintenance Renewals.",
      {
        annualFinancialId: [
          "Select a Software, Maintenance account, or Contract-backed annual row.",
        ],
      }
    );
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return isPrismaErrorCode(error, "P2002");
}

function isPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

function mapAnnualFinancial(
  annual: BudgetAnnualRecord,
  worksheet: BudgetWorksheetType
): BudgetAnnualFinancial {
  return {
    id: annual.id,
    budgetPlanId: annual.budgetPlanId,
    scenarioId: annual.scenarioId,
    fiscalYear: annual.fiscalYear.label,
    budgetItemId: annual.budgetItemId,
    accountId: annual.accountId,
    worksheet,
    sortOrder: annual.sortOrder,
    priorApprovedAmountCents: cents(annual.priorApprovedAmount),
    currentApprovedAmountCents: cents(annual.currentApprovedAmount),
    baseAmountCents: cents(annual.baseAmount),
    requestedAmountCents: cents(annual.requestedAmount),
    proposedAmountCents: cents(annual.proposedAmount),
    approvedAmountCents: cents(annual.approvedAmount),
    revisedApprovedAmountCents: cents(annual.revisedApprovedAmount),
    forecastAmountCents: cents(annual.forecastAmount),
    encumberedAmountCents: cents(annual.encumberedAmount),
    actualAmountCents: cents(annual.actualAmount),
    unitCostCents: cents(annual.unitCost),
    quantity: numberValue(annual.quantity),
    oneTimeAmountCents: cents(annual.oneTimeAmount),
    recurringAmountCents: cents(annual.recurringAmount),
    savingsAmountCents: cents(annual.savingsAmount),
    costAvoidanceAmountCents: cents(annual.costAvoidanceAmount),
    fundingStatus: titleCaseEnum(
      String(annual.fundingStatus)
    ) as BudgetAnnualFinancial["fundingStatus"],
    recurrence: titleCaseEnum(
      String(annual.recurrence)
    ) as BudgetAnnualFinancial["recurrence"],
    reviewState: titleCaseEnum(
      String(annual.reviewState)
    ) as BudgetAnnualFinancial["reviewState"],
    isNewRequest: annual.isNewRequest,
    isRecurring: annual.isRecurring,
    isOneTime: annual.isOneTime,
    isRetired: annual.isRetired,
    comments: annual.comments ?? "",
    businessJustification: annual.businessJustification ?? "",
    riskIfNotFunded: annual.riskIfNotFunded ?? "",
    complianceRequirement: annual.complianceRequirement ?? undefined,
    owner: annual.owner ?? "",
    linkedMaintenanceRenewalId: annual.linkedMaintenanceRenewalId ?? undefined,
  };
}

function mapAccount(account: BudgetAccountRecord): BudgetAccount {
  return {
    id: account.id,
    departmentId: account.departmentId ?? undefined,
    departmentName: account.department?.name,
    code: account.code,
    name: account.name,
    defaultWorksheet: accountWorksheetToUi(
      String(account.defaultWorksheet),
      account.code
    ),
    active: account.active,
    sortOrder: account.sortOrder,
  };
}

function softwareDetail(
  line: BudgetAnnualFinancial,
  item: BudgetItem,
  details: JsonRecord
): SoftwareBudgetDetail {
  const requestType =
    details.requestType === "Replacement" ? "Replacement" : "New";
  return {
    annualFinancialId: line.id,
    reseller: stringValue(details.resellerLabel) ?? item.resellerId ?? "Direct",
    requestType,
    replaces: stringValue(details.replaces) ?? "",
    notes: stringValue(details.notes) ?? line.comments,
  };
}

function trainingDetail(
  line: BudgetAnnualFinancial,
  item: BudgetItem,
  details: JsonRecord
): TrainingBudgetDetail {
  return {
    annualFinancialId: line.id,
    training: stringValue(details.training) ?? item.description ?? item.name,
    quantity: numberDetail(details.quantity) ?? line.quantity,
    costCents: numberDetail(details.costCents) ?? line.unitCostCents,
  };
}

function conferenceDetail(
  line: BudgetAnnualFinancial,
  item: BudgetItem,
  details: JsonRecord
): ConferenceBudgetDetail {
  return {
    annualFinancialId: line.id,
    conference: stringValue(details.conference) ?? item.name,
    attendees: numberDetail(details.attendees) ?? line.quantity,
    registrationFeeCents:
      numberDetail(details.registrationFeeCents) ?? line.unitCostCents,
  };
}

function travelDetail(
  line: BudgetAnnualFinancial,
  item: BudgetItem,
  details: JsonRecord
): TravelBudgetDetail {
  return {
    annualFinancialId: line.id,
    conferenceOrTrip: stringValue(details.conferenceOrTrip) ?? item.name,
    attendees: numberDetail(details.attendees) ?? line.quantity,
    airfareCents: numberDetail(details.airfareCents) ?? 0,
    hotelCents: numberDetail(details.hotelCents) ?? 0,
    perDiemCents: numberDetail(details.perDiemCents) ?? 0,
    luggageCents: numberDetail(details.luggageCents) ?? 0,
    parkingCents: numberDetail(details.parkingCents) ?? 0,
    taxiUberCents: numberDetail(details.taxiUberCents) ?? 0,
  };
}

function membershipDetail(
  line: BudgetAnnualFinancial,
  item: BudgetItem,
  details: JsonRecord
): MembershipBudgetDetail {
  return {
    annualFinancialId: line.id,
    employee: stringValue(details.employee) ?? item.owner,
    organization: stringValue(details.organization) ?? item.name,
    certification: stringValue(details.certification) ?? "",
    annualFeeCents:
      numberDetail(details.annualFeeCents) ?? line.proposedAmountCents,
  };
}

function professionalDetail(
  line: BudgetAnnualFinancial,
  item: BudgetItem,
  details: JsonRecord
): ProfessionalServicesBudgetDetail {
  return {
    annualFinancialId: line.id,
    vendor: stringValue(details.vendor) ?? displayVendor(item),
    productOrEmployee: stringValue(details.productOrEmployee) ?? item.name,
    amount: numberDetail(details.amount) ?? 1,
    rateCents: numberDetail(details.rateCents) ?? line.proposedAmountCents,
  };
}

function annualPersistenceData(
  line: BudgetAnnualFinancial,
  detail: BudgetRowSaveInput["detail"]
) {
  const worksheetDetails = detailToJson(line, detail) as Prisma.InputJsonObject;
  const quantity = quantityForPersistence(line, detail);
  const unitCostCents = unitCostForPersistence(line, detail);

  return {
    accountId: line.accountOverrideId ?? line.accountId,
    sortOrder: line.sortOrder,
    worksheet: uiWorksheetToDatabase(line.worksheet),
    priorApprovedAmount: dollars(line.priorApprovedAmountCents),
    currentApprovedAmount: dollars(line.currentApprovedAmountCents),
    baseAmount: dollars(line.baseAmountCents),
    requestedAmount: dollars(line.requestedAmountCents),
    proposedAmount: dollars(line.proposedAmountCents),
    approvedAmount: dollars(line.approvedAmountCents),
    revisedApprovedAmount: dollars(line.revisedApprovedAmountCents),
    forecastAmount: dollars(line.forecastAmountCents),
    encumberedAmount: dollars(line.encumberedAmountCents),
    actualAmount: dollars(line.actualAmountCents),
    unitCost: dollars(unitCostCents),
    quantity: quantity.toFixed(2),
    oneTimeAmount: dollars(line.oneTimeAmountCents),
    recurringAmount: dollars(line.recurringAmountCents),
    savingsAmount: dollars(line.savingsAmountCents),
    costAvoidanceAmount: dollars(line.costAvoidanceAmountCents),
    fundingStatus: uiEnumToDatabase(
      line.fundingStatus
    ) as PrismaBudgetFundingStatus,
    recurrence: uiEnumToDatabase(
      line.recurrence
    ) as PrismaRecurringClassification,
    reviewState: uiEnumToDatabase(line.reviewState) as PrismaRowReviewState,
    isNewRequest: line.isNewRequest,
    isRecurring: line.isRecurring,
    isOneTime: line.isOneTime,
    isRetired: line.isRetired,
    comments: commentsForPersistence(line, detail),
    businessJustification: line.businessJustification,
    riskIfNotFunded: line.riskIfNotFunded,
    complianceRequirement: line.complianceRequirement,
    owner: line.owner,
    worksheetDetails,
  };
}

function detailToJson(
  line: BudgetAnnualFinancial,
  detail: BudgetRowSaveInput["detail"]
) {
  if (!detail) return {};
  if (line.worksheet === "Software and SaaS") {
    const software = detail as SoftwareBudgetDetail;
    return {
      resellerLabel: software.reseller ?? "Direct",
      requestType: software.requestType ?? "New",
      replaces: software.replaces ?? "",
      notes: software.notes ?? line.comments,
    };
  }
  const worksheetDetails = { ...detail } as Record<string, unknown>;
  delete worksheetDetails.annualFinancialId;
  return worksheetDetails;
}

function defaultWorksheetDetails(worksheet: BudgetWorksheetType, name: string) {
  if (worksheet === "Software and SaaS") {
    return {
      resellerLabel: "Direct",
      requestType: "New",
      replaces: "",
      notes: "",
    };
  }
  if (worksheet === "Training")
    return { training: "", quantity: 1, costCents: 0 };
  if (worksheet === "Conferences") {
    return { conference: "", attendees: 1, registrationFeeCents: 0 };
  }
  if (worksheet === "Travel") {
    return {
      conferenceOrTrip: "",
      attendees: 1,
      airfareCents: 0,
      hotelCents: 0,
      perDiemCents: 0,
      luggageCents: 0,
      parkingCents: 0,
      taxiUberCents: 0,
    };
  }
  if (worksheet === "Organizational Dues") {
    return {
      employee: "",
      organization: "",
      certification: "",
      annualFeeCents: 0,
    };
  }
  if (worksheet === "Professional Services") {
    return { vendor: "", productOrEmployee: name, amount: 1, rateCents: 0 };
  }
  return {};
}

async function defaultAccountForWorksheet(
  worksheet: BudgetWorksheetType,
  departmentId?: string
) {
  const prisma = getPrisma();
  const code = defaultAccountCodes[worksheet];
  const worksheetType = uiWorksheetToDatabase(worksheet);
  const account =
    (departmentId
      ? await prisma.budgetAccount.findFirst({
          where: {
            departmentId,
            defaultWorksheet: worksheetType,
            active: true,
          },
          orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
        })
      : null) ??
    (await prisma.budgetAccount.findFirst({
      where: code
        ? { code, departmentId: null, active: true }
        : { defaultWorksheet: worksheetType, departmentId: null, active: true },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    }));
  if (!account) {
    throw new FieldValidationError("Budget account was not found.", {
      accountId: ["Create an active default account for this worksheet."],
    });
  }
  return account;
}

function activeScenario(scenarios: Array<{ id: string; isActive: boolean }>) {
  const scenario =
    scenarios.find((candidate) => candidate.isActive) ?? scenarios[0];
  if (!scenario) {
    throw new FieldValidationError("Budget plan has no scenario.", {
      budgetPlanId: ["Create a budget scenario before adding rows."],
    });
  }
  return scenario;
}

function databaseWorksheetToUi(
  value: string,
  accountCode?: string
): BudgetWorksheetType {
  if (value === "SOFTWARE_SAAS" || value === "MAINTENANCE_RENEWALS") {
    return "Software and SaaS";
  }
  if (value === "TRAINING") return "Training";
  if (value === "ORGANIZATIONAL_DUES") return "Organizational Dues";
  if (value === "PROFESSIONAL_SERVICES") return "Professional Services";
  if (value === "TRAVEL_CONFERENCES") {
    return accountCode === "62026" ? "Travel" : "Conferences";
  }
  if (value === "HARDWARE") return "Hardware";
  if (value === "PERSONNEL") return "Personnel";
  return "Software and SaaS";
}

function accountWorksheetToUi(
  value: string,
  accountCode?: string
): BudgetWorksheetType {
  return databaseWorksheetToUi(value, accountCode);
}

function uiWorksheetToDatabase(worksheet: BudgetWorksheetType) {
  return (
    worksheetToDatabase[worksheet] ?? PrismaBudgetWorksheetType.SOFTWARE_SAAS
  );
}

function uiEnumToDatabase(value: string) {
  return value.replace(/-/g, " ").replace(/\s+/g, "_").toUpperCase();
}

function titleCaseEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .replace("Saas", "SaaS");
}

function jsonRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function numberDetail(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function numberValue(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function cents(value: unknown) {
  return Math.round(numberValue(value) * 100);
}

function dollars(centsValue: number) {
  return (centsValue / 100).toFixed(2);
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function displayVendor(item: BudgetItem) {
  return item.vendorId ? item.vendorId : "Unassigned";
}

function quantityForPersistence(
  line: BudgetAnnualFinancial,
  detail: BudgetRowSaveInput["detail"]
) {
  if (!detail) return line.quantity;
  if ("quantity" in detail && typeof detail.quantity === "number") {
    return detail.quantity;
  }
  if ("attendees" in detail && typeof detail.attendees === "number") {
    return detail.attendees;
  }
  if ("amount" in detail && typeof detail.amount === "number") {
    return detail.amount;
  }
  return line.quantity;
}

function unitCostForPersistence(
  line: BudgetAnnualFinancial,
  detail: BudgetRowSaveInput["detail"]
) {
  if (!detail) return line.unitCostCents;
  if ("costCents" in detail && typeof detail.costCents === "number") {
    return detail.costCents;
  }
  if (
    "registrationFeeCents" in detail &&
    typeof detail.registrationFeeCents === "number"
  ) {
    return detail.registrationFeeCents;
  }
  if ("annualFeeCents" in detail && typeof detail.annualFeeCents === "number") {
    return detail.annualFeeCents;
  }
  if ("rateCents" in detail && typeof detail.rateCents === "number") {
    return detail.rateCents;
  }
  return line.unitCostCents;
}

function commentsForPersistence(
  line: BudgetAnnualFinancial,
  detail: BudgetRowSaveInput["detail"]
) {
  if (detail && "notes" in detail && typeof detail.notes === "string") {
    return detail.notes;
  }
  return line.comments;
}
