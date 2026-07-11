import { z } from "zod";

import {
  FieldValidationError,
  type FieldErrors,
} from "@/lib/server/action-result";
import { getPrisma } from "@/lib/server/prisma";
import {
  defaultTaskTitlesForDisposition,
  dispositionDefinitions,
  renewalDecisionStatuses,
  renewalDispositions,
  renewalFundingStatuses,
  renewalOverallStatuses,
  renewalQuoteStatuses,
  renewalRiskStatuses,
  renewalTaskStatuses,
  renewalWorkflowStages,
  requiresDecisionReason,
  validateDispositionRequirements,
  type RenewalDisposition,
} from "@/lib/maintenance-renewal-rules";

type PrismaClientLike = ReturnType<typeof getPrisma>;

export const maintenanceRenewalOptionSets = {
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

async function createDispositionWork(
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

export async function getMaintenanceRenewalPageData() {
  const prisma = getPrisma();

  const [
    companies,
    products,
    modules,
    features,
    capabilities,
    fiscalYears,
    budgetPlans,
    budgetAccounts,
    budgetAnnualFinancials,
    budgetLineItems,
    contracts,
    purchasingVehicles,
    purchasingAgreements,
    purchases,
    purchaseRequests,
    renewals,
  ] = await Promise.all([
    prisma.company.findMany({
      orderBy: { name: "asc" },
      include: { roles: true },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: {
        vendorCompany: true,
        capabilities: { include: { capability: true } },
      },
    }),
    prisma.productModule.findMany({ orderBy: { name: "asc" } }),
    prisma.productFeature.findMany({ orderBy: { name: "asc" } }),
    prisma.capability.findMany({ orderBy: { name: "asc" } }),
    prisma.fiscalYear.findMany({ orderBy: { startsOn: "desc" } }),
    prisma.budgetPlan.findMany({
      orderBy: [{ fiscalYear: { startsOn: "desc" } }, { version: "asc" }],
      include: { fiscalYear: true },
    }),
    prisma.budgetAccount.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    }),
    prisma.budgetAnnualFinancial.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        budgetPlan: true,
        scenario: true,
        fiscalYear: true,
        account: true,
        budgetItem: true,
      },
    }),
    prisma.budgetLineItem.findMany({
      orderBy: { createdAt: "desc" },
      include: { fiscalYear: true, budgetCategory: true },
    }),
    prisma.contract.findMany({
      orderBy: { title: "asc" },
      include: { vendorCompany: true, sellerCompany: true, products: true },
    }),
    prisma.purchasingVehicle.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.purchasingVehicleSeller.findMany({
      where: { active: true },
      orderBy: [{ endsOn: "asc" }, { createdAt: "desc" }],
      include: {
        purchasingVehicle: true,
        seller: true,
        productEligibility: true,
      },
    }),
    prisma.purchase.findMany({
      orderBy: { createdAt: "desc" },
      include: { sellerCompany: true, items: { include: { product: true } } },
    }),
    prisma.purchaseRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { vendorCompany: true, sellerCompany: true },
    }),
    prisma.maintenanceRenewal.findMany({
      orderBy: [{ renewalDate: "asc" }, { createdAt: "desc" }],
      include: {
        fiscalYear: true,
        budgetPlan: true,
        fundingAccount: true,
        linkedAnnualFinancial: {
          include: { account: true, budgetItem: true, scenario: true },
        },
        budgetItem: true,
        budgetLineItem: true,
        vendorCompany: true,
        sellerCompany: true,
        contract: true,
        purchasingVehicle: true,
        purchasingAgreement: {
          include: { purchasingVehicle: true, seller: true },
        },
        product: { include: { vendorCompany: true } },
        productModules: true,
        productFeatures: true,
        replacementProduct: true,
        purchaseItem: { include: { purchase: true, product: true } },
        deployment: {
          include: { usageMeasurements: { orderBy: { measuredAt: "desc" } } },
        },
        securityCapability: true,
        quotes: { orderBy: [{ selectedFinal: "desc" }, { createdAt: "desc" }] },
        workflowStages: { orderBy: { createdAt: "asc" } },
        tasks: { orderBy: [{ dueOn: "asc" }, { createdAt: "desc" }] },
        fundingAllocations: { orderBy: { createdAt: "desc" } },
        decisionHistory: { orderBy: { changedAt: "desc" } },
        replacementPlan: { include: { replacementProduct: true } },
        decommissioningPlan: {
          include: { tasks: { orderBy: { createdAt: "asc" } } },
        },
        purchaseRequests: true,
        purchases: true,
        invoices: true,
        payments: true,
        notes: { orderBy: { createdAt: "desc" } },
      },
    }),
  ]);

  return {
    companies,
    products,
    modules,
    features,
    capabilities,
    fiscalYears,
    budgetPlans,
    budgetAccounts,
    budgetAnnualFinancials,
    budgetLineItems,
    contracts,
    purchasingVehicles,
    purchasingAgreements,
    purchases,
    purchaseRequests,
    renewals,
    optionSets: maintenanceRenewalOptionSets,
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
