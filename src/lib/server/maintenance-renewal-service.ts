import { z } from "zod";
import { Prisma } from "@prisma/client";

import {
  FieldValidationError,
  type FieldErrors,
} from "@/lib/server/action-result";
import { requirePermission } from "@/lib/server/authorization";
import { getPrisma } from "@/lib/server/prisma";
import type { GlobalContextSelection } from "@/lib/server/global-context";
import {
  defaultTaskTitlesForDisposition,
  dispositionDefinitions,
  renewalDecisionStatuses,
  renewalDispositions,
  renewalFundingStatuses,
  renewalOverallStatuses,
  renewalQuoteStatuses,
  renewalRiskStatuses,
  renewalRegisterStatuses,
  renewalTaskStatuses,
  renewalWorkflowStages,
  requiresDecisionReason,
  validateDispositionRequirements,
  type RenewalDisposition,
} from "@/lib/maintenance-renewal-rules";

type PrismaClientLike = ReturnType<typeof getPrisma>;

const maintenanceRenewalDefaultPageSize = 50;
const maintenanceRenewalMaximumPageSize = 100;
const maintenanceRenewalReferenceOptionLimit = 500;
const selectedCommentLimit = 50;
const selectedHistoryLimit = 50;
const selectedProductLineLimit = 100;

export type MaintenanceRenewalListSort =
  "renewalDateAsc" | "renewalDateDesc" | "updatedAtDesc";

export type MaintenanceRenewalListInput = GlobalContextSelection & {
  search?: string;
  status?: string;
  ownerId?: string;
  vendorId?: string;
  resellerId?: string;
  coOpAgreement?: string;
  windowDays?: number;
  sort?: MaintenanceRenewalListSort;
  page?: number;
  pageSize?: number;
};

export type MaintenanceRenewalPageInput = MaintenanceRenewalListInput & {
  selectedId?: string;
};

export type MaintenanceRenewalEditorOptionsDto = Awaited<
  ReturnType<typeof getMaintenanceRenewalEditorOptions>
>;

export type MaintenanceRenewalListRowDto = {
  id: string;
  departmentId: string | null;
  departmentRef: { name: string } | null;
  renewalName: string;
  productOrService: string;
  vendorCompanyId: string | null;
  sellerCompanyId: string | null;
  productId: string | null;
  vendorCompany: { id: string; name: string; active: boolean } | null;
  sellerCompany: { id: string; name: string; active: boolean } | null;
  product: {
    id: string;
    name: string;
    active: boolean;
    vendorCompanyId: string | null;
  } | null;
  ownerTeamMemberId: string | null;
  ownerTeamMember: {
    id: string;
    fullName: string;
    active: boolean;
  } | null;
  renewalOwner: string | null;
  renewalDate: Date;
  currentAnnualCost: number;
  approvedAmount: number;
  renewalStatus: string;
  coOpAgreement: string | null;
  coOpContractNumber: string | null;
  coOpAgreementExpirationDate: Date | null;
  purchasingVehicle: {
    name: string;
    contractNumber: string | null;
    endsOn: Date | null;
  } | null;
  purchasingAgreement: {
    sellerAwardNumber: string | null;
    endsOn: Date | null;
    purchasingVehicle: { name: string };
  } | null;
  notes: Array<{
    id: string;
    body: string;
    createdAt: Date;
    author: { name: string } | null;
  }>;
  decisionHistory: [];
  lineItems: [];
  deploymentRecords: [];
  createdAt: Date;
  updatedAt: Date;
};

function normalizedPositiveInteger(
  value: number | undefined,
  fallback: number,
  maximum?: number
) {
  if (!Number.isFinite(value) || !value || value < 1) return fallback;
  const normalized = Math.floor(value);
  return maximum ? Math.min(normalized, maximum) : normalized;
}

function maintenanceRenewalListWhere(
  input: MaintenanceRenewalListInput
): Prisma.MaintenanceRenewalWhereInput {
  const search = input.search?.trim();
  const status = maintenanceRenewalOptionSets.registerStatuses.includes(
    input.status as (typeof renewalRegisterStatuses)[number]
  )
    ? (input.status as (typeof renewalRegisterStatuses)[number])
    : undefined;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const where: Prisma.MaintenanceRenewalWhereInput = {
    ...(input.fiscalYearId ? { fiscalYearId: input.fiscalYearId } : {}),
    ...(input.departmentId ? { departmentId: input.departmentId } : {}),
    ...(status ? { renewalStatus: status } : {}),
    ...(input.ownerId ? { ownerTeamMemberId: input.ownerId } : {}),
    ...(input.vendorId ? { vendorCompanyId: input.vendorId } : {}),
    ...(input.resellerId ? { sellerCompanyId: input.resellerId } : {}),
    ...(input.coOpAgreement
      ? {
          AND: [
            {
              OR: [
                { coOpAgreement: input.coOpAgreement },
                {
                  purchasingVehicle: {
                    is: { name: input.coOpAgreement },
                  },
                },
                {
                  purchasingAgreement: {
                    is: {
                      purchasingVehicle: {
                        is: { name: input.coOpAgreement },
                      },
                    },
                  },
                },
              ],
            },
          ],
        }
      : {}),
    ...(input.windowDays && input.windowDays > 0
      ? {
          renewalDate: {
            gte: today,
            lte: new Date(today.getTime() + input.windowDays * 86_400_000),
          },
        }
      : {}),
  };

  if (search) {
    const searchFilter: Prisma.MaintenanceRenewalWhereInput = {
      OR: [
        { renewalName: { contains: search, mode: "insensitive" } },
        { productOrService: { contains: search, mode: "insensitive" } },
        { renewalOwner: { contains: search, mode: "insensitive" } },
        { coOpAgreement: { contains: search, mode: "insensitive" } },
        { coOpContractNumber: { contains: search, mode: "insensitive" } },
        {
          vendorCompany: {
            is: { name: { contains: search, mode: "insensitive" } },
          },
        },
        {
          sellerCompany: {
            is: { name: { contains: search, mode: "insensitive" } },
          },
        },
        {
          product: {
            is: { name: { contains: search, mode: "insensitive" } },
          },
        },
        {
          ownerTeamMember: {
            is: { fullName: { contains: search, mode: "insensitive" } },
          },
        },
        {
          notes: {
            some: { body: { contains: search, mode: "insensitive" } },
          },
        },
      ],
    };
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      searchFilter,
    ];
  }

  return where;
}

function maintenanceRenewalListOrderBy(
  sort: MaintenanceRenewalListSort | undefined
): Prisma.MaintenanceRenewalOrderByWithRelationInput[] {
  if (sort === "renewalDateDesc") {
    return [{ renewalDate: "desc" }, { createdAt: "desc" }, { id: "asc" }];
  }
  if (sort === "updatedAtDesc") {
    return [{ updatedAt: "desc" }, { id: "asc" }];
  }
  return [{ renewalDate: "asc" }, { createdAt: "desc" }, { id: "asc" }];
}

export const maintenanceRenewalOptionSets = {
  registerStatuses: renewalRegisterStatuses,
  dispositions: renewalDispositions,
  decisionStatuses: renewalDecisionStatuses,
  workflowStages: renewalWorkflowStages,
  overallStatuses: renewalOverallStatuses,
  riskStatuses: renewalRiskStatuses,
  fundingStatuses: renewalFundingStatuses,
  quoteStatuses: renewalQuoteStatuses,
  taskStatuses: renewalTaskStatuses,
  dispositionDefinitions,
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
const requiredTimestamp = z.coerce.date();
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

function assertDateOrder(
  earlier: Date | undefined,
  later: Date | undefined,
  field = "date"
) {
  if (earlier && later && earlier > later) {
    throw new FieldValidationError("Review the date range.", {
      [field]: ["The end date must be on or after the start date."],
    });
  }
}

function dateOnly(date?: Date) {
  return date ? date.toISOString().slice(0, 10) : undefined;
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

async function findProductOrThrow(prisma: PrismaClientLike, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, active: true },
    include: { vendorCompany: true },
  });
  if (!product) {
    throw new FieldValidationError("Product is required.", {
      productId: ["Select an active Product Catalog record."],
    });
  }
  return product;
}

