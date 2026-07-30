import { z } from "zod";
import { Prisma } from "@prisma/client";

import {
  FieldValidationError,
  type FieldErrors,
} from "@/lib/server/action-result";
import { requirePermission } from "@/lib/server/authorization";
import {
  budgetWorksheetForAccount,
  worksheetDetailsForContract,
} from "@/lib/server/budget-service";
import { getPrisma } from "@/lib/server/prisma";
import type { GlobalContextSelection } from "@/lib/server/global-context";
import {
  maintenanceRenewalOptionSets,
  createDispositionWork,
} from "@/lib/server/maintenance-renewal-service";
import {
  CONTRACT_LIST_DEFAULT_SIZE,
  CONTRACT_LIST_MAX_SIZE,
  type ContractDetailDto,
  type ContractEditorOptionsDto,
  type ContractHandoffOptionsDto,
  type ContractListFilters,
  type ContractListResultDto,
  type ContractListRowDto,
  type ContractPageDataDto,
  type ContractRenewalSummaryDto,
  type ContractSortKey,
} from "@/types/contracts";

type PrismaClientLike = ReturnType<typeof getPrisma>;

export const contractOptionSets = {
  contractTypes: [
    "SOFTWARE",
    "SAAS",
    "HARDWARE",
    "PROFESSIONAL_SERVICES",
    "MANAGED_SERVICES",
    "SUPPORT",
    "MAINTENANCE",
    "TRAINING",
    "CERTIFICATION",
    "OTHER",
  ] as const,
  contractStatuses: [
    "ACTIVE",
    "PENDING",
    "RENEWING",
    "EXPIRING_SOON",
    "EXPIRED",
    "TERMINATED",
  ] as const,
  paymentFrequencies: [
    "MONTHLY",
    "QUARTERLY",
    "ANNUAL",
    "MULTI_YEAR",
    "ONE_TIME",
  ] as const,
  renewalRisks: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const,
  licenseMetrics: [
    "USERS",
    "IDENTITIES",
    "ENDPOINTS",
    "SERVERS",
    "DEVICES",
    "APPLICATIONS",
    "CLOUD_ACCOUNTS",
    "TERABYTES",
    "GIGABYTES_PER_DAY",
    "EVENTS_PER_SECOND",
    "SEATS",
    "ENTERPRISE_LICENSE",
    "FIXED_SERVICE",
    "OTHER",
  ] as const,
  renewalLineActions: ["KEEP", "CHANGE", "ADD", "REMOVE", "REPLACE"] as const,
  renewal: maintenanceRenewalOptionSets,
};

const requiredString = z.string().trim().min(1, "Required");
const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);
const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value !== "none" ? value : undefined));
const idSchema = z.string().trim().min(1, "Required");
const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) =>
    value ? new Date(`${value}T00:00:00.000Z`) : undefined
  );
const optionalTimestamp = z.coerce.date().optional();
const decimal = z.preprocess(
  (value) => (value === "" || value === undefined ? 0 : value),
  z.coerce.number().min(0, "Must be zero or greater")
);

function flattenZod(error: z.ZodError): FieldErrors {
  const flattened = error.flatten().fieldErrors as Record<string, string[]>;
  return Object.fromEntries(
    Object.entries(flattened).filter(([, value]) => value?.length)
  );
}

function parse<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new FieldValidationError(
      "Review the highlighted fields.",
      flattenZod(result.error)
    );
  }
  return result.data;
}

function toDecimalInput(value: number | undefined) {
  return value === undefined ? undefined : String(value);
}

function yearsBetween(startsOn?: Date, endsOn?: Date) {
  if (!startsOn || !endsOn || startsOn > endsOn) return 1;
  const days = Math.max(
    1,
    Math.ceil((endsOn.getTime() - startsOn.getTime()) / 86_400_000) + 1
  );
  return Math.max(1, days / 365);
}

export function calculatedAnnualAmount(input: {
  quantity: unknown;
  unitPrice: unknown;
}) {
  return Number(input.quantity ?? 0) * Number(input.unitPrice ?? 0);
}

export function calculatedTotalAmount(input: {
  annualAmount: unknown;
  startsOn?: Date;
  endsOn?: Date;
}) {
  return (
    Number(input.annualAmount ?? 0) * yearsBetween(input.startsOn, input.endsOn)
  );
}

export function resolveLineAmounts(input: {
  quantity: unknown;
  unitPrice: unknown;
  annualAmount?: unknown;
  totalAmount?: unknown;
  startsOn?: Date;
  endsOn?: Date;
}) {
  const annual = Number(input.annualAmount ?? 0);
  const resolvedAnnual = annual || calculatedAnnualAmount(input);
  const total = Number(input.totalAmount ?? 0);
  return {
    annualAmount: resolvedAnnual,
    totalAmount:
      total ||
      calculatedTotalAmount({
        annualAmount: resolvedAnnual,
        startsOn: input.startsOn,
        endsOn: input.endsOn,
      }),
  };
}

function assertDateOrder(
  startsOn: Date | undefined,
  endsOn: Date | undefined,
  field = "endsOn"
) {
  if (startsOn && endsOn && startsOn > endsOn) {
    throw new FieldValidationError("Review the date range.", {
      [field]: ["End date must be on or after the start date."],
    });
  }
}

function noticeDate(input: {
  endsOn?: Date | null;
  renewalDate?: Date | null;
  noticePeriodDays?: number | null;
}) {
  const anchor = input.renewalDate ?? input.endsOn;
  if (!anchor) return undefined;
  const result = new Date(anchor);
  result.setUTCDate(result.getUTCDate() - (input.noticePeriodDays ?? 60));
  return result;
}

async function assertCompanyRole(
  prisma: PrismaClientLike,
  companyId: string,
  role: "VENDOR" | "RESELLER",
  field: string
) {
  const company = await prisma.company.findFirst({
    where: { id: companyId, active: true, roles: { some: { role } } },
  });
  if (!company) {
    throw new FieldValidationError("Selected company is not eligible.", {
      [field]: [`Company must be active with the ${role} role.`],
    });
  }
  return company;
}

async function assertActiveDepartment(
  prisma: PrismaClientLike,
  departmentId: string | null | undefined
) {
  if (!departmentId) return;
  const department = await prisma.department.findFirst({
    where: { id: departmentId, active: true },
  });
  if (
    !department ||
    department.name.trim().toLowerCase() === "all departments"
  ) {
    throw new FieldValidationError("Selected department is unavailable.", {
      departmentId: ["Choose an active department."],
    });
  }
}

async function assertProductScope(
  prisma: PrismaClientLike,
  input: {
    productId?: string;
    productModuleId?: string;
    vendorCompanyId?: string | null;
  }
) {
  if (!input.productId && input.productModuleId) {
    throw new FieldValidationError("Product is required.", {
      productId: ["Select a product before selecting a Product Component."],
    });
  }

  if (input.productId) {
    const product = await prisma.product.findFirst({
      where: { id: input.productId, active: true },
    });
    if (!product) {
      throw new FieldValidationError("Product is required.", {
        productId: ["Select an active Product Catalog record."],
      });
    }
    if (
      input.vendorCompanyId &&
      product.vendorCompanyId &&
      product.vendorCompanyId !== input.vendorCompanyId
    ) {
      throw new FieldValidationError("Product does not match vendor.", {
        productId: ["Select a product owned by the contract vendor."],
      });
    }
  }

  if (input.productModuleId) {
    const productModule = await prisma.productModule.findUnique({
      where: { id: input.productModuleId },
    });
    if (!productModule || productModule.productId !== input.productId) {
      throw new FieldValidationError("Product Component does not match.", {
        productModuleId: ["Select a component that belongs to the product."],
      });
    }
  }
}

