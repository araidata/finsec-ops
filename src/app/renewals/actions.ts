"use server";

import { revalidatePath } from "next/cache";

import {
  type ActionResult,
  validationFailure,
} from "@/lib/server/action-result";
import {
  addRenewalComment,
  addRenewalFundingAllocation,
  addRenewalQuote,
  addRenewalTask,
  advanceRenewalStage,
  createMaintenanceRenewal,
  createNextRenewalCycle,
  decideDisposition,
  saveDecommissionPlan,
  saveReplacementPlan,
  submitDispositionRecommendation,
  updateMaintenanceRenewalCase,
  updateMaintenanceRenewalRegister,
  updateMaintenanceRenewalTableField,
} from "@/lib/server/maintenance-renewal-service";

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

function list(formData: FormData, key: string) {
  return formData.getAll(key).map(String).filter(Boolean);
}

async function action<T>(
  callback: () => Promise<T>,
  message: string
): Promise<ActionResult> {
  try {
    await callback();
    revalidatePath("/renewals");
    revalidatePath("/budgets");
    return { ok: true, message };
  } catch (error) {
    return validationFailure(error);
  }
}

export async function createRenewalAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      createMaintenanceRenewal({
        renewalName: text(formData, "renewalName"),
        productId: text(formData, "productId"),
        productModuleIds: list(formData, "productModuleIds"),
        productFeatureIds: list(formData, "productFeatureIds"),
        vendorCompanyId: optionalText(formData, "vendorCompanyId"),
        sellerCompanyId: optionalText(formData, "sellerCompanyId"),
        contractId: optionalText(formData, "contractId"),
        purchasingVehicleId: optionalText(formData, "purchasingVehicleId"),
        purchasingAgreementId: optionalText(formData, "purchasingAgreementId"),
        fiscalYearId: text(formData, "fiscalYearId"),
        budgetPlanId: text(formData, "budgetPlanId"),
        linkedAnnualFinancialId: optionalText(
          formData,
          "linkedAnnualFinancialId"
        ),
        budgetItemId: optionalText(formData, "budgetItemId"),
        budgetLineItemId: optionalText(formData, "budgetLineItemId"),
        fundingAccountId: text(formData, "fundingAccountId"),
        securityCapabilityId: optionalText(formData, "securityCapabilityId"),
        department: text(formData, "department"),
        costCenter: text(formData, "costCenter"),
        fundingSource: text(formData, "fundingSource"),
        currentAnnualCost: text(formData, "currentAnnualCost"),
        forecastedRenewalCost: text(formData, "forecastedRenewalCost"),
        approvedAmount: text(formData, "approvedAmount"),
        renewalDate: text(formData, "renewalDate"),
        currentContractStart: text(formData, "currentContractStart"),
        currentContractEnd: text(formData, "currentContractEnd"),
        renewalEffectiveDate: text(formData, "renewalEffectiveDate"),
        renewalExpirationDate: text(formData, "renewalExpirationDate"),
        cancellationNoticeDeadline: text(
          formData,
          "cancellationNoticeDeadline"
        ),
        autoRenewal: checked(formData, "autoRenewal"),
        renewalOwner: text(formData, "renewalOwner"),
        productOwner: text(formData, "productOwner"),
        businessOwner: text(formData, "businessOwner"),
        contractOwner: text(formData, "contractOwner"),
        capabilityOwner: text(formData, "capabilityOwner"),
        decisionOwner: text(formData, "decisionOwner"),
        recommendedDisposition: text(formData, "recommendedDisposition"),
        decisionDueDate: text(formData, "decisionDueDate"),
        nextAction: text(formData, "nextAction"),
        nextActionOwner: text(formData, "nextActionOwner"),
        nextActionDueDate: text(formData, "nextActionDueDate"),
        notesText: text(formData, "notesText"),
        renewalStatus: text(formData, "renewalStatus"),
        coOpAgreement: text(formData, "coOpAgreement"),
        coOpContractNumber: text(formData, "coOpContractNumber"),
        coOpAgreementExpirationDate: text(
          formData,
          "coOpAgreementExpirationDate"
        ),
      }),
    "Maintenance renewal created."
  );
}