function normalizedRenewalName(input: {
  renewalName?: string;
  productOrService?: string;
}) {
  return input.renewalName?.trim() || `${input.productOrService} renewal`;
}

export async function createDispositionWork(
  prisma: PrismaClientLike,
  renewalId: string,
  disposition: RenewalDisposition
) {
  const definition = dispositionDefinitions.find(
    (candidate) => candidate.value === disposition
  );
  if (!definition) return;

  await prisma.maintenanceRenewalWorkflowStep.createMany({
    data: definition.activeStages.map((stage) => ({
      maintenanceRenewalId: renewalId,
      stage,
      status: "REQUIRED",
    })),
    skipDuplicates: true,
  });

  await prisma.maintenanceRenewalTask.createMany({
    data: defaultTaskTitlesForDisposition(disposition).map((title) => ({
      maintenanceRenewalId: renewalId,
      title,
      stage: definition.activeStages[0],
    })),
  });
}

async function createDecisionHistory(
  prisma: PrismaClientLike,
  input: {
    renewalId: string;
    recommendedDisposition?: RenewalDisposition;
    approvedDisposition?: RenewalDisposition;
    decisionStatus: (typeof renewalDecisionStatuses)[number];
    changedBy?: string;
    rationale?: string;
    conditionsOfApproval?: string;
  }
) {
  await prisma.maintenanceRenewalDecisionHistory.create({
    data: {
      maintenanceRenewalId: input.renewalId,
      recommendedDisposition: input.recommendedDisposition,
      approvedDisposition: input.approvedDisposition,
      decisionStatus: input.decisionStatus,
      changedBy: input.changedBy,
      rationale: input.rationale,
      conditionsOfApproval: input.conditionsOfApproval,
    },
  });
}

