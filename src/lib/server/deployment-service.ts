import { z } from "zod";
import { Prisma } from "@prisma/client";

import { FieldValidationError } from "@/lib/server/action-result";
import { getPrisma } from "@/lib/server/prisma";
import type { GlobalContextSelection } from "@/lib/server/global-context";
import {
  DEPLOYMENT_LIST_DEFAULT_SIZE,
  DEPLOYMENT_LIST_MAX_SIZE,
  DEPLOYMENT_USAGE_DEFAULT_SIZE,
  DEPLOYMENT_USAGE_MAX_SIZE,
  type DeploymentDetailDto,
  type DeploymentEditorOptionsDto,
  type DeploymentFilterOptionsDto,
  type DeploymentListFilters,
  type DeploymentListRowDto,
  type DeploymentMetricsDto,
  type DeploymentPageDataDto,
  type DeploymentSortKey,
  type DeploymentUsageDto,
} from "@/types/deployment";

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
const optionalInt = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().int().min(0, "Must be zero or greater").optional()
);
const percent = z.coerce.number().min(0).max(100);
const optionalPercent = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().min(0).max(100).optional()
);

export const deploymentOptionSets = {
  deploymentStatuses: [
    "NOT_STARTED",
    "PLANNING",
    "IN_PROGRESS",
    "PARTIALLY_DEPLOYED",
    "DEPLOYED",
    "ON_HOLD",
    "RETIRING",
    "RETIRED",
    "PLANNED",
    "IMPLEMENTING",
    "ACTIVE",
    "UNDER_REVIEW",
  ] as const,
  adoptionLevels: [
    "NOT_USED",
    "LOW",
    "MEDIUM",
    "HIGH",
    "FULLY_ADOPTED",
  ] as const,
};

export const DEPLOYMENT_USAGE_HISTORY_LIMIT = DEPLOYMENT_USAGE_DEFAULT_SIZE;
export const DEPLOYMENT_SOURCE_OPTION_LIMIT = 100;

const companySummarySelect = {
  id: true,
  name: true,
} as const;

const productSummarySelect = {
  id: true,
  name: true,
  vendorCompany: { select: companySummarySelect },
} as const;

const productModuleSummarySelect = {
  id: true,
  name: true,
} as const;

const maintenanceRenewalSummarySelect = {
  id: true,
  renewalDate: true,
  departmentId: true,
  departmentRef: { select: { name: true } },
  vendorCompany: { select: companySummarySelect },
} as const;

const contractLineSummarySelect = {
  id: true,
  contractId: true,
  description: true,
  quantity: true,
  licenseMetric: true,
  annualAmount: true,
  product: { select: productSummarySelect },
  productModule: { select: productModuleSummarySelect },
  contract: {
    select: {
      id: true,
      title: true,
      vendorCompany: { select: companySummarySelect },
    },
  },
} satisfies Prisma.ContractLineItemSelect;

const renewalLineSummarySelect = {
  id: true,
  maintenanceRenewalId: true,
  description: true,
  currentQuantity: true,
  proposedQuantity: true,
  product: { select: productSummarySelect },
  productModule: { select: productModuleSummarySelect },
  maintenanceRenewal: { select: maintenanceRenewalSummarySelect },
} satisfies Prisma.MaintenanceRenewalLineItemSelect;

const purchaseItemSummarySelect = {
  id: true,
  quantity: true,
  product: { select: productSummarySelect },
  productModule: { select: productModuleSummarySelect },
  purchase: {
    select: {
      title: true,
      contract: { select: { title: true } },
      sellerCompany: { select: companySummarySelect },
    },
  },
} satisfies Prisma.PurchaseItemSelect;

