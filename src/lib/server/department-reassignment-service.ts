import { z } from "zod";
import { Prisma } from "@prisma/client";

import { FieldValidationError } from "@/lib/server/action-result";
import { requirePermission } from "@/lib/server/authorization";
import { getPrisma } from "@/lib/server/prisma";

export const reassignmentEntityTypes = [
  "budgetItem",
  "contract",
  "maintenanceRenewal",
] as const;

export type ReassignmentEntityType = (typeof reassignmentEntityTypes)[number];

export type ReassignDepartmentInput = {
  entityType: ReassignmentEntityType;
  entityIds: string[];
  departmentId: string | null;
};

export type DepartmentReassignmentResult = {
  moved: number;
  departmentName: string;
  warnings: Array<{ entityId: string; entityType: ReassignmentEntityType; message: string }>;
};

const inputSchema = z.object({
  entityType: z.enum(reassignmentEntityTypes),
  entityIds: z.array(z.string().trim().min(1)).min(1),
  departmentId: z.string().trim().min(1).nullable(),
});

const destinationLabel = "Unassigned";

function displayDepartment(name?: string | null) {
  return name || destinationLabel;
}

function validateEntityIds(ids: string[]) {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length !== ids.length) {
    throw new FieldValidationError("Select each record only once.", {
      entityIds: ["Duplicate records were selected."],
    });
  }
  return uniqueIds;
}

export async function reassignDepartment(
  input: ReassignDepartmentInput
): Promise<DepartmentReassignmentResult> {
  const data = inputSchema.parse(input);
  const entityIds = validateEntityIds(data.entityIds);
  const prisma = getPrisma();
  const { actorId } = await requirePermission({
    permission: "departments.reassign",
    departmentId: data.departmentId,
  });

  const department = data.departmentId
    ? await prisma.department.findUnique({ where: { id: data.departmentId } })
    : null;
  if (data.departmentId && (!department || !department.active)) {
    throw new FieldValidationError("Choose an active destination department.", {
      departmentId: ["The destination department is unavailable."],
    });
  }
  if (department?.name.trim().toLowerCase() === "all departments") {
    throw new FieldValidationError("All Departments is reserved for the global context.", {
      departmentId: ["Choose a specific department."],
    });
  }

  const targetName = displayDepartment(department?.name);
  return runSerializableTransaction(prisma, async (tx) => {
    const warnings: DepartmentReassignmentResult["warnings"] = [];
    const logs: Array<{
      action: "UPDATE";
      entityType: string;
      entityId: string;
      fieldName: string;
      previousValue: string;
      newValue: string;
      metadata: Prisma.InputJsonObject;
      actorId: string | null;
    }> = [];
    let moved = 0;

    if (data.entityType === "budgetItem") {
      const records = await tx.budgetItem.findMany({
        where: { id: { in: entityIds } },
        include: {
          department: true,
          _count: { select: { annualFinancials: true, maintenanceRenewals: true } },
        },
      });
      if (records.length !== entityIds.length) throw missingRecords(entityIds, records.map((record) => record.id));
      const update = await tx.budgetItem.updateMany({
        where: { id: { in: entityIds } },
        data: { departmentId: data.departmentId },
      });
      if (update.count !== records.length) throw concurrentReassignment();
      for (const record of records) {
        const warning = record._count.maintenanceRenewals
          ? `This Budget Item has ${record._count.maintenanceRenewals} linked renewal${record._count.maintenanceRenewals === 1 ? "" : "s"}; those records remain in ${displayDepartment(record.department?.name)}.`
          : null;
        if (warning) warnings.push({ entityId: record.id, entityType: data.entityType, message: warning });
        logs.push({
          ...logEntry(data.entityType, record.id, record.department?.name, targetName, {
            annualFinancialRows: record._count.annualFinancials,
            linkedMaintenanceRenewals: record._count.maintenanceRenewals,
          }),
          actorId,
        });
      }
      moved = records.length;
    }

    if (data.entityType === "contract") {
      const records = await tx.contract.findMany({
        where: { id: { in: entityIds } },
        include: {
          department: true,
          _count: { select: { maintenanceRenewals: true, budgetItems: true, documents: true } },
        },
      });
      if (records.length !== entityIds.length) throw missingRecords(entityIds, records.map((record) => record.id));
      const update = await tx.contract.updateMany({
        where: { id: { in: entityIds } },
        data: { departmentId: data.departmentId },
      });
      if (update.count !== records.length) throw concurrentReassignment();
      for (const record of records) {
        const linked = record._count.maintenanceRenewals + record._count.budgetItems + record._count.documents;
        if (linked) warnings.push({
          entityId: record.id,
          entityType: data.entityType,
          message: `This Contract has ${linked} linked record${linked === 1 ? "" : "s"}; linked departments remain unchanged.`,
        });
        logs.push({
          ...logEntry(data.entityType, record.id, record.department?.name, targetName, {
            linkedMaintenanceRenewals: record._count.maintenanceRenewals,
            linkedBudgetItems: record._count.budgetItems,
            linkedDocuments: record._count.documents,
          }),
          actorId,
        });
      }
      moved = records.length;
    }

    if (data.entityType === "maintenanceRenewal") {
      const records = await tx.maintenanceRenewal.findMany({
        where: { id: { in: entityIds } },
        include: { departmentRef: true, _count: { select: { documents: true, notes: true } } },
      });
      if (records.length !== entityIds.length) throw missingRecords(entityIds, records.map((record) => record.id));
      const update = await tx.maintenanceRenewal.updateMany({
        where: { id: { in: entityIds } },
        data: {
          departmentId: data.departmentId,
          department: department?.name ?? null,
        },
      });
      if (update.count !== records.length) throw concurrentReassignment();
      for (const record of records) {
        logs.push({
          ...logEntry(data.entityType, record.id, record.departmentRef?.name, targetName, {
            linkedDocuments: record._count.documents,
            linkedNotes: record._count.notes,
          }),
          actorId,
        });
      }
      moved = records.length;
    }

    if (logs.length) await tx.activityLog.createMany({ data: logs });
    return { moved, departmentName: targetName, warnings };
  });
}

async function runSerializableTransaction<T>(
  prisma: ReturnType<typeof getPrisma>,
  operation: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
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
  throw new Error("Department reassignment transaction did not complete.");
}

function logEntry(
  entityType: ReassignmentEntityType,
  entityId: string,
  previousDepartment: string | null | undefined,
  newDepartment: string,
  metadata: Prisma.InputJsonObject
) {
  return {
    action: "UPDATE" as const,
    entityType,
    entityId,
    fieldName: "departmentId",
    previousValue: displayDepartment(previousDepartment),
    newValue: newDepartment,
    metadata: { reassignment: true, ...metadata },
  };
}

function missingRecords(expected: string[], found: string[]) {
  const missing = expected.filter((id) => !found.includes(id));
  return new FieldValidationError("Some selected records no longer exist.", {
    entityIds: [`Missing record IDs: ${missing.join(", ")}`],
  });
}

function concurrentReassignment() {
  return new FieldValidationError(
    "The selected records changed while they were being reassigned.",
    {
      entityIds: ["Refresh the page and try the department move again."],
    }
  );
}
