-- Small compatibility corrections for the database-backed Product Catalog and Purchases UI.

CREATE TYPE "SellerRelationshipType" AS ENUM (
  'DIRECT_VENDOR',
  'RESELLER',
  'SERVICE_PROVIDER',
  'MARKETPLACE',
  'OTHER'
);

ALTER TABLE "ProductSeller"
  ADD COLUMN "relationshipType" "SellerRelationshipType" NOT NULL DEFAULT 'RESELLER';

ALTER TABLE "PurchasingVehicleSeller"
  ADD COLUMN "title" TEXT,
  ADD COLUMN "startsOn" DATE,
  ADD COLUMN "endsOn" DATE;

ALTER TABLE "Purchase"
  ADD COLUMN "purchasingAgreementId" TEXT;

ALTER TABLE "UsageMeasurement"
  ADD COLUMN "licensedCount" INTEGER,
  ADD COLUMN "deployedCount" INTEGER;

CREATE INDEX "ProductSeller_relationshipType_idx" ON "ProductSeller"("relationshipType");
CREATE INDEX "PurchasingVehicleSeller_endsOn_idx" ON "PurchasingVehicleSeller"("endsOn");
CREATE INDEX "Purchase_purchasingAgreementId_idx" ON "Purchase"("purchasingAgreementId");

ALTER TABLE "Purchase"
  ADD CONSTRAINT "Purchase_purchasingAgreementId_fkey"
  FOREIGN KEY ("purchasingAgreementId")
  REFERENCES "PurchasingVehicleSeller"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