const deploymentListSelect = {
  id: true,
  updatedAt: true,
  departmentId: true,
  ownerTeamMemberId: true,
  contractLineItemId: true,
  purchaseItemId: true,
  maintenanceRenewalId: true,
  maintenanceRenewalLineItemId: true,
  scopeName: true,
  environment: true,
  department: true,
  owner: true,
  status: true,
  deploymentPercent: true,
  utilizationPercent: true,
  licensedQuantity: true,
  activeUsageQuantity: true,
  targetPopulation: true,
  deployedPopulation: true,
  targetDate: true,
  completedDate: true,
  blockers: true,
  contractLineItem: { select: contractLineSummarySelect },
  maintenanceRenewal: { select: maintenanceRenewalSummarySelect },
  maintenanceRenewalLineItem: { select: renewalLineSummarySelect },
  purchaseItem: { select: purchaseItemSummarySelect },
} satisfies Prisma.DeploymentSelect;

type DeploymentListRecord = Prisma.DeploymentGetPayload<{
  select: typeof deploymentListSelect;
}>;

function dateDto(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function renewalSummaryDto(
  renewal: NonNullable<DeploymentListRecord["maintenanceRenewal"]>
) {
  return { ...renewal, renewalDate: renewal.renewalDate.toISOString() };
}

function productDto<T extends { vendorCompany: unknown }>(product: T | null) {
  return product;
}

function renewalLineDto(
  line: NonNullable<DeploymentListRecord["maintenanceRenewalLineItem"]>
) {
  return {
    ...line,
    currentQuantity: line.currentQuantity.toString(),
    proposedQuantity: line.proposedQuantity.toString(),
    product: productDto(line.product),
    maintenanceRenewal: renewalSummaryDto(line.maintenanceRenewal),
  };
}

function deploymentListRowDto(
  deployment: DeploymentListRecord
): DeploymentListRowDto {
  return {
    ...deployment,
    updatedAt: deployment.updatedAt.toISOString(),
    deploymentPercent: deployment.deploymentPercent.toString(),
    utilizationPercent: deployment.utilizationPercent?.toString() ?? null,
    targetDate: dateDto(deployment.targetDate),
    completedDate: dateDto(deployment.completedDate),
    contractLineItem: deployment.contractLineItem
      ? {
          ...deployment.contractLineItem,
          quantity: deployment.contractLineItem.quantity.toString(),
          annualAmount: deployment.contractLineItem.annualAmount.toString(),
          product: productDto(deployment.contractLineItem.product),
        }
      : null,
    maintenanceRenewal: deployment.maintenanceRenewal
      ? renewalSummaryDto(deployment.maintenanceRenewal)
      : null,
    maintenanceRenewalLineItem: deployment.maintenanceRenewalLineItem
      ? renewalLineDto(deployment.maintenanceRenewalLineItem)
      : null,
    purchaseItem: deployment.purchaseItem
      ? {
          ...deployment.purchaseItem,
          quantity: deployment.purchaseItem.quantity?.toString() ?? null,
          product: productDto(deployment.purchaseItem.product),
        }
      : null,
  };
}

async function deploymentScopeWhere(
  selection: GlobalContextSelection
): Promise<Prisma.DeploymentWhereInput> {
  const prisma = getPrisma();
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
                is: {
                  contract: {
                    startsOn: { lte: fiscalYear.endsOn },
                    endsOn: { gte: fiscalYear.startsOn },
                  },
                },
              },
            },
            {
              maintenanceRenewal: {
                is: { fiscalYearId: selection.fiscalYearId },
              },
            },
            {
              maintenanceRenewalLineItem: {
                is: {
                  maintenanceRenewal: {
                    fiscalYearId: selection.fiscalYearId,
                  },
                },
              },
            },
          ],
        }
      : undefined),
  };
}

function deploymentOrderBy(
  sortBy: DeploymentSortKey,
  direction: Prisma.SortOrder
): Prisma.DeploymentOrderByWithRelationInput[] {
  const first: Prisma.DeploymentOrderByWithRelationInput =
    sortBy === "scopeName"
      ? { scopeName: direction }
      : sortBy === "owner"
        ? { owner: direction }
        : sortBy === "status"
          ? { status: direction }
          : sortBy === "deploymentPercent"
            ? { deploymentPercent: direction }
            : sortBy === "utilizationPercent"
              ? { utilizationPercent: direction }
              : { updatedAt: direction };
  return [
    first,
    ...(sortBy === "scopeName" ? [] : [{ scopeName: "asc" as const }]),
    { id: "asc" },
  ];
}

