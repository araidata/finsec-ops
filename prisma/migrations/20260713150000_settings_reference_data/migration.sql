DO $$ BEGIN
  CREATE TYPE "FiscalYearStatus" AS ENUM ('PLANNING', 'OPEN', 'CLOSED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "OrganizationSettings" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "shortName" TEXT,
  "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
  "currentFiscalYearId" TEXT,
  "fiscalYearStartMonth" INTEGER NOT NULL DEFAULT 7,
  "defaultTimezone" TEXT NOT NULL DEFAULT 'America/Chicago',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Department" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TeamMember" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "jobTitle" TEXT,
  "departmentId" TEXT,
  "email" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExpenseTypeOption" (
  "id" TEXT NOT NULL,
  "key" "ExpenseType" NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExpenseTypeOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PaymentFrequencyOption" (
  "id" TEXT NOT NULL,
  "key" "PaymentFrequency" NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentFrequencyOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LicenseMetricOption" (
  "id" TEXT NOT NULL,
  "key" "LicenseMetric" NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LicenseMetricOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DeploymentEnvironment" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeploymentEnvironment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RenewalPriorityOption" (
  "id" TEXT NOT NULL,
  "key" "MaintenanceRenewalPriority" NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RenewalPriorityOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RenewalDecisionReason" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "applicableDisposition" "RenewalDisposition",
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RenewalDecisionReason_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FiscalYear"
  ADD COLUMN IF NOT EXISTS "status" "FiscalYearStatus" NOT NULL DEFAULT 'PLANNING',
  ADD COLUMN IF NOT EXISTS "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "planningEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "BudgetCategory"
  ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "PurchasingVehicle"
  ADD COLUMN IF NOT EXISTS "description" TEXT;

ALTER TABLE "BudgetItem"
  ADD COLUMN IF NOT EXISTS "departmentId" TEXT,
  ADD COLUMN IF NOT EXISTS "ownerTeamMemberId" TEXT;

ALTER TABLE "BudgetLineItem"
  ADD COLUMN IF NOT EXISTS "departmentId" TEXT,
  ADD COLUMN IF NOT EXISTS "ownerTeamMemberId" TEXT;

ALTER TABLE "Contract"
  ADD COLUMN IF NOT EXISTS "departmentId" TEXT,
  ADD COLUMN IF NOT EXISTS "ownerTeamMemberId" TEXT;

ALTER TABLE "MaintenanceRenewal"
  ADD COLUMN IF NOT EXISTS "departmentId" TEXT,
  ADD COLUMN IF NOT EXISTS "ownerTeamMemberId" TEXT;

ALTER TABLE "Deployment"
  ADD COLUMN IF NOT EXISTS "departmentId" TEXT,
  ADD COLUMN IF NOT EXISTS "ownerTeamMemberId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Department_name_key" ON "Department"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "TeamMember_email_key" ON "TeamMember"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "ExpenseTypeOption_key_key" ON "ExpenseTypeOption"("key");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentFrequencyOption_key_key" ON "PaymentFrequencyOption"("key");
CREATE UNIQUE INDEX IF NOT EXISTS "LicenseMetricOption_key_key" ON "LicenseMetricOption"("key");
CREATE UNIQUE INDEX IF NOT EXISTS "DeploymentEnvironment_name_key" ON "DeploymentEnvironment"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "RenewalPriorityOption_key_key" ON "RenewalPriorityOption"("key");
CREATE UNIQUE INDEX IF NOT EXISTS "RenewalDecisionReason_name_key" ON "RenewalDecisionReason"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "FiscalYear_one_current_idx" ON "FiscalYear"("isCurrent") WHERE "isCurrent" = true;

UPDATE "FiscalYear"
SET
  "status" = CASE
    WHEN "endsOn" < CURRENT_DATE THEN 'CLOSED'::"FiscalYearStatus"
    WHEN "startsOn" <= CURRENT_DATE AND "endsOn" >= CURRENT_DATE THEN 'OPEN'::"FiscalYearStatus"
    ELSE 'PLANNING'::"FiscalYearStatus"
  END,
  "planningEnabled" = "endsOn" >= CURRENT_DATE,
  "active" = true;

UPDATE "FiscalYear"
SET "isCurrent" = true
WHERE "id" = (
  SELECT "id"
  FROM "FiscalYear"
  WHERE "startsOn" <= CURRENT_DATE AND "endsOn" >= CURRENT_DATE
  ORDER BY "startsOn" DESC
  LIMIT 1
);

UPDATE "FiscalYear"
SET "isCurrent" = true
WHERE NOT EXISTS (SELECT 1 FROM "FiscalYear" WHERE "isCurrent" = true)
  AND "id" = (SELECT "id" FROM "FiscalYear" ORDER BY "startsOn" DESC LIMIT 1);

INSERT INTO "Department" ("id", "name", "active", "updatedAt")
VALUES
  ('dept-it-operations', 'IT Operations', true, CURRENT_TIMESTAMP),
  ('dept-information-security', 'Information Security', true, CURRENT_TIMESTAMP),
  ('dept-finance', 'Finance', true, CURRENT_TIMESTAMP),
  ('dept-human-resources', 'Human Resources', true, CURRENT_TIMESTAMP),
  ('dept-purchasing', 'Purchasing', true, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "Department" ("id", "name", "active", "updatedAt")
SELECT DISTINCT
  'dept-' || substr(md5(lower(trim(value))), 1, 24),
  trim(value),
  true,
  CURRENT_TIMESTAMP
FROM (
  SELECT "department" AS value FROM "MaintenanceRenewal"
  UNION
  SELECT "department" AS value FROM "Deployment"
) existing
WHERE value IS NOT NULL
  AND trim(value) <> ''
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "TeamMember" ("id", "fullName", "jobTitle", "email", "active", "updatedAt")
SELECT
  "id",
  "name",
  "role",
  lower("email"),
  true,
  CURRENT_TIMESTAMP
FROM "User"
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "TeamMember" ("id", "fullName", "email", "active", "updatedAt")
SELECT DISTINCT
  'tm-' || substr(md5(lower(trim(value))), 1, 24),
  trim(value),
  lower(regexp_replace(trim(value), '[^a-zA-Z0-9]+', '.', 'g')) || '@reference.local',
  true,
  CURRENT_TIMESTAMP
FROM (
  SELECT "owner" AS value FROM "BudgetItem"
  UNION
  SELECT "owner" AS value FROM "BudgetAnnualFinancial"
  UNION
  SELECT "contractOwner" AS value FROM "Contract"
  UNION
  SELECT "businessOwner" AS value FROM "Contract"
  UNION
  SELECT "renewalOwner" AS value FROM "MaintenanceRenewal"
  UNION
  SELECT "businessOwner" AS value FROM "MaintenanceRenewal"
  UNION
  SELECT "owner" AS value FROM "Deployment"
) existing
WHERE value IS NOT NULL
  AND trim(value) <> ''
ON CONFLICT ("email") DO NOTHING;

UPDATE "MaintenanceRenewal" mr
SET "departmentId" = d."id"
FROM "Department" d
WHERE mr."department" IS NOT NULL
  AND lower(trim(mr."department")) = lower(d."name");

UPDATE "Deployment" dep
SET "departmentId" = d."id"
FROM "Department" d
WHERE dep."department" IS NOT NULL
  AND lower(trim(dep."department")) = lower(d."name");

UPDATE "BudgetItem" item
SET "ownerTeamMemberId" = tm."id"
FROM "TeamMember" tm
WHERE item."owner" IS NOT NULL
  AND lower(trim(item."owner")) = lower(tm."fullName");

UPDATE "BudgetLineItem" line
SET "ownerTeamMemberId" = tm."id"
FROM "User" u
JOIN "TeamMember" tm ON lower(tm."email") = lower(u."email")
WHERE line."ownerId" = u."id";

UPDATE "Contract" c
SET "ownerTeamMemberId" = tm."id"
FROM "TeamMember" tm
WHERE lower(trim(COALESCE(c."contractOwner", c."businessOwner", ''))) = lower(tm."fullName");

UPDATE "MaintenanceRenewal" mr
SET "ownerTeamMemberId" = tm."id"
FROM "TeamMember" tm
WHERE lower(trim(COALESCE(mr."renewalOwner", mr."businessOwner", ''))) = lower(tm."fullName");

UPDATE "Deployment" dep
SET "ownerTeamMemberId" = tm."id"
FROM "TeamMember" tm
WHERE lower(trim(dep."owner")) = lower(tm."fullName");

UPDATE "Deployment" dep
SET "ownerTeamMemberId" = tm."id"
FROM "User" u
JOIN "TeamMember" tm ON lower(tm."email") = lower(u."email")
WHERE dep."ownerTeamMemberId" IS NULL
  AND dep."businessOwnerId" = u."id";

INSERT INTO "OrganizationSettings" (
  "id",
  "name",
  "shortName",
  "defaultCurrency",
  "currentFiscalYearId",
  "fiscalYearStartMonth",
  "defaultTimezone",
  "active",
  "updatedAt"
)
SELECT
  'org-default',
  'Sample Cybersecurity Finance Organization',
  'finsec-ops',
  'USD',
  (SELECT "id" FROM "FiscalYear" WHERE "isCurrent" = true LIMIT 1),
  7,
  'America/Chicago',
  true,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "OrganizationSettings");

INSERT INTO "ExpenseTypeOption" ("id", "key", "name", "displayOrder", "updatedAt")
VALUES
  ('expense-hardware', 'HARDWARE', 'Hardware', 10, CURRENT_TIMESTAMP),
  ('expense-software-saas', 'SOFTWARE_SAAS', 'Software and SaaS', 20, CURRENT_TIMESTAMP),
  ('expense-subscription', 'SUBSCRIPTION', 'Subscription', 30, CURRENT_TIMESTAMP),
  ('expense-managed-service', 'MANAGED_SERVICE', 'Managed Service', 40, CURRENT_TIMESTAMP),
  ('expense-professional-service', 'PROFESSIONAL_SERVICE', 'Professional Services', 50, CURRENT_TIMESTAMP),
  ('expense-consulting', 'CONSULTING', 'Consulting', 60, CURRENT_TIMESTAMP),
  ('expense-training', 'TRAINING', 'Training', 70, CURRENT_TIMESTAMP),
  ('expense-certification', 'CERTIFICATION', 'Certification', 80, CURRENT_TIMESTAMP),
  ('expense-support-maintenance', 'SUPPORT_MAINTENANCE', 'Support and Maintenance', 90, CURRENT_TIMESTAMP),
  ('expense-cloud-infrastructure', 'CLOUD_INFRASTRUCTURE', 'Cloud Infrastructure', 100, CURRENT_TIMESTAMP),
  ('expense-one-time-purchase', 'ONE_TIME_PURCHASE', 'One-Time Purchase', 110, CURRENT_TIMESTAMP),
  ('expense-other', 'OTHER', 'Other', 120, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "PaymentFrequencyOption" ("id", "key", "name", "displayOrder", "updatedAt")
VALUES
  ('payment-monthly', 'MONTHLY', 'Monthly', 10, CURRENT_TIMESTAMP),
  ('payment-quarterly', 'QUARTERLY', 'Quarterly', 20, CURRENT_TIMESTAMP),
  ('payment-annual', 'ANNUAL', 'Annual', 30, CURRENT_TIMESTAMP),
  ('payment-one-time', 'ONE_TIME', 'One-Time', 40, CURRENT_TIMESTAMP),
  ('payment-multi-year', 'MULTI_YEAR', 'Multi-Year Prepaid', 50, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "LicenseMetricOption" ("id", "key", "name", "displayOrder", "updatedAt")
VALUES
  ('license-users', 'USERS', 'Users', 10, CURRENT_TIMESTAMP),
  ('license-identities', 'IDENTITIES', 'Identities', 20, CURRENT_TIMESTAMP),
  ('license-endpoints', 'ENDPOINTS', 'Endpoints', 30, CURRENT_TIMESTAMP),
  ('license-servers', 'SERVERS', 'Servers', 40, CURRENT_TIMESTAMP),
  ('license-devices', 'DEVICES', 'Devices', 50, CURRENT_TIMESTAMP),
  ('license-applications', 'APPLICATIONS', 'Applications', 60, CURRENT_TIMESTAMP),
  ('license-cloud-accounts', 'CLOUD_ACCOUNTS', 'Cloud Accounts', 70, CURRENT_TIMESTAMP),
  ('license-terabytes', 'TERABYTES', 'Terabytes', 80, CURRENT_TIMESTAMP),
  ('license-gb-day', 'GIGABYTES_PER_DAY', 'Gigabytes per Day', 90, CURRENT_TIMESTAMP),
  ('license-eps', 'EVENTS_PER_SECOND', 'Events per Second', 100, CURRENT_TIMESTAMP),
  ('license-seats', 'SEATS', 'Seats', 110, CURRENT_TIMESTAMP),
  ('license-enterprise', 'ENTERPRISE_LICENSE', 'Enterprise License', 120, CURRENT_TIMESTAMP),
  ('license-fixed-service', 'FIXED_SERVICE', 'Fixed Service', 130, CURRENT_TIMESTAMP),
  ('license-other', 'OTHER', 'Other', 140, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "DeploymentEnvironment" ("id", "name", "displayOrder", "updatedAt")
VALUES
  ('env-production', 'Production', 10, CURRENT_TIMESTAMP),
  ('env-development', 'Development', 20, CURRENT_TIMESTAMP),
  ('env-test', 'Test', 30, CURRENT_TIMESTAMP),
  ('env-disaster-recovery', 'Disaster Recovery', 40, CURRENT_TIMESTAMP),
  ('env-cloud', 'Cloud', 50, CURRENT_TIMESTAMP),
  ('env-on-premises', 'On-Premises', 60, CURRENT_TIMESTAMP),
  ('env-organization-wide', 'Organization-Wide', 70, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "RenewalPriorityOption" ("id", "key", "name", "displayOrder", "updatedAt")
VALUES
  ('priority-low', 'LOW', 'Low', 10, CURRENT_TIMESTAMP),
  ('priority-medium', 'MEDIUM', 'Medium', 20, CURRENT_TIMESTAMP),
  ('priority-high', 'HIGH', 'High', 30, CURRENT_TIMESTAMP),
  ('priority-critical', 'CRITICAL', 'Critical', 40, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "RenewalDecisionReason" ("id", "name", "description", "applicableDisposition", "updatedAt")
VALUES
  ('reason-price-increase', 'Price increase', 'Renewal quote or proposed term increases cost beyond expectations.', 'RENEGOTIATE', CURRENT_TIMESTAMP),
  ('reason-product-not-needed', 'Product no longer needed', 'Business or technical need no longer exists.', 'DO_NOT_RENEW', CURRENT_TIMESTAMP),
  ('reason-consolidating-tools', 'Consolidating tools', 'Coverage is moving into an existing platform or contract.', 'CONSOLIDATE', CURRENT_TIMESTAMP),
  ('reason-replacing-product', 'Replacing with another product', 'Replacement product or service will take over the capability.', 'REPLACE', CURRENT_TIMESTAMP),
  ('reason-low-usage', 'Usage below expectations', 'Measured adoption or active usage does not support full renewal.', 'RENEW_WITH_CHANGES', CURRENT_TIMESTAMP),
  ('reason-contract-terms', 'Contract terms unacceptable', 'Legal, procurement, or commercial terms require change.', 'RENEGOTIATE', CURRENT_TIMESTAMP),
  ('reason-budget-reduction', 'Budget reduction', 'Funding reduction requires scope or term adjustment.', 'RENEW_WITH_CHANGES', CURRENT_TIMESTAMP),
  ('reason-service-quality', 'Service quality concerns', 'Support, delivery, or product quality has not met expectations.', 'REVIEW_REQUIRED', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

CREATE INDEX IF NOT EXISTS "OrganizationSettings_currentFiscalYearId_idx" ON "OrganizationSettings"("currentFiscalYearId");
CREATE INDEX IF NOT EXISTS "FiscalYear_active_startsOn_idx" ON "FiscalYear"("active", "startsOn");
CREATE INDEX IF NOT EXISTS "FiscalYear_isCurrent_idx" ON "FiscalYear"("isCurrent");
CREATE INDEX IF NOT EXISTS "BudgetCategory_active_displayOrder_idx" ON "BudgetCategory"("active", "displayOrder");
CREATE INDEX IF NOT EXISTS "Department_active_name_idx" ON "Department"("active", "name");
CREATE INDEX IF NOT EXISTS "TeamMember_departmentId_idx" ON "TeamMember"("departmentId");
CREATE INDEX IF NOT EXISTS "TeamMember_active_fullName_idx" ON "TeamMember"("active", "fullName");
CREATE INDEX IF NOT EXISTS "ExpenseTypeOption_active_displayOrder_idx" ON "ExpenseTypeOption"("active", "displayOrder");
CREATE INDEX IF NOT EXISTS "PaymentFrequencyOption_active_displayOrder_idx" ON "PaymentFrequencyOption"("active", "displayOrder");
CREATE INDEX IF NOT EXISTS "LicenseMetricOption_active_displayOrder_idx" ON "LicenseMetricOption"("active", "displayOrder");
CREATE INDEX IF NOT EXISTS "DeploymentEnvironment_active_displayOrder_idx" ON "DeploymentEnvironment"("active", "displayOrder");
CREATE INDEX IF NOT EXISTS "RenewalPriorityOption_active_displayOrder_idx" ON "RenewalPriorityOption"("active", "displayOrder");
CREATE INDEX IF NOT EXISTS "RenewalDecisionReason_active_name_idx" ON "RenewalDecisionReason"("active", "name");
CREATE INDEX IF NOT EXISTS "RenewalDecisionReason_applicableDisposition_idx" ON "RenewalDecisionReason"("applicableDisposition");
CREATE INDEX IF NOT EXISTS "BudgetItem_departmentId_idx" ON "BudgetItem"("departmentId");
CREATE INDEX IF NOT EXISTS "BudgetItem_ownerTeamMemberId_idx" ON "BudgetItem"("ownerTeamMemberId");
CREATE INDEX IF NOT EXISTS "BudgetLineItem_departmentId_idx" ON "BudgetLineItem"("departmentId");
CREATE INDEX IF NOT EXISTS "BudgetLineItem_ownerTeamMemberId_idx" ON "BudgetLineItem"("ownerTeamMemberId");
CREATE INDEX IF NOT EXISTS "Contract_departmentId_idx" ON "Contract"("departmentId");
CREATE INDEX IF NOT EXISTS "Contract_ownerTeamMemberId_idx" ON "Contract"("ownerTeamMemberId");
CREATE INDEX IF NOT EXISTS "MaintenanceRenewal_departmentId_idx" ON "MaintenanceRenewal"("departmentId");
CREATE INDEX IF NOT EXISTS "MaintenanceRenewal_ownerTeamMemberId_idx" ON "MaintenanceRenewal"("ownerTeamMemberId");
CREATE INDEX IF NOT EXISTS "Deployment_departmentId_idx" ON "Deployment"("departmentId");
CREATE INDEX IF NOT EXISTS "Deployment_ownerTeamMemberId_idx" ON "Deployment"("ownerTeamMemberId");

ALTER TABLE "OrganizationSettings" ADD CONSTRAINT "OrganizationSettings_currentFiscalYearId_fkey" FOREIGN KEY ("currentFiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_ownerTeamMemberId_fkey" FOREIGN KEY ("ownerTeamMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BudgetLineItem" ADD CONSTRAINT "BudgetLineItem_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BudgetLineItem" ADD CONSTRAINT "BudgetLineItem_ownerTeamMemberId_fkey" FOREIGN KEY ("ownerTeamMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_ownerTeamMemberId_fkey" FOREIGN KEY ("ownerTeamMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_ownerTeamMemberId_fkey" FOREIGN KEY ("ownerTeamMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_ownerTeamMemberId_fkey" FOREIGN KEY ("ownerTeamMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