export function sumContractLineAmounts(
  lines: Array<{ annualAmount: unknown; totalAmount: unknown }>
) {
  return lines.reduce(
    (totals, line) => ({
      annualValue: totals.annualValue + Number(line.annualAmount ?? 0),
      totalValue: totals.totalValue + Number(line.totalAmount ?? 0),
    }),
    { annualValue: 0, totalValue: 0 }
  );
}

export function renewalLineVariance(input: {
  currentAnnualAmount: unknown;
  quotedAnnualAmount?: unknown;
  finalAmount?: unknown;
}) {
  const currentAnnualAmount = Number(input.currentAnnualAmount ?? 0);
  const quotedVariance =
    Number(input.quotedAnnualAmount ?? 0) - currentAnnualAmount;
  const finalVariance = Number(input.finalAmount ?? 0) - currentAnnualAmount;
  const denominator = currentAnnualAmount || 1;
  return {
    quotedVariance,
    finalVariance,
    quotedVariancePercent: currentAnnualAmount
      ? quotedVariance / denominator
      : 0,
    finalVariancePercent: currentAnnualAmount ? finalVariance / denominator : 0,
  };
}

async function syncContractTotals(
  prisma: PrismaClientLike,
  contractId: string
) {
  const lines = await prisma.contractLineItem.findMany({
    where: { contractId },
    select: { annualAmount: true, totalAmount: true },
  });
  const totals = sumContractLineAmounts(lines);
  await prisma.contract.update({
    where: { id: contractId },
    data: {
      annualValue: toDecimalInput(totals.annualValue),
      totalValue: toDecimalInput(totals.totalValue),
    },
  });
  return totals;
}

function concurrentContractEdit() {
  return new FieldValidationError(
    "This contract changed after you opened it.",
    {
      id: ["Refresh the contract and apply your changes again."],
    }
  );
}

async function runSerializableTransaction<T>(
  prisma: PrismaClientLike,
  operation: (tx: Prisma.TransactionClient) => Promise<T>
) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034";
      if (!retryable || attempt === maxAttempts) throw error;
    }
  }
  throw new Error("Contract transaction did not complete.");
}

const contractListSelect = {
  id: true,
  updatedAt: true,
  departmentId: true,
  contractNumber: true,
  title: true,
  vendorCompanyId: true,
  sellerCompanyId: true,
  contractType: true,
  status: true,
  renewalDate: true,
  autoRenewal: true,
  noticePeriodDays: true,
  annualValue: true,
  totalValue: true,
  paymentFrequency: true,
  businessOwner: true,
  securityOwner: true,
  procurementContact: true,
  contractOwner: true,
  vendorAccountManager: true,
  resellerAccountManager: true,
  renewalRiskLevel: true,
  startsOn: true,
  endsOn: true,
  department: { select: { name: true } },
  vendorCompany: { select: { name: true, active: true } },
  sellerCompany: { select: { name: true, active: true } },
  owner: { select: { name: true } },
  _count: { select: { lineItems: true } },
  maintenanceRenewals: {
    take: 1,
    orderBy: [{ renewalDate: "desc" as const }, { createdAt: "desc" as const }],
    select: {
      id: true,
      renewalName: true,
      renewalDate: true,
      workflowStage: true,
      overallStatus: true,
      approvedDisposition: true,
      recommendedDisposition: true,
      currentAnnualCost: true,
      forecastedRenewalCost: true,
      _count: { select: { lineItems: true } },
    },
  },
} satisfies Prisma.ContractSelect;

type ContractListRecord = Prisma.ContractGetPayload<{
  select: typeof contractListSelect;
}>;

