import { z } from "zod";

import { FieldValidationError } from "@/lib/server/action-result";
import { getPrisma } from "@/lib/server/prisma";
import { requirePermission } from "@/lib/server/authorization";

const fiscalYearStatuses = ["PLANNING", "OPEN", "CLOSED", "ARCHIVED"] as const;
const budgetWorksheets = [
  "SUMMARY",
  "OPERATING_EXPENSES",
  "SOFTWARE_SAAS",
  "MAINTENANCE_RENEWALS",
  "HARDWARE",
  "PROFESSIONAL_SERVICES",
  "TRAINING",
  "TRAVEL_CONFERENCES",
  "ORGANIZATIONAL_DUES",
  "PERSONNEL",
  "NEW_REQUESTS",
  "SAVINGS_REDUCTIONS",
  "SUBMISSION_EXPORT",
] as const;
const expenseTypes = [
  "HARDWARE",
  "SOFTWARE_SAAS",
  "SUBSCRIPTION",
  "MANAGED_SERVICE",
  "PROFESSIONAL_SERVICE",
  "CONSULTING",
  "TRAINING",
  "CERTIFICATION",
  "SUPPORT_MAINTENANCE",
  "CLOUD_INFRASTRUCTURE",
  "ONE_TIME_PURCHASE",
  "OTHER",
] as const;
const paymentFrequencies = [
  "MONTHLY",
  "QUARTERLY",
  "ANNUAL",
  "MULTI_YEAR",
  "ONE_TIME",
] as const;
const licenseMetrics = [
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
] as const;
const renewalPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const renewalDispositions = [
  "REVIEW_REQUIRED",
  "DECISION_PENDING",
  "RENEW_AS_IS",
  "RENEW_WITH_CHANGES",
  "RENEGOTIATE",
  "REPLACE",
  "CONSOLIDATE",
  "EXTEND_TEMPORARILY",
  "DECOMMISSION",
  "DO_NOT_RENEW",
] as const;

export const settingsOptionSets = {
  fiscalYearStatuses,
  budgetWorksheets,
  expenseTypes,
  paymentFrequencies,
  licenseMetrics,
  renewalPriorities,
  renewalDispositions,
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
const dateInput = z
  .string()
  .trim()
  .min(1, "Required")
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

function parse<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fieldErrors = Object.fromEntries(
      Object.entries(result.error.flatten().fieldErrors).filter(
        (entry): entry is [string, string[]] => Array.isArray(entry[1])
      )
    );
    throw new FieldValidationError(
      "Review the highlighted fields.",
      fieldErrors
    );
  }
  return result.data;
}

export type SettingsSection =
  | "organization"
  | "fiscal-years"
  | "departments"
  | "team-members"
  | "finance"
  | "contract-options"
  | "deployment-options"
  | "renewal-options";

