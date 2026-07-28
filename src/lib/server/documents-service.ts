import { z } from "zod";

import { FieldValidationError } from "@/lib/server/action-result";
import { getPrisma } from "@/lib/server/prisma";
import type { GlobalContextSelection } from "@/lib/server/global-context";

const documentInput = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  title: z.string().trim().min(1, "A document title is required.").max(160),
  type: z.enum([
    "CONTRACT",
    "ORDER_FORM",
    "QUOTE",
    "INVOICE",
    "RENEWAL_NOTICE",
    "PURCHASE_REQUEST",
    "SECURITY_REVIEW",
    "OTHER",
  ]),
  url: z.string().trim().url("Enter a valid document URL.").max(2000),
  description: z.string().trim().max(2000).optional(),
  entityType: z.enum(["contract", "maintenanceRenewal", "company", "product"]),
  entityId: z.string().uuid("Select a linked record."),
});

export type SaveDocumentInput = z.infer<typeof documentInput>;

const documentInclude = {
  uploadedBy: { select: { name: true } },
  contract: { select: { id: true, title: true } },
  maintenanceRenewal: { select: { id: true, renewalName: true } },
  company: { select: { id: true, name: true } },
  product: { select: { id: true, name: true } },
} as const;

export async function getDocumentsPageData(
  selection: GlobalContextSelection = {}
) {
  const prisma = getPrisma();
  const [documents, activityLogs, companies, contracts, renewals, products, fiscalYears] =
    await Promise.all([
      prisma.document.findMany({
        include: documentInclude,
        orderBy: { uploadedAt: "desc" },
      }),
      prisma.activityLog.findMany({
        include: { actor: { select: { name: true } } },
        orderBy: { occurredAt: "desc" },
        take: 200,
      }),
      prisma.company.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.contract.findMany({
        orderBy: { title: "asc" },
        select: { id: true, title: true, departmentId: true, startsOn: true, endsOn: true, renewalDate: true },
      }),
      prisma.maintenanceRenewal.findMany({
        orderBy: { renewalName: "asc" },
        select: { id: true, renewalName: true, departmentId: true, fiscalYearId: true },
      }),
      prisma.product.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.fiscalYear.findMany({
        where: { active: true },
        select: { id: true, startsOn: true, endsOn: true },
      }),
    ]);

  const fiscalYear = fiscalYears.find((year) => year.id === selection.fiscalYearId);
  const contractIds = new Set(
    contracts.filter((contract) => {
      const departmentMatches =
        !selection.departmentId || contract.departmentId === selection.departmentId;
      return departmentMatches && (!fiscalYear || contractInFiscalYear(contract, fiscalYear));
    }).map((contract) => contract.id)
  );
  const renewalIds = new Set(
    renewals.filter((renewal) =>
      (!selection.departmentId || renewal.departmentId === selection.departmentId) &&
      (!selection.fiscalYearId || renewal.fiscalYearId === selection.fiscalYearId)
    ).map((renewal) => renewal.id)
  );
  const scopedDocuments = documents.filter((document) =>
    (!document.contractId || contractIds.has(document.contractId)) &&
    (!document.maintenanceRenewalId || renewalIds.has(document.maintenanceRenewalId))
  );
  return { documents: scopedDocuments, activityLogs, companies, contracts, renewals, products };
}

function contractInFiscalYear(
  contract: { startsOn: Date; endsOn: Date; renewalDate: Date | null },
  fiscalYear: { startsOn: Date; endsOn: Date }
) {
  return (
    contract.startsOn <= fiscalYear.endsOn && contract.endsOn >= fiscalYear.startsOn
  ) || (
    contract.renewalDate != null &&
    contract.renewalDate >= fiscalYear.startsOn &&
    contract.renewalDate <= fiscalYear.endsOn
  );
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

export async function saveDocument(rawInput: SaveDocumentInput) {
  const parsed = documentInput.safeParse(rawInput);
  if (!parsed.success) validationError(parsed.error);
  if (!parsed.success) throw new Error("Invalid document input.");
  const input = parsed.data;
  const prisma = getPrisma();
  const relations = linkedRelation(input);
  const existing = input.id
    ? await prisma.document.findUnique({ where: { id: input.id } })
    : null;

  if (input.id && !existing) {
    throw new FieldValidationError("The document no longer exists.", {
      id: ["Refresh and try again."],
    });
  }

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
    select: { id: true, title: true },
  });
  if (!document)
    throw new FieldValidationError("The document no longer exists.", {
      id: ["Refresh and try again."],
    });

  await prisma.$transaction([
    prisma.document.delete({ where: { id } }),
    prisma.activityLog.create({
      data: {
        action: "DELETE",
        entityType: "Document",
        entityId: id,
        metadata: { title: document.title },
      },
    }),
  ]);
}