function dateDto(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function renewalSummaryDto(
  renewal: ContractListRecord["maintenanceRenewals"][number]
): ContractRenewalSummaryDto {
  return {
    id: renewal.id,
    renewalName: renewal.renewalName,
    renewalDate: renewal.renewalDate.toISOString(),
    workflowStage: renewal.workflowStage,
    overallStatus: renewal.overallStatus,
    approvedDisposition: renewal.approvedDisposition,
    recommendedDisposition: renewal.recommendedDisposition,
    currentAnnualCost: renewal.currentAnnualCost.toString(),
    forecastedRenewalCost: renewal.forecastedRenewalCost.toString(),
    lineItemCount: renewal._count.lineItems,
  };
}

function contractListRowDto(contract: ContractListRecord): ContractListRowDto {
  return {
    id: contract.id,
    updatedAt: contract.updatedAt.toISOString(),
    departmentId: contract.departmentId,
    department: contract.department,
    contractNumber: contract.contractNumber,
    title: contract.title,
    vendorCompanyId: contract.vendorCompanyId,
    sellerCompanyId: contract.sellerCompanyId,
    contractType: contract.contractType,
    status: contract.status,
    renewalDate: dateDto(contract.renewalDate),
    autoRenewal: contract.autoRenewal,
    noticePeriodDays: contract.noticePeriodDays,
    annualValue: contract.annualValue.toString(),
    totalValue: contract.totalValue.toString(),
    paymentFrequency: contract.paymentFrequency,
    businessOwner: contract.businessOwner,
    securityOwner: contract.securityOwner,
    procurementContact: contract.procurementContact,
    contractOwner: contract.contractOwner,
    vendorAccountManager: contract.vendorAccountManager,
    resellerAccountManager: contract.resellerAccountManager,
    renewalRiskLevel: contract.renewalRiskLevel,
    startsOn: contract.startsOn.toISOString(),
    endsOn: contract.endsOn.toISOString(),
    vendorCompany: contract.vendorCompany,
    sellerCompany: contract.sellerCompany,
    owner: contract.owner,
    lineItemCount: contract._count.lineItems,
    latestRenewal: contract.maintenanceRenewals[0]
      ? renewalSummaryDto(contract.maintenanceRenewals[0])
      : null,
  };
}

async function contractScopeWhere(
  prisma: PrismaClientLike,
  selection: GlobalContextSelection
): Promise<Prisma.ContractWhereInput> {
  const fiscalYear = selection.fiscalYearId
    ? await prisma.fiscalYear.findUnique({
        where: { id: selection.fiscalYearId },
        select: { startsOn: true, endsOn: true },
      })
    : null;
  return {
    ...(selection.departmentId
      ? { departmentId: selection.departmentId }
      : undefined),
    ...(fiscalYear
      ? {
          OR: [
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
          ],
        }
      : undefined),
  };
}

function renewalWindowWhere(
  window: ContractListFilters["renewalWindow"]
): Prisma.ContractWhereInput | undefined {
  if (!window) return undefined;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const upperDays =
    window === "30 days"
      ? 30
      : window === "60 days"
        ? 60
        : window === "90 days"
          ? 90
          : null;
  const lowerDays =
    window === "60 days" ? 30 : window === "90 days" ? 60 : null;
  const lower = lowerDays === null ? undefined : new Date(today);
  if (lower && lowerDays !== null) {
    lower.setUTCDate(lower.getUTCDate() + lowerDays);
  }
  const upper = upperDays === null ? undefined : new Date(today);
  if (upper && upperDays !== null) {
    upper.setUTCDate(upper.getUTCDate() + upperDays);
  }

  const datePredicate: Prisma.DateTimeFilter =
    window === "Past due"
      ? { lt: today }
      : window === "Later"
        ? { gt: new Date(today.getTime() + 90 * 86_400_000) }
        : {
            ...(lower ? { gt: lower } : { gte: today }),
            ...(upper ? { lte: upper } : undefined),
          };
  return {
    OR: [
      { renewalDate: datePredicate },
      { renewalDate: null, endsOn: datePredicate },
    ],
  };
}

function contractOrderBy(
  sortBy: ContractSortKey,
  direction: Prisma.SortOrder
): Prisma.ContractOrderByWithRelationInput[] {
  const first: Prisma.ContractOrderByWithRelationInput =
    sortBy === "department"
      ? { department: { name: direction } }
      : sortBy === "vendor"
        ? { vendorCompany: { name: direction } }
        : sortBy === "seller"
          ? { sellerCompany: { name: direction } }
          : sortBy === "annualValue"
            ? { annualValue: direction }
            : sortBy === "totalValue"
              ? { totalValue: direction }
              : sortBy === "status"
                ? { status: direction }
                : sortBy === "owner"
                  ? { businessOwner: direction }
                  : sortBy === "title"
                    ? { title: direction }
                    : sortBy === "notice"
                      ? { renewalDate: direction }
                      : { endsOn: direction };
  return [
    first,
    ...(sortBy === "title" ? [] : [{ title: "asc" as const }]),
    { id: "asc" },
  ];
}

export async function listContracts(
  selection: GlobalContextSelection = {},
  filters: ContractListFilters = {}
): Promise<ContractListResultDto> {
  const prisma = getPrisma();
  const pageSize = Math.min(
    CONTRACT_LIST_MAX_SIZE,
    Math.max(1, Math.trunc(filters.pageSize ?? CONTRACT_LIST_DEFAULT_SIZE))
  );
  const sortBy = filters.sortBy ?? "term";
  const sortDirection = filters.sortDirection ?? "asc";
  const scope = await contractScopeWhere(prisma, selection);
  const search = filters.search?.trim().slice(0, 200);
  const where: Prisma.ContractWhereInput = {
    AND: [
      scope,
      ...(search
        ? [
            {
              OR: [
                { title: { contains: search, mode: "insensitive" as const } },
                {
                  contractNumber: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  businessOwner: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  contractOwner: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  vendorCompany: {
                    is: {
                      name: { contains: search, mode: "insensitive" as const },
                    },
                  },
                },
                {
                  sellerCompany: {
                    is: {
                      name: { contains: search, mode: "insensitive" as const },
                    },
                  },
                },
              ],
            },
          ]
        : []),
      ...(filters.vendorCompanyId
        ? [{ vendorCompanyId: filters.vendorCompanyId }]
        : []),
      ...(filters.sellerCompanyId === "direct"
        ? [{ sellerCompanyId: null }]
        : filters.sellerCompanyId
          ? [{ sellerCompanyId: filters.sellerCompanyId }]
          : []),
      ...(filters.status ? [{ status: filters.status as never }] : []),
      ...(renewalWindowWhere(filters.renewalWindow)
        ? [renewalWindowWhere(filters.renewalWindow)!]
        : []),
    ],
  };
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const in90Days = new Date(today);
  in90Days.setUTCDate(in90Days.getUTCDate() + 90);
  const due90Date = { gte: today, lte: in90Days };
  const due90Where: Prisma.ContractWhereInput = {
    OR: [{ renewalDate: due90Date }, { renewalDate: null, endsOn: due90Date }],
  };

  const [records, active, values, due90, noRenewal, lineItems] =
    await Promise.all([
      prisma.contract.findMany({
        where,
        orderBy: contractOrderBy(sortBy, sortDirection),
        take: pageSize + 1,
        ...(filters.cursor
          ? { cursor: { id: filters.cursor }, skip: 1 }
          : undefined),
        select: contractListSelect,
      }),
      prisma.contract.count({ where: { AND: [scope, { status: "ACTIVE" }] } }),
      prisma.contract.aggregate({
        where: scope,
        _sum: { annualValue: true, totalValue: true },
      }),
      prisma.contract.count({ where: { AND: [scope, due90Where] } }),
      prisma.contract.count({
        where: { AND: [scope, { maintenanceRenewals: { none: {} } }] },
      }),
      prisma.contractLineItem.count({ where: { contract: scope } }),
    ]);

  const hasNextPage = records.length > pageSize;
  const page = hasNextPage ? records.slice(0, pageSize) : records;
  return {
    rows: page.map(contractListRowDto),
    nextCursor: hasNextPage ? (page.at(-1)?.id ?? null) : null,
    metrics: {
      active,
      annualValue: values._sum.annualValue?.toString() ?? "0",
      totalValue: values._sum.totalValue?.toString() ?? "0",
      due90,
      noRenewal,
      lineItems,
    },
  };
}

export async function getContractDetail(
  id: string,
  selection: GlobalContextSelection = {}
): Promise<ContractDetailDto | null> {
  if (!id) return null;
  const prisma = getPrisma();
  const scope = await contractScopeWhere(prisma, selection);
  const contract = await prisma.contract.findFirst({
    where: { AND: [{ id }, scope] },
    select: {
      ...contractListSelect,
      renewalStrategy: true,
      notesText: true,
      lineItems: {
        take: CONTRACT_LIST_MAX_SIZE,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          productId: true,
          productModuleId: true,
          description: true,
          sku: true,
          quantity: true,
          licenseMetric: true,
          unitPrice: true,
          annualAmount: true,
          totalAmount: true,
          startsOn: true,
          endsOn: true,
          renewable: true,
          sortOrder: true,
          notesText: true,
          product: { select: { name: true } },
          productModule: { select: { name: true } },
        },
      },
      maintenanceRenewals: {
        take: 20,
        orderBy: [{ renewalDate: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          renewalName: true,
          renewalDate: true,
          workflowStage: true,
          overallStatus: true,
          approvedDisposition: true,
          recommendedDisposition: true,
          currentAnnualCost: true,
          forecastedRenewalCost: true,
          _count: { select: { lineItems: true } },
        },
      },
      documents: {
        take: 20,
        orderBy: [{ uploadedAt: "desc" }, { id: "asc" }],
        select: { id: true, title: true, type: true },
      },
    },
  });
  if (!contract) return null;
  const row = contractListRowDto(contract);
  return {
    ...row,
    renewalStrategy: contract.renewalStrategy,
    notesText: contract.notesText,
    lineItems: contract.lineItems.map((line) => ({
      ...line,
      quantity: line.quantity.toString(),
      unitPrice: line.unitPrice.toString(),
      annualAmount: line.annualAmount.toString(),
      totalAmount: line.totalAmount.toString(),
      startsOn: dateDto(line.startsOn),
      endsOn: dateDto(line.endsOn),
    })),
    maintenanceRenewals: contract.maintenanceRenewals.map(renewalSummaryDto),
    documents: contract.documents,
  };
}

export async function getContractEditorOptions(input: {
  vendorCompanyId?: string;
  productIds?: string[];
}): Promise<ContractEditorOptionsDto> {
  const prisma = getPrisma();
  const productIds = [
    ...new Set(input.productIds?.filter(Boolean) ?? []),
  ].slice(0, CONTRACT_LIST_MAX_SIZE);
  const [products, modules, paymentFrequencyOptions, licenseMetricOptions] =
    await Promise.all([
      input.vendorCompanyId
        ? prisma.product.findMany({
            where: {
              active: true,
              OR: [
                { vendorCompanyId: input.vendorCompanyId },
                ...(productIds.length ? [{ id: { in: productIds } }] : []),
              ],
            },
            take: CONTRACT_LIST_MAX_SIZE,
            orderBy: [{ name: "asc" }, { id: "asc" }],
            select: {
              id: true,
              name: true,
              active: true,
              vendorCompanyId: true,
              vendorCompany: { select: { name: true } },
            },
          })
        : Promise.resolve([]),
      productIds.length
        ? prisma.productModule.findMany({
            where: { active: true, productId: { in: productIds } },
            take: CONTRACT_LIST_MAX_SIZE,
            orderBy: [{ name: "asc" }, { id: "asc" }],
            select: {
              id: true,
              name: true,
              active: true,
              productId: true,
              product: { select: { name: true } },
            },
          })
        : Promise.resolve([]),
      prisma.paymentFrequencyOption.findMany({
        where: { active: true },
        take: CONTRACT_LIST_MAX_SIZE,
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        select: { key: true },
      }),
      prisma.licenseMetricOption.findMany({
        where: { active: true },
        take: CONTRACT_LIST_MAX_SIZE,
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        select: { key: true },
      }),
    ]);
  return {
    products,
    modules,
    paymentFrequencies: paymentFrequencyOptions.length
      ? paymentFrequencyOptions.map((option) => option.key)
      : [...contractOptionSets.paymentFrequencies],
    licenseMetrics: licenseMetricOptions.length
      ? licenseMetricOptions.map((option) => option.key)
      : [...contractOptionSets.licenseMetrics],
  };
}

export async function getContractHandoffOptions(
  selection: GlobalContextSelection = {}
): Promise<ContractHandoffOptionsDto> {
  const prisma = getPrisma();
  const annualWhere: Prisma.BudgetAnnualFinancialWhereInput = {
    ...(selection.fiscalYearId
      ? { fiscalYearId: selection.fiscalYearId }
      : undefined),
    ...(selection.departmentId
      ? { budgetItem: { departmentId: selection.departmentId } }
      : undefined),
  };
  const [fiscalYears, budgetPlans, budgetAccounts, annualFinancials] =
    await Promise.all([
      prisma.fiscalYear.findMany({
        take: CONTRACT_LIST_MAX_SIZE,
        orderBy: { startsOn: "desc" },
        select: { id: true, label: true },
      }),
      prisma.budgetPlan.findMany({
        where: selection.fiscalYearId
          ? { fiscalYearId: selection.fiscalYearId }
          : undefined,
        take: CONTRACT_LIST_MAX_SIZE,
        orderBy: [{ fiscalYear: { startsOn: "desc" } }, { version: "asc" }],
        select: {
          id: true,
          name: true,
          version: true,
          fiscalYear: { select: { label: true } },
        },
      }),
      prisma.budgetAccount.findMany({
        where: { active: true },
        take: CONTRACT_LIST_MAX_SIZE,
        orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
        select: { id: true, code: true, name: true },
      }),
      prisma.budgetAnnualFinancial.findMany({
        where: annualWhere,
        take: CONTRACT_LIST_MAX_SIZE,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        select: {
          id: true,
          budgetPlan: { select: { name: true } },
          scenario: { select: { label: true } },
          account: { select: { code: true } },
          budgetItem: { select: { name: true } },
        },
      }),
    ]);
  return { fiscalYears, budgetPlans, budgetAccounts, annualFinancials };
}

export async function getContractPageData(
  selection: GlobalContextSelection = {},
  filters: ContractListFilters = {},
  selectedId?: string
): Promise<ContractPageDataDto> {
  const prisma = getPrisma();
  const normalizedFilters: ContractPageDataDto["filters"] = {
    ...filters,
    sortBy: filters.sortBy ?? "term",
    sortDirection: filters.sortDirection ?? "asc",
    pageSize: Math.min(
      CONTRACT_LIST_MAX_SIZE,
      Math.max(1, Math.trunc(filters.pageSize ?? CONTRACT_LIST_DEFAULT_SIZE))
    ),
  };
  const [list, companies] = await Promise.all([
    listContracts(selection, normalizedFilters),
    prisma.company.findMany({
      where: {
        roles: { some: { role: { in: ["VENDOR", "RESELLER"] } } },
      },
      take: CONTRACT_LIST_MAX_SIZE,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        active: true,
        roles: {
          where: { role: { in: ["VENDOR", "RESELLER"] } },
          orderBy: { role: "asc" },
          select: { role: true },
        },
      },
    }),
  ]);
  const detailId =
    selectedId && list.rows.some((row) => row.id === selectedId)
      ? selectedId
      : list.rows[0]?.id;
  const selectedContract = detailId
    ? await getContractDetail(detailId, selection)
    : null;
  return {
    contracts: list.rows,
    selectedContract,
    nextCursor: list.nextCursor,
    metrics: list.metrics,
    companies,
    filters: normalizedFilters,
    optionSets: {
      ...contractOptionSets,
    },
  };
}

