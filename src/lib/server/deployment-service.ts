import { z } from "zod";

import { FieldValidationError } from "@/lib/server/action-result";
import { getPrisma } from "@/lib/server/prisma";

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

export async function getDeploymentPageData() {
  const prisma = getPrisma();
  const [
    deployments,
    contracts,
    lineItems,
    departments,
    teamMembers,
    deploymentEnvironments,
  ] = await Promise.all([
    prisma.deployment.findMany({
      orderBy: [{ updatedAt: "desc" }, { scopeName: "asc" }],
      include: {
        contractLineItem: {
          include: {
            contract: { include: { vendorCompany: true, sellerCompany: true } },
            product: { include: { vendorCompany: true } },
            productModule: true,
          },
        },
        purchaseItem: {
          include: {
            purchase: { include: { contract: true, sellerCompany: true } },
            product: { include: { vendorCompany: true } },
            productModule: true,
          },
        },
        usageMeasurements: { orderBy: { measuredAt: "desc" } },
      },
    }),
    prisma.contract.findMany({
      orderBy: [{ title: "asc" }],
      include: { vendorCompany: true, sellerCompany: true },
    }),
    prisma.contractLineItem.findMany({
      orderBy: [{ contract: { title: "asc" } }, { sortOrder: "asc" }],
      include: {
        contract: { include: { vendorCompany: true, sellerCompany: true } },
        product: { include: { vendorCompany: true } },
        productModule: true,
      },
    }),
    prisma.department.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
    prisma.teamMember.findMany({
      orderBy: [{ active: "desc" }, { fullName: "asc" }],
      include: { department: true },
    }),
    prisma.deploymentEnvironment.findMany({
      where: { active: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return {
    deployments,
    contracts,
    lineItems,
    departments,
    teamMembers,
    deploymentEnvironments,
    optionSets: deploymentOptionSets,
  };
}

const deploymentSchema = z.object({
  id: optionalId,
  contractLineItemId: idSchema,
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

export async function saveDeployment(input: unknown) {
  const data = deploymentSchema.parse(input);
  const line = await assertContractLine(data.contractLineItemId);
  const prisma = getPrisma();
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
      contractLineItemId: data.contractLineItemId,
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
    contractLineItemId: data.contractLineItemId,
    scopeName: data.scopeName,
    environment: data.environment,
    departmentId: data.departmentId,
    ownerTeamMemberId: data.ownerTeamMemberId,
    department: department?.name,
    owner: ownerTeamMember?.fullName,
    status: data.status,
    deploymentPercent: String(data.deploymentPercent),
    licensedQuantity:
      data.licensedQuantity ?? Math.floor(Number(line.quantity ?? 0)),
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