export async function getSettingsPageData(
  input: {
    section?: SettingsSection;
    page?: number;
    pageSize?: number;
    accountPage?: number;
    categoryPage?: number;
  } = {}
) {
  const prisma = getPrisma();
  const section = input.section ?? "organization";
  const pageSize = Math.min(Math.max(Math.floor(input.pageSize ?? 50), 1), 100);
  const page = Math.max(Math.floor(input.page ?? 1), 1);
  const accountPage = Math.max(Math.floor(input.accountPage ?? 1), 1);
  const categoryPage = Math.max(Math.floor(input.categoryPage ?? 1), 1);
  const referenceLimit = 100;
  const [
    organization,
    fiscalYears,
    departments,
    teamMembers,
    budgetAccounts,
    budgetCategories,
    expenseTypeOptions,
    purchasingVehicles,
    paymentFrequencyOptions,
    licenseMetricOptions,
    deploymentEnvironments,
    renewalPriorityOptions,
    renewalDecisionReasons,
  ] = await Promise.all([
    section === "organization"
      ? prisma.organizationSettings.findFirst({
          orderBy: { createdAt: "asc" },
          include: { currentFiscalYear: true },
        })
      : Promise.resolve(null),
    ["organization", "fiscal-years", "finance"].includes(section)
      ? prisma.fiscalYear.findMany({
          orderBy: { startsOn: "desc" },
          take: referenceLimit,
        })
      : Promise.resolve([]),
    ["departments", "team-members", "finance"].includes(section)
      ? prisma.department.findMany({
          orderBy: [{ active: "desc" }, { name: "asc" }],
          take: referenceLimit,
        })
      : Promise.resolve([]),
    section === "team-members"
      ? prisma.teamMember.findMany({
          orderBy: [{ active: "desc" }, { fullName: "asc" }],
          include: { department: true },
          skip: (page - 1) * pageSize,
          take: pageSize,
        })
      : Promise.resolve([]),
    section === "finance"
      ? prisma.budgetAccount.findMany({
          orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { code: "asc" }],
          include: { department: true },
          skip: (accountPage - 1) * pageSize,
          take: pageSize,
        })
      : Promise.resolve([]),
    section === "finance"
      ? prisma.budgetCategory.findMany({
          orderBy: [
            { fiscalYear: { startsOn: "desc" } },
            { displayOrder: "asc" },
            { name: "asc" },
          ],
          include: { fiscalYear: true },
          skip: (categoryPage - 1) * pageSize,
          take: pageSize,
        })
      : Promise.resolve([]),
    section === "finance"
      ? prisma.expenseTypeOption.findMany({
          orderBy: [{ active: "desc" }, { displayOrder: "asc" }],
          take: referenceLimit,
        })
      : Promise.resolve([]),
    section === "contract-options"
      ? prisma.purchasingVehicle.findMany({
          orderBy: [{ active: "desc" }, { name: "asc" }],
          take: referenceLimit,
        })
      : Promise.resolve([]),
    section === "contract-options"
      ? prisma.paymentFrequencyOption.findMany({
          orderBy: [{ active: "desc" }, { displayOrder: "asc" }],
          take: referenceLimit,
        })
      : Promise.resolve([]),
    section === "contract-options"
      ? prisma.licenseMetricOption.findMany({
          orderBy: [{ active: "desc" }, { displayOrder: "asc" }],
          take: referenceLimit,
        })
      : Promise.resolve([]),
    section === "deployment-options"
      ? prisma.deploymentEnvironment.findMany({
          orderBy: [{ active: "desc" }, { displayOrder: "asc" }],
          take: referenceLimit,
        })
      : Promise.resolve([]),
    section === "renewal-options"
      ? prisma.renewalPriorityOption.findMany({
          orderBy: [{ active: "desc" }, { displayOrder: "asc" }],
          take: referenceLimit,
        })
      : Promise.resolve([]),
    section === "renewal-options"
      ? prisma.renewalDecisionReason.findMany({
          orderBy: [{ active: "desc" }, { name: "asc" }],
          take: referenceLimit,
        })
      : Promise.resolve([]),
  ]);
  const [teamMemberCount, budgetAccountCount, budgetCategoryCount] =
    await Promise.all([
      section === "team-members" ? prisma.teamMember.count() : 0,
      section === "finance" ? prisma.budgetAccount.count() : 0,
      section === "finance" ? prisma.budgetCategory.count() : 0,
    ]);

  return {
    activeSection: section,
    organization,
    fiscalYears,
    departments,
    teamMembers,
    budgetAccounts,
    budgetCategories,
    expenseTypeOptions,
    purchasingVehicles,
    paymentFrequencyOptions,
    licenseMetricOptions,
    deploymentEnvironments,
    renewalPriorityOptions,
    renewalDecisionReasons,
    pagination: {
      page,
      pageSize,
      teamMemberCount,
      teamMemberPages: Math.max(1, Math.ceil(teamMemberCount / pageSize)),
      accountPage,
      budgetAccountCount,
      budgetAccountPages: Math.max(1, Math.ceil(budgetAccountCount / pageSize)),
      categoryPage,
      budgetCategoryCount,
      budgetCategoryPages: Math.max(
        1,
        Math.ceil(budgetCategoryCount / pageSize)
      ),
    },
    optionSets: settingsOptionSets,
  };
}

const organizationSchema = z.object({
  id: optionalId,
  name: requiredString,
  shortName: optionalString,
  defaultCurrency: z.string().trim().min(3).max(3).default("USD"),
  currentFiscalYearId: optionalId,
  fiscalYearStartMonth: z.coerce.number().int().min(1).max(12).default(7),
  defaultTimezone: requiredString,
});

