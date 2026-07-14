"use server";

import { revalidatePath } from "next/cache";

import {
  type ActionResult,
  validationFailure,
} from "@/lib/server/action-result";
import {
  addDeploymentUsageMeasurement,
  saveDeployment,
} from "@/lib/server/deployment-service";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value === "none" ? "" : value;
}

async function action<T>(
  callback: () => Promise<T>,
  message: string
): Promise<ActionResult> {
  try {
    const result = await callback();
    revalidatePath("/deployment");
    revalidatePath("/contracts");
    revalidatePath("/renewals");
    return {
      ok: true,
      message,
      data: typeof result === "string" ? { id: result } : undefined,
    };
  } catch (error) {
    return validationFailure(error);
  }
}

export async function saveDeploymentAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveDeployment({
        id: optionalText(formData, "id"),
        contractLineItemId: text(formData, "contractLineItemId"),
        scopeName: text(formData, "scopeName"),
        environment: text(formData, "environment"),
        departmentId: optionalText(formData, "departmentId"),
        ownerTeamMemberId: optionalText(formData, "ownerTeamMemberId"),
        status: text(formData, "status"),
        deploymentPercent: text(formData, "deploymentPercent"),
        licensedQuantity: text(formData, "licensedQuantity") || undefined,
        deployedPopulation: text(formData, "deployedPopulation") || undefined,
        activeUsageQuantity: text(formData, "activeUsageQuantity") || undefined,
        utilizationPercent: text(formData, "utilizationPercent") || undefined,
        adoptionLevel: optionalText(formData, "adoptionLevel") || undefined,
        targetDate: text(formData, "targetDate"),
        completedDate: text(formData, "completedDate"),
        blockers: text(formData, "blockers"),
        notesText: text(formData, "notesText"),
      }),
    "Deployment saved."
  );
}

export async function addUsageMeasurementAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      addDeploymentUsageMeasurement({
        deploymentId: text(formData, "deploymentId"),
        measuredAt: text(formData, "measuredAt"),
        licensedCount: text(formData, "licensedCount") || undefined,
        deployedCount: text(formData, "deployedCount") || undefined,
        activeUsageCount: text(formData, "activeUsageCount") || undefined,
        utilizationPercent: text(formData, "utilizationPercent") || undefined,
        source: text(formData, "source"),
        notesText: text(formData, "notesText"),
      }),
    "Usage measurement added."
  );
}
