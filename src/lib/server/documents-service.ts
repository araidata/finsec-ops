import { z } from "zod";
import { Prisma } from "@prisma/client";

import { FieldValidationError } from "@/lib/server/action-result";
import { requirePermission } from "@/lib/server/authorization";
import { getPrisma } from "@/lib/server/prisma";
import type { GlobalContextSelection } from "@/lib/server/global-context";

const maintenanceDocumentTypes = [
  "CONTRACT",
  "ORDER_FORM",
  "QUOTE",
  "INVOICE",
  "RENEWAL_NOTICE",
  "PURCHASE_REQUEST",
  "SECURITY_REVIEW",
  "OTHER",
] as const;

const documentInput = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(1, "A document title is required.").max(160),
  type: z.enum(maintenanceDocumentTypes),
  url: z.string().trim().url("Enter a valid document URL.").max(2000),
  description: z.string().trim().max(2000).optional(),
  entityType: z.enum(["contract", "maintenanceRenewal", "company", "product"]),
  entityId: z.string().uuid("Select a linked record."),
  departmentId: z.string().uuid().optional().or(z.literal("")),
  fiscalYearId: z.string().uuid().optional().or(z.literal("")),
});

export type SaveDocumentInput = z.infer<typeof documentInput>;

const defaultPageSize = 50;
const maximumPageSize = 100;

function isDocumentType(
  value: string | undefined
): value is (typeof maintenanceDocumentTypes)[number] {
  return maintenanceDocumentTypes.some((type) => type === value);
}

export type DocumentsPageInput = GlobalContextSelection & {
  search?: string;
  type?: string;
  entityType?:
    "all" | "contract" | "maintenanceRenewal" | "company" | "product";
  sort?: "uploadedDesc" | "uploadedAsc" | "titleAsc";
  page?: number;
  pageSize?: number;
  activeTab?: "documents" | "audit";
  activityPage?: number;
};

function positiveInteger(
  value: number | undefined,
  fallback: number,
  maximum?: number
) {
  if (!value || !Number.isFinite(value) || value < 1) return fallback;
  const normalized = Math.floor(value);
  return maximum ? Math.min(normalized, maximum) : normalized;
}

function linkedEntityWhere(
  entityType: DocumentsPageInput["entityType"]
): Prisma.DocumentWhereInput | undefined {
  if (entityType === "contract") return { contractId: { not: null } };
  if (entityType === "maintenanceRenewal")
    return { maintenanceRenewalId: { not: null } };
  if (entityType === "company") return { companyId: { not: null } };
  if (entityType === "product") return { productId: { not: null } };
  return undefined;
}

function documentOrderBy(
  sort: DocumentsPageInput["sort"]
): Prisma.DocumentOrderByWithRelationInput[] {
  if (sort === "uploadedAsc") return [{ uploadedAt: "asc" }, { id: "asc" }];
  if (sort === "titleAsc") return [{ title: "asc" }, { id: "asc" }];
  return [{ uploadedAt: "desc" }, { id: "asc" }];
}

