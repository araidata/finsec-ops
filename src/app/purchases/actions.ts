"use server";

import { revalidatePath } from "next/cache";

import {
  type ActionResult,
  validationFailure,
} from "@/lib/server/action-result";
import {
  addBudgetAllocation,
  addDeployment,
  addPurchaseItem,
  addUsageMeasurement,
  createPurchase,
} from "@/lib/server/catalog-service";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value === "none" ? "" : value;
}

function list(formData: FormData, key: string) {
  return formData.getAll(key).map(String).filter(Boolean);
}

async function action<T>(
  callback: () => Promise<T>,
  message: string
): Promise<ActionResult> {
  try {
    await callback();
    revalidatePath("/purchases");
    return { ok: true, message };
  } catch (error) {
    return validationFailure(error);
  }
}

const itemInput = (formData: FormData) => ({
  productId: text(formData, "productId"),
  productModuleId: optionalText(formData, "productModuleId"),
  featureIds: list(formData, "featureIds"),
  description: text(formData, "description"),
  quantity: text(formData, "quantity"),
  quantityType: optionalText(formData, "quantityType") || undefined,
  unitCost: text(formData, "unitCost"),
  recurringCost: text(formData, "recurringCost"),
  implementationCost: text(formData, "implementationCost"),
  licenseStartsOn: text(formData, "licenseStartsOn"),
  licenseEndsOn: text(formData, "licenseEndsOn"),
});

export async function createPurchaseAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      createPurchase({
        title: text(formData, "title"),
        fiscalYearId: text(formData, "fiscalYearId"),
        sellerCompanyId: text(formData, "sellerCompanyId"),
        contractId: optionalText(formData, "contractId"),
        purchasingAgreementId: optionalText(formData, "purchasingAgreementId"),
        purchaseRequestId: optionalText(formData, "purchaseRequestId"),
        status: text(formData, "status"),
        currencyCode: text(formData, "currencyCode") || "USD",
        startsOn: text(formData, "startsOn"),
        endsOn: text(formData, "endsOn"),
        renewalDate: text(formData, "renewalDate"),
        notesText: text(formData, "notesText"),
        item: itemInput(formData),
      }),
    "Purchase created."
  );
}

export async function addItemAction(_prev: ActionResult, formData: FormData) {
  return action(
    () =>
      addPurchaseItem({
        purchaseId: text(formData, "purchaseId"),
        ...itemInput(formData),
      }),
    "Purchase item added."
  );
}

export async function addAllocationAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      addBudgetAllocation({
        purchaseId: text(formData, "purchaseId"),
        purchaseItemId: optionalText(formData, "purchaseItemId"),
        budgetAnnualFinancialId: text(formData, "budgetAnnualFinancialId"),
        allocatedAmount: text(formData, "allocatedAmount"),
        notesText: text(formData, "notesText"),
      }),
    "Budget allocation added."
  );
}

export async function addDeploymentAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      addDeployment({
        purchaseItemId: text(formData, "purchaseItemId"),
        scopeName: text(formData, "scopeName"),
        environment: text(formData, "environment"),
        department: text(formData, "department"),
        status: text(formData, "status"),
        deploymentPercent: text(formData, "deploymentPercent"),
        targetPopulation: text(formData, "targetPopulation") || undefined,
        deployedPopulation: text(formData, "deployedPopulation") || undefined,
        adoptionLevel: optionalText(formData, "adoptionLevel") || undefined,
        targetDate: text(formData, "targetDate"),
        completedDate: text(formData, "completedDate"),
        blockers: text(formData, "blockers"),
        expectedOutcome: text(formData, "expectedOutcome"),
        realizedOutcome: text(formData, "realizedOutcome"),
        valueNarrative: text(formData, "valueNarrative"),
      }),
    "Deployment scope added."
  );
}

export async function addUsageAction(_prev: ActionResult, formData: FormData) {
  return action(
    () =>
      addUsageMeasurement({
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
