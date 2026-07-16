import { z } from "zod";

import {
  FieldValidationError,
  type FieldErrors,
} from "@/lib/server/action-result";
import {
  budgetWorksheetForAccount,
  worksheetDetailsForContract,
} from "@/lib/server/budget-service";
import { getPrisma } from "@/lib/server/prisma";
import {
  maintenanceRenewalOptionSets,
  createDispositionWork,
} from "@/lib/server/maintenance-renewal-service";

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

export async function getContractPageData() {
  const prisma = getPrisma();
  const [
    contracts,
    companies,
    products,
    modules,
    fiscalYears,
    budgetPlans,
    budgetAccounts,
    annualFinancials,
    paymentFrequencyOptions,
    licenseMetricOptions,
  ] = await Promise.all([
    prisma.contract.findMany({
      orderBy: [{ endsOn: "asc" }, { title: "asc" }],
      include: {
        vendorCompany: true,
        sellerCompany: true,
        owner: true,
        previousContract: true,
        nextContracts: true,
        lineItems: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: { product: true, productModule: true },
        },
        maintenanceRenewals: {
          orderBy: [{ renewalDate: "desc" }, { createdAt: "desc" }],
          include: { lineItems: true },
        },
        documents: true,
      },
    }),
    prisma.company.findMany({
      orderBy: { name: "asc" },
      include: { roles: { orderBy: { role: "asc" } } },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: { vendorCompany: true },
    }),
    prisma.productModule.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: { product: true },
    }),
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
    prisma.paymentFrequencyOption.findMany({
      where: { active: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.licenseMetricOption.findMany({
      where: { active: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return {
    contracts,
    companies,
    products,
    modules,
    fiscalYears,
    budgetPlans,
    budgetAccounts,
    annualFinancials,
    optionSets: {
      ...contractOptionSets,
      paymentFrequencies: paymentFrequencyOptions.length
        ? paymentFrequencyOptions.map((option) => option.key)
        : contractOptionSets.paymentFrequencies,
      licenseMetrics: licenseMetricOptions.length
        ? licenseMetricOptions.map((option) => option.key)
        : contractOptionSets.licenseMetrics,
    },
  };
}

const contractSchema = z.object({
  id: optionalId,
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

  const payload = {
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
  lines: z.array(lineSchema.omit({ contractId: true })),
});

type ContractLineFormData = Omit<z.infer<typeof lineSchema>, "contractId"> & {
  contractId?: string;
};

function contractPayload(data: z.infer<typeof contractSchema>) {
  return {
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

  if (!existing || existing.vendorCompanyId !== data.vendorCompanyId) {
    await assertCompanyRole(
      prisma,
      data.vendorCompanyId,
      "VENDOR",
      "vendorCompanyId"
    );
  }
  if (
    data.sellerCompanyId &&
    existing?.sellerCompanyId !== data.sellerCompanyId
  ) {
    await assertCompanyRole(
      prisma,
      data.sellerCompanyId,
      "RESELLER",
      "sellerCompanyId"
    );
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
    await assertProductScope(prisma, {
      productId: line.productId,
      productModuleId: line.productModuleId,
      vendorCompanyId: data.vendorCompanyId,
    });
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
  const prisma = getPrisma();
  if (!data.id && data.lines.length === 0) {
    throw new FieldValidationError("Add at least one product row.", {
      lines: ["Add at least one product row."],
      line_0_description: ["Product row description is required."],
    });
  }
  const existing = data.id
    ? await prisma.contract.findUnique({
        where: { id: data.id },
        select: {
          id: true,
          vendorCompanyId: true,
          sellerCompanyId: true,
          lineItems: { select: { id: true } },
        },
      })
    : null;
  if (data.id && !existing) {
    throw new FieldValidationError("Contract was not found.", {
      id: ["Select an existing contract."],
    });
  }
  await validateContractInput(prisma, data, existing);

  if (data.id && data.lines.length === 0) {
    const updated = await prisma.contract.update({
      where: { id: data.id },
      data: {
        ...contractPayload(data),
        startsOn: data.startsOn!,
        endsOn: data.endsOn!,
      },
    });
    return updated.id;
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

  const savedId = await prisma.$transaction(async (tx) => {
    const contract = data.id
      ? await tx.contract.update({
          where: { id: data.id },
          data: {
            ...payload,
            annualValue: toDecimalInput(totals.annualValue),
            totalValue: toDecimalInput(totals.totalValue),
          },
        })
      : await tx.contract.create({
          data: {
            ...payload,
            annualValue: toDecimalInput(totals.annualValue),
            totalValue: toDecimalInput(totals.totalValue),
          },
        });

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

    for (const [index, line] of data.lines.entries()) {
      const nextPayload = linePayload(
        { ...line, sortOrder: index },
        contract.id,
        data.startsOn,
        data.endsOn
      );
      if (line.id) {
        await tx.contractLineItem.update({
          where: { id: line.id },
          data: nextPayload,
        });
      } else {
        await tx.contractLineItem.create({ data: nextPayload });
      }
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
      orderedIds: z.array(idSchema).min(1),
    }),
    input
  );
  const prisma = getPrisma();
  await prisma.$transaction(
    data.orderedIds.map((id, index) =>
      prisma.contractLineItem.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );
  await syncContractTotals(prisma, data.contractId);
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