const contractSchema = z.object({
  id: optionalId,
  expectedUpdatedAt: optionalTimestamp,
  departmentId: optionalId,
  title: requiredString,
  contractNumber: optionalString,
  vendorCompanyId: idSchema,
  sellerCompanyId: optionalId,
  contractType: z.enum(contractOptionSets.contractTypes).default("SAAS"),
  startsOn: optionalDate,
  endsOn: optionalDate,
  renewalDate: optionalDate,
  noticePeriodDays: z.coerce.number().int().min(0).default(60),
  autoRenewal: z.boolean().default(false),
  paymentFrequency: z.enum(contractOptionSets.paymentFrequencies),
  status: z.enum(contractOptionSets.contractStatuses),
  contractOwner: optionalString,
  businessOwner: optionalString,
  securityOwner: optionalString,
  procurementContact: optionalString,
  vendorAccountManager: optionalString,
  resellerAccountManager: optionalString,
  renewalRiskLevel: z.enum(contractOptionSets.renewalRisks),
  renewalStrategy: optionalString,
  notesText: optionalString,
});

export async function saveContract(input: unknown) {
  const data = parse(contractSchema, input);
  assertDateOrder(data.startsOn, data.endsOn);
  if (!data.startsOn || !data.endsOn) {
    throw new FieldValidationError("Contract dates are required.", {
      startsOn: ["Start date is required."],
      endsOn: ["End date is required."],
    });
  }

  const prisma = getPrisma();
  await assertCompanyRole(
    prisma,
    data.vendorCompanyId,
    "VENDOR",
    "vendorCompanyId"
  );
  if (data.sellerCompanyId) {
    await assertCompanyRole(
      prisma,
      data.sellerCompanyId,
      "RESELLER",
      "sellerCompanyId"
    );
  }
  await assertActiveDepartment(prisma, data.departmentId);

  const payload = {
    departmentId: data.departmentId ?? null,
    contractNumber: data.contractNumber,
    title: data.title,
    vendorCompanyId: data.vendorCompanyId,
    sellerCompanyId: data.sellerCompanyId ?? null,
    contractType: data.contractType,
    status: data.status,
    renewalDate: data.renewalDate,
    autoRenewal: data.autoRenewal,
    noticePeriodDays: data.noticePeriodDays,
    paymentFrequency: data.paymentFrequency,
    contractOwner: data.contractOwner,
    businessOwner: data.businessOwner,
    securityOwner: data.securityOwner,
    procurementContact: data.procurementContact,
    vendorAccountManager: data.vendorAccountManager,
    resellerAccountManager: data.resellerAccountManager,
    renewalRiskLevel: data.renewalRiskLevel,
    renewalStrategy: data.renewalStrategy,
    notesText: data.notesText,
    startsOn: data.startsOn,
    endsOn: data.endsOn,
  };

  const contract = data.id
    ? await prisma.contract.update({ where: { id: data.id }, data: payload })
    : await prisma.contract.create({ data: payload });

  return contract.id;
}

export type ContractDeleteResult = {
  id: string;
  mode: "deleted" | "terminated";
};

export async function deleteContract(
  contractId: string
): Promise<ContractDeleteResult> {
  const prisma = getPrisma();
  const [dependencyCounts, deployedLineCount] = await Promise.all([
    prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        _count: {
          select: {
            maintenanceRenewals: true,
            renewals: true,
            purchases: true,
            purchaseRequests: true,
            invoices: true,
            payments: true,
            budgetItems: true,
            budgetLineItems: true,
          },
        },
      },
    }),
    prisma.contractLineItem.count({
      where: { contractId, deployments: { some: {} } },
    }),
  ]);
  if (!dependencyCounts) {
    throw new FieldValidationError("Contract was not found.", {
      id: ["Select an existing contract."],
    });
  }

  const hasFinancialDependencies =
    Object.values(dependencyCounts._count).some((count) => count > 0) ||
    deployedLineCount > 0;
  if (hasFinancialDependencies) {
    await prisma.contract.update({
      where: { id: contractId },
      data: { status: "TERMINATED" },
    });
    return { id: contractId, mode: "terminated" };
  }

  await prisma.contract.delete({ where: { id: contractId } });
  return { id: contractId, mode: "deleted" };
}