export async function listDeployments(
  selection: GlobalContextSelection = {},
  filters: DeploymentListFilters = {}
) {
  const prisma = getPrisma();
  const scope = await deploymentScopeWhere(selection);
  const pageSize = Math.min(
    DEPLOYMENT_LIST_MAX_SIZE,
    Math.max(1, Math.trunc(filters.pageSize ?? DEPLOYMENT_LIST_DEFAULT_SIZE))
  );
  const search = filters.search?.trim().slice(0, 200);
  const where: Prisma.DeploymentWhereInput = {
    AND: [
      scope,
      ...(search
        ? [
            {
              OR: [
                {
                  scopeName: { contains: search, mode: "insensitive" as const },
                },
                {
                  blockers: { contains: search, mode: "insensitive" as const },
                },
                {
                  department: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                { owner: { contains: search, mode: "insensitive" as const } },
                {
                  contractLineItem: {
                    is: {
                      OR: [
                        {
                          product: {
                            is: {
                              name: {
                                contains: search,
                                mode: "insensitive" as const,
                              },
                            },
                          },
                        },
                        {
                          productModule: {
                            is: {
                              name: {
                                contains: search,
                                mode: "insensitive" as const,
                              },
                            },
                          },
                        },
                        {
                          contract: {
                            vendorCompany: {
                              is: {
                                name: {
                                  contains: search,
                                  mode: "insensitive" as const,
                                },
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
                {
                  maintenanceRenewalLineItem: {
                    is: {
                      OR: [
                        {
                          product: {
                            is: {
                              name: {
                                contains: search,
                                mode: "insensitive" as const,
                              },
                            },
                          },
                        },
                        {
                          productModule: {
                            is: {
                              name: {
                                contains: search,
                                mode: "insensitive" as const,
                              },
                            },
                          },
                        },
                        {
                          maintenanceRenewal: {
                            vendorCompany: {
                              is: {
                                name: {
                                  contains: search,
                                  mode: "insensitive" as const,
                                },
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
                {
                  purchaseItem: {
                    is: {
                      OR: [
                        {
                          product: {
                            is: {
                              name: {
                                contains: search,
                                mode: "insensitive" as const,
                              },
                            },
                          },
                        },
                        {
                          productModule: {
                            is: {
                              name: {
                                contains: search,
                                mode: "insensitive" as const,
                              },
                            },
                          },
                        },
                        {
                          product: {
                            is: {
                              vendorCompany: {
                                is: {
                                  name: {
                                    contains: search,
                                    mode: "insensitive" as const,
                                  },
                                },
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          ]
        : []),
      ...(filters.departmentId ? [{ departmentId: filters.departmentId }] : []),
      ...(filters.ownerTeamMemberId
        ? [{ ownerTeamMemberId: filters.ownerTeamMemberId }]
        : []),
      ...(filters.status ? [{ status: filters.status as never }] : []),
      ...(filters.productId
        ? [
            {
              OR: [
                { contractLineItem: { is: { productId: filters.productId } } },
                {
                  maintenanceRenewalLineItem: {
                    is: { productId: filters.productId },
                  },
                },
                { purchaseItem: { is: { productId: filters.productId } } },
              ],
            },
          ]
        : []),
      ...(filters.vendorCompanyId
        ? [
            {
              OR: [
                {
                  contractLineItem: {
                    is: {
                      contract: {
                        vendorCompanyId: filters.vendorCompanyId,
                      },
                    },
                  },
                },
                {
                  maintenanceRenewal: {
                    is: { vendorCompanyId: filters.vendorCompanyId },
                  },
                },
                {
                  maintenanceRenewalLineItem: {
                    is: {
                      maintenanceRenewal: {
                        vendorCompanyId: filters.vendorCompanyId,
                      },
                    },
                  },
                },
                {
                  purchaseItem: {
                    is: {
                      product: {
                        is: { vendorCompanyId: filters.vendorCompanyId },
                      },
                    },
                  },
                },
              ],
            },
          ]
        : []),
    ],
  };
  const [records, metrics] = await Promise.all([
    prisma.deployment.findMany({
      where,
      orderBy: deploymentOrderBy(
        filters.sortBy ?? "updatedAt",
        filters.sortDirection ?? "desc"
      ),
      take: pageSize + 1,
      ...(filters.cursor
        ? { cursor: { id: filters.cursor }, skip: 1 }
        : undefined),
      select: deploymentListSelect,
    }),
    getDeploymentMetrics(scope),
  ]);
  const hasNextPage = records.length > pageSize;
  const page = hasNextPage ? records.slice(0, pageSize) : records;
  return {
    rows: page.map(deploymentListRowDto),
    nextCursor: hasNextPage ? (page.at(-1)?.id ?? null) : null,
    metrics,
  };
}

async function getDeploymentMetrics(
  scope: Prisma.DeploymentWhereInput
): Promise<DeploymentMetricsDto> {
  const prisma = getPrisma();
  const [tracked, fullyDeployed, partiallyDeployed, notStartedOrBlocked, avg] =
    await Promise.all([
      prisma.deployment.count({ where: scope }),
      prisma.deployment.count({
        where: {
          AND: [
            scope,
            {
              OR: [
                { status: { in: ["DEPLOYED", "ACTIVE"] } },
                { deploymentPercent: { gte: 100 } },
              ],
            },
          ],
        },
      }),
      prisma.deployment.count({
        where: {
          AND: [
            scope,
            {
              OR: [
                { status: "PARTIALLY_DEPLOYED" },
                { deploymentPercent: { gt: 0, lt: 100 } },
              ],
            },
          ],
        },
      }),
      prisma.deployment.count({
        where: {
          AND: [
            scope,
            {
              OR: [
                {
                  status: {
                    in: ["NOT_STARTED", "PLANNING", "PLANNED", "ON_HOLD"],
                  },
                },
                { blockers: { not: null } },
              ],
            },
          ],
        },
      }),
      prisma.deployment.aggregate({
        where: scope,
        _avg: { utilizationPercent: true },
      }),
    ]);
  return {
    tracked,
    fullyDeployed,
    partiallyDeployed,
    notStartedOrBlocked,
    averageUtilization: avg._avg.utilizationPercent?.toString() ?? "0",
  };
}

export async function getDeploymentDetail(
  id: string,
  selection: GlobalContextSelection = {}
): Promise<DeploymentDetailDto | null> {
  if (!id) return null;
  const prisma = getPrisma();
  const scope = await deploymentScopeWhere(selection);
  const deployment = await prisma.deployment.findFirst({
    where: { AND: [{ id }, scope] },
    select: {
      ...deploymentListSelect,
      adoptionLevel: true,
      valueNarrative: true,
    },
  });
  return deployment
    ? {
        ...deploymentListRowDto(deployment),
        adoptionLevel: deployment.adoptionLevel,
        valueNarrative: deployment.valueNarrative,
      }
    : null;
}

export async function listDeploymentUsageMeasurements(
  deploymentId: string,
  cursor?: string,
  pageSize = DEPLOYMENT_USAGE_DEFAULT_SIZE
) {
  const prisma = getPrisma();
  const size = Math.min(
    DEPLOYMENT_USAGE_MAX_SIZE,
    Math.max(1, Math.trunc(pageSize))
  );
  const measurements = await prisma.usageMeasurement.findMany({
    where: { deploymentId },
    orderBy: [{ measuredAt: "desc" }, { id: "desc" }],
    take: size + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : undefined),
    select: {
      id: true,
      measuredAt: true,
      licensedCount: true,
      deployedCount: true,
      activeUsageCount: true,
      utilizationPercent: true,
      source: true,
      notesText: true,
    },
  });
  const hasNextPage = measurements.length > size;
  const page = hasNextPage ? measurements.slice(0, size) : measurements;
  return {
    rows: page.map((measurement): DeploymentUsageDto => ({
      ...measurement,
      measuredAt: measurement.measuredAt.toISOString(),
      utilizationPercent: measurement.utilizationPercent?.toString() ?? null,
    })),
    nextCursor: hasNextPage ? (page.at(-1)?.id ?? null) : null,
  };
}

export async function getDeploymentFilterOptions(
  selection: GlobalContextSelection = {}
): Promise<DeploymentFilterOptionsDto> {
  const prisma = getPrisma();
  const [departments, owners, vendors, products] = await Promise.all([
    prisma.department.findMany({
      where: selection.departmentId
        ? { id: selection.departmentId }
        : undefined,
      take: DEPLOYMENT_LIST_MAX_SIZE,
      orderBy: [{ active: "desc" }, { name: "asc" }],
      select: { id: true, name: true, active: true },
    }),
    prisma.teamMember.findMany({
      where: selection.departmentId
        ? { departmentId: selection.departmentId }
        : undefined,
      take: DEPLOYMENT_LIST_MAX_SIZE,
      orderBy: [{ active: "desc" }, { fullName: "asc" }],
      select: {
        id: true,
        fullName: true,
        active: true,
        departmentId: true,
      },
    }),
    prisma.company.findMany({
      where: { active: true, roles: { some: { role: "VENDOR" } } },
      take: DEPLOYMENT_LIST_MAX_SIZE,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      where: { active: true },
      take: DEPLOYMENT_LIST_MAX_SIZE,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, name: true, vendorCompanyId: true },
    }),
  ]);
  return { departments, owners, vendors, products };
}

export async function getDeploymentEditorOptions(
  selection: GlobalContextSelection = {},
  filterOptions?: DeploymentFilterOptionsDto
): Promise<DeploymentEditorOptionsDto> {
  const prisma = getPrisma();
  const [renewalLineItems, deploymentEnvironments, sharedOptions] =
    await Promise.all([
      prisma.maintenanceRenewalLineItem.findMany({
        where: {
          maintenanceRenewal:
            selection.departmentId || selection.fiscalYearId
              ? {
                  departmentId: selection.departmentId,
                  fiscalYearId: selection.fiscalYearId,
                }
              : undefined,
        },
        orderBy: [
          { maintenanceRenewal: { renewalDate: "asc" } },
          { sortOrder: "asc" },
          { id: "asc" },
        ],
        take: DEPLOYMENT_SOURCE_OPTION_LIMIT,
        select: renewalLineSummarySelect,
      }),
      prisma.deploymentEnvironment.findMany({
        where: { active: true },
        take: DEPLOYMENT_LIST_MAX_SIZE,
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, active: true },
      }),
      filterOptions
        ? Promise.resolve(filterOptions)
        : getDeploymentFilterOptions(selection),
    ]);
  return {
    renewalLineItems: renewalLineItems.map(renewalLineDto),
    departments: sharedOptions.departments,
    teamMembers: sharedOptions.owners,
    deploymentEnvironments,
  };
}

export async function getDeploymentPageData(
  selection: GlobalContextSelection = {},
  filters: DeploymentListFilters = {},
  selectedId?: string,
  usageCursor?: string
): Promise<DeploymentPageDataDto> {
  const normalizedFilters: DeploymentPageDataDto["filters"] = {
    ...filters,
    sortBy: filters.sortBy ?? "updatedAt",
    sortDirection: filters.sortDirection ?? "desc",
    pageSize: Math.min(
      DEPLOYMENT_LIST_MAX_SIZE,
      Math.max(1, Math.trunc(filters.pageSize ?? DEPLOYMENT_LIST_DEFAULT_SIZE))
    ),
  };
  const [list, filterOptions] = await Promise.all([
    listDeployments(selection, normalizedFilters),
    getDeploymentFilterOptions(selection),
  ]);
  const detailId =
    selectedId && list.rows.some((row) => row.id === selectedId)
      ? selectedId
      : list.rows[0]?.id;
  const [selectedDeployment, usage, editorOptions] = await Promise.all([
    detailId ? getDeploymentDetail(detailId, selection) : Promise.resolve(null),
    detailId
      ? listDeploymentUsageMeasurements(detailId, usageCursor)
      : Promise.resolve({ rows: [], nextCursor: null }),
    getDeploymentEditorOptions(selection, filterOptions),
  ]);
  return {
    deployments: list.rows,
    selectedDeployment,
    usageMeasurements: usage.rows,
    nextCursor: list.nextCursor,
    nextUsageCursor: usage.nextCursor,
    metrics: list.metrics,
    filterOptions,
    editorOptions,
    filters: normalizedFilters,
    optionSets: deploymentOptionSets,
  };
}

const deploymentSchema = z.object({
  id: optionalId,
  contractLineItemId: optionalId,
  maintenanceRenewalId: optionalId,
  maintenanceRenewalLineItemId: optionalId,
  scopeName: requiredString,
  environment: optionalString,
  departmentId: optionalId,
  ownerTeamMemberId: optionalId,
  status: z.enum(deploymentOptionSets.deploymentStatuses),
  deploymentPercent: percent,
  licensedQuantity: optionalInt,
  deployedPopulation: optionalInt,
  activeUsageQuantity: optionalInt,
  utilizationPercent: optionalPercent,
  adoptionLevel: z.enum(deploymentOptionSets.adoptionLevels).optional(),
  targetDate: optionalDate,
  completedDate: optionalDate,
  blockers: optionalString,
  notesText: optionalString,
});

function decimalInput(value?: number) {
  return value === undefined ? undefined : String(value);
}

async function assertContractLine(lineItemId: string) {
  const prisma = getPrisma();
  const line = await prisma.contractLineItem.findUnique({
    where: { id: lineItemId },
  });
  if (!line) {
    throw new FieldValidationError("Contract line item is required.", {
      contractLineItemId: ["Select a valid contract product or service line."],
    });
  }
  return line;
}

async function assertRenewalLine(
  renewalId: string,
  lineItemId: string,
  departmentId?: string
) {
  const prisma = getPrisma();
  const line = await prisma.maintenanceRenewalLineItem.findFirst({
    where: {
      id: lineItemId,
      maintenanceRenewalId: renewalId,
      maintenanceRenewal: departmentId ? { departmentId } : undefined,
    },
    include: { maintenanceRenewal: true, product: true },
  });
  if (!line) {
    throw new FieldValidationError("Renewal product is required.", {
      maintenanceRenewalLineItemId: [
        "Select a product listed on this department's renewal.",
      ],
    });
  }
  return line;
}

export async function saveDeployment(input: unknown) {
  const data = deploymentSchema.parse(input);
  const prisma = getPrisma();
  let line: { quantity?: unknown } | null = null;
  let renewalLine: Awaited<ReturnType<typeof assertRenewalLine>> | null = null;
  const legacyEdit = Boolean(
    data.id && !data.maintenanceRenewalLineItemId && data.contractLineItemId
  );
  if (!data.id && !data.departmentId) {
    throw new FieldValidationError(
      "Department is required for new deployments.",
      {
        departmentId: [
          "Choose a department before selecting a renewal product.",
        ],
      }
    );
  }
  if (data.maintenanceRenewalId && data.maintenanceRenewalLineItemId) {
    renewalLine = await assertRenewalLine(
      data.maintenanceRenewalId,
      data.maintenanceRenewalLineItemId,
      data.departmentId
    );
  } else if (data.contractLineItemId && legacyEdit) {
    line = await assertContractLine(data.contractLineItemId);
  } else {
    throw new FieldValidationError("Select a Maintenance Renewal product.", {
      maintenanceRenewalLineItemId: [
        "New deployments must use a product from Maintenance Renewals.",
      ],
    });
  }
  const [department, ownerTeamMember] = await Promise.all([
    data.departmentId
      ? prisma.department.findUnique({ where: { id: data.departmentId } })
      : Promise.resolve(null),
    data.ownerTeamMemberId
      ? prisma.teamMember.findUnique({ where: { id: data.ownerTeamMemberId } })
      : Promise.resolve(null),
  ]);
  if (data.departmentId && !department) {
    throw new FieldValidationError("Department is required.", {
      departmentId: ["Choose an existing Department."],
    });
  }
  if (data.ownerTeamMemberId && !ownerTeamMember) {
    throw new FieldValidationError("Owner is required.", {
      ownerTeamMemberId: ["Choose an existing Team Member."],
    });
  }

  const duplicate = await prisma.deployment.findFirst({
    where: {
      ...(legacyEdit
        ? { contractLineItemId: data.contractLineItemId }
        : { maintenanceRenewalLineItemId: data.maintenanceRenewalLineItemId }),
      scopeName: data.scopeName,
      id: data.id ? { not: data.id } : undefined,
    },
  });
  if (duplicate) {
    throw new FieldValidationError(
      "Deployment scope must be unique per contract line item.",
      { scopeName: ["Use a different scope for this contract line item."] }
    );
  }

  const payload = {
    contractLineItemId: legacyEdit ? data.contractLineItemId : undefined,
    maintenanceRenewalId: renewalLine?.maintenanceRenewalId,
    maintenanceRenewalLineItemId: renewalLine?.id,
    scopeName: data.scopeName,
    environment: data.environment,
    departmentId: data.departmentId,
    ownerTeamMemberId: data.ownerTeamMemberId,
    department: department?.name,
    owner: ownerTeamMember?.fullName,
    status: data.status,
    deploymentPercent: String(data.deploymentPercent),
    licensedQuantity:
      data.licensedQuantity ??
      Math.floor(
        Number(
          (line as { quantity?: unknown } | null)?.quantity ??
            renewalLine?.currentQuantity ??
            0
        )
      ),
    deployedPopulation: data.deployedPopulation,
    activeUsageQuantity: data.activeUsageQuantity,
    utilizationPercent: decimalInput(data.utilizationPercent),
    adoptionLevel: data.adoptionLevel,
    targetDate: data.targetDate,
    completedDate: data.completedDate,
    blockers: data.blockers,
    valueNarrative: data.notesText,
  };

  const deployment = data.id
    ? await prisma.deployment.update({ where: { id: data.id }, data: payload })
    : await prisma.deployment.create({ data: payload });

  return deployment.id;
}

const usageSchema = z.object({
  deploymentId: idSchema,
  measuredAt: z
    .string()
    .trim()
    .min(1, "Required")
    .transform((value) => new Date(`${value}T00:00:00.000Z`)),
  licensedCount: optionalInt,
  deployedCount: optionalInt,
  activeUsageCount: optionalInt,
  utilizationPercent: optionalPercent,
  source: optionalString,
  notesText: optionalString,
});

export async function addDeploymentUsageMeasurement(input: unknown) {
  const data = usageSchema.parse(input);
  const prisma = getPrisma();
  const deployment = await prisma.deployment.findUnique({
    where: { id: data.deploymentId },
  });
  if (!deployment) {
    throw new FieldValidationError("Deployment is required.", {
      deploymentId: ["Select a deployment record."],
    });
  }

  const duplicate = await prisma.usageMeasurement.findFirst({
    where: { deploymentId: data.deploymentId, measuredAt: data.measuredAt },
  });
  if (duplicate) {
    throw new FieldValidationError("Measurement date already exists.", {
      measuredAt: ["Add a different date to preserve usage history."],
    });
  }

  const measurement = await prisma.$transaction(async (tx) => {
    const created = await tx.usageMeasurement.create({
      data: {
        deploymentId: data.deploymentId,
        measuredAt: data.measuredAt,
        licensedCount: data.licensedCount,
        deployedCount: data.deployedCount,
        activeUsageCount: data.activeUsageCount,
        utilizationPercent: decimalInput(data.utilizationPercent),
        source: data.source,
        notesText: data.notesText,
      },
    });
    await tx.deployment.update({
      where: { id: data.deploymentId },
      data: {
        licensedQuantity: data.licensedCount ?? deployment.licensedQuantity,
        deployedPopulation: data.deployedCount ?? deployment.deployedPopulation,
        activeUsageQuantity:
          data.activeUsageCount ?? deployment.activeUsageQuantity,
        utilizationPercent:
          decimalInput(data.utilizationPercent) ??
          deployment.utilizationPercent,
      },
    });
    return created;
  });

  return measurement.id;
}
