"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import {
  type ActionResult,
  validationFailure,
} from "@/lib/server/action-result";
import {
  createBudgetRow,
  deleteBudgetRow,
  duplicateBudgetRow,
  saveBudgetRow,
  sendBudgetAnnualToMaintenance,
  type BudgetRowCreateInput,
  type BudgetRowSaveInput,
} from "@/lib/server/budget-service";
import { DASHBOARD_CACHE_TAG } from "@/lib/server/dashboard-cache";
import type { MaintenanceRenewal } from "@/types/budget";

export type SendBudgetToMaintenanceActionResult = Omit<ActionResult, "data"> & {
  data?: {
    renewal?: MaintenanceRenewal;
    created?: boolean;
  };
};

async function action(
  callback: () => Promise<void>,
  message: string
): Promise<ActionResult> {
  try {
    await callback();
    revalidatePath("/budgets");
    revalidateTag(DASHBOARD_CACHE_TAG, "max");
    return { ok: true, message };
  } catch (error) {
    return validationFailure(error);
  }
}

export async function createBudgetRowAction(input: BudgetRowCreateInput) {
  return action(() => createBudgetRow(input), "Budget row created.");
}

export async function saveBudgetRowAction(input: BudgetRowSaveInput) {
  return action(() => saveBudgetRow(input), "Budget row saved.");
}

export async function duplicateBudgetRowAction(lineId: string) {
  return action(() => duplicateBudgetRow(lineId), "Budget row duplicated.");
}

export async function deleteBudgetRowAction(lineId: string) {
  return action(() => deleteBudgetRow(lineId), "Budget row deleted.");
}

export async function sendBudgetToMaintenanceAction(
  annualFinancialId: string
): Promise<SendBudgetToMaintenanceActionResult> {
  try {
    const result = await sendBudgetAnnualToMaintenance(annualFinancialId);
    revalidatePath("/budgets");
    revalidatePath("/renewals");
    revalidateTag(DASHBOARD_CACHE_TAG, "max");
    return {
      ok: true,
      message: result.created
        ? "Maintenance Renewal created and linked."
        : "Existing Maintenance Renewal linked.",
      data: result,
    };
  } catch (error) {
    return validationFailure(error);
  }
}
