-- Product Catalog taxonomy refactor.
-- Preserve existing ProductModule/ProductFeature tables for data continuity while
-- adding fields needed to present them as Product Components and Functions.

DO $$ BEGIN
  CREATE TYPE "ProductComponentType" AS ENUM (
    'MODULE',
    'ADD_ON',
    'LICENSE_TIER',
    'SERVICE',
    'SUPPORT',
    'CAPACITY',
    'RETENTION',
    'TRAINING',
    'HARDWARE',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CatalogLifecycleStatus" AS ENUM (
    'PLANNED',
    'EVALUATING',
    'ACTIVE',
    'RETIRING',
    'RETIRED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CapabilityAllocationMethod" AS ENUM (
    'DIRECT',
    'USER_ALLOCATED',
    'EQUAL',
    'PRIMARY_CAPABILITY',
    'UNALLOCATED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "ProductModule"
  ADD COLUMN IF NOT EXISTS "componentType" "ProductComponentType" NOT NULL DEFAULT 'MODULE',
  ADD COLUMN IF NOT EXISTS "sku" TEXT,
  ADD COLUMN IF NOT EXISTS "licenseMetric" "LicenseMetric",
  ADD COLUMN IF NOT EXISTS "separatelyPurchasable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "separatelyRenewable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "purpose" TEXT,
  ADD COLUMN IF NOT EXISTS "lifecycleStatus" "CatalogLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "planningEstimate" DECIMAL(14, 2) NOT NULL DEFAULT 0;

ALTER TABLE "ProductFeature"
  ADD COLUMN IF NOT EXISTS "relatedCapabilityId" TEXT,
  ADD COLUMN IF NOT EXISTS "strategicImportance" "StrategicValue",
  ADD COLUMN IF NOT EXISTS "notesText" TEXT;

ALTER TABLE "ProductCapability"
  ADD COLUMN IF NOT EXISTS "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "allocationMethod" "CapabilityAllocationMethod" NOT NULL DEFAULT 'UNALLOCATED',
  ADD COLUMN IF NOT EXISTS "allocationGuidance" TEXT,
  ADD COLUMN IF NOT EXISTS "notesText" TEXT;

ALTER TABLE "ProductModuleCapability"
  ADD COLUMN IF NOT EXISTS "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "allocationMethod" "CapabilityAllocationMethod" NOT NULL DEFAULT 'UNALLOCATED',
  ADD COLUMN IF NOT EXISTS "allocationGuidance" TEXT,
  ADD COLUMN IF NOT EXISTS "notesText" TEXT;

DO $$ BEGIN
  ALTER TABLE "ProductFeature"
    ADD CONSTRAINT "ProductFeature_relatedCapabilityId_fkey"
    FOREIGN KEY ("relatedCapabilityId") REFERENCES "Capability"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "ProductModule_componentType_idx" ON "ProductModule"("componentType");
CREATE INDEX IF NOT EXISTS "ProductModule_lifecycleStatus_idx" ON "ProductModule"("lifecycleStatus");
CREATE INDEX IF NOT EXISTS "ProductFeature_relatedCapabilityId_idx" ON "ProductFeature"("relatedCapabilityId");
