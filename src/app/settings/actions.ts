"use server";

import { revalidatePath } from "next/cache";

import {
  type ActionResult,
  validationFailure,
} from "@/lib/server/action-result";
import {
  saveBudgetAccount,
  saveBudgetCategory,
  saveDepartment,
  saveDeploymentEnvironment,
  saveExpenseTypeOption,
  saveFiscalYear,
  saveLicenseMetricOption,
  saveOrganizationSettings,
  savePaymentFrequencyOption,
  savePurchasingVehicle,
  saveRenewalDecisionReason,
  saveRenewalPriorityOption,
  saveTeamMember,
  setReferenceActive,
} from "@/lib/server/settings-service";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value === "none" ? "" : value;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

async function action<T>(
  callback: () => Promise<T>,
  message: string
): Promise<ActionResult> {
  try {
    const result = await callback();
    revalidatePath("/settings");
    revalidatePath("/budgets");
    revalidatePath("/contracts");
    revalidatePath("/deployment");
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

export async function saveOrganizationAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveOrganizationSettings({
        id: optionalText(formData, "id"),
        name: text(formData, "name"),
        shortName: text(formData, "shortName"),
        defaultCurrency: text(formData, "defaultCurrency") || "USD",
        currentFiscalYearId: optionalText(formData, "currentFiscalYearId"),
        fiscalYearStartMonth: text(formData, "fiscalYearStartMonth") || "7",
        defaultTimezone: text(formData, "defaultTimezone") || "America/Chicago",
      }),
    "Organization settings saved."
  );
}

export async function saveFiscalYearAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveFiscalYear({
        id: optionalText(formData, "id"),
        label: text(formData, "label"),
        startsOn: text(formData, "startsOn"),
        endsOn: text(formData, "endsOn"),
        status: text(formData, "status"),
        isCurrent: checked(formData, "isCurrent"),
        planningEnabled: checked(formData, "planningEnabled"),
        active: checked(formData, "active"),
      }),
    "Fiscal year saved."
  );
}

export async function saveDepartmentAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveDepartment({
        id: optionalText(formData, "id"),
        name: text(formData, "name"),
        active: checked(formData, "active"),
      }),
    "Department saved."
  );
}

export async function saveTeamMemberAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveTeamMember({
        id: optionalText(formData, "id"),
        fullName: text(formData, "fullName"),
        jobTitle: text(formData, "jobTitle"),
        departmentId: optionalText(formData, "departmentId"),
        email: text(formData, "email"),
        active: checked(formData, "active"),
      }),
    "Team member saved."
  );
}

export async function saveBudgetAccountAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveBudgetAccount({
        id: optionalText(formData, "id"),
        code: text(formData, "code"),
        name: text(formData, "name"),
        defaultWorksheet: text(formData, "defaultWorksheet"),
        active: checked(formData, "active"),
        sortOrder: text(formData, "sortOrder") || "0",
      }),
    "Financial account saved."
  );
}

export async function saveBudgetCategoryAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveBudgetCategory({
        id: optionalText(formData, "id"),
        fiscalYearId: text(formData, "fiscalYearId"),
        name: text(formData, "name"),
        description: text(formData, "description"),
        active: checked(formData, "active"),
        displayOrder: text(formData, "displayOrder") || "0",
      }),
    "Budget category saved."
  );
}

export async function saveExpenseTypeOptionAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveExpenseTypeOption({
        id: optionalText(formData, "id"),
        key: text(formData, "key"),
        name: text(formData, "name"),
        active: checked(formData, "active"),
        displayOrder: text(formData, "displayOrder") || "0",
      }),
    "Expense type saved."
  );
}

export async function savePurchasingVehicleAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      savePurchasingVehicle({
        id: optionalText(formData, "id"),
        name: text(formData, "name"),
        description: text(formData, "description"),
        active: checked(formData, "active"),
      }),
    "Purchasing vehicle saved."
  );
}

export async function savePaymentFrequencyOptionAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      savePaymentFrequencyOption({
        id: optionalText(formData, "id"),
        key: text(formData, "key"),
        name: text(formData, "name"),
        active: checked(formData, "active"),
        displayOrder: text(formData, "displayOrder") || "0",
      }),
    "Payment frequency saved."
  );
}

export async function saveLicenseMetricOptionAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveLicenseMetricOption({
        id: optionalText(formData, "id"),
        key: text(formData, "key"),
        name: text(formData, "name"),
        active: checked(formData, "active"),
        displayOrder: text(formData, "displayOrder") || "0",
      }),
    "License metric saved."
  );
}

export async function saveDeploymentEnvironmentAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveDeploymentEnvironment({
        id: optionalText(formData, "id"),
        name: text(formData, "name"),
        active: checked(formData, "active"),
        displayOrder: text(formData, "displayOrder") || "0",
      }),
    "Deployment environment saved."
  );
}

export async function saveRenewalPriorityOptionAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveRenewalPriorityOption({
        id: optionalText(formData, "id"),
        key: text(formData, "key"),
        name: text(formData, "name"),
        active: checked(formData, "active"),
        displayOrder: text(formData, "displayOrder") || "0",
      }),
    "Renewal priority saved."
  );
}

export async function saveRenewalDecisionReasonAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveRenewalDecisionReason({
        id: optionalText(formData, "id"),
        name: text(formData, "name"),
        description: text(formData, "description"),
        applicableDisposition:
          optionalText(formData, "applicableDisposition") || undefined,
        active: checked(formData, "active"),
      }),
    "Decision reason saved."
  );
}

export async function setReferenceActiveAction(
  _prev: ActionResult,
  formData: FormData
) {
  const model = text(formData, "model") as Parameters<
    typeof setReferenceActive
  >[0];
  const active = text(formData, "active") === "true";
  return action(
    () => setReferenceActive(model, text(formData, "id"), active),
    active ? "Record activated." : "Record deactivated."
  );
}
