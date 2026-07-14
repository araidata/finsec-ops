-- Expand the controlled deployment status set without removing legacy values.
ALTER TYPE "DeploymentStatus" ADD VALUE IF NOT EXISTS 'NOT_STARTED';
ALTER TYPE "DeploymentStatus" ADD VALUE IF NOT EXISTS 'PLANNING';
ALTER TYPE "DeploymentStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE "DeploymentStatus" ADD VALUE IF NOT EXISTS 'DEPLOYED';
ALTER TYPE "DeploymentStatus" ADD VALUE IF NOT EXISTS 'ON_HOLD';

-- Stage Deployment as a ContractLineItem-backed workspace while preserving
-- legacy PurchaseItem-linked deployment and usage records for compatibility.
ALTER TABLE "Deployment"
  ADD COLUMN "contractLineItemId" TEXT,
  ADD COLUMN "owner" TEXT,
  ADD COLUMN "utilizationPercent" DECIMAL(5,2),
  ADD COLUMN "licensedQuantity" INTEGER,
  ADD COLUMN "activeUsageQuantity" INTEGER;

ALTER TABLE "Deployment"
  ALTER COLUMN "purchaseItemId" DROP NOT NULL;

ALTER TABLE "Deployment"
  DROP CONSTRAINT IF EXISTS "Deployment_purchaseItemId_fkey";

ALTER TABLE "Deployment"
  ADD CONSTRAINT "Deployment_purchaseItemId_fkey"
  FOREIGN KEY ("purchaseItemId") REFERENCES "PurchaseItem"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Deployment"
  ADD CONSTRAINT "Deployment_contractLineItemId_fkey"
  FOREIGN KEY ("contractLineItemId") REFERENCES "ContractLineItem"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "Deployment" d
SET
  "contractLineItemId" = cli."id",
  "licensedQuantity" = COALESCE(d."targetPopulation", FLOOR(COALESCE(pi."quantity", 0))::INTEGER),
  "owner" = COALESCE(d."department", d."scopeName")
FROM "PurchaseItem" pi
JOIN "Purchase" p ON p."id" = pi."purchaseId"
JOIN "ContractLineItem" cli
  ON cli."contractId" = p."contractId"
  AND cli."productId" = pi."productId"
  AND (
    cli."productModuleId" = pi."productModuleId"
    OR (cli."productModuleId" IS NULL AND pi."productModuleId" IS NULL)
  )
WHERE d."purchaseItemId" = pi."id"
  AND d."contractLineItemId" IS NULL;

UPDATE "Deployment" d
SET
  "licensedQuantity" = COALESCE(d."licensedQuantity", latest."licensedCount"),
  "deployedPopulation" = COALESCE(d."deployedPopulation", latest."deployedCount"),
  "activeUsageQuantity" = latest."activeUsageCount",
  "utilizationPercent" = latest."utilizationPercent"
FROM (
  SELECT DISTINCT ON ("deploymentId")
    "deploymentId",
    "licensedCount",
    "deployedCount",
    "activeUsageCount",
    "utilizationPercent"
  FROM "UsageMeasurement"
  ORDER BY "deploymentId", "measuredAt" DESC
) latest
WHERE d."id" = latest."deploymentId";

CREATE INDEX "Deployment_contractLineItemId_idx" ON "Deployment"("contractLineItemId");
CREATE INDEX "Deployment_department_idx" ON "Deployment"("department");
CREATE INDEX "Deployment_owner_idx" ON "Deployment"("owner");