export async function getDocumentsPageData(input: DocumentsPageInput = {}) {
  const prisma = getPrisma();
  const page = positiveInteger(input.page, 1);
  const pageSize = positiveInteger(
    input.pageSize,
    defaultPageSize,
    maximumPageSize
  );
  const fiscalYear = input.fiscalYearId
    ? await prisma.fiscalYear.findUnique({
        where: { id: input.fiscalYearId },
        select: { startsOn: true, endsOn: true },
      })
    : null;
  const search = input.search?.trim();
  const scope: Prisma.DocumentWhereInput[] = [];
  if (input.departmentId) {
    scope.push(
      {
        OR: [
          { contractId: null },
          { contract: { is: { departmentId: input.departmentId } } },
        ],
      },
      {
        OR: [
          { maintenanceRenewalId: null },
          { maintenanceRenewal: { is: { departmentId: input.departmentId } } },
        ],
      }
    );
  }
  if (input.fiscalYearId) {
    scope.push({
      OR: [
        { maintenanceRenewalId: null },
        { maintenanceRenewal: { is: { fiscalYearId: input.fiscalYearId } } },
      ],
    });
  }
  if (fiscalYear) {
    scope.push({
      OR: [
        { contractId: null },
        {
          contract: {
            is: {
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
            },
          },
        },
      ],
    });
  }
  const where: Prisma.DocumentWhereInput = {
    AND: [
      ...scope,
      ...(isDocumentType(input.type) ? [{ type: input.type }] : []),
      ...(linkedEntityWhere(input.entityType)
        ? [linkedEntityWhere(input.entityType)!]
        : []),
      ...(search
        ? [
            {
              OR: [
                { title: { contains: search, mode: "insensitive" as const } },
                {
                  description: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  contract: {
                    is: {
                      title: { contains: search, mode: "insensitive" as const },
                    },
                  },
                },
                {
                  maintenanceRenewal: {
                    is: {
                      renewalName: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                },
                {
                  company: {
                    is: {
                      name: { contains: search, mode: "insensitive" as const },
                    },
                  },
                },
                {
                  product: {
                    is: {
                      name: { contains: search, mode: "insensitive" as const },
                    },
                  },
                },
              ],
            },
          ]
        : []),
    ],
  };
  const [totalCount, documentRows, activity] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      select: {
        id: true,
        title: true,
        type: true,
        url: true,
        description: true,
        uploadedAt: true,
        uploadedBy: { select: { name: true } },
        contract: { select: { id: true, title: true } },
        maintenanceRenewal: { select: { id: true, renewalName: true } },
        company: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
      orderBy: documentOrderBy(input.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    input.activeTab === "audit"
      ? listDocumentActivity({ page: input.activityPage }, prisma)
      : Promise.resolve(null),
  ]);
  return {
    documents: documentRows,
    activityLogs: activity?.activityLogs ?? [],
    activityPagination: activity?.pagination ?? null,
    companies: [],
    contracts: [],
    renewals: [],
    products: [],
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    },
    query: {
      search: search ?? "",
      type: isDocumentType(input.type) ? input.type : "",
      entityType: input.entityType ?? "all",
      sort: input.sort ?? "uploadedDesc",
      activeTab: input.activeTab ?? "documents",
    },
    selection: {
      departmentId: input.departmentId ?? null,
      fiscalYearId: input.fiscalYearId ?? null,
    },
  };
}

export async function listDocumentActivity(
  input: { page?: number; pageSize?: number } = {},
  prisma = getPrisma()
) {
  const page = positiveInteger(input.page, 1);
  const pageSize = positiveInteger(
    input.pageSize,
    defaultPageSize,
    maximumPageSize
  );
  const [totalCount, activityLogs] = await Promise.all([
    prisma.activityLog.count(),
    prisma.activityLog.findMany({
      orderBy: [{ occurredAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        fieldName: true,
        previousValue: true,
        newValue: true,
        metadata: true,
        occurredAt: true,
        actor: { select: { name: true } },
      },
    }),
  ]);
  return {
    activityLogs,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    },
  };
}

export async function searchDocumentLinkTargets(input: {
  entityType: "contract" | "maintenanceRenewal" | "company" | "product";
  search?: string;
  departmentId?: string;
  fiscalYearId?: string;
}) {
  const prisma = getPrisma();
  const search = input.search?.trim();
  if (input.entityType === "contract") {
    const fiscalYear = input.fiscalYearId
      ? await prisma.fiscalYear.findUnique({
          where: { id: input.fiscalYearId },
          select: { startsOn: true, endsOn: true },
        })
      : null;
    return prisma.contract.findMany({
      where: {
        ...(input.departmentId ? { departmentId: input.departmentId } : {}),
        ...(search
          ? { title: { contains: search, mode: "insensitive" as const } }
          : {}),
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
          : {}),
      },
      orderBy: { title: "asc" },
      take: 50,
      select: { id: true, title: true },
    });
  }
  if (input.entityType === "maintenanceRenewal") {
    return prisma.maintenanceRenewal.findMany({
      where: {
        ...(input.departmentId ? { departmentId: input.departmentId } : {}),
        ...(input.fiscalYearId ? { fiscalYearId: input.fiscalYearId } : {}),
        ...(search
          ? { renewalName: { contains: search, mode: "insensitive" as const } }
          : {}),
      },
      orderBy: { renewalName: "asc" },
      take: 50,
      select: { id: true, renewalName: true },
    });
  }
  if (input.entityType === "company") {
    return prisma.company.findMany({
      where: {
        active: true,
        ...(search
          ? { name: { contains: search, mode: "insensitive" as const } }
          : {}),
      },
      orderBy: { name: "asc" },
      take: 50,
      select: { id: true, name: true },
    });
  }
  return prisma.product.findMany({
    where: {
      active: true,
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
    },
    orderBy: { name: "asc" },
    take: 50,
    select: { id: true, name: true },
  });
}

function linkedRelation(input: SaveDocumentInput) {
  return {
    contractId: input.entityType === "contract" ? input.entityId : null,
    maintenanceRenewalId:
      input.entityType === "maintenanceRenewal" ? input.entityId : null,
    companyId: input.entityType === "company" ? input.entityId : null,
    productId: input.entityType === "product" ? input.entityId : null,
  };
}