export async function saveOrganizationSettings(input: unknown) {
  const data = parse(organizationSchema, input);
  const { actorId } = await requirePermission({
    permission: "settings.write",
  });
  const prisma = getPrisma();
  if (data.currentFiscalYearId) {
    const fiscalYear = await prisma.fiscalYear.findUnique({
      where: { id: data.currentFiscalYearId },
    });
    if (!fiscalYear) {
      throw new FieldValidationError("Current fiscal year is invalid.", {
        currentFiscalYearId: ["Choose an existing fiscal year."],
      });
    }
  }
  const existing =
    data.id ??
    (await prisma.organizationSettings.findFirst({ select: { id: true } }))?.id;
  const payload = {
    name: data.name,
    shortName: data.shortName,
    defaultCurrency: data.defaultCurrency.toUpperCase(),
    currentFiscalYearId: data.currentFiscalYearId,
    fiscalYearStartMonth: data.fiscalYearStartMonth,
    defaultTimezone: data.defaultTimezone,
  };
  return prisma.$transaction(async (tx) => {
    const savedId = existing
      ? (
          await tx.organizationSettings.update({
            where: { id: existing },
            data: payload,
          })
        ).id
      : (await tx.organizationSettings.create({ data: payload })).id;
    await tx.activityLog.create({
      data: {
        actorId,
        action: existing ? "UPDATE" : "CREATE",
        entityType: "OrganizationSettings",
        entityId: savedId,
      },
    });
    return savedId;
  });
}

const fiscalYearSchema = z.object({
  id: optionalId,
  label: requiredString,
  startsOn: dateInput,
  endsOn: dateInput,
  status: z.enum(fiscalYearStatuses),
  isCurrent: z.boolean().default(false),
  planningEnabled: z.boolean().default(false),
  active: z.boolean().default(true),
});

export async function saveFiscalYear(input: unknown) {
  const data = parse(fiscalYearSchema, input);
  const { actorId } = await requirePermission({
    permission: "settings.write",
  });
  if (data.endsOn <= data.startsOn) {
    throw new FieldValidationError(
      "Fiscal year end date must be after start date.",
      {
        endsOn: ["End date must be after start date."],
      }
    );
  }
  const prisma = getPrisma();
  const overlap = await prisma.fiscalYear.findFirst({
    where: {
      id: data.id ? { not: data.id } : undefined,
      startsOn: { lte: data.endsOn },
      endsOn: { gte: data.startsOn },
    },
  });
  if (overlap) {
    throw new FieldValidationError("Fiscal years cannot overlap.", {
      startsOn: [`Overlaps ${overlap.label}.`],
    });
  }

  return prisma.$transaction(async (tx) => {
    if (data.isCurrent) {
      await tx.fiscalYear.updateMany({ data: { isCurrent: false } });
    }
    const payload = {
      label: data.label,
      startsOn: data.startsOn,
      endsOn: data.endsOn,
      status: data.status,
      isCurrent: data.isCurrent,
      planningEnabled: data.planningEnabled,
      active: data.active,
    };
    const saved = data.id
      ? await tx.fiscalYear.update({ where: { id: data.id }, data: payload })
      : await tx.fiscalYear.create({ data: payload });
    if (saved.isCurrent) {
      await tx.organizationSettings.updateMany({
        data: { currentFiscalYearId: saved.id },
      });
    }
    await tx.activityLog.create({
      data: {
        actorId,
        action: data.id ? "UPDATE" : "CREATE",
        entityType: "FiscalYear",
        entityId: saved.id,
        metadata: {
          isCurrent: saved.isCurrent,
          planningEnabled: saved.planningEnabled,
        },
      },
    });
    return saved.id;
  });
}

const departmentSchema = z.object({
  id: optionalId,
  name: requiredString,
  active: z.boolean().default(true),
});

export async function saveDepartment(input: unknown) {
  const data = parse(departmentSchema, input);
  const prisma = getPrisma();
  const existingDepartment = data.id
    ? await prisma.department.findUnique({
        where: { id: data.id },
        select: { id: true },
      })
    : null;
  const { actorId } = await requirePermission({
    permission: "settings.write",
    departmentId: existingDepartment?.id,
  });
  if (data.name.trim().toLowerCase() === "all departments") {
    throw new FieldValidationError(
      "All Departments is reserved for the organization-wide context.",
      { name: ["Use a specific department name such as IT Security."] }
    );
  }
  const duplicate = await prisma.department.findFirst({
    where: {
      id: data.id ? { not: data.id } : undefined,
      name: { equals: data.name, mode: "insensitive" },
      active: true,
    },
  });
  if (duplicate && data.active) {
    throw new FieldValidationError("Active department name already exists.", {
      name: ["Use a unique active Department name."],
    });
  }
  return prisma.$transaction(async (tx) => {
    const saved = data.id
      ? await tx.department.update({ where: { id: data.id }, data })
      : await tx.department.create({ data });
    await tx.activityLog.create({
      data: {
        actorId,
        action: data.id ? "UPDATE" : "CREATE",
        entityType: "Department",
        entityId: saved.id,
        metadata: { active: saved.active },
      },
    });
    return saved.id;
  });
}

