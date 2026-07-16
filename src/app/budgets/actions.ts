"use server";

import { revalidatePath } from "next/cache";

import {
  type ActionResult,
  validationFailure,
} from "@/lib/server/action-result";
import {
  createBudgetRow,
  deleteBudgetRow,
  duplicateBudgetRow,
  saveBudgetRow,
  type BudgetRowCreateInput,
  type BudgetRowSaveInput,
} from "@/lib/server/budget-service";

async function action(
  callback: () => Promise<void>,
  message: string
): Promise<ActionResult> {
  try {
    await callback();
    revalidatePath("/budgets");
    revalidatePath("/contracts");
    revalidatePath("/renewals");
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