export async function updateRenewalRegisterAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      updateMaintenanceRenewalRegister({
        id: text(formData, "id"),
        vendorCompanyId: text(formData, "vendorCompanyId"),
        productId: text(formData, "productId"),
        sellerCompanyId: optionalText(formData, "sellerCompanyId"),
        renewalDate: text(formData, "renewalDate"),
        currentAnnualCost: text(formData, "currentAnnualCost"),
        renewalAmount: text(formData, "renewalAmount"),
        renewalStatus: text(formData, "renewalStatus"),
        ownerTeamMemberId: optionalText(formData, "ownerTeamMemberId"),
        renewalOwner: text(formData, "renewalOwner"),
        coOpAgreement: text(formData, "coOpAgreement"),
        coOpContractNumber: text(formData, "coOpContractNumber"),
        coOpAgreementExpirationDate: text(
          formData,
          "coOpAgreementExpirationDate"
        ),
      }),
    "Renewal updated."
  );
}

export async function updateRenewalCaseAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      updateMaintenanceRenewalCase({
        id: text(formData, "id"),
        overallStatus: text(formData, "overallStatus"),
        workflowStage: text(formData, "workflowStage"),
        riskStatus: text(formData, "riskStatus"),
        fundingStatus: text(formData, "fundingStatus"),
        quoteStatus: text(formData, "quoteStatus"),
        renewalOwner: text(formData, "renewalOwner"),
        decisionOwner: text(formData, "decisionOwner"),
        currentAnnualCost: text(formData, "currentAnnualCost"),
        forecastedRenewalCost: text(formData, "forecastedRenewalCost"),
        approvedAmount: text(formData, "approvedAmount"),
        purchaseOrderAmount: text(formData, "purchaseOrderAmount"),
        finalPurchaseAmount: text(formData, "finalPurchaseAmount"),
        renewalExpirationDate: text(formData, "renewalExpirationDate"),
        cancellationNoticeDeadline: text(
          formData,
          "cancellationNoticeDeadline"
        ),
        nextAction: text(formData, "nextAction"),
        nextActionOwner: text(formData, "nextActionOwner"),
        nextActionDueDate: text(formData, "nextActionDueDate"),
        notesText: text(formData, "notesText"),
      }),
    "Renewal case updated."
  );
}

export async function updateRenewalTableFieldAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      updateMaintenanceRenewalTableField({
        id: text(formData, "id"),
        field: text(formData, "field"),
        value: text(formData, "value"),
      }),
    "Renewal table field updated."
  );
}

export async function submitRecommendationAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      submitDispositionRecommendation({
        id: text(formData, "id"),
        recommendedDisposition: text(formData, "recommendedDisposition"),
        recommendationSubmittedBy: text(formData, "recommendationSubmittedBy"),
        recommendationRationale: text(formData, "recommendationRationale"),
        decisionDueDate: text(formData, "decisionDueDate"),
        replacementRequired: checked(formData, "replacementRequired"),
        replacementProductId: optionalText(formData, "replacementProductId"),
        replacementProject: text(formData, "replacementProject"),
        targetReplacementDate: text(formData, "targetReplacementDate"),
        decommissioningRequired: checked(formData, "decommissioningRequired"),
        targetDecommissionDate: text(formData, "targetDecommissionDate"),
        temporaryExtensionTerm: text(formData, "temporaryExtensionTerm"),
        temporaryExtensionReason: text(formData, "temporaryExtensionReason"),
        nextReviewDate: text(formData, "nextReviewDate"),
      }),
    "Disposition recommendation submitted."
  );
}

export async function decideDispositionAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      decideDisposition({
        id: text(formData, "id"),
        approvedDisposition: optionalText(formData, "approvedDisposition"),
        decisionStatus: text(formData, "decisionStatus"),
        approvedBy: text(formData, "approvedBy"),
        approvalRationale: text(formData, "approvalRationale"),
        conditionsOfApproval: text(formData, "conditionsOfApproval"),
      }),
    "Disposition decision recorded."
  );
}