const teamMemberSchema = z.object({
  id: optionalId,
  fullName: requiredString,
  jobTitle: optionalString,
  departmentId: optionalId,
  email: z.string().trim().email("Valid email is required."),
  active: z.boolean().default(true),
});

export async function saveTeamMember(input: unknown) {
  const data = parse(teamMemberSchema, input);
  const prisma = getPrisma();
  const existingTeamMember = data.id
    ? await prisma.teamMember.findUnique({
        where: { id: data.id },
        select: { departmentId: true },
      })
    : null;
  if (existingTeamMember?.departmentId) {
    await requirePermission({
      permission: "settings.write",
      departmentId: existingTeamMember.departmentId,
    });
  }
  if (data.departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });
    if (!department) {
      throw new FieldValidationError("Department is invalid.", {
        departmentId: ["Choose an existing Department."],
      });
    }
    await requirePermission({
      permission: "settings.write",
      departmentId: department.id,
    });
  } else {
    await requirePermission({ permission: "settings.write" });
  }
  const duplicate = await prisma.teamMember.findFirst({
    where: {
      id: data.id ? { not: data.id } : undefined,
      email: { equals: data.email, mode: "insensitive" },
      active: true,
    },
  });
  if (duplicate && data.active) {
    throw new FieldValidationError("Active team member email already exists.", {
      email: ["Use a unique active email address."],
    });
  }
  const payload = { ...data, email: data.email.toLowerCase() };
  const saved = data.id
    ? await prisma.teamMember.update({ where: { id: data.id }, data: payload })
    : await prisma.teamMember.create({ data: payload });
  return saved.id;
}

export async function setReferenceActive(
  model:
    | "department"
    | "teamMember"
    | "budgetAccount"
    | "budgetCategory"
    | "expenseTypeOption"
    | "purchasingVehicle"
    | "paymentFrequencyOption"
    | "licenseMetricOption"
    | "deploymentEnvironment"
    | "renewalPriorityOption"
    | "renewalDecisionReason",
  id: string,
  active: boolean
) {
  const prisma = getPrisma();
  let departmentId: string | null = null;
  if (model === "department") {
    departmentId = (
      await prisma.department.findUnique({
        where: { id },
        select: { id: true },
      })
    )?.id ?? null;
  } else if (model === "teamMember") {
    departmentId = (
      await prisma.teamMember.findUnique({
        where: { id },
        select: { departmentId: true },
      })
    )?.departmentId ?? null;
  } else if (model === "budgetAccount") {
    departmentId = (
      await prisma.budgetAccount.findUnique({
        where: { id },
        select: { departmentId: true },
      })
    )?.departmentId ?? null;
  }
  await requirePermission({ permission: "settings.write", departmentId });
  const delegate = prisma[model] as unknown as {
    update(args: {
      where: { id: string };
      data: { active: boolean };
    }): Promise<{ id: string }>;
  };
  return (await delegate.update({ where: { id }, data: { active } })).id;
}

