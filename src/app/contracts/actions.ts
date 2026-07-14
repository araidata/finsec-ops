"use server";

import { revalidatePath } from "next/cache";

import {
  type ActionResult,
  validationFailure,
} from "@/lib/server/action-result";
import {
  createMaintenanceRenewalFromContract,
  createNewContractTermFromRenewal,
  deleteContract,
  deleteContractLineItem,
  duplicateContractLineItem,
  pushContractToBudget,
  reorderContractLineItems,
  saveContract,
  saveContractLineItem,
  saveContractLineItems,
  saveContractWithLineItems,
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
    const result = await callback();
    revalidatePath("/contracts");
    revalidatePath("/renewals");
    revalidatePath("/budgets");
    return {
      ok: true,
      message,
      data: typeof result === "string" ? { id: result } : undefined,
    };
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
        vendorCompanyId: optionalText(formData, "vendorCompanyId"),
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

function lineHasValues(formData: FormData, index: number) {
  const meaningfulFields = [
    "id",
    "productId",
    "productModuleId",
    "description",
    "sku",
    "unitPrice",
    "annualAmount",
    "totalAmount",
    "notesText",
  ];
  return meaningfulFields.some((field) => {
    const value = optionalText(formData, `line_${index}_${field}`);
    return value && value !== "0";
  });
}

function contractLineFromForm(formData: FormData, index: number) {
  return {
    id: optionalText(formData, `line_${index}_id`),
    productId: optionalText(formData, `line_${index}_productId`),
    productModuleId: optionalText(formData, `line_${index}_productModuleId`),
    description: text(formData, `line_${index}_description`),
    sku: text(formData, `line_${index}_sku`),
    quantity: text(formData, `line_${index}_quantity`),
    licenseMetric:
      optionalText(formData, `line_${index}_licenseMetric`) || undefined,
    unitPrice: text(formData, `line_${index}_unitPrice`),
    annualAmount: text(formData, `line_${index}_annualAmount`),
    totalAmount: text(formData, `line_${index}_totalAmount`),
    startsOn: text(formData, `line_${index}_startsOn`),
    endsOn: text(formData, `line_${index}_endsOn`),
    renewable: checked(formData, `line_${index}_renewable`),
    sortOrder: text(formData, `line_${index}_sortOrder`),
    notesText: text(formData, `line_${index}_notesText`),
  };
}

export async function saveContractWithLinesAction(
  _prev: ActionResult,
  formData: FormData
) {
  const lineCount = Number(text(formData, "lineCount") || 0);
  const lines = Array.from({ length: lineCount }, (_, index) => index)
    .filter((index) => lineHasValues(formData, index))
    .map((index) => contractLineFromForm(formData, index));

  return action(
    () =>
      saveContractWithLineItems({
        id: optionalText(formData, "id"),
        title: text(formData, "title"),
        contractNumber: text(formData, "contractNumber"),
        vendorCompanyId: optionalText(formData, "vendorCompanyId"),
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
        lines,
      }),
    "Contract and products saved."
  );
}

export async function deleteContractAction(
  _prev: ActionResult,
  formData: FormData
) {
  try {
    const result = await deleteContract(text(formData, "id"));
    revalidatePath("/contracts");
    revalidatePath("/renewals");
    revalidatePath("/budgets");
    return {
      ok: true,
      message:
        result.mode === "deleted"
          ? "Contract deleted."
          : "Contract has linked records, so it was marked terminated instead.",
      data: result,
    };
  } catch (error) {
    return validationFailure(error);
  }
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

export async function saveContractLinesAction(
  _prev: ActionResult,
  formData: FormData
) {
  const lineCount = Number(text(formData, "lineCount") || 0);
  const lines = Array.from({ length: lineCount }, (_, index) => index)
    .filter((index) => lineHasValues(formData, index))
    .map((index) => ({
      productId: optionalText(formData, `line_${index}_productId`),
      productModuleId: optionalText(formData, `line_${index}_productModuleId`),
      description: text(formData, `line_${index}_description`),
      sku: text(formData, `line_${index}_sku`),
      quantity: text(formData, `line_${index}_quantity`),
      licenseMetric:
        optionalText(formData, `line_${index}_licenseMetric`) || undefined,
      unitPrice: text(formData, `line_${index}_unitPrice`),
      annualAmount: text(formData, `line_${index}_annualAmount`),
      totalAmount: text(formData, `line_${index}_totalAmount`),
      startsOn: text(formData, `line_${index}_startsOn`),
      endsOn: text(formData, `line_${index}_endsOn`),
      renewable: checked(formData, `line_${index}_renewable`),
      sortOrder: text(formData, `line_${index}_sortOrder`),
      notesText: text(formData, `line_${index}_notesText`),
    }));

  return action(
    () =>
      saveContractLineItems({
        contractId: text(formData, "contractId"),
        lines,
      }),
    "Contract lines added."
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
    "Contract pushed to Renewal."
  );
}

export async function pushContractToBudgetAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      pushContractToBudget({
        contractId: text(formData, "contractId"),
        fiscalYearId: text(formData, "fiscalYearId"),
        budgetPlanId: text(formData, "budgetPlanId"),
        accountId: text(formData, "accountId"),
      }),
    "Contract pushed to Budget."
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