const lineSchema = z.object({
  id: optionalId,
  contractId: idSchema,
  productId: optionalId,
  productModuleId: optionalId,
  description: requiredString,
  sku: optionalString,
  quantity: decimal,
  licenseMetric: z.enum(contractOptionSets.licenseMetrics).optional(),
  unitPrice: decimal,
  annualAmount: decimal,
  totalAmount: decimal,
  startsOn: optionalDate,
  endsOn: optionalDate,
  renewable: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
  notesText: optionalString,
});

const lineBatchSchema = z.object({
  contractId: idSchema,
  lines: z
    .array(lineSchema.omit({ id: true, contractId: true }))
    .min(1, "Add at least one line item."),
});

const contractWithLineItemsSchema = contractSchema.extend({
  lines: z
    .array(lineSchema.omit({ contractId: true }))
    .max(
      CONTRACT_LIST_MAX_SIZE,
      `A Contract can contain at most ${CONTRACT_LIST_MAX_SIZE} pricing lines.`
    ),
});

type ContractLineFormData = Omit<z.infer<typeof lineSchema>, "contractId"> & {
  contractId?: string;
};

function contractPayload(data: z.infer<typeof contractSchema>) {
  return {
    departmentId: data.departmentId ?? null,
    contractNumber: data.contractNumber,
    title: data.title,
    vendorCompanyId: data.vendorCompanyId,
    sellerCompanyId: data.sellerCompanyId ?? null,
    contractType: data.contractType,
    status: data.status,
    renewalDate: data.renewalDate,
    autoRenewal: data.autoRenewal,
    noticePeriodDays: data.noticePeriodDays,
    paymentFrequency: data.paymentFrequency,
    contractOwner: data.contractOwner,
    businessOwner: data.businessOwner,
    securityOwner: data.securityOwner,
    procurementContact: data.procurementContact,
    vendorAccountManager: data.vendorAccountManager,
    resellerAccountManager: data.resellerAccountManager,
    renewalRiskLevel: data.renewalRiskLevel,
    renewalStrategy: data.renewalStrategy,
    notesText: data.notesText,
    startsOn: data.startsOn,
    endsOn: data.endsOn,
  };
}

function linePayload(
  line: ContractLineFormData,
  contractId: string,
  fallbackStartsOn?: Date,
  fallbackEndsOn?: Date
) {
  const startsOn = line.startsOn ?? fallbackStartsOn;
  const endsOn = line.endsOn ?? fallbackEndsOn;
  const amounts = resolveLineAmounts({
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    annualAmount: line.annualAmount,
    totalAmount: line.totalAmount,
    startsOn,
    endsOn,
  });

  return {
    contractId,
    productId: line.productId ?? null,
    productModuleId: line.productModuleId ?? null,
    description: line.description,
    sku: line.sku,
    quantity: toDecimalInput(line.quantity),
    licenseMetric: line.licenseMetric,
    unitPrice: toDecimalInput(line.unitPrice),
    annualAmount: toDecimalInput(amounts.annualAmount),
    totalAmount: toDecimalInput(amounts.totalAmount),
    startsOn,
    endsOn,
    renewable: line.renewable,
    sortOrder: line.sortOrder,
    notesText: line.notesText,
  };
}