const budgetAccountSchema = z.object({
  id: optionalId,
  departmentId: optionalId,
  code: requiredString,
  name: requiredString,
  defaultWorksheet: z.enum(budgetWorksheets),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export async function saveBudgetAccount(input: unknown) {
  const data = parse(budgetAccountSchema, input);
  const prisma = getPrisma();
  const existingAccount = data.id
    ? await prisma.budgetAccount.findUnique({
        where: { id: data.id },
        select: { departmentId: true },
      })
    : null;
  if (existingAccount?.departmentId) {
    await requirePermission({
      permission: "settings.write",
      departmentId: existingAccount.departmentId,
    });
  }
  if (
    data.departmentId &&
    !(await prisma.department.findUnique({ where: { id: data.departmentId } }))
  ) {
    throw new FieldValidationError("Department is invalid.", {
      departmentId: ["Choose an existing department."],
    });
  }
  await requirePermission({
    permission: "settings.write",
    departmentId: data.departmentId,
  });
  const saved = data.id
    ? await prisma.budgetAccount.update({ where: { id: data.id }, data })
    : await prisma.budgetAccount.create({ data });
  return saved.id;
}

const budgetCategorySchema = z.object({
  id: optionalId,
  fiscalYearId: requiredString,
  name: requiredString,
  description: optionalString,
  active: z.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
});

export async function saveBudgetCategory(input: unknown) {
  const data = parse(budgetCategorySchema, input);
  await requirePermission({ permission: "settings.write" });
  const prisma = getPrisma();
  const fiscalYear = await prisma.fiscalYear.findUnique({
    where: { id: data.fiscalYearId },
  });
  if (!fiscalYear) {
    throw new FieldValidationError("Fiscal year is invalid.", {
      fiscalYearId: ["Choose an existing fiscal year."],
    });
  }
  const saved = data.id
    ? await prisma.budgetCategory.update({ where: { id: data.id }, data })
    : await prisma.budgetCategory.create({ data });
  return saved.id;
}

function optionSchema<T extends readonly [string, ...string[]]>(keys: T) {
  return z.object({
    id: optionalId,
    key: z.enum(keys),
    name: requiredString,
    active: z.boolean().default(true),
    displayOrder: z.coerce.number().int().default(0),
  });
}

export async function saveExpenseTypeOption(input: unknown) {
  const data = parse(optionSchema(expenseTypes), input);
  await requirePermission({ permission: "settings.write" });
  const prisma = getPrisma();
  return (
    data.id
      ? await prisma.expenseTypeOption.update({ where: { id: data.id }, data })
      : await prisma.expenseTypeOption.create({ data })
  ).id;
}

export async function savePaymentFrequencyOption(input: unknown) {
  const data = parse(optionSchema(paymentFrequencies), input);
  await requirePermission({ permission: "settings.write" });
  const prisma = getPrisma();
  return (
    data.id
      ? await prisma.paymentFrequencyOption.update({
          where: { id: data.id },
          data,
        })
      : await prisma.paymentFrequencyOption.create({ data })
  ).id;
}

export async function saveLicenseMetricOption(input: unknown) {
  const data = parse(optionSchema(licenseMetrics), input);
  await requirePermission({ permission: "settings.write" });
  const prisma = getPrisma();
  return (
    data.id
      ? await prisma.licenseMetricOption.update({
          where: { id: data.id },
          data,
        })
      : await prisma.licenseMetricOption.create({ data })
  ).id;
}

export async function saveRenewalPriorityOption(input: unknown) {
  const data = parse(optionSchema(renewalPriorities), input);
  await requirePermission({ permission: "settings.write" });
  const prisma = getPrisma();
  return (
    data.id
      ? await prisma.renewalPriorityOption.update({
          where: { id: data.id },
          data,
        })
      : await prisma.renewalPriorityOption.create({ data })
  ).id;
}

const nameOptionSchema = z.object({
  id: optionalId,
  name: requiredString,
  active: z.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
});

export async function saveDeploymentEnvironment(input: unknown) {
  const data = parse(nameOptionSchema, input);
  await requirePermission({ permission: "settings.write" });
  const prisma = getPrisma();
  return (
    data.id
      ? await prisma.deploymentEnvironment.update({
          where: { id: data.id },
          data,
        })
      : await prisma.deploymentEnvironment.create({ data })
  ).id;
}

const purchasingVehicleSchema = z.object({
  id: optionalId,
  name: requiredString,
  description: optionalString,
  active: z.boolean().default(true),
});

export async function savePurchasingVehicle(input: unknown) {
  const data = parse(purchasingVehicleSchema, input);
  await requirePermission({ permission: "settings.write" });
  const prisma = getPrisma();
  return (
    data.id
      ? await prisma.purchasingVehicle.update({ where: { id: data.id }, data })
      : await prisma.purchasingVehicle.create({ data })
  ).id;
}

const decisionReasonSchema = z.object({
  id: optionalId,
  name: requiredString,
  description: optionalString,
  applicableDisposition: z.enum(renewalDispositions).optional(),
  active: z.boolean().default(true),
});

export async function saveRenewalDecisionReason(input: unknown) {
  const data = parse(decisionReasonSchema, input);
  await requirePermission({ permission: "settings.write" });
  const prisma = getPrisma();
  return (
    data.id
      ? await prisma.renewalDecisionReason.update({
          where: { id: data.id },
          data,
        })
      : await prisma.renewalDecisionReason.create({ data })
  ).id;
}
