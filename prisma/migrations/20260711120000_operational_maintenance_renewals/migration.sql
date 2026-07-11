-- CreateEnum
CREATE TYPE "MaintenanceRenewalOverallStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'NOT_RENEWING', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MaintenanceRenewalWorkflowStage" AS ENUM ('NOT_STARTED', 'RENEWAL_REVIEW', 'REQUIREMENTS_VALIDATION', 'USAGE_VALUE_REVIEW', 'DISPOSITION_RECOMMENDATION', 'DISPOSITION_APPROVAL', 'QUOTE_REQUESTED', 'QUOTE_RECEIVED', 'QUOTE_NEGOTIATION', 'FUNDING_CONFIRMATION', 'COURT_BRIEF_PREPARATION', 'MANAGEMENT_APPROVAL', 'PURCHASING_REVIEW', 'LEGAL_REVIEW', 'COMMISSIONERS_COURT_SUBMISSION', 'PURCHASE_ORDER_PENDING', 'ORDER_PLACED', 'INVOICE_RECEIVED', 'PAYMENT_PROCESSING', 'REPLACEMENT_MIGRATION', 'DECOMMISSIONING', 'COMPLETED', 'CANCELLED_NOT_RENEWING');

-- CreateEnum
CREATE TYPE "MaintenanceRenewalStageStatus" AS ENUM ('REQUIRED', 'OPTIONAL', 'SKIPPED', 'NOT_APPLICABLE', 'REOPENED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "MaintenanceRenewalTaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'SKIPPED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "MaintenanceRenewalRiskStatus" AS ENUM ('ON_TRACK', 'ATTENTION_REQUIRED', 'AT_RISK', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MaintenanceRenewalFundingStatus" AS ENUM ('NOT_STARTED', 'IDENTIFIED', 'CONFIRMED', 'APPROVED', 'PARTIALLY_FUNDED', 'UNFUNDED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "MaintenanceRenewalQuoteStatus" AS ENUM ('NOT_REQUESTED', 'REQUESTED', 'RECEIVED', 'IN_NEGOTIATION', 'FINAL_SELECTED', 'EXPIRED', 'NOT_REQUIRED');

-- CreateEnum
CREATE TYPE "RenewalDisposition" AS ENUM ('REVIEW_REQUIRED', 'DECISION_PENDING', 'RENEW_AS_IS', 'RENEW_WITH_CHANGES', 'RENEGOTIATE', 'REPLACE', 'CONSOLIDATE', 'EXTEND_TEMPORARILY', 'DECOMMISSION', 'DO_NOT_RENEW');

-- CreateEnum
CREATE TYPE "RenewalDecisionStatus" AS ENUM ('NOT_STARTED', 'UNDER_REVIEW', 'RECOMMENDATION_SUBMITTED', 'APPROVED', 'REJECTED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "MaintenanceRenewalPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- DropIndex
DROP INDEX "MaintenanceRenewal_fiscalYearId_renewalStatus_idx";

-- AlterTable
ALTER TABLE "MaintenanceRenewal" ADD COLUMN     "approvalDate" DATE,
ADD COLUMN     "approvalRationale" TEXT,
ADD COLUMN     "approvedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "approvedDisposition" "RenewalDisposition",
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "budgetItemId" TEXT,
ADD COLUMN     "budgetLineItemId" TEXT,
ADD COLUMN     "businessOwner" TEXT,
ADD COLUMN     "cancellationNoticeDeadline" DATE,
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "capabilityOwner" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "conditionsOfApproval" TEXT,
ADD COLUMN     "contractOwner" TEXT,
ADD COLUMN     "costCenter" TEXT,
ADD COLUMN     "criticality" "Criticality" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "currentContractEnd" DATE,
ADD COLUMN     "currentContractStart" DATE,
ADD COLUMN     "decisionConfidence" TEXT,
ADD COLUMN     "decisionDueDate" DATE,
ADD COLUMN     "decisionOwner" TEXT,
ADD COLUMN     "decisionRationale" TEXT,
ADD COLUMN     "decisionStatus" "RenewalDecisionStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "decommissioningRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "deploymentId" TEXT,
ADD COLUMN     "finalPurchaseAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "forecastedRenewalCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "fundingSource" TEXT,
ADD COLUMN     "fundingStatus" "MaintenanceRenewalFundingStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "invoiceDate" DATE,
ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "nextAction" TEXT,
ADD COLUMN     "nextActionDueDate" DATE,
ADD COLUMN     "nextActionOwner" TEXT,
ADD COLUMN     "nextReviewDate" DATE,
ADD COLUMN     "overallStatus" "MaintenanceRenewalOverallStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "paymentDate" DATE,
ADD COLUMN     "paymentStatus" "PaymentStatus",
ADD COLUMN     "priority" "MaintenanceRenewalPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "productOwner" TEXT,
ADD COLUMN     "purchaseOrderAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "purchasingAgreementId" TEXT,
ADD COLUMN     "purchasingVehicleId" TEXT,
ADD COLUMN     "quoteStatus" "MaintenanceRenewalQuoteStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
ADD COLUMN     "recommendationDate" DATE,
ADD COLUMN     "recommendationRationale" TEXT,
ADD COLUMN     "recommendationSubmittedBy" TEXT,
ADD COLUMN     "recommendedDisposition" "RenewalDisposition" NOT NULL DEFAULT 'DECISION_PENDING',
ADD COLUMN     "renewalEffectiveDate" DATE,
ADD COLUMN     "renewalExpirationDate" DATE,
ADD COLUMN     "renewalName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "renewalNumber" TEXT,
ADD COLUMN     "renewalTerm" TEXT,
ADD COLUMN     "replacementProductId" TEXT,
ADD COLUMN     "replacementProject" TEXT,
ADD COLUMN     "replacementRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "riskStatus" "MaintenanceRenewalRiskStatus" NOT NULL DEFAULT 'ON_TRACK',
ADD COLUMN     "securityCapabilityId" TEXT,
ADD COLUMN     "targetDecommissionDate" DATE,
ADD COLUMN     "targetReplacementDate" DATE,
ADD COLUMN     "temporaryExtensionReason" TEXT,
ADD COLUMN     "temporaryExtensionTerm" TEXT,
ADD COLUMN     "workflowStage" "MaintenanceRenewalWorkflowStage" NOT NULL DEFAULT 'NOT_STARTED';

UPDATE "MaintenanceRenewal"
SET
    "renewalName" = COALESCE(NULLIF("productOrService", ''), 'Maintenance Renewal'),
    "currentContractStart" = COALESCE("currentContractStart", "contractStart"),
    "currentContractEnd" = COALESCE("currentContractEnd", "contractEnd"),
    "cancellationNoticeDeadline" = COALESCE("cancellationNoticeDeadline", "noticeDate"),
    "forecastedRenewalCost" = COALESCE(NULLIF("negotiatedCost", 0), "renewalQuote", "currentAnnualCost"),
    "approvedAmount" = COALESCE(NULLIF("negotiatedCost", 0), "renewalQuote", "currentAnnualCost")
WHERE "renewalName" = '';

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "maintenanceRenewalId" TEXT;

-- AlterTable
ALTER TABLE "PurchaseRequest" ADD COLUMN     "maintenanceRenewalId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "maintenanceRenewalId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "maintenanceRenewalId" TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "maintenanceRenewalId" TEXT;

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "maintenanceRenewalId" TEXT;

-- CreateTable
CREATE TABLE "MaintenanceRenewalQuote" (
    "id" TEXT NOT NULL,
    "maintenanceRenewalId" TEXT NOT NULL,
    "quoteNumber" TEXT,
    "versionLabel" TEXT,
    "status" "MaintenanceRenewalQuoteStatus" NOT NULL DEFAULT 'RECEIVED',
    "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "receivedOn" DATE,
    "expiresOn" DATE,
    "selectedFinal" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "notesText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRenewalQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRenewalWorkflowStep" (
    "id" TEXT NOT NULL,
    "maintenanceRenewalId" TEXT NOT NULL,
    "stage" "MaintenanceRenewalWorkflowStage" NOT NULL,
    "status" "MaintenanceRenewalStageStatus" NOT NULL DEFAULT 'REQUIRED',
    "owner" TEXT,
    "startedAt" TIMESTAMP(3),
    "dueOn" DATE,
    "completedAt" TIMESTAMP(3),
    "skipReason" TEXT,
    "blockers" TEXT,
    "notesText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRenewalWorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRenewalTask" (
    "id" TEXT NOT NULL,
    "maintenanceRenewalId" TEXT NOT NULL,
    "stage" "MaintenanceRenewalWorkflowStage",
    "title" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT,
    "status" "MaintenanceRenewalTaskStatus" NOT NULL DEFAULT 'OPEN',
    "dueOn" DATE,
    "completedAt" TIMESTAMP(3),
    "notApplicableReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRenewalTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRenewalFundingAllocation" (
    "id" TEXT NOT NULL,
    "maintenanceRenewalId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "costCenter" TEXT,
    "fundingSource" TEXT,
    "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "notesText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRenewalFundingAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRenewalDecisionHistory" (
    "id" TEXT NOT NULL,
    "maintenanceRenewalId" TEXT NOT NULL,
    "recommendedDisposition" "RenewalDisposition",
    "approvedDisposition" "RenewalDisposition",
    "decisionStatus" "RenewalDecisionStatus" NOT NULL,
    "changedBy" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rationale" TEXT,
    "conditionsOfApproval" TEXT,

    CONSTRAINT "MaintenanceRenewalDecisionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRenewalReplacementPlan" (
    "id" TEXT NOT NULL,
    "maintenanceRenewalId" TEXT NOT NULL,
    "replacementProductId" TEXT,
    "replacementProject" TEXT,
    "replacementOwner" TEXT,
    "migrationOwner" TEXT,
    "targetReplacementDate" DATE,
    "transitionPlan" TEXT,
    "transitionRisk" TEXT,
    "contractOverlapRequired" BOOLEAN NOT NULL DEFAULT false,
    "overlapCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "dataMigrationRequired" BOOLEAN NOT NULL DEFAULT false,
    "integrationMigrationRequired" BOOLEAN NOT NULL DEFAULT false,
    "status" "MaintenanceRenewalTaskStatus" NOT NULL DEFAULT 'OPEN',
    "notesText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRenewalReplacementPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRenewalDecommissionPlan" (
    "id" TEXT NOT NULL,
    "maintenanceRenewalId" TEXT NOT NULL,
    "decommissionOwner" TEXT,
    "businessOwner" TEXT,
    "technicalOwner" TEXT,
    "targetDecommissionDate" DATE,
    "actualDecommissionDate" DATE,
    "completionEvidence" TEXT,
    "notesText" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRenewalDecommissionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRenewalDecommissionTask" (
    "id" TEXT NOT NULL,
    "decommissionPlanId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "status" "MaintenanceRenewalTaskStatus" NOT NULL DEFAULT 'OPEN',
    "owner" TEXT,
    "dueOn" DATE,
    "completedAt" TIMESTAMP(3),
    "notApplicableReason" TEXT,
    "notesText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRenewalDecommissionTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MaintenanceRenewalProductModules" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MaintenanceRenewalProductModules_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MaintenanceRenewalProductFeatures" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MaintenanceRenewalProductFeatures_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "MaintenanceRenewalQuote_maintenanceRenewalId_idx" ON "MaintenanceRenewalQuote"("maintenanceRenewalId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalQuote_status_idx" ON "MaintenanceRenewalQuote"("status");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalQuote_expiresOn_idx" ON "MaintenanceRenewalQuote"("expiresOn");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalWorkflowStep_stage_status_idx" ON "MaintenanceRenewalWorkflowStep"("stage", "status");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalWorkflowStep_dueOn_idx" ON "MaintenanceRenewalWorkflowStep"("dueOn");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceRenewalWorkflowStep_maintenanceRenewalId_stage_key" ON "MaintenanceRenewalWorkflowStep"("maintenanceRenewalId", "stage");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalTask_maintenanceRenewalId_idx" ON "MaintenanceRenewalTask"("maintenanceRenewalId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalTask_status_idx" ON "MaintenanceRenewalTask"("status");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalTask_dueOn_idx" ON "MaintenanceRenewalTask"("dueOn");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalFundingAllocation_maintenanceRenewalId_idx" ON "MaintenanceRenewalFundingAllocation"("maintenanceRenewalId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalFundingAllocation_department_idx" ON "MaintenanceRenewalFundingAllocation"("department");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalFundingAllocation_costCenter_idx" ON "MaintenanceRenewalFundingAllocation"("costCenter");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalDecisionHistory_maintenanceRenewalId_idx" ON "MaintenanceRenewalDecisionHistory"("maintenanceRenewalId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalDecisionHistory_decisionStatus_idx" ON "MaintenanceRenewalDecisionHistory"("decisionStatus");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalDecisionHistory_changedAt_idx" ON "MaintenanceRenewalDecisionHistory"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceRenewalReplacementPlan_maintenanceRenewalId_key" ON "MaintenanceRenewalReplacementPlan"("maintenanceRenewalId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalReplacementPlan_replacementProductId_idx" ON "MaintenanceRenewalReplacementPlan"("replacementProductId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalReplacementPlan_targetReplacementDate_idx" ON "MaintenanceRenewalReplacementPlan"("targetReplacementDate");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceRenewalDecommissionPlan_maintenanceRenewalId_key" ON "MaintenanceRenewalDecommissionPlan"("maintenanceRenewalId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalDecommissionPlan_targetDecommissionDate_idx" ON "MaintenanceRenewalDecommissionPlan"("targetDecommissionDate");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalDecommissionPlan_completed_idx" ON "MaintenanceRenewalDecommissionPlan"("completed");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalDecommissionTask_decommissionPlanId_idx" ON "MaintenanceRenewalDecommissionTask"("decommissionPlanId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalDecommissionTask_status_idx" ON "MaintenanceRenewalDecommissionTask"("status");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalDecommissionTask_dueOn_idx" ON "MaintenanceRenewalDecommissionTask"("dueOn");

-- CreateIndex
CREATE INDEX "_MaintenanceRenewalProductModules_B_index" ON "_MaintenanceRenewalProductModules"("B");

-- CreateIndex
CREATE INDEX "_MaintenanceRenewalProductFeatures_B_index" ON "_MaintenanceRenewalProductFeatures"("B");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceRenewal_renewalNumber_key" ON "MaintenanceRenewal"("renewalNumber");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_fiscalYearId_overallStatus_idx" ON "MaintenanceRenewal"("fiscalYearId", "overallStatus");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_fiscalYearId_workflowStage_idx" ON "MaintenanceRenewal"("fiscalYearId", "workflowStage");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_renewalExpirationDate_idx" ON "MaintenanceRenewal"("renewalExpirationDate");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_productId_idx" ON "MaintenanceRenewal"("productId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_contractId_idx" ON "MaintenanceRenewal"("contractId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_deploymentId_idx" ON "MaintenanceRenewal"("deploymentId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_riskStatus_idx" ON "MaintenanceRenewal"("riskStatus");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_fundingStatus_idx" ON "MaintenanceRenewal"("fundingStatus");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_quoteStatus_idx" ON "MaintenanceRenewal"("quoteStatus");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_recommendedDisposition_idx" ON "MaintenanceRenewal"("recommendedDisposition");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_approvedDisposition_idx" ON "MaintenanceRenewal"("approvedDisposition");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_decisionStatus_idx" ON "MaintenanceRenewal"("decisionStatus");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_decisionDueDate_idx" ON "MaintenanceRenewal"("decisionDueDate");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_targetDecommissionDate_idx" ON "MaintenanceRenewal"("targetDecommissionDate");

-- CreateIndex
CREATE INDEX "Purchase_maintenanceRenewalId_idx" ON "Purchase"("maintenanceRenewalId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_maintenanceRenewalId_idx" ON "PurchaseRequest"("maintenanceRenewalId");

-- CreateIndex
CREATE INDEX "Invoice_maintenanceRenewalId_idx" ON "Invoice"("maintenanceRenewalId");

-- CreateIndex
CREATE INDEX "Payment_maintenanceRenewalId_idx" ON "Payment"("maintenanceRenewalId");

-- CreateIndex
CREATE INDEX "Document_maintenanceRenewalId_idx" ON "Document"("maintenanceRenewalId");

-- CreateIndex
CREATE INDEX "Note_maintenanceRenewalId_idx" ON "Note"("maintenanceRenewalId");

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "BudgetItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_budgetLineItemId_fkey" FOREIGN KEY ("budgetLineItemId") REFERENCES "BudgetLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_purchasingVehicleId_fkey" FOREIGN KEY ("purchasingVehicleId") REFERENCES "PurchasingVehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_purchasingAgreementId_fkey" FOREIGN KEY ("purchasingAgreementId") REFERENCES "PurchasingVehicleSeller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_replacementProductId_fkey" FOREIGN KEY ("replacementProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "Deployment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_securityCapabilityId_fkey" FOREIGN KEY ("securityCapabilityId") REFERENCES "Capability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewalQuote" ADD CONSTRAINT "MaintenanceRenewalQuote_maintenanceRenewalId_fkey" FOREIGN KEY ("maintenanceRenewalId") REFERENCES "MaintenanceRenewal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewalWorkflowStep" ADD CONSTRAINT "MaintenanceRenewalWorkflowStep_maintenanceRenewalId_fkey" FOREIGN KEY ("maintenanceRenewalId") REFERENCES "MaintenanceRenewal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewalTask" ADD CONSTRAINT "MaintenanceRenewalTask_maintenanceRenewalId_fkey" FOREIGN KEY ("maintenanceRenewalId") REFERENCES "MaintenanceRenewal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewalFundingAllocation" ADD CONSTRAINT "MaintenanceRenewalFundingAllocation_maintenanceRenewalId_fkey" FOREIGN KEY ("maintenanceRenewalId") REFERENCES "MaintenanceRenewal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewalDecisionHistory" ADD CONSTRAINT "MaintenanceRenewalDecisionHistory_maintenanceRenewalId_fkey" FOREIGN KEY ("maintenanceRenewalId") REFERENCES "MaintenanceRenewal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewalReplacementPlan" ADD CONSTRAINT "MaintenanceRenewalReplacementPlan_maintenanceRenewalId_fkey" FOREIGN KEY ("maintenanceRenewalId") REFERENCES "MaintenanceRenewal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewalReplacementPlan" ADD CONSTRAINT "MaintenanceRenewalReplacementPlan_replacementProductId_fkey" FOREIGN KEY ("replacementProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewalDecommissionPlan" ADD CONSTRAINT "MaintenanceRenewalDecommissionPlan_maintenanceRenewalId_fkey" FOREIGN KEY ("maintenanceRenewalId") REFERENCES "MaintenanceRenewal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewalDecommissionTask" ADD CONSTRAINT "MaintenanceRenewalDecommissionTask_decommissionPlanId_fkey" FOREIGN KEY ("decommissionPlanId") REFERENCES "MaintenanceRenewalDecommissionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_maintenanceRenewalId_fkey" FOREIGN KEY ("maintenanceRenewalId") REFERENCES "MaintenanceRenewal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_maintenanceRenewalId_fkey" FOREIGN KEY ("maintenanceRenewalId") REFERENCES "MaintenanceRenewal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_maintenanceRenewalId_fkey" FOREIGN KEY ("maintenanceRenewalId") REFERENCES "MaintenanceRenewal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_maintenanceRenewalId_fkey" FOREIGN KEY ("maintenanceRenewalId") REFERENCES "MaintenanceRenewal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_maintenanceRenewalId_fkey" FOREIGN KEY ("maintenanceRenewalId") REFERENCES "MaintenanceRenewal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_maintenanceRenewalId_fkey" FOREIGN KEY ("maintenanceRenewalId") REFERENCES "MaintenanceRenewal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MaintenanceRenewalProductModules" ADD CONSTRAINT "_MaintenanceRenewalProductModules_A_fkey" FOREIGN KEY ("A") REFERENCES "MaintenanceRenewal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MaintenanceRenewalProductModules" ADD CONSTRAINT "_MaintenanceRenewalProductModules_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MaintenanceRenewalProductFeatures" ADD CONSTRAINT "_MaintenanceRenewalProductFeatures_A_fkey" FOREIGN KEY ("A") REFERENCES "MaintenanceRenewal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MaintenanceRenewalProductFeatures" ADD CONSTRAINT "_MaintenanceRenewalProductFeatures_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductFeature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