export async function addQuoteAction(_prev: ActionResult, formData: FormData) {
  return action(
    () =>
      addRenewalQuote({
        maintenanceRenewalId: text(formData, "maintenanceRenewalId"),
        quoteNumber: text(formData, "quoteNumber"),
        versionLabel: text(formData, "versionLabel"),
        status: text(formData, "status"),
        amount: text(formData, "amount"),
        receivedOn: text(formData, "receivedOn"),
        expiresOn: text(formData, "expiresOn"),
        selectedFinal: checked(formData, "selectedFinal"),
        source: text(formData, "source"),
        notesText: text(formData, "notesText"),
      }),
    "Quote added."
  );
}

export async function addTaskAction(_prev: ActionResult, formData: FormData) {
  return action(
    () =>
      addRenewalTask({
        maintenanceRenewalId: text(formData, "maintenanceRenewalId"),
        title: text(formData, "title"),
        description: text(formData, "description"),
        owner: text(formData, "owner"),
        stage: optionalText(formData, "stage") || undefined,
        status: text(formData, "status"),
        dueOn: text(formData, "dueOn"),
      }),
    "Task added."
  );
}

export async function advanceStageAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      advanceRenewalStage({
        maintenanceRenewalId: text(formData, "maintenanceRenewalId"),
        stage: text(formData, "stage"),
        owner: text(formData, "owner"),
        dueOn: text(formData, "dueOn"),
        notesText: text(formData, "notesText"),
      }),
    "Workflow stage advanced."
  );
}

export async function addFundingAllocationAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      addRenewalFundingAllocation({
        maintenanceRenewalId: text(formData, "maintenanceRenewalId"),
        department: text(formData, "department"),
        costCenter: text(formData, "costCenter"),
        fundingSource: text(formData, "fundingSource"),
        amount: text(formData, "amount"),
        approved: checked(formData, "approved"),
        notesText: text(formData, "notesText"),
      }),
    "Funding allocation added."
  );
}

export async function saveReplacementPlanAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveReplacementPlan({
        maintenanceRenewalId: text(formData, "maintenanceRenewalId"),
        replacementProductId: optionalText(formData, "replacementProductId"),
        replacementProject: text(formData, "replacementProject"),
        replacementOwner: text(formData, "replacementOwner"),
        migrationOwner: text(formData, "migrationOwner"),
        targetReplacementDate: text(formData, "targetReplacementDate"),
        transitionPlan: text(formData, "transitionPlan"),
        transitionRisk: text(formData, "transitionRisk"),
        contractOverlapRequired: checked(formData, "contractOverlapRequired"),
        overlapCost: text(formData, "overlapCost"),
        dataMigrationRequired: checked(formData, "dataMigrationRequired"),
        integrationMigrationRequired: checked(
          formData,
          "integrationMigrationRequired"
        ),
        notesText: text(formData, "notesText"),
      }),
    "Replacement plan saved."
  );
}

export async function saveDecommissionPlanAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveDecommissionPlan({
        maintenanceRenewalId: text(formData, "maintenanceRenewalId"),
        decommissionOwner: text(formData, "decommissionOwner"),
        businessOwner: text(formData, "businessOwner"),
        technicalOwner: text(formData, "technicalOwner"),
        targetDecommissionDate: text(formData, "targetDecommissionDate"),
        notesText: text(formData, "notesText"),
      }),
    "Decommissioning plan saved."
  );
}

export async function addCommentAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      addRenewalComment({
        maintenanceRenewalId: text(formData, "maintenanceRenewalId"),
        body: text(formData, "body"),
      }),
    "Comment added."
  );
}

export async function createNextCycleAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      createNextRenewalCycle({
        sourceRenewalId: text(formData, "sourceRenewalId"),
        fiscalYearId: text(formData, "fiscalYearId"),
        budgetPlanId: text(formData, "budgetPlanId"),
        renewalDate: text(formData, "renewalDate"),
        renewalExpirationDate: text(formData, "renewalExpirationDate"),
      }),
    "Next renewal cycle created."
  );
}