async function validateContractInput(
  prisma: PrismaClientLike,
  data: z.infer<typeof contractWithLineItemsSchema>,
  existing?: {
    vendorCompanyId?: string | null;
    sellerCompanyId?: string | null;
  } | null
) {
  assertDateOrder(data.startsOn, data.endsOn);
  if (!data.startsOn || !data.endsOn) {
    throw new FieldValidationError("Contract dates are required.", {
      startsOn: ["Start date is required."],
      endsOn: ["End date is required."],
    });
  }
  for (const [index, line] of data.lines.entries()) {
    if (!line.productId) {
      throw new FieldValidationError("Select a product for each pricing row.", {
        lines: ["Every pricing row with values needs a product."],
        [`line_${index}_productId`]: ["Select a product."],
      });
    }
    if (!line.description) {
      throw new FieldValidationError(
        "Add a description for each pricing row.",
        {
          lines: ["Every pricing row with values needs a description."],
          [`line_${index}_description`]: ["Add a description."],
        }
      );
    }
    assertDateOrder(
      line.startsOn ?? data.startsOn,
      line.endsOn ?? data.endsOn,
      `lines.${index}.endsOn`
    );
  }

  const productIds = [
    ...new Set(
      data.lines
        .map((line) => line.productId)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const moduleIds = [
    ...new Set(
      data.lines
        .map((line) => line.productModuleId)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const [, , , products, modules] = await Promise.all([
    assertActiveDepartment(prisma, data.departmentId),
    !existing || existing.vendorCompanyId !== data.vendorCompanyId
      ? assertCompanyRole(
          prisma,
          data.vendorCompanyId,
          "VENDOR",
          "vendorCompanyId"
        )
      : Promise.resolve(null),
    data.sellerCompanyId && existing?.sellerCompanyId !== data.sellerCompanyId
      ? assertCompanyRole(
          prisma,
          data.sellerCompanyId,
          "RESELLER",
          "sellerCompanyId"
        )
      : Promise.resolve(null),
    productIds.length
      ? prisma.product.findMany({
          where: { id: { in: productIds }, active: true },
          select: { id: true, vendorCompanyId: true },
        })
      : Promise.resolve([]),
    moduleIds.length
      ? prisma.productModule.findMany({
          where: { id: { in: moduleIds } },
          select: { id: true, productId: true },
        })
      : Promise.resolve([]),
  ]);
  const productsById = new Map(
    products.map((product) => [product.id, product])
  );
  const modulesById = new Map(modules.map((module) => [module.id, module]));
  for (const line of data.lines) {
    const product = productsById.get(line.productId!);
    if (!product) {
      throw new FieldValidationError("Product is required.", {
        productId: ["Select an active Product Catalog record."],
      });
    }
    if (
      product.vendorCompanyId &&
      product.vendorCompanyId !== data.vendorCompanyId
    ) {
      throw new FieldValidationError("Product does not match vendor.", {
        productId: ["Select a product owned by the contract vendor."],
      });
    }
    if (line.productModuleId) {
      const productModule = modulesById.get(line.productModuleId);
      if (!productModule || productModule.productId !== line.productId) {
        throw new FieldValidationError("Product Component does not match.", {
          productModuleId: ["Select a component that belongs to the product."],
        });
      }
    }
  }
}

export async function saveContractLineItem(input: unknown) {
  const data = parse(lineSchema, input);
  assertDateOrder(data.startsOn, data.endsOn);
  const prisma = getPrisma();
  const contract = await prisma.contract.findUnique({
    where: { id: data.contractId },
  });
  if (!contract) {
    throw new FieldValidationError("Contract was not found.", {
      contractId: ["Select an existing contract."],
    });
  }
  await assertProductScope(prisma, {
    productId: data.productId,
    productModuleId: data.productModuleId,
    vendorCompanyId: contract.vendorCompanyId,
  });

  const payload = {
    contractId: data.contractId,
    productId: data.productId ?? null,
    productModuleId: data.productModuleId ?? null,
    description: data.description,
    sku: data.sku,
    quantity: toDecimalInput(data.quantity),
    licenseMetric: data.licenseMetric,
    unitPrice: toDecimalInput(data.unitPrice),
    annualAmount: toDecimalInput(data.annualAmount),
    totalAmount: toDecimalInput(data.totalAmount),
    startsOn: data.startsOn,
    endsOn: data.endsOn,
    renewable: data.renewable,
    sortOrder: data.sortOrder,
    notesText: data.notesText,
  };

  const line = await prisma.$transaction(async (tx) => {
    const saved = data.id
      ? await tx.contractLineItem.update({
          where: { id: data.id },
          data: payload,
        })
      : await tx.contractLineItem.create({ data: payload });
    await syncContractTotals(tx as PrismaClientLike, data.contractId);
    return saved;
  });

  return line.id;
}

export async function saveContractLineItems(input: unknown) {
  const data = parse(lineBatchSchema, input);
  const prisma = getPrisma();
  const contract = await prisma.contract.findUnique({
    where: { id: data.contractId },
  });
  if (!contract) {
    throw new FieldValidationError("Contract was not found.", {
      contractId: ["Select an existing contract."],
    });
  }

  for (const [index, line] of data.lines.entries()) {
    assertDateOrder(line.startsOn, line.endsOn, `lines.${index}.endsOn`);
    await assertProductScope(prisma, {
      productId: line.productId,
      productModuleId: line.productModuleId,
      vendorCompanyId: contract.vendorCompanyId,
    });
  }

  await prisma.$transaction(async (tx) => {
    for (const line of data.lines) {
      const calculatedAmount =
        Number(line.quantity ?? 0) * Number(line.unitPrice ?? 0);
      await tx.contractLineItem.create({
        data: {
          contractId: data.contractId,
          productId: line.productId ?? null,
          productModuleId: line.productModuleId ?? null,
          description: line.description,
          sku: line.sku,
          quantity: toDecimalInput(line.quantity),
          licenseMetric: line.licenseMetric,
          unitPrice: toDecimalInput(line.unitPrice),
          annualAmount: toDecimalInput(line.annualAmount || calculatedAmount),
          totalAmount: toDecimalInput(line.totalAmount || calculatedAmount),
          startsOn: line.startsOn,
          endsOn: line.endsOn,
          renewable: line.renewable,
          sortOrder: line.sortOrder,
          notesText: line.notesText,
        },
      });
    }
    await syncContractTotals(tx as PrismaClientLike, data.contractId);
  });

  return data.contractId;
}

export async function saveContractWithLineItems(input: unknown) {
  const data = parse(contractWithLineItemsSchema, input);
  await requirePermission({
    permission: "contracts.write",
    departmentId: data.departmentId,
  });
  const prisma = getPrisma();
  if (!data.id && data.lines.length === 0) {
    throw new FieldValidationError("Add at least one product row.", {
      lines: ["Add at least one product row."],
      line_0_description: ["Product row description is required."],
    });
  }
  if (data.id && !data.expectedUpdatedAt) {
    throw new FieldValidationError("Contract version is required.", {
      id: ["Refresh the contract before saving changes."],
    });
  }
  const existing = data.id
    ? await prisma.contract.findUnique({
        where: { id: data.id },
        select: {
          id: true,
          updatedAt: true,
          vendorCompanyId: true,
          sellerCompanyId: true,
          lineItems: {
            take: CONTRACT_LIST_MAX_SIZE + 1,
            select: { id: true },
          },
        },
      })
    : null;
  if (data.id && !existing) {
    throw new FieldValidationError("Contract was not found.", {
      id: ["Select an existing contract."],
    });
  }
  await validateContractInput(prisma, data, existing);

  if (
    data.lines.length > 0 &&
    existing &&
    existing.lineItems.length > CONTRACT_LIST_MAX_SIZE
  ) {
    throw new FieldValidationError(
      "This Contract exceeds the supported pricing-line limit.",
      {
        lines: [
          `Reduce the Contract to ${CONTRACT_LIST_MAX_SIZE} pricing lines before using the combined editor.`,
        ],
      }
    );
  }

  if (data.id && data.lines.length === 0) {
    const updated = await prisma.contract.updateMany({
      where: { id: data.id, updatedAt: data.expectedUpdatedAt },
      data: {
        ...contractPayload(data),
        startsOn: data.startsOn!,
        endsOn: data.endsOn!,
      },
    });
    if (updated.count !== 1) throw concurrentContractEdit();
    return data.id;
  }

  let existingLineIds = new Set<string>();
  if (data.id) {
    existingLineIds = new Set(existing?.lineItems.map((line) => line.id));
    const invalidLineId = data.lines.find(
      (line) => line.id && !existingLineIds.has(line.id)
    )?.id;
    if (invalidLineId) {
      throw new FieldValidationError("Line item does not belong to contract.", {
        lineItems: [`Line ${invalidLineId} cannot be reconciled here.`],
      });
    }
  }

  const payload = {
    ...contractPayload(data),
    startsOn: data.startsOn!,
    endsOn: data.endsOn!,
  };
  const resolvedLines = data.lines.map((line, index) =>
    linePayload(
      { ...line, sortOrder: index },
      data.id ?? "pending",
      data.startsOn,
      data.endsOn
    )
  );
  const totals = sumContractLineAmounts(resolvedLines);

  const savedId = await runSerializableTransaction(prisma, async (tx) => {
    let contract: { id: string };
    if (data.id) {
      const updated = await tx.contract.updateMany({
        where: { id: data.id, updatedAt: data.expectedUpdatedAt },
        data: {
          ...payload,
          annualValue: toDecimalInput(totals.annualValue),
          totalValue: toDecimalInput(totals.totalValue),
        },
      });
      if (updated.count !== 1) throw concurrentContractEdit();
      contract = { id: data.id };
    } else {
      contract = await tx.contract.create({
        data: {
          ...payload,
          annualValue: toDecimalInput(totals.annualValue),
          totalValue: toDecimalInput(totals.totalValue),
        },
      });
    }

    const submittedLineIds = data.lines
      .map((line) => line.id)
      .filter((id): id is string => Boolean(id));

    if (data.id) {
      await tx.contractLineItem.deleteMany({
        where: {
          contractId: contract.id,
          id: { notIn: submittedLineIds },
        },
      });
    }

    const reconciledLines = data.lines.map((line, sortOrder) => ({
      line,
      payload: linePayload(
        { ...line, sortOrder },
        contract.id,
        data.startsOn,
        data.endsOn
      ),
    }));
    const existingLines = reconciledLines.filter(({ line }) =>
      Boolean(line.id)
    );
    await Promise.all(
      existingLines.map(({ line, payload: lineData }) =>
        tx.contractLineItem.update({
          where: { id: line.id! },
          data: lineData,
        })
      )
    );
    const newLines = reconciledLines
      .filter(({ line }) => !line.id)
      .map(({ payload: lineData }) => lineData);
    if (newLines.length) {
      await tx.contractLineItem.createMany({ data: newLines });
    }

    return contract.id;
  });

  return savedId;
}

export async function deleteContractLineItem(lineItemId: string) {
  const prisma = getPrisma();
  const line = await prisma.contractLineItem.findUnique({
    where: { id: lineItemId },
  });
  if (!line) return lineItemId;
  await prisma.$transaction(async (tx) => {
    await tx.contractLineItem.delete({ where: { id: lineItemId } });
    await syncContractTotals(tx as PrismaClientLike, line.contractId);
  });
  return lineItemId;
}

export async function duplicateContractLineItem(lineItemId: string) {
  const prisma = getPrisma();
  const line = await prisma.contractLineItem.findUnique({
    where: { id: lineItemId },
  });
  if (!line) {
    throw new FieldValidationError("Line item was not found.", {
      id: ["Select an existing line item."],
    });
  }
  const duplicate = await prisma.$transaction(async (tx) => {
    const created = await tx.contractLineItem.create({
      data: {
        contractId: line.contractId,
        productId: line.productId,
        productModuleId: line.productModuleId,
        description: `${line.description} copy`,
        sku: line.sku,
        quantity: line.quantity,
        licenseMetric: line.licenseMetric,
        unitPrice: line.unitPrice,
        annualAmount: line.annualAmount,
        totalAmount: line.totalAmount,
        startsOn: line.startsOn,
        endsOn: line.endsOn,
        renewable: line.renewable,
        sortOrder: line.sortOrder + 1,
        notesText: line.notesText,
      },
    });
    await tx.contractLineItem.updateMany({
      where: {
        contractId: line.contractId,
        id: { not: created.id },
        sortOrder: { gt: line.sortOrder },
      },
      data: { sortOrder: { increment: 1 } },
    });
    await syncContractTotals(tx as PrismaClientLike, line.contractId);
    return created;
  });
  return duplicate.id;
}

export async function reorderContractLineItems(input: unknown) {
  const data = parse(
    z.object({
      contractId: idSchema,
      expectedUpdatedAt: z.coerce.date(),
      orderedIds: z.array(idSchema).min(1),
    }),
    input
  );
  if (new Set(data.orderedIds).size !== data.orderedIds.length) {
    throw new FieldValidationError("Each contract line can appear only once.", {
      orderedIds: ["Remove duplicate line IDs and try again."],
    });
  }
  const prisma = getPrisma();
  const contractScope = await prisma.contract.findUnique({
    where: { id: data.contractId },
    select: { departmentId: true },
  });
  if (!contractScope) {
    throw new FieldValidationError("Contract was not found.", {
      contractId: ["Select an existing contract."],
    });
  }
  await requirePermission({
    permission: "contracts.write",
    departmentId: contractScope.departmentId,
  });
  await runSerializableTransaction(prisma, async (tx) => {
    const contract = await tx.contract.updateMany({
      where: {
        id: data.contractId,
        updatedAt: data.expectedUpdatedAt,
      },
      data: { updatedAt: new Date() },
    });
    if (contract.count !== 1) throw concurrentContractEdit();
    const lines = await tx.contractLineItem.findMany({
      where: { contractId: data.contractId },
      select: { id: true },
    });
    const actualIds = new Set(lines.map((line) => line.id));
    if (
      actualIds.size !== data.orderedIds.length ||
      data.orderedIds.some((id) => !actualIds.has(id))
    ) {
      throw new FieldValidationError(
        "The contract product rows changed while they were being reordered.",
        {
          orderedIds: ["Refresh the contract and try the reorder again."],
        }
      );
    }
    const orderCases = Prisma.join(
      data.orderedIds.map((id, index) => Prisma.sql`WHEN ${id} THEN ${index}`),
      " "
    );
    await tx.$executeRaw(
      Prisma.sql`
        UPDATE "ContractLineItem"
        SET "sortOrder" = CASE "id" ${orderCases} END,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "contractId" = ${data.contractId}
          AND "id" IN (${Prisma.join(data.orderedIds)})
      `
    );
  });
  return data.contractId;
}

const budgetFromContractSchema = z.object({
  contractId: idSchema,
  fiscalYearId: idSchema,
  budgetPlanId: idSchema,
  accountId: idSchema,
});

export async function pushContractToBudget(input: unknown) {
  const data = parse(budgetFromContractSchema, input);
  const prisma = getPrisma();
  const [contract, budgetPlan, account] = await Promise.all([
    prisma.contract.findUnique({
      where: { id: data.contractId },
      include: {
        vendorCompany: true,
        sellerCompany: true,
        lineItems: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        products: true,
        productModules: true,
      },
    }),
    prisma.budgetPlan.findUnique({
      where: { id: data.budgetPlanId },
      include: { scenarios: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.budgetAccount.findUnique({ where: { id: data.accountId } }),
  ]);

  if (!contract) {
    throw new FieldValidationError("Contract was not found.", {
      contractId: ["Select an existing contract."],
    });
  }
  if (!budgetPlan || budgetPlan.fiscalYearId !== data.fiscalYearId) {
    throw new FieldValidationError("Budget plan does not match fiscal year.", {
      budgetPlanId: ["Select a budget plan for the target fiscal year."],
    });
  }
  const scenario =
    budgetPlan.scenarios.find((candidate) => candidate.isActive) ??
    budgetPlan.scenarios[0];
  if (!scenario) {
    throw new FieldValidationError("Budget plan has no scenario.", {
      budgetPlanId: ["Create a budget scenario before pushing this contract."],
    });
  }
  if (!account?.active) {
    throw new FieldValidationError("Budget account is not available.", {
      accountId: ["Select an active budget account."],
    });
  }

  const amount = Number(contract.annualValue ?? 0);
  if (!amount) {
    throw new FieldValidationError("Contract has no annual value.", {
      contractId: [
        "Add product pricing before pushing this contract to Budget.",
      ],
    });
  }

  const firstLine = contract.lineItems[0];
  const productId = firstLine?.productId ?? contract.products[0]?.id;
  const productModuleId =
    firstLine?.productModuleId ?? contract.productModules[0]?.id;

  const annualId = await prisma.$transaction(async (tx) => {
    const budgetItem =
      (await tx.budgetItem.findFirst({
        where: { contractId: contract.id, active: true },
      })) ??
      (await tx.budgetItem.create({
        data: {
          vendorId: contract.vendorId,
          resellerId: contract.resellerId,
          vendorCompanyId: contract.vendorCompanyId,
          sellerCompanyId: contract.sellerCompanyId,
          contractId: contract.id,
          productId,
          productModuleId,
          name: contract.title,
          description: `Pushed from contract ${
            contract.contractNumber ?? contract.title
          }.`,
          owner: contract.businessOwner ?? contract.contractOwner,
          strategicProgramArea: contract.securityOwner,
        },
      }));

    const existingAnnual = await tx.budgetAnnualFinancial.findFirst({
      where: {
        budgetPlanId: budgetPlan.id,
        scenarioId: scenario.id,
        fiscalYearId: data.fiscalYearId,
        budgetItemId: budgetItem.id,
      },
    });

    const annualData = {
      budgetPlanId: budgetPlan.id,
      scenarioId: scenario.id,
      fiscalYearId: data.fiscalYearId,
      budgetItemId: budgetItem.id,
      accountId: account.id,
      worksheet: budgetWorksheetForAccount(String(account.defaultWorksheet)),
      baseAmount: toDecimalInput(amount),
      requestedAmount: toDecimalInput(amount),
      proposedAmount: toDecimalInput(amount),
      forecastAmount: toDecimalInput(amount),
      unitCost: toDecimalInput(amount),
      quantity: "1",
      recurringAmount: toDecimalInput(amount),
      fundingStatus: "REQUESTED" as const,
      reviewState: "NEEDS_REVIEW" as const,
      isRecurring: true,
      isOneTime: false,
      comments: `Created from contract ${contract.contractNumber ?? contract.title}.`,
      businessJustification:
        contract.renewalStrategy ??
        `Budget planning row generated from ${contract.title}.`,
      owner: contract.businessOwner ?? contract.contractOwner,
      worksheetDetails: worksheetDetailsForContract({
        contractTitle: contract.contractNumber ?? contract.title,
        resellerLabel:
          contract.sellerCompany?.name ?? contract.resellerId ?? "Direct",
      }),
    };

    if (existingAnnual) {
      const updated = await tx.budgetAnnualFinancial.update({
        where: { id: existingAnnual.id },
        data: annualData,
      });
      return updated.id;
    }

    const sortOrder = await tx.budgetAnnualFinancial.count({
      where: { budgetPlanId: budgetPlan.id, scenarioId: scenario.id },
    });
    const created = await tx.budgetAnnualFinancial.create({
      data: { ...annualData, sortOrder },
    });
    return created.id;
  });

  return annualId;
}

const renewalFromContractSchema = z.object({
  contractId: idSchema,
  fiscalYearId: idSchema,
  budgetPlanId: idSchema,
  fundingAccountId: idSchema,
  linkedAnnualFinancialId: optionalId,
  budgetItemId: optionalId,
  budgetLineItemId: optionalId,
  department: optionalString,
  costCenter: optionalString,
  renewalOwner: optionalString,
});

export async function createMaintenanceRenewalFromContract(input: unknown) {
  const data = parse(renewalFromContractSchema, input);
  const prisma = getPrisma();
  const contract = await prisma.contract.findUnique({
    where: { id: data.contractId },
    include: {
      lineItems: {
        where: { renewable: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!contract) {
    throw new FieldValidationError("Contract was not found.", {
      contractId: ["Select an existing contract."],
    });
  }
  if (!contract.lineItems.length) {
    throw new FieldValidationError("Contract has no renewable line items.", {
      contractId: ["Add at least one renewable product or pricing line."],
    });
  }

  const duplicate = await prisma.maintenanceRenewal.findFirst({
    where: {
      contractId: contract.id,
      fiscalYearId: data.fiscalYearId,
      overallStatus: { notIn: ["CANCELLED", "ARCHIVED"] },
    },
  });
  if (duplicate) {
    throw new FieldValidationError("Renewal already exists.", {
      contractId: [
        "This contract already has a renewal for the selected fiscal year.",
      ],
    });
  }

  const renewal = await prisma.$transaction(async (tx) => {
    const created = await tx.maintenanceRenewal.create({
      data: {
        budgetPlanId: data.budgetPlanId,
        fiscalYearId: data.fiscalYearId,
        linkedAnnualFinancialId: data.linkedAnnualFinancialId,
        budgetItemId: data.budgetItemId,
        budgetLineItemId: data.budgetLineItemId,
        vendorCompanyId: contract.vendorCompanyId,
        sellerCompanyId: contract.sellerCompanyId,
        contractId: contract.id,
        productId: contract.lineItems[0]?.productId,
        fundingAccountId: data.fundingAccountId,
        renewalName: `${contract.title} renewal`,
        productOrService: contract.title,
        department: data.department,
        costCenter: data.costCenter,
        currentAnnualCost: contract.annualValue,
        forecastedRenewalCost: contract.annualValue,
        approvedAmount: "0",
        renewalQuote: contract.annualValue,
        negotiatedCost: "0",
        currentContractStart: contract.startsOn,
        currentContractEnd: contract.endsOn,
        contractStart: contract.startsOn,
        contractEnd: contract.endsOn,
        renewalDate: contract.renewalDate ?? contract.endsOn,
        renewalExpirationDate: contract.endsOn,
        cancellationNoticeDeadline: noticeDate(contract),
        noticeDate: noticeDate(contract),
        noticePeriodDays: contract.noticePeriodDays,
        autoRenewal: contract.autoRenewal,
        paymentFrequency: contract.paymentFrequency,
        renewalOwner:
          data.renewalOwner ?? contract.contractOwner ?? contract.businessOwner,
        businessOwner: contract.businessOwner,
        contractOwner: contract.contractOwner,
        productOwner: contract.securityOwner,
        decisionOwner: contract.procurementContact,
        renewalRisk: contract.renewalRiskLevel,
        riskStatus:
          contract.renewalRiskLevel === "CRITICAL"
            ? "CRITICAL"
            : contract.renewalRiskLevel === "HIGH"
              ? "AT_RISK"
              : "ON_TRACK",
        renewalStrategy: contract.renewalStrategy,
        notesText: `Created from contract ${contract.contractNumber ?? contract.title}.`,
        lineItems: {
          create: contract.lineItems.map((line) => ({
            sourceContractLineId: line.id,
            productId: line.productId,
            productModuleId: line.productModuleId,
            description: line.description,
            sku: line.sku,
            licenseMetric: line.licenseMetric,
            currentQuantity: line.quantity,
            proposedQuantity: line.quantity,
            currentUnitPrice: line.unitPrice,
            proposedUnitPrice: line.unitPrice,
            currentAnnualAmount: line.annualAmount,
            quotedAnnualAmount: line.annualAmount,
            negotiatedAmount: "0",
            finalAmount: "0",
            action: "KEEP",
            sortOrder: line.sortOrder,
            notesText: line.notesText,
          })),
        },
      },
    });
    await createDispositionWork(
      tx as PrismaClientLike,
      created.id,
      "DECISION_PENDING"
    );
    return created;
  });

  return renewal.id;
}

const newTermSchema = z.object({
  maintenanceRenewalId: idSchema,
});

export async function createNewContractTermFromRenewal(input: unknown) {
  const data = parse(newTermSchema, input);
  const prisma = getPrisma();
  const renewal = await prisma.maintenanceRenewal.findUnique({
    where: { id: data.maintenanceRenewalId },
    include: {
      contract: true,
      lineItems: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!renewal || !renewal.contract) {
    throw new FieldValidationError("Renewal is not linked to a contract.", {
      maintenanceRenewalId: ["Select a contract-backed renewal."],
    });
  }
  const priorContract = renewal.contract;
  if (renewal.decisionStatus !== "APPROVED" || !renewal.approvedDisposition) {
    throw new FieldValidationError("Approved renewal disposition required.", {
      decisionStatus: [
        "Approve the renewal disposition before creating a term.",
      ],
    });
  }
  if (["DO_NOT_RENEW", "DECOMMISSION"].includes(renewal.approvedDisposition)) {
    throw new FieldValidationError("No new contract term is expected.", {
      approvedDisposition: ["This disposition does not create a new term."],
    });
  }
  if (!renewal.renewalEffectiveDate || !renewal.renewalExpirationDate) {
    throw new FieldValidationError("Final term dates are required.", {
      renewalEffectiveDate: ["Add a renewal effective date."],
      renewalExpirationDate: ["Add a renewal expiration date."],
    });
  }
  const renewalEffectiveDate = renewal.renewalEffectiveDate;
  const renewalExpirationDate = renewal.renewalExpirationDate;
  if (!renewal.lineItems.length) {
    throw new FieldValidationError("Renewal has no line items.", {
      maintenanceRenewalId: ["Add line pricing before creating a new term."],
    });
  }

  const created = await prisma.$transaction(async (tx) => {
    const next = await tx.contract.create({
      data: {
        previousContractId: priorContract.id,
        vendorCompanyId: renewal.vendorCompanyId,
        sellerCompanyId: renewal.sellerCompanyId,
        title: `${priorContract.title} next term`,
        contractType: priorContract.contractType,
        associatedProductOrService: renewal.productOrService,
        status: "ACTIVE",
        renewalDate: renewal.renewalDate,
        autoRenewal: renewal.autoRenewal,
        noticePeriodDays: renewal.noticePeriodDays,
        paymentFrequency: renewal.paymentFrequency,
        contractOwner: renewal.contractOwner,
        businessOwner: renewal.businessOwner,
        securityOwner: renewal.productOwner,
        procurementContact: renewal.procurementOwner,
        renewalRiskLevel: renewal.renewalRisk,
        renewalStrategy: renewal.renewalStrategy,
        notesText: `Created from renewal ${renewal.renewalNumber ?? renewal.id}.`,
        startsOn: renewalEffectiveDate,
        endsOn: renewalExpirationDate,
        lineItems: {
          create: renewal.lineItems
            .filter((line) => line.action !== "REMOVE")
            .map((line) => {
              const finalAmount = Number(line.finalAmount ?? 0);
              const termAmount = finalAmount
                ? line.finalAmount
                : line.quotedAnnualAmount;
              return {
                productId: line.productId,
                productModuleId: line.productModuleId,
                description: line.description,
                sku: line.sku,
                quantity: line.proposedQuantity,
                licenseMetric: line.licenseMetric,
                unitPrice: line.proposedUnitPrice,
                annualAmount: termAmount,
                totalAmount: termAmount,
                startsOn: renewalEffectiveDate,
                endsOn: renewalExpirationDate,
                renewable: true,
                sortOrder: line.sortOrder,
                notesText: line.notesText,
              };
            }),
        },
      },
      include: { lineItems: true },
    });
    await syncContractTotals(tx as PrismaClientLike, next.id);
    await tx.contract.update({
      where: { id: priorContract.id },
      data: { status: "EXPIRED" },
    });
    await tx.maintenanceRenewal.update({
      where: { id: renewal.id },
      data: { overallStatus: "COMPLETED", completedAt: new Date() },
    });
    return next;
  });

  return created.id;
}
