"use server";

import { revalidatePath } from "next/cache";

import {
  type ActionResult,
  validationFailure,
} from "@/lib/server/action-result";
import {
  archiveOrDeleteContract,
  createMaintenanceRenewalFromContract,
  createNewContractTermFromRenewal,
  deleteContractLineItem,
  duplicateContractLineItem,
  reorderContractLineItems,
  saveContract,
  saveContractLineItem,
} from "@/lib/server/contract-service";

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
    await callback();
    revalidatePath("/contracts");
    revalidatePath("/renewals");
    revalidatePath("/budgets");
    return { ok: true, message };
  } catch (error) {
    return validationFailure(error);
  }
}

export async function saveContractAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveContract({
        id: optionalText(formData, "id"),
        title: text(formData, "title"),
        contractNumber: text(formData, "contractNumber"),
        vendorCompanyId: text(formData, "vendorCompanyId"),
        sellerCompanyId: optionalText(formData, "sellerCompanyId"),
        contractType: text(formData, "contractType"),
        startsOn: text(formData, "startsOn"),
        endsOn: text(formData, "endsOn"),
        renewalDate: text(formData, "renewalDate"),
        noticePeriodDays: text(formData, "noticePeriodDays"),
        autoRenewal: checked(formData, "autoRenewal"),
        paymentFrequency: text(formData, "paymentFrequency"),
        status: text(formData, "status"),
        contractOwner: text(formData, "contractOwner"),
        businessOwner: text(formData, "businessOwner"),
        securityOwner: text(formData, "securityOwner"),
        procurementContact: text(formData, "procurementContact"),
        vendorAccountManager: text(formData, "vendorAccountManager"),
        resellerAccountManager: text(formData, "resellerAccountManager"),
        renewalRiskLevel: text(formData, "renewalRiskLevel"),
        renewalStrategy: text(formData, "renewalStrategy"),
        notesText: text(formData, "notesText"),
      }),
    "Contract saved."
  );
}

export async function archiveContractAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () => archiveOrDeleteContract(text(formData, "id")),
    "Contract removed or archived."
  );
}

export async function saveContractLineAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveContractLineItem({
        id: optionalText(formData, "id"),
        contractId: text(formData, "contractId"),
        productId: optionalText(formData, "productId"),
        productModuleId: optionalText(formData, "productModuleId"),
        description: text(formData, "description"),
        sku: text(formData, "sku"),
        quantity: text(formData, "quantity"),
        licenseMetric: optionalText(formData, "licenseMetric") || undefined,
        unitPrice: text(formData, "unitPrice"),
        annualAmount: text(formData, "annualAmount"),
        totalAmount: text(formData, "totalAmount"),
        startsOn: text(formData, "startsOn"),
        endsOn: text(formData, "endsOn"),
        renewable: checked(formData, "renewable"),
        sortOrder: text(formData, "sortOrder"),
        notesText: text(formData, "notesText"),
      }),
    "Contract line saved."
  );
}

export async function deleteContractLineAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () => deleteContractLineItem(text(formData, "id")),
    "Contract line deleted."
  );
}

export async function duplicateContractLineAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () => duplicateContractLineItem(text(formData, "id")),
    "Contract line duplicated."
  );
}

export async function reorderContractLinesAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      reorderContractLineItems({
        contractId: text(formData, "contractId"),
        orderedIds: text(formData, "orderedIds").split(",").filter(Boolean),
      }),
    "Contract lines reordered."
  );
}

export async function createRenewalFromContractAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      createMaintenanceRenewalFromContract({
        contractId: text(formData, "contractId"),
        fiscalYearId: text(formData, "fiscalYearId"),
        budgetPlanId: text(formData, "budgetPlanId"),
        fundingAccountId: text(formData, "fundingAccountId"),
        linkedAnnualFinancialId: optionalText(
          formData,
          "linkedAnnualFinancialId"
        ),
        budgetItemId: optionalText(formData, "budgetItemId"),
        budgetLineItemId: optionalText(formData, "budgetLineItemId"),
        department: text(formData, "department"),
        costCenter: text(formData, "costCenter"),
        renewalOwner: text(formData, "renewalOwner"),
      }),
    "Maintenance renewal created from contract."
  );
}

export async function createNewContractTermAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      createNewContractTermFromRenewal({
        maintenanceRenewalId: text(formData, "maintenanceRenewalId"),
      }),
    "New contract term created."
  );
}