function validationError(error: z.ZodError) {
  throw new FieldValidationError(
    "Review the document details.",
    error.flatten().fieldErrors
  );
}

async function assertDocumentLinkTarget(
  prisma: ReturnType<typeof getPrisma>,
  input: SaveDocumentInput
) {
  let target: { id: string; departmentId?: string | null } | null = null;
  if (input.entityType === "contract") {
    const fiscalYear = input.fiscalYearId
      ? await prisma.fiscalYear.findUnique({
          where: { id: input.fiscalYearId },
          select: { startsOn: true, endsOn: true },
        })
      : null;
    target = await prisma.contract.findFirst({
      where: {
        id: input.entityId,
        ...(input.departmentId ? { departmentId: input.departmentId } : {}),
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
          : {}),
      },
      select: { id: true, departmentId: true },
    });
  } else if (input.entityType === "maintenanceRenewal") {
    target = await prisma.maintenanceRenewal.findFirst({
      where: {
        id: input.entityId,
        ...(input.departmentId ? { departmentId: input.departmentId } : {}),
        ...(input.fiscalYearId ? { fiscalYearId: input.fiscalYearId } : {}),
      },
      select: { id: true, departmentId: true },
    });
  } else if (input.entityType === "company") {
    target = await prisma.company.findFirst({
      where: { id: input.entityId, active: true },
      select: { id: true },
    });
  } else {
    target = await prisma.product.findFirst({
      where: { id: input.entityId, active: true },
      select: { id: true },
    });
  }
  if (!target) {
    throw new FieldValidationError("The linked record is not available.", {
      entityId: ["Choose a record available in the current context."],
    });
  }
  return target.departmentId ?? null;
}

export async function saveDocument(rawInput: SaveDocumentInput) {
  const parsed = documentInput.safeParse(rawInput);
  if (!parsed.success) validationError(parsed.error);
  if (!parsed.success) throw new Error("Invalid document input.");
  const input = parsed.data;
  const prisma = getPrisma();
  const targetDepartmentId = await assertDocumentLinkTarget(prisma, input);
  const relations = linkedRelation(input);
  const existing = input.id
    ? await prisma.document.findUnique({
        where: { id: input.id },
        include: {
          contract: { select: { departmentId: true } },
          maintenanceRenewal: { select: { departmentId: true } },
        },
      })
    : null;

  if (input.id && !existing) {
    throw new FieldValidationError("The document no longer exists.", {
      id: ["Refresh and try again."],
    });
  }
  const existingDepartmentId =
    existing?.contract?.departmentId ??
    existing?.maintenanceRenewal?.departmentId ??
    null;
  let actorId: string | null = null;
  if (existing && existingDepartmentId !== targetDepartmentId) {
    ({ actorId } = await requirePermission({
      permission: "documents.write",
      departmentId: existingDepartmentId,
    }));
  }
  ({ actorId } = await requirePermission({
    permission: "documents.write",
    departmentId: targetDepartmentId,
  }));

  const document = await prisma.$transaction(async (tx) => {
    const saved = existing
      ? await tx.document.update({
          where: { id: input.id },
          data: {
            title: input.title,
            type: input.type,
            url: input.url,
            description: input.description || null,
            ...relations,
          },
        })
      : await tx.document.create({
          data: {
            title: input.title,
            type: input.type,
            url: input.url,
            description: input.description || null,
            ...relations,
          },
        });

    await tx.activityLog.create({
      data: {
        action: existing ? "UPDATE" : "CREATE",
        actorId,
        entityType: "Document",
        entityId: saved.id,
        metadata: {
          title: saved.title,
          type: saved.type,
          linkedEntity: input.entityType,
        },
      },
    });
    return saved;
  });

  return document.id;
}

export async function deleteDocument(id: string) {
  if (!z.string().uuid().safeParse(id).success) {
    throw new FieldValidationError("The document could not be removed.", {
      id: ["Invalid document."],
    });
  }
  const prisma = getPrisma();
  const document = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      contract: { select: { departmentId: true } },
      maintenanceRenewal: { select: { departmentId: true } },
    },
  });
  if (!document)
    throw new FieldValidationError("The document no longer exists.", {
      id: ["Refresh and try again."],
    });
  const { actorId } = await requirePermission({
    permission: "documents.write",
    departmentId:
      document.contract?.departmentId ??
      document.maintenanceRenewal?.departmentId ??
      null,
  });

  await prisma.$transaction([
    prisma.document.delete({ where: { id } }),
    prisma.activityLog.create({
      data: {
        action: "DELETE",
        actorId,
        entityType: "Document",
        entityId: id,
        metadata: { title: document.title },
      },
    }),
  ]);
}
