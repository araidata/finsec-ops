-- Maintenance Renewals register: retain legacy workflow data for history while
-- exposing a smaller operational status surface and explicit co-op snapshots.
ALTER TYPE "MaintenanceRenewalStatus" ADD VALUE IF NOT EXISTS 'COMPLETE';
ALTER TYPE "MaintenanceRenewalStatus" ADD VALUE IF NOT EXISTS 'REPLACE';
ALTER TYPE "MaintenanceRenewalStatus" ADD VALUE IF NOT EXISTS 'DECOMMISSION';

ALTER TABLE "MaintenanceRenewal"
  ADD COLUMN IF NOT EXISTS "coOpAgreement" TEXT,
  ADD COLUMN IF NOT EXISTS "coOpContractNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "coOpAgreementExpirationDate" DATE;

UPDATE "MaintenanceRenewal" renewal
SET
  "coOpAgreement" = vehicle."name",
  "coOpContractNumber" = COALESCE(
    (
      SELECT agreement."sellerAwardNumber"
      FROM "PurchasingVehicleSeller" agreement
      WHERE agreement."id" = renewal."purchasingAgreementId"
    ),
    vehicle."contractNumber"
  ),
  "coOpAgreementExpirationDate" = COALESCE(
    (
      SELECT agreement."endsOn"
      FROM "PurchasingVehicleSeller" agreement
      WHERE agreement."id" = renewal."purchasingAgreementId"
    ),
    vehicle."endsOn"
  )
FROM "PurchasingVehicle" vehicle
WHERE renewal."purchasingVehicleId" = vehicle."id"
  AND renewal."coOpAgreement" IS NULL;

-- Compatibility mapping for historical workflow stages removed from the
-- register's selectable status model. The original stage values remain in the
-- enum so old audit records can still be interpreted safely.
UPDATE "MaintenanceRenewal"
SET "workflowStage" = CASE
  WHEN "workflowStage" IN ('REQUIREMENTS_VALIDATION', 'USAGE_VALUE_REVIEW', 'DISPOSITION_RECOMMENDATION', 'DISPOSITION_APPROVAL')
    THEN 'RENEWAL_REVIEW'::"MaintenanceRenewalWorkflowStage"
  WHEN "workflowStage" = 'QUOTE_NEGOTIATION'
    THEN 'QUOTE_RECEIVED'::"MaintenanceRenewalWorkflowStage"
  WHEN "workflowStage" = 'FUNDING_CONFIRMATION'
    THEN 'PURCHASING_REVIEW'::"MaintenanceRenewalWorkflowStage"
  WHEN "workflowStage" = 'MANAGEMENT_APPROVAL'
    THEN 'PURCHASING_REVIEW'::"MaintenanceRenewalWorkflowStage"
  ELSE "workflowStage"
END
WHERE "workflowStage" IN (
  'REQUIREMENTS_VALIDATION',
  'USAGE_VALUE_REVIEW',
  'DISPOSITION_RECOMMENDATION',
  'DISPOSITION_APPROVAL',
  'QUOTE_NEGOTIATION',
  'FUNDING_CONFIRMATION',
  'MANAGEMENT_APPROVAL'
);

CREATE INDEX IF NOT EXISTS "MaintenanceRenewal_coOpAgreementExpirationDate_idx"
  ON "MaintenanceRenewal"("coOpAgreementExpirationDate");