async function readMaintenanceRenewalPageData(
  input: MaintenanceRenewalPageInput,
  listOnly: boolean
) {
  const prisma = getPrisma();
  const page = normalizedPositiveInteger(input.page, 1);
  const pageSize = normalizedPositiveInteger(
    input.pageSize,
    maintenanceRenewalDefaultPageSize,
    maintenanceRenewalMaximumPageSize
  );
  const sort = input.sort ?? "renewalDateAsc";
  const where = maintenanceRenewalListWhere(input);

  const [
    companies,
    purchasingVehicles,
    teamMembers,
    totalCount,
    renewalRecords,
  ] = await Promise.all([
    listOnly
      ? Promise.resolve([])
      : prisma.company.findMany({
          where: {
            active: true,
            roles: { some: { role: { in: ["VENDOR", "RESELLER"] } } },
          },
          orderBy: { name: "asc" },
          take: maintenanceRenewalReferenceOptionLimit,
          select: {
            id: true,
            name: true,
            active: true,
            roles: { select: { role: true } },
          },
        }),
    listOnly
      ? Promise.resolve([])
      : prisma.purchasingVehicle.findMany({
          where: { active: true },
          orderBy: { name: "asc" },
          take: maintenanceRenewalReferenceOptionLimit,
          select: { id: true, name: true },
        }),
    listOnly
      ? Promise.resolve([])
      : prisma.teamMember.findMany({
          where: { active: true },
          orderBy: { fullName: "asc" },
          take: maintenanceRenewalReferenceOptionLimit,
          select: { id: true, fullName: true, active: true },
        }),
    prisma.maintenanceRenewal.count({ where }),
    prisma.maintenanceRenewal.findMany({
      where,
      orderBy: maintenanceRenewalListOrderBy(sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        departmentId: true,
        departmentRef: { select: { name: true } },
        renewalName: true,
        productOrService: true,
        vendorCompanyId: true,
        sellerCompanyId: true,
        productId: true,
        vendorCompany: {
          select: { id: true, name: true, active: true },
        },
        sellerCompany: {
          select: { id: true, name: true, active: true },
        },
        product: {
          select: {
            id: true,
            name: true,
            active: true,
            vendorCompanyId: true,
          },
        },
        ownerTeamMemberId: true,
        ownerTeamMember: {
          select: { id: true, fullName: true, active: true },
        },
        renewalOwner: true,
        renewalDate: true,
        currentAnnualCost: true,
        approvedAmount: true,
        renewalStatus: true,
        coOpAgreement: true,
        coOpContractNumber: true,
        coOpAgreementExpirationDate: true,
        purchasingVehicle: {
          select: {
            name: true,
            contractNumber: true,
            endsOn: true,
          },
        },
        purchasingAgreement: {
          select: {
            sellerAwardNumber: true,
            endsOn: true,
            purchasingVehicle: { select: { name: true } },
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const renewalIds = renewalRecords.map((renewal) => renewal.id);
  const previewNotes: Array<{
    id: string;
    maintenanceRenewalId: string;
    body: string;
    createdAt: Date;
    authorName: string | null;
  }> = renewalIds.length
    ? await prisma.$queryRaw(Prisma.sql`
        SELECT
          preview.id,
          preview."maintenanceRenewalId",
          preview.body,
          preview."createdAt",
          author.name AS "authorName"
        FROM (
          SELECT DISTINCT ON (note."maintenanceRenewalId")
            note.id,
            note."maintenanceRenewalId",
            note."authorId",
            note.body,
            note."createdAt"
          FROM "Note" AS note
          WHERE note."maintenanceRenewalId" IN (${Prisma.join(renewalIds)})
          ORDER BY
            note."maintenanceRenewalId" ASC,
            note."createdAt" DESC,
            note.id ASC
        ) AS preview
        LEFT JOIN "User" AS author ON author.id = preview."authorId"
      `)
    : [];
  const previewByRenewalId = new Map(
    previewNotes.map((note) => [note.maintenanceRenewalId, note])
  );
  const renewals: MaintenanceRenewalListRowDto[] = renewalRecords.map(
    (renewal) => {
      const preview = previewByRenewalId.get(renewal.id);
      return {
        ...renewal,
        currentAnnualCost: Number(renewal.currentAnnualCost),
        approvedAmount: Number(renewal.approvedAmount),
        renewalStatus: renewal.renewalStatus,
        notes: preview
          ? [
              {
                id: preview.id,
                body: preview.body,
                createdAt: preview.createdAt,
                author: preview.authorName
                  ? { name: preview.authorName }
                  : null,
              },
            ]
          : [],
        decisionHistory: [],
        lineItems: [],
        deploymentRecords: [],
      };
    }
  );

  const selectedId = listOnly
    ? undefined
    : (input.selectedId ?? renewals[0]?.id);
  const selectedWhere: Prisma.MaintenanceRenewalWhereInput = selectedId
    ? { AND: [where, { id: selectedId }] }
    : { id: "__none__" };
  const [selectedRenewalRecord, activityLogs] = selectedId
    ? await Promise.all([
        prisma.maintenanceRenewal.findFirst({
          where: selectedWhere,
          select: {
            id: true,
            departmentId: true,
            departmentRef: { select: { name: true } },
            renewalName: true,
            productOrService: true,
            vendorCompanyId: true,
            sellerCompanyId: true,
            productId: true,
            vendorCompany: {
              select: { id: true, name: true, active: true },
            },
            sellerCompany: {
              select: { id: true, name: true, active: true },
            },
            product: {
              select: {
                id: true,
                name: true,
                active: true,
                vendorCompanyId: true,
              },
            },
            ownerTeamMemberId: true,
            ownerTeamMember: {
              select: { id: true, fullName: true, active: true },
            },
            renewalOwner: true,
            renewalDate: true,
            currentAnnualCost: true,
            approvedAmount: true,
            renewalStatus: true,
            coOpAgreement: true,
            coOpContractNumber: true,
            coOpAgreementExpirationDate: true,
            purchasingVehicle: {
              select: {
                name: true,
                contractNumber: true,
                endsOn: true,
              },
            },
            purchasingAgreement: {
              select: {
                sellerAwardNumber: true,
                endsOn: true,
                purchasingVehicle: { select: { name: true } },
              },
            },
            notes: {
              orderBy: [{ createdAt: "desc" }, { id: "asc" }],
              take: selectedCommentLimit,
              select: {
                id: true,
                body: true,
                createdAt: true,
                author: { select: { name: true } },
              },
            },
            decisionHistory: {
              orderBy: [{ changedAt: "desc" }, { id: "asc" }],
              take: selectedHistoryLimit,
              select: {
                id: true,
                changedAt: true,
                changedBy: true,
                decisionStatus: true,
              },
            },
            lineItems: {
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
              take: selectedProductLineLimit,
              select: {
                id: true,
                updatedAt: true,
                maintenanceRenewalId: true,
                productId: true,
                productModuleId: true,
                description: true,
                currentQuantity: true,
                proposedQuantity: true,
                currentUnitPrice: true,
                proposedUnitPrice: true,
                currentAnnualAmount: true,
                quotedAnnualAmount: true,
                negotiatedAmount: true,
                finalAmount: true,
                action: true,
                sortOrder: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    active: true,
                    vendorCompanyId: true,
                  },
                },
                productModule: {
                  select: {
                    id: true,
                    productId: true,
                    name: true,
                    active: true,
                  },
                },
                deployments: {
                  orderBy: { updatedAt: "desc" },
                  take: 10,
                  select: { id: true, status: true, scopeName: true },
                },
              },
            },
            deploymentRecords: {
              orderBy: { updatedAt: "desc" },
              take: 50,
              select: {
                id: true,
                maintenanceRenewalLineItemId: true,
                status: true,
                scopeName: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.activityLog.findMany({
          where: {
            entityType: "MaintenanceRenewal",
            entityId: selectedId,
          },
          orderBy: [{ occurredAt: "desc" }, { id: "asc" }],
          take: selectedHistoryLimit,
          select: {
            id: true,
            entityId: true,
            fieldName: true,
            previousValue: true,
            newValue: true,
            occurredAt: true,
            actor: { select: { name: true } },
          },
        }),
      ])
    : [null, []];

  const selectedRenewal = selectedRenewalRecord
    ? {
        ...selectedRenewalRecord,
        currentAnnualCost: Number(selectedRenewalRecord.currentAnnualCost),
        approvedAmount: Number(selectedRenewalRecord.approvedAmount),
        lineItems: selectedRenewalRecord.lineItems.map((line) => ({
          ...line,
          currentQuantity: Number(line.currentQuantity),
          proposedQuantity: Number(line.proposedQuantity),
          currentUnitPrice: Number(line.currentUnitPrice),
          proposedUnitPrice: Number(line.proposedUnitPrice),
          currentAnnualAmount: Number(line.currentAnnualAmount),
          quotedAnnualAmount: Number(line.quotedAnnualAmount),
          negotiatedAmount: Number(line.negotiatedAmount),
          finalAmount: Number(line.finalAmount),
        })),
      }
    : null;

  return {
    companies,
    products: [],
    modules: [],
    fiscalYears: [],
    budgetPlans: [],
    budgetAccounts: [],
    editorOptionsLoaded: false,
    purchasingVehicles,
    teamMembers,
    activityLogs,
    renewals,
    selectedRenewal,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    },
    query: {
      search: input.search?.trim() ?? "",
      status: maintenanceRenewalOptionSets.registerStatuses.includes(
        input.status as (typeof renewalRegisterStatuses)[number]
      )
        ? (input.status ?? "")
        : "",
      ownerId: input.ownerId ?? "",
      vendorId: input.vendorId ?? "",
      resellerId: input.resellerId ?? "",
      coOpAgreement: input.coOpAgreement ?? "",
      windowDays: input.windowDays ?? null,
      sort,
    },
    selection: {
      departmentId: input.departmentId ?? null,
      fiscalYearId: input.fiscalYearId ?? null,
    },
    optionSets: maintenanceRenewalOptionSets,
  };
}

export async function getMaintenanceRenewalPageData(
  input: MaintenanceRenewalPageInput = {}
) {
  return readMaintenanceRenewalPageData(input, false);
}

export async function listMaintenanceRenewals(
  input: MaintenanceRenewalListInput = {}
) {
  const data = await readMaintenanceRenewalPageData(input, true);
  return {
    renewals: data.renewals,
    pagination: data.pagination,
    query: data.query,
  };
}

export async function getMaintenanceRenewalEditorOptions() {
  const prisma = getPrisma();
  const [
    companies,
    products,
    modules,
    fiscalYears,
    budgetPlans,
    budgetAccounts,
    purchasingVehicles,
    teamMembers,
  ] = await Promise.all([
    prisma.company.findMany({
      orderBy: { name: "asc" },
      take: maintenanceRenewalReferenceOptionLimit,
      select: {
        id: true,
        name: true,
        active: true,
        roles: { select: { role: true } },
      },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      take: maintenanceRenewalReferenceOptionLimit,
      select: {
        id: true,
        name: true,
        active: true,
        vendorCompanyId: true,
      },
    }),
    prisma.productModule.findMany({
      orderBy: { name: "asc" },
      take: maintenanceRenewalReferenceOptionLimit,
      select: { id: true, productId: true, name: true, active: true },
    }),
    prisma.fiscalYear.findMany({
      orderBy: { startsOn: "desc" },
      take: maintenanceRenewalReferenceOptionLimit,
      select: { id: true, label: true },
    }),
    prisma.budgetPlan.findMany({
      orderBy: [{ fiscalYear: { startsOn: "desc" } }, { version: "asc" }],
      take: maintenanceRenewalReferenceOptionLimit,
      select: { id: true, fiscalYearId: true },
    }),
    prisma.budgetAccount.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      take: maintenanceRenewalReferenceOptionLimit,
      select: { id: true },
    }),
    prisma.purchasingVehicle.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      take: maintenanceRenewalReferenceOptionLimit,
      select: { id: true, name: true },
    }),
    prisma.teamMember.findMany({
      orderBy: { fullName: "asc" },
      take: maintenanceRenewalReferenceOptionLimit,
      select: { id: true, fullName: true, active: true },
    }),
  ]);

  return {
    companies,
    products,
    modules,
    fiscalYears,
    budgetPlans,
    budgetAccounts,
    purchasingVehicles,
    teamMembers,
  };
}

const createRenewalSchema = z.object({
  renewalName: optionalString,
  productId: idSchema,
  productModuleIds: z.array(idSchema).default([]),
  productFeatureIds: z.array(idSchema).default([]),
  vendorCompanyId: optionalId,
  sellerCompanyId: optionalId,
  contractId: optionalId,
  purchasingVehicleId: optionalId,
  purchasingAgreementId: optionalId,
  fiscalYearId: idSchema,
  budgetPlanId: idSchema,
  linkedAnnualFinancialId: optionalId,
  budgetItemId: optionalId,
  budgetLineItemId: optionalId,
  fundingAccountId: idSchema,
  securityCapabilityId: optionalId,
  department: optionalString,
  costCenter: optionalString,
  fundingSource: optionalString,
  currentAnnualCost: decimal,
  forecastedRenewalCost: decimal,
  approvedAmount: decimal,
  renewalDate: optionalDate,
  currentContractStart: optionalDate,
  currentContractEnd: optionalDate,
  renewalEffectiveDate: optionalDate,
  renewalExpirationDate: optionalDate,
  cancellationNoticeDeadline: optionalDate,
  autoRenewal: z.boolean().default(false),
  renewalOwner: optionalString,
  productOwner: optionalString,
  businessOwner: optionalString,
  contractOwner: optionalString,
  capabilityOwner: optionalString,
  decisionOwner: optionalString,
  recommendedDisposition: z
    .enum(renewalDispositions)
    .default("DECISION_PENDING"),
  decisionDueDate: optionalDate,
  nextAction: optionalString,
  nextActionOwner: optionalString,
  nextActionDueDate: optionalDate,
  notesText: optionalString,
  renewalStatus: z.enum(renewalRegisterStatuses).default("NOT_STARTED"),
  coOpAgreement: optionalString,
  coOpContractNumber: optionalString,
  coOpAgreementExpirationDate: optionalDate,
});

export async function createMaintenanceRenewal(input: unknown) {
  const data = parse(createRenewalSchema, input);
  assertDateOrder(
    data.currentContractStart,
    data.currentContractEnd,
    "currentContractEnd"
  );
  assertDateOrder(
    data.renewalEffectiveDate,
    data.renewalExpirationDate,
    "renewalExpirationDate"
  );

  if (!data.renewalDate && !data.renewalExpirationDate) {
    throw new FieldValidationError("Renewal date is required.", {
      renewalDate: ["Add a renewal or expiration date."],
    });
  }

  const requirementErrors = validateDispositionRequirements({
    disposition: data.recommendedDisposition,
    decisionDueDate: dateOnly(data.decisionDueDate),
  });
  if (requirementErrors.length) {
    throw new FieldValidationError("Disposition requirements are incomplete.", {
      recommendedDisposition: requirementErrors,
    });
  }

  const prisma = getPrisma();
  const product = await findProductOrThrow(prisma, data.productId);
  const vendorCompanyId = data.vendorCompanyId ?? product.vendorCompanyId;
  if (vendorCompanyId) {
    await assertCompanyRole(
      prisma,
      vendorCompanyId,
      "VENDOR",
      "vendorCompanyId"
    );
    if (product.vendorCompanyId !== vendorCompanyId) {
      throw new FieldValidationError(
        "Product does not belong to the selected vendor.",
        { productId: ["Select a product offered by the selected vendor."] }
      );
    }
  }
  if (data.sellerCompanyId) {
    await assertCompanyRole(
      prisma,
      data.sellerCompanyId,
      "RESELLER",
      "sellerCompanyId"
    );
  }

  const renewal = await prisma.$transaction(async (tx) => {
    const created = await tx.maintenanceRenewal.create({
      data: {
        renewalName: normalizedRenewalName({
          renewalName: data.renewalName,
          productOrService: product.name,
        }),
        productOrService: product.name,
        productId: data.productId,
        productModules: {
          connect: data.productModuleIds.map((id) => ({ id })),
        },
        productFeatures: {
          connect: data.productFeatureIds.map((id) => ({ id })),
        },
        vendorCompanyId,
        sellerCompanyId: data.sellerCompanyId,
        contractId: data.contractId,
        purchasingVehicleId: data.purchasingVehicleId,
        purchasingAgreementId: data.purchasingAgreementId,
        fiscalYearId: data.fiscalYearId,
        budgetPlanId: data.budgetPlanId,
        linkedAnnualFinancialId: data.linkedAnnualFinancialId,
        budgetItemId: data.budgetItemId,
        budgetLineItemId: data.budgetLineItemId,
        fundingAccountId: data.fundingAccountId,
        securityCapabilityId: data.securityCapabilityId,
        department: data.department,
        costCenter: data.costCenter,
        fundingSource: data.fundingSource,
        currentAnnualCost: toDecimalInput(data.currentAnnualCost),
        forecastedRenewalCost: toDecimalInput(data.forecastedRenewalCost),
        approvedAmount: toDecimalInput(data.approvedAmount),
        renewalQuote: toDecimalInput(data.forecastedRenewalCost),
        negotiatedCost: toDecimalInput(
          data.approvedAmount || data.forecastedRenewalCost
        ),
        renewalDate: data.renewalDate ?? data.renewalExpirationDate!,
        currentContractStart: data.currentContractStart,
        currentContractEnd: data.currentContractEnd,
        contractStart: data.currentContractStart,
        contractEnd: data.currentContractEnd,
        renewalEffectiveDate: data.renewalEffectiveDate,
        renewalExpirationDate: data.renewalExpirationDate ?? data.renewalDate,
        cancellationNoticeDeadline: data.cancellationNoticeDeadline,
        noticeDate: data.cancellationNoticeDeadline,
        autoRenewal: data.autoRenewal,
        renewalOwner: data.renewalOwner,
        productOwner: data.productOwner,
        businessOwner: data.businessOwner,
        contractOwner: data.contractOwner,
        capabilityOwner: data.capabilityOwner,
        decisionOwner: data.decisionOwner,
        recommendedDisposition: data.recommendedDisposition,
        decisionStatus:
          data.recommendedDisposition === "DECISION_PENDING"
            ? "UNDER_REVIEW"
            : "NOT_STARTED",
        decisionDueDate: data.decisionDueDate,
        nextAction: data.nextAction,
        nextActionOwner: data.nextActionOwner,
        nextActionDueDate: data.nextActionDueDate,
        notesText: data.notesText,
        renewalStatus: data.renewalStatus,
        coOpAgreement: data.coOpAgreement,
        coOpContractNumber: data.coOpContractNumber,
        coOpAgreementExpirationDate: data.coOpAgreementExpirationDate,
      },
    });

    await createDispositionWork(
      tx as PrismaClientLike,
      created.id,
      data.recommendedDisposition
    );
    await createDecisionHistory(tx as PrismaClientLike, {
      renewalId: created.id,
      recommendedDisposition: data.recommendedDisposition,
      decisionStatus:
        data.recommendedDisposition === "DECISION_PENDING"
          ? "UNDER_REVIEW"
          : "NOT_STARTED",
      changedBy: data.renewalOwner,
      rationale: data.notesText,
    });
    return created;
  });

  return renewal.id;
}

const registerUpdateSchema = z.object({
  id: idSchema,
  expectedUpdatedAt: requiredTimestamp,
  departmentId: optionalId,
  vendorCompanyId: idSchema,
  productId: idSchema,
  sellerCompanyId: optionalId,
  renewalDate: optionalDate,
  currentAnnualCost: decimal,
  renewalAmount: decimal,
  renewalStatus: z.enum(renewalRegisterStatuses),
  ownerTeamMemberId: optionalId,
  renewalOwner: optionalString,
  coOpAgreement: optionalString,
  coOpContractNumber: optionalString,
  coOpAgreementExpirationDate: optionalDate,
});

const registerTrackedFields = [
  "vendorCompanyId",
  "productId",
  "departmentId",
  "sellerCompanyId",
  "renewalDate",
  "currentAnnualCost",
  "approvedAmount",
  "renewalStatus",
  "ownerTeamMemberId",
  "renewalOwner",
  "coOpAgreement",
  "coOpContractNumber",
  "coOpAgreementExpirationDate",
] as const;

function auditValue(value: unknown) {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export async function updateMaintenanceRenewalRegister(input: unknown) {
  const data = parse(registerUpdateSchema, input);
  if (!data.renewalDate) {
    throw new FieldValidationError("Renewal date is required.", {
      renewalDate: ["Add the renewal date."],
    });
  }

  const prisma = getPrisma();
  const { actorId } = await requirePermission({
    permission: "renewals.write",
    departmentId: data.departmentId,
  });
  const [current, , , product, owner, department] = await Promise.all([
    prisma.maintenanceRenewal.findUnique({
      where: { id: data.id },
    }),
    assertCompanyRole(
      prisma,
      data.vendorCompanyId,
      "VENDOR",
      "vendorCompanyId"
    ),
    data.sellerCompanyId
      ? assertCompanyRole(
          prisma,
          data.sellerCompanyId,
          "RESELLER",
          "sellerCompanyId"
        )
      : Promise.resolve(null),
    findProductOrThrow(prisma, data.productId),
    data.ownerTeamMemberId
      ? prisma.teamMember.findFirst({
          where: { id: data.ownerTeamMemberId, active: true },
        })
      : Promise.resolve(null),
    data.departmentId
      ? prisma.department.findFirst({
          where: { id: data.departmentId, active: true },
        })
      : Promise.resolve(null),
  ]);
  if (!current) {
    throw new FieldValidationError("Renewal was not found.", {
      id: ["Select an existing renewal."],
    });
  }
  if (current.departmentId !== (data.departmentId ?? null)) {
    await requirePermission({
      permission: "renewals.write",
      departmentId: current.departmentId,
    });
  }
  if (product.vendorCompanyId !== data.vendorCompanyId) {
    throw new FieldValidationError(
      "Product does not belong to the selected vendor.",
      {
        productId: ["Select a product offered by the selected vendor."],
      }
    );
  }
  if (data.ownerTeamMemberId) {
    if (!owner) {
      throw new FieldValidationError("Owner is not active.", {
        ownerTeamMemberId: ["Select an active team member."],
      });
    }
  }
  if (data.departmentId && !department) {
    throw new FieldValidationError("Department is not active.", {
      departmentId: ["Select an active department."],
    });
  }

  const next = {
    vendorCompanyId: data.vendorCompanyId,
    productId: data.productId,
    departmentId: data.departmentId ?? null,
    department: department?.name ?? null,
    sellerCompanyId: data.sellerCompanyId ?? null,
    renewalDate: data.renewalDate,
    currentAnnualCost: toDecimalInput(data.currentAnnualCost),
    approvedAmount: toDecimalInput(data.renewalAmount),
    negotiatedCost: toDecimalInput(data.renewalAmount),
    renewalStatus: data.renewalStatus,
    ownerTeamMemberId: data.ownerTeamMemberId ?? null,
    renewalOwner: data.renewalOwner,
    coOpAgreement: data.coOpAgreement,
    coOpContractNumber: data.coOpContractNumber,
    coOpAgreementExpirationDate: data.coOpAgreementExpirationDate,
    productOrService: product.name,
  };

  await prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRenewal.updateMany({
      where: { id: data.id, updatedAt: data.expectedUpdatedAt },
      data: next,
    });
    if (updated.count !== 1) {
      const latest = await tx.maintenanceRenewal.findUnique({
        where: { id: data.id },
      });
      if (latest && registerStateMatches(latest, next)) return;
      throw new FieldValidationError(
        "This renewal changed after you opened it.",
        {
          id: ["Refresh the renewal and apply your changes again."],
        }
      );
    }
    const logRows = registerTrackedFields.flatMap((field) => {
      const nextValue =
        field === "approvedAmount"
          ? data.renewalAmount
          : next[field as keyof typeof next];
      const previousValue = current[field as keyof typeof current];
      if (auditValue(previousValue) === auditValue(nextValue)) return [];
      return [
        {
          action:
            field === "renewalStatus"
              ? ("STATUS_CHANGE" as const)
              : ("UPDATE" as const),
          entityType: "MaintenanceRenewal",
          entityId: data.id,
          actorId,
          fieldName: field,
          previousValue: auditValue(previousValue),
          newValue: auditValue(nextValue),
        },
      ];
    });
    if (logRows.length) await tx.activityLog.createMany({ data: logRows });
  });
  return data.id;
}

function registerStateMatches(
  current: Record<string, unknown>,
  next: Record<string, unknown>
) {
  return [...registerTrackedFields, "negotiatedCost", "productOrService"].every(
    (field) => auditValue(current[field]) === auditValue(next[field])
  );
}

const renewalLineItemSchema = z.object({
  id: optionalId,
  expectedUpdatedAt: z.coerce.date().optional(),
  maintenanceRenewalId: idSchema,
  productId: idSchema,
  productModuleId: optionalId,
  description: optionalString,
  sku: optionalString,
  licenseMetric: z
    .enum([
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
    ])
    .optional(),
  currentQuantity: decimal,
  proposedQuantity: decimal,
  currentUnitPrice: decimal,
  proposedUnitPrice: decimal,
  currentAnnualAmount: decimal,
  quotedAnnualAmount: decimal,
  negotiatedAmount: decimal,
  finalAmount: decimal,
  action: z.enum(["KEEP", "CHANGE", "ADD", "REMOVE", "REPLACE"]),
  sortOrder: z.coerce.number().int().min(0).default(0),
  notesText: optionalString,
});

async function assertRenewalLineProduct(
  prisma: PrismaClientLike,
  renewalId: string,
  productId: string,
  productModuleId?: string
) {
  const renewal = await prisma.maintenanceRenewal.findUnique({
    where: { id: renewalId },
    select: { id: true, vendorCompanyId: true, departmentId: true },
  });
  if (!renewal) {
    throw new FieldValidationError("Renewal was not found.", {
      maintenanceRenewalId: ["Select an existing maintenance renewal."],
    });
  }
  const product = await findProductOrThrow(prisma, productId);
  if (
    renewal.vendorCompanyId &&
    product.vendorCompanyId !== renewal.vendorCompanyId
  ) {
    throw new FieldValidationError(
      "Product does not belong to the renewal vendor.",
      {
        productId: [
          "Select an active catalog product offered by this renewal vendor.",
        ],
      }
    );
  }
  if (productModuleId) {
    const component = await prisma.productModule.findFirst({
      where: { id: productModuleId, productId, active: true },
    });
    if (!component) {
      throw new FieldValidationError("Product component is invalid.", {
        productModuleId: ["Select an active component for this product."],
      });
    }
  }
  return { renewal, product };
}

export async function saveMaintenanceRenewalLineItem(input: unknown) {
  const data = parse(renewalLineItemSchema, input);
  if (data.id && !data.expectedUpdatedAt) {
    throw new FieldValidationError("Renewal product version is required.", {
      id: ["Refresh the renewal before saving this product."],
    });
  }
  const prisma = getPrisma();
  const { renewal, product } = await assertRenewalLineProduct(
    prisma,
    data.maintenanceRenewalId,
    data.productId,
    data.productModuleId
  );
  const { actorId } = await requirePermission({
    permission: "renewals.write",
    departmentId: renewal.departmentId,
  });
  const payload = {
    maintenanceRenewalId: data.maintenanceRenewalId,
    productId: data.productId,
    productModuleId: data.productModuleId,
    description: data.description || product.name,
    sku: data.sku,
    licenseMetric: data.licenseMetric || undefined,
    currentQuantity: toDecimalInput(data.currentQuantity),
    proposedQuantity: toDecimalInput(data.proposedQuantity),
    currentUnitPrice: toDecimalInput(data.currentUnitPrice),
    proposedUnitPrice: toDecimalInput(data.proposedUnitPrice),
    currentAnnualAmount: toDecimalInput(data.currentAnnualAmount),
    quotedAnnualAmount: toDecimalInput(data.quotedAnnualAmount),
    negotiatedAmount: toDecimalInput(data.negotiatedAmount),
    finalAmount: toDecimalInput(data.finalAmount),
    action: data.action,
    sortOrder: data.sortOrder,
    notesText: data.notesText,
  };
  return prisma.$transaction(async (tx) => {
    let lineId: string;
    if (data.id) {
      const updated = await tx.maintenanceRenewalLineItem.updateMany({
        where: {
          id: data.id,
          maintenanceRenewalId: data.maintenanceRenewalId,
          updatedAt: data.expectedUpdatedAt,
        },
        data: payload,
      });
      if (updated.count !== 1) {
        const current = await tx.maintenanceRenewalLineItem.findUnique({
          where: { id: data.id },
        });
        if (
          !current ||
          current.maintenanceRenewalId !== data.maintenanceRenewalId
        ) {
          throw new FieldValidationError(
            "Renewal product does not belong to this renewal.",
            { id: ["Refresh the renewal product list and try again."] }
          );
        }
        if (renewalLineStateMatches(current, payload)) return data.id;
        throw new FieldValidationError(
          "This renewal product changed after you opened it.",
          { id: ["Refresh the renewal product and apply your changes again."] }
        );
      }
      lineId = data.id;
    } else {
      const created = await tx.maintenanceRenewalLineItem.create({
        data: payload,
      });
      lineId = created.id;
    }
    await tx.activityLog.create({
      data: {
        action: data.id ? "UPDATE" : "CREATE",
        entityType: "MaintenanceRenewal",
        entityId: data.maintenanceRenewalId,
        actorId,
        fieldName: "lineItems",
        newValue: lineId,
        metadata: { lineItemId: lineId },
      },
    });
    return lineId;
  });
}

export async function deleteMaintenanceRenewalLineItem(input: unknown) {
  const data = parse(
    z.object({
      id: idSchema,
      maintenanceRenewalId: idSchema,
      expectedUpdatedAt: requiredTimestamp,
    }),
    input
  );
  const prisma = getPrisma();
  const renewal = await prisma.maintenanceRenewal.findUnique({
    where: { id: data.maintenanceRenewalId },
    select: { id: true, departmentId: true },
  });
  if (!renewal) {
    throw new FieldValidationError("Renewal was not found.", {
      maintenanceRenewalId: ["Refresh the renewal product list."],
    });
  }
  const { actorId } = await requirePermission({
    permission: "renewals.write",
    departmentId: renewal.departmentId,
  });
  await prisma.$transaction(async (tx) => {
    const line = await tx.maintenanceRenewalLineItem.findUnique({
      where: { id: data.id },
      select: {
        maintenanceRenewalId: true,
        updatedAt: true,
        _count: { select: { deployments: true } },
      },
    });
    if (!line || line.maintenanceRenewalId !== data.maintenanceRenewalId) {
      throw new FieldValidationError(
        "Renewal product does not belong to this renewal.",
        { id: ["Refresh the renewal product list and try again."] }
      );
    }
    if (line.updatedAt.getTime() !== data.expectedUpdatedAt.getTime()) {
      throw new FieldValidationError(
        "This renewal product changed after you opened it.",
        { id: ["Refresh the renewal product before removing it."] }
      );
    }
    if (line._count.deployments > 0) {
      throw new FieldValidationError(
        "This renewal product has deployment history and cannot be removed.",
        {
          id: ["Preserve the product line or reassign its deployment records."],
        }
      );
    }
    await tx.maintenanceRenewalLineItem.delete({ where: { id: data.id } });
    await tx.activityLog.create({
      data: {
        action: "DELETE",
        entityType: "MaintenanceRenewal",
        entityId: data.maintenanceRenewalId,
        actorId,
        fieldName: "lineItems",
        previousValue: data.id,
        metadata: { lineItemId: data.id },
      },
    });
  });
  return data.id;
}

function renewalLineStateMatches(
  current: Record<string, unknown>,
  next: Record<string, unknown>
) {
  return Object.entries(next).every(
    ([field, value]) => auditValue(current[field]) === auditValue(value)
  );
}

const caseUpdateSchema = z.object({
  id: idSchema,
  overallStatus: z.enum(renewalOverallStatuses),
  workflowStage: z.enum(renewalWorkflowStages),
  riskStatus: z.enum(renewalRiskStatuses),
  fundingStatus: z.enum(renewalFundingStatuses),
  quoteStatus: z.enum(renewalQuoteStatuses),
  renewalOwner: optionalString,
  decisionOwner: optionalString,
  currentAnnualCost: decimal,
  forecastedRenewalCost: decimal,
  approvedAmount: decimal,
  purchaseOrderAmount: decimal,
  finalPurchaseAmount: decimal,
  renewalExpirationDate: optionalDate,
  cancellationNoticeDeadline: optionalDate,
  nextAction: optionalString,
  nextActionOwner: optionalString,
  nextActionDueDate: optionalDate,
  notesText: optionalString,
});

export async function updateMaintenanceRenewalCase(input: unknown) {
  const data = parse(caseUpdateSchema, input);
  const prisma = getPrisma();
  const updated = await prisma.maintenanceRenewal.update({
    where: { id: data.id },
    data: {
      overallStatus: data.overallStatus,
      workflowStage: data.workflowStage,
      riskStatus: data.riskStatus,
      fundingStatus: data.fundingStatus,
      quoteStatus: data.quoteStatus,
      renewalOwner: data.renewalOwner,
      decisionOwner: data.decisionOwner,
      currentAnnualCost: toDecimalInput(data.currentAnnualCost),
      forecastedRenewalCost: toDecimalInput(data.forecastedRenewalCost),
      approvedAmount: toDecimalInput(data.approvedAmount),
      purchaseOrderAmount: toDecimalInput(data.purchaseOrderAmount),
      finalPurchaseAmount: toDecimalInput(data.finalPurchaseAmount),
      negotiatedCost: toDecimalInput(
        data.finalPurchaseAmount || data.approvedAmount
      ),
      renewalExpirationDate: data.renewalExpirationDate,
      renewalDate: data.renewalExpirationDate,
      cancellationNoticeDeadline: data.cancellationNoticeDeadline,
      noticeDate: data.cancellationNoticeDeadline,
      nextAction: data.nextAction,
      nextActionOwner: data.nextActionOwner,
      nextActionDueDate: data.nextActionDueDate,
      notesText: data.notesText,
    },
  });
  return updated.id;
}

const tableFieldUpdateSchema = z.object({
  id: idSchema,
  field: z.enum([
    "productId",
    "vendorCompanyId",
    "sellerCompanyId",
    "recommendedDisposition",
  ]),
  value: z.string().trim(),
});

export async function updateMaintenanceRenewalTableField(input: unknown) {
  const data = parse(tableFieldUpdateSchema, input);
  const prisma = getPrisma();
  const renewal = await prisma.maintenanceRenewal.findUnique({
    where: { id: data.id },
  });

  if (!renewal) {
    throw new FieldValidationError("Renewal was not found.", {
      id: ["Select an existing renewal."],
    });
  }

  if (data.field === "productId") {
    const product = await findProductOrThrow(prisma, data.value);
    await prisma.maintenanceRenewal.update({
      where: { id: data.id },
      data: {
        productId: product.id,
        productOrService: product.name,
        vendorCompanyId: product.vendorCompanyId,
      },
    });
    return data.id;
  }

  if (data.field === "vendorCompanyId") {
    const companyId = data.value === "none" ? undefined : data.value;
    if (companyId) {
      await assertCompanyRole(prisma, companyId, "VENDOR", "vendorCompanyId");
    }
    const currentProduct = renewal.productId
      ? await prisma.product.findUnique({ where: { id: renewal.productId } })
      : null;
    const productStillMatches =
      !companyId || currentProduct?.vendorCompanyId === companyId;

    await prisma.maintenanceRenewal.update({
      where: { id: data.id },
      data: {
        vendorCompanyId: companyId ?? null,
        productId: productStillMatches ? undefined : null,
        productOrService: productStillMatches ? undefined : "",
      },
    });
    return data.id;
  }

  if (data.field === "sellerCompanyId") {
    const companyId = data.value === "none" ? undefined : data.value;
    if (companyId) {
      await assertCompanyRole(prisma, companyId, "RESELLER", "sellerCompanyId");
    }
    await prisma.maintenanceRenewal.update({
      where: { id: data.id },
      data: { sellerCompanyId: companyId ?? null },
    });
    return data.id;
  }

  if (data.field === "recommendedDisposition") {
    const disposition = parse(z.enum(renewalDispositions), data.value);
    await prisma.$transaction(async (tx) => {
      await tx.maintenanceRenewal.update({
        where: { id: data.id },
        data: {
          recommendedDisposition: disposition,
          recommendationDate: new Date(),
          decisionStatus:
            renewal.decisionStatus === "NOT_STARTED"
              ? "RECOMMENDATION_SUBMITTED"
              : undefined,
        },
      });
      await createDecisionHistory(tx as PrismaClientLike, {
        renewalId: data.id,
        recommendedDisposition: disposition,
        approvedDisposition: renewal.approvedDisposition as
          RenewalDisposition | undefined,
        decisionStatus:
          renewal.decisionStatus === "NOT_STARTED"
            ? "RECOMMENDATION_SUBMITTED"
            : (renewal.decisionStatus as
                (typeof renewalDecisionStatuses)[number] | undefined) ||
              "UNDER_REVIEW",
        rationale: "Updated from the renewal table.",
      });
    });
    return data.id;
  }
}

const recommendationSchema = z.object({
  id: idSchema,
  recommendedDisposition: z.enum(renewalDispositions),
  recommendationSubmittedBy: optionalString,
  recommendationRationale: requiredString,
  decisionDueDate: optionalDate,
  replacementRequired: z.boolean().default(false),
  replacementProductId: optionalId,
  replacementProject: optionalString,
  targetReplacementDate: optionalDate,
  decommissioningRequired: z.boolean().default(false),
  targetDecommissionDate: optionalDate,
  temporaryExtensionTerm: optionalString,
  temporaryExtensionReason: optionalString,
  nextReviewDate: optionalDate,
});

export async function submitDispositionRecommendation(input: unknown) {
  const data = parse(recommendationSchema, input);
  const missing = validateDispositionRequirements({
    disposition: data.recommendedDisposition,
    replacementRequired: data.replacementRequired,
    replacementProductId: data.replacementProductId,
    replacementProject: data.replacementProject,
    targetReplacementDate: dateOnly(data.targetReplacementDate),
    decommissioningRequired: data.decommissioningRequired,
    targetDecommissionDate: dateOnly(data.targetDecommissionDate),
    temporaryExtensionTerm: data.temporaryExtensionTerm,
    nextReviewDate: dateOnly(data.nextReviewDate),
    decisionDueDate: dateOnly(data.decisionDueDate),
  });
  if (missing.length) {
    throw new FieldValidationError("Disposition requirements are incomplete.", {
      recommendedDisposition: missing,
    });
  }

  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    await tx.maintenanceRenewal.update({
      where: { id: data.id },
      data: {
        recommendedDisposition: data.recommendedDisposition,
        decisionStatus: "RECOMMENDATION_SUBMITTED",
        recommendationSubmittedBy: data.recommendationSubmittedBy,
        recommendationRationale: data.recommendationRationale,
        recommendationDate: new Date(),
        decisionDueDate: data.decisionDueDate,
        replacementRequired: data.replacementRequired,
        replacementProductId: data.replacementProductId,
        replacementProject: data.replacementProject,
        targetReplacementDate: data.targetReplacementDate,
        decommissioningRequired: data.decommissioningRequired,
        targetDecommissionDate: data.targetDecommissionDate,
        temporaryExtensionTerm: data.temporaryExtensionTerm,
        temporaryExtensionReason: data.temporaryExtensionReason,
        nextReviewDate: data.nextReviewDate,
      },
    });
    await createDispositionWork(
      tx as PrismaClientLike,
      data.id,
      data.recommendedDisposition
    );
    await createDecisionHistory(tx as PrismaClientLike, {
      renewalId: data.id,
      recommendedDisposition: data.recommendedDisposition,
      decisionStatus: "RECOMMENDATION_SUBMITTED",
      changedBy: data.recommendationSubmittedBy,
      rationale: data.recommendationRationale,
    });
  });

  return data.id;
}

const approvalSchema = z.object({
  id: idSchema,
  approvedDisposition: z.enum(renewalDispositions).optional(),
  decisionStatus: z.enum(renewalDecisionStatuses),
  approvedBy: optionalString,
  approvalRationale: optionalString,
  conditionsOfApproval: optionalString,
});

export async function decideDisposition(input: unknown) {
  const data = parse(approvalSchema, input);
  const prisma = getPrisma();
  const renewal = await prisma.maintenanceRenewal.findUnique({
    where: { id: data.id },
  });
  if (!renewal) {
    throw new FieldValidationError("Renewal was not found.", {
      id: ["Select an existing renewal."],
    });
  }

  if (
    requiresDecisionReason({
      decisionStatus: data.decisionStatus,
      recommendedDisposition: renewal.recommendedDisposition as
        RenewalDisposition | undefined,
      approvedDisposition: data.approvedDisposition,
    }) &&
    !data.approvalRationale
  ) {
    throw new FieldValidationError("Decision rationale is required.", {
      approvalRationale: [
        "Add a reason for rejection, deferral, or an approval that differs from the recommendation.",
      ],
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.maintenanceRenewal.update({
      where: { id: data.id },
      data: {
        approvedDisposition: data.approvedDisposition,
        decisionStatus: data.decisionStatus,
        approvedBy: data.approvedBy,
        approvalRationale: data.approvalRationale,
        conditionsOfApproval: data.conditionsOfApproval,
        approvalDate:
          data.decisionStatus === "APPROVED" ? new Date() : undefined,
        overallStatus:
          data.decisionStatus === "APPROVED" &&
          data.approvedDisposition === "DO_NOT_RENEW"
            ? "NOT_RENEWING"
            : undefined,
        decommissioningRequired:
          data.approvedDisposition === "DECOMMISSION" ? true : undefined,
      },
    });
    await createDecisionHistory(tx as PrismaClientLike, {
      renewalId: data.id,
      recommendedDisposition:
        renewal.recommendedDisposition as RenewalDisposition,
      approvedDisposition: data.approvedDisposition,
      decisionStatus: data.decisionStatus,
      changedBy: data.approvedBy,
      rationale: data.approvalRationale,
      conditionsOfApproval: data.conditionsOfApproval,
    });
    if (data.approvedDisposition) {
      await createDispositionWork(
        tx as PrismaClientLike,
        data.id,
        data.approvedDisposition
      );
    }
    if (data.approvedDisposition === "DECOMMISSION") {
      await tx.maintenanceRenewalDecommissionPlan.upsert({
        where: { maintenanceRenewalId: data.id },
        create: { maintenanceRenewalId: data.id },
        update: {},
      });
    }
  });

  return data.id;
}

const quoteSchema = z.object({
  maintenanceRenewalId: idSchema,
  quoteNumber: optionalString,
  versionLabel: optionalString,
  status: z.enum(renewalQuoteStatuses).default("RECEIVED"),
  amount: decimal,
  receivedOn: optionalDate,
  expiresOn: optionalDate,
  selectedFinal: z.boolean().default(false),
  source: optionalString,
  notesText: optionalString,
});

export async function addRenewalQuote(input: unknown) {
  const data = parse(quoteSchema, input);
  assertDateOrder(data.receivedOn, data.expiresOn, "expiresOn");
  const prisma = getPrisma();

  const quote = await prisma.$transaction(async (tx) => {
    if (data.selectedFinal) {
      await tx.maintenanceRenewalQuote.updateMany({
        where: { maintenanceRenewalId: data.maintenanceRenewalId },
        data: { selectedFinal: false },
      });
    }
    const created = await tx.maintenanceRenewalQuote.create({
      data: {
        ...data,
        amount: toDecimalInput(data.amount),
      },
    });
    await tx.maintenanceRenewal.update({
      where: { id: data.maintenanceRenewalId },
      data: {
        quoteStatus: data.selectedFinal ? "FINAL_SELECTED" : data.status,
        quoteReceivedDate: data.receivedOn,
        forecastedRenewalCost: toDecimalInput(data.amount),
        renewalQuote: toDecimalInput(data.amount),
        finalPurchaseAmount: data.selectedFinal
          ? toDecimalInput(data.amount)
          : undefined,
      },
    });
    return created;
  });

  return quote.id;
}

const taskSchema = z.object({
  maintenanceRenewalId: idSchema,
  title: requiredString,
  description: optionalString,
  owner: optionalString,
  stage: z.enum(renewalWorkflowStages).optional(),
  status: z.enum(renewalTaskStatuses).default("OPEN"),
  dueOn: optionalDate,
});

export async function addRenewalTask(input: unknown) {
  const data = parse(taskSchema, input);
  const prisma = getPrisma();
  const task = await prisma.maintenanceRenewalTask.create({ data });
  return task.id;
}

const stageSchema = z.object({
  maintenanceRenewalId: idSchema,
  stage: z.enum(renewalWorkflowStages),
  owner: optionalString,
  dueOn: optionalDate,
  notesText: optionalString,
});

export async function advanceRenewalStage(input: unknown) {
  const data = parse(stageSchema, input);
  const prisma = getPrisma();
  await prisma.$transaction(async (tx) => {
    await tx.maintenanceRenewal.update({
      where: { id: data.maintenanceRenewalId },
      data: { workflowStage: data.stage },
    });
    await tx.maintenanceRenewalWorkflowStep.upsert({
      where: {
        maintenanceRenewalId_stage: {
          maintenanceRenewalId: data.maintenanceRenewalId,
          stage: data.stage,
        },
      },
      create: {
        maintenanceRenewalId: data.maintenanceRenewalId,
        stage: data.stage,
        status: "IN_PROGRESS",
        owner: data.owner,
        startedAt: new Date(),
        dueOn: data.dueOn,
        notesText: data.notesText,
      },
      update: {
        status: "IN_PROGRESS",
        owner: data.owner,
        startedAt: new Date(),
        dueOn: data.dueOn,
        notesText: data.notesText,
      },
    });
  });
  return data.maintenanceRenewalId;
}

const fundingAllocationSchema = z.object({
  maintenanceRenewalId: idSchema,
  department: requiredString,
  costCenter: optionalString,
  fundingSource: optionalString,
  amount: decimal,
  approved: z.boolean().default(false),
  notesText: optionalString,
});

export async function addRenewalFundingAllocation(input: unknown) {
  const data = parse(fundingAllocationSchema, input);
  const prisma = getPrisma();
  const allocation = await prisma.maintenanceRenewalFundingAllocation.create({
    data: { ...data, amount: toDecimalInput(data.amount) },
  });
  return allocation.id;
}

const replacementPlanSchema = z.object({
  maintenanceRenewalId: idSchema,
  replacementProductId: optionalId,
  replacementProject: optionalString,
  replacementOwner: optionalString,
  migrationOwner: optionalString,
  targetReplacementDate: optionalDate,
  transitionPlan: optionalString,
  transitionRisk: optionalString,
  contractOverlapRequired: z.boolean().default(false),
  overlapCost: decimal,
  dataMigrationRequired: z.boolean().default(false),
  integrationMigrationRequired: z.boolean().default(false),
  notesText: optionalString,
});

export async function saveReplacementPlan(input: unknown) {
  const data = parse(replacementPlanSchema, input);
  if (!data.replacementProductId && !data.replacementProject) {
    throw new FieldValidationError("Replacement target is required.", {
      replacementProject: [
        "Select a replacement product or enter a replacement project.",
      ],
    });
  }

  const prisma = getPrisma();
  const plan = await prisma.maintenanceRenewalReplacementPlan.upsert({
    where: { maintenanceRenewalId: data.maintenanceRenewalId },
    create: { ...data, overlapCost: toDecimalInput(data.overlapCost) },
    update: { ...data, overlapCost: toDecimalInput(data.overlapCost) },
  });
  await prisma.maintenanceRenewal.update({
    where: { id: data.maintenanceRenewalId },
    data: {
      replacementRequired: true,
      replacementProductId: data.replacementProductId,
      replacementProject: data.replacementProject,
      targetReplacementDate: data.targetReplacementDate,
    },
  });
  return plan.id;
}

const decommissionPlanSchema = z.object({
  maintenanceRenewalId: idSchema,
  decommissionOwner: optionalString,
  businessOwner: optionalString,
  technicalOwner: optionalString,
  targetDecommissionDate: optionalDate,
  notesText: optionalString,
});

const defaultDecommissionTasks = [
  "Confirm business owner signoff",
  "Export or retain required data",
  "Remove user and privileged access",
  "Remove vendor access",
  "Remove integrations, agents, API keys, and service accounts",
  "Reclaim licenses and complete final security signoff",
];

export async function saveDecommissionPlan(input: unknown) {
  const data = parse(decommissionPlanSchema, input);
  const prisma = getPrisma();
  const plan = await prisma.$transaction(async (tx) => {
    const saved = await tx.maintenanceRenewalDecommissionPlan.upsert({
      where: { maintenanceRenewalId: data.maintenanceRenewalId },
      create: data,
      update: data,
    });
    const existingTaskCount = await tx.maintenanceRenewalDecommissionTask.count(
      {
        where: { decommissionPlanId: saved.id },
      }
    );
    if (!existingTaskCount) {
      await tx.maintenanceRenewalDecommissionTask.createMany({
        data: defaultDecommissionTasks.map((title) => ({
          decommissionPlanId: saved.id,
          title,
        })),
      });
    }
    await tx.maintenanceRenewal.update({
      where: { id: data.maintenanceRenewalId },
      data: {
        decommissioningRequired: true,
        targetDecommissionDate: data.targetDecommissionDate,
      },
    });
    return saved;
  });
  return plan.id;
}

const commentSchema = z.object({
  maintenanceRenewalId: idSchema,
  body: requiredString,
});

export async function addRenewalComment(input: unknown) {
  const data = parse(commentSchema, input);
  const prisma = getPrisma();
  const note = await prisma.note.create({
    data: {
      maintenanceRenewalId: data.maintenanceRenewalId,
      body: data.body,
    },
  });
  await prisma.activityLog.create({
    data: {
      action: "UPDATE",
      entityType: "MaintenanceRenewal",
      entityId: data.maintenanceRenewalId,
      fieldName: "comment",
      newValue: data.body,
    },
  });
  return note.id;
}

const nextCycleSchema = z.object({
  sourceRenewalId: idSchema,
  fiscalYearId: idSchema,
  budgetPlanId: idSchema,
  renewalDate: optionalDate,
  renewalExpirationDate: optionalDate,
});

export async function createNextRenewalCycle(input: unknown) {
  const data = parse(nextCycleSchema, input);
  const prisma = getPrisma();
  const prior = await prisma.maintenanceRenewal.findUnique({
    where: { id: data.sourceRenewalId },
    include: { productModules: true, productFeatures: true },
  });
  if (!prior) {
    throw new FieldValidationError("Prior renewal was not found.", {
      sourceRenewalId: ["Select an existing renewal cycle."],
    });
  }
  if (!data.renewalDate && !data.renewalExpirationDate) {
    throw new FieldValidationError("Next renewal date is required.", {
      renewalDate: ["Add the next renewal date."],
    });
  }

  const renewal = await prisma.maintenanceRenewal.create({
    data: {
      renewalName: prior.renewalName,
      productOrService: prior.productOrService,
      productId: prior.productId,
      productModules: {
        connect: prior.productModules.map((item) => ({ id: item.id })),
      },
      productFeatures: {
        connect: prior.productFeatures.map((item) => ({ id: item.id })),
      },
      vendorCompanyId: prior.vendorCompanyId,
      sellerCompanyId: prior.sellerCompanyId,
      contractId: prior.contractId,
      fiscalYearId: data.fiscalYearId,
      budgetPlanId: data.budgetPlanId,
      fundingAccountId: prior.fundingAccountId,
      department: prior.department,
      costCenter: prior.costCenter,
      fundingSource: prior.fundingSource,
      currentAnnualCost: prior.finalPurchaseAmount,
      forecastedRenewalCost: prior.finalPurchaseAmount,
      approvedAmount: "0",
      renewalQuote: "0",
      negotiatedCost: "0",
      renewalDate: data.renewalDate ?? data.renewalExpirationDate!,
      renewalExpirationDate: data.renewalExpirationDate ?? data.renewalDate,
      currentContractStart: prior.renewalEffectiveDate,
      currentContractEnd: prior.renewalExpirationDate,
      renewalOwner: prior.renewalOwner,
      productOwner: prior.productOwner,
      businessOwner: prior.businessOwner,
      contractOwner: prior.contractOwner,
      capabilityOwner: prior.capabilityOwner,
      decisionOwner: prior.decisionOwner,
      recommendedDisposition: "DECISION_PENDING",
      decisionStatus: "NOT_STARTED",
      notesText: `Created from prior renewal cycle ${prior.renewalNumber ?? prior.id}.`,
    },
  });

  await createDecisionHistory(prisma, {
    renewalId: renewal.id,
    recommendedDisposition: "DECISION_PENDING",
    decisionStatus: "NOT_STARTED",
    rationale: "Next renewal cycle created from prior cycle reference data.",
  });

  return renewal.id;
}
