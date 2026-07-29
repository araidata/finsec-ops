ALTER TABLE "Deployment"
ADD COLUMN "maintenanceRenewalId" TEXT,
ADD COLUMN "maintenanceRenewalLineItemId" TEXT;

CREATE INDEX "Deployment_maintenanceRenewalId_idx"
ON "Deployment"("maintenanceRenewalId");

CREATE INDEX "Deployment_maintenanceRenewalLineItemId_idx"
ON "Deployment"("maintenanceRenewalLineItemId");

ALTER TABLE "Deployment"
ADD CONSTRAINT "Deployment_maintenanceRenewalId_fkey"
FOREIGN KEY ("maintenanceRenewalId") REFERENCES "MaintenanceRenewal"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Deployment"
ADD CONSTRAINT "Deployment_maintenanceRenewalLineItemId_fkey"
FOREIGN KEY ("maintenanceRenewalLineItemId") REFERENCES "MaintenanceRenewalLineItem"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
