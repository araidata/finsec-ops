-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('PLANNED', 'REQUESTED', 'APPROVED', 'PARTIALLY_APPROVED', 'DEFERRED', 'REJECTED', 'UNFUNDED');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('HARDWARE', 'SOFTWARE_SAAS', 'SUBSCRIPTION', 'MANAGED_SERVICE', 'PROFESSIONAL_SERVICE', 'CONSULTING', 'TRAINING', 'CERTIFICATION', 'SUPPORT_MAINTENANCE', 'CLOUD_INFRASTRUCTURE', 'ONE_TIME_PURCHASE', 'OTHER');

-- CreateEnum
CREATE TYPE "FundingType" AS ENUM ('BASELINE', 'RENEWAL', 'NEW_CAPABILITY', 'EXPANSION', 'TRUE_UP', 'GRANT');

-- CreateEnum
CREATE TYPE "BudgetPlanStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'SUBMITTED', 'APPROVED', 'PARTIALLY_APPROVED', 'REVISED', 'CLOSED');

-- CreateEnum
CREATE TYPE "BudgetScenarioLabel" AS ENUM ('INITIAL_REQUEST', 'RECOMMENDED', 'REDUCED_5_PERCENT', 'REDUCED_10_PERCENT', 'SUBMITTED', 'FINAL_APPROVED');

-- CreateEnum
CREATE TYPE "BudgetWorksheetType" AS ENUM ('SUMMARY', 'OPERATING_EXPENSES', 'SOFTWARE_SAAS', 'MAINTENANCE_RENEWALS', 'HARDWARE', 'PROFESSIONAL_SERVICES', 'TRAINING', 'TRAVEL_CONFERENCES', 'ORGANIZATIONAL_DUES', 'PERSONNEL', 'NEW_REQUESTS', 'SAVINGS_REDUCTIONS', 'SUBMISSION_EXPORT');

-- CreateEnum
CREATE TYPE "BudgetFundingStatus" AS ENUM ('DRAFT', 'REQUESTED', 'RECOMMENDED', 'APPROVED', 'PARTIALLY_APPROVED', 'DEFERRED', 'REJECTED', 'UNFUNDED');

-- CreateEnum
CREATE TYPE "RowReviewState" AS ENUM ('NEEDS_REVIEW', 'REVIEWED', 'UPDATED', 'RETIRED');

-- CreateEnum
CREATE TYPE "RecurringClassification" AS ENUM ('RECURRING', 'ONE_TIME', 'MIXED');

-- CreateEnum
CREATE TYPE "MaintenanceRenewalStatus" AS ENUM ('NOT_STARTED', 'PLANNING', 'QUOTE_REQUESTED', 'QUOTE_RECEIVED', 'NEGOTIATING', 'BUDGET_CONFIRMED', 'PURCHASE_REQUEST_SUBMITTED', 'APPROVED', 'ORDERED', 'RENEWED', 'NON_RENEWAL_PLANNED', 'RETIRED');

-- CreateEnum
CREATE TYPE "ProcurementStatus" AS ENUM ('NOT_REQUIRED', 'NOT_STARTED', 'IN_PREPARATION', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PURCHASE_ORDER_ISSUED', 'COMPLETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CompanyRoleType" AS ENUM ('VENDOR', 'RESELLER', 'SERVICE_PROVIDER', 'IMPLEMENTATION_PARTNER', 'CONSULTANT');

-- CreateEnum
CREATE TYPE "ProductOfferingType" AS ENUM ('SOFTWARE', 'SAAS', 'HARDWARE', 'MANAGED_SERVICE', 'PROFESSIONAL_SERVICE', 'TRAINING', 'SUPPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('APPROVED', 'ORDERED', 'COMMITTED', 'RECEIVED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PurchasingChannel" AS ENUM ('DIRECT_FROM_VENDOR', 'RESELLER', 'COOPERATIVE_OR_PURCHASING_CONTRACT', 'SERVICE_PROVIDER', 'OTHER');

-- CreateEnum
CREATE TYPE "LicenseMetric" AS ENUM ('USERS', 'IDENTITIES', 'ENDPOINTS', 'SERVERS', 'DEVICES', 'APPLICATIONS', 'CLOUD_ACCOUNTS', 'TERABYTES', 'GIGABYTES_PER_DAY', 'EVENTS_PER_SECOND', 'SEATS', 'ENTERPRISE_LICENSE', 'FIXED_SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "SavingsType" AS ENUM ('CONTRACT_NEGOTIATION', 'PRODUCT_RETIREMENT', 'PRODUCT_CONSOLIDATION', 'LICENSE_REDUCTION', 'RESELLER_CHANGE', 'SCOPE_REDUCTION', 'MULTI_YEAR_AGREEMENT', 'ONE_TIME_COST_EXPIRATION', 'AVOIDED_PURCHASE', 'OTHER');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'PENDING', 'RENEWING', 'EXPIRING_SOON', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('SOFTWARE', 'SAAS', 'HARDWARE', 'PROFESSIONAL_SERVICES', 'MANAGED_SERVICES', 'SUPPORT', 'MAINTENANCE', 'TRAINING', 'CERTIFICATION', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'MULTI_YEAR', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "RenewalRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('ENDPOINT_SECURITY', 'IDENTITY_ACCESS', 'NETWORK_SECURITY', 'CLOUD_SECURITY', 'DATA_SECURITY', 'APPLICATION_SECURITY', 'SECURITY_OPERATIONS', 'GOVERNANCE_RISK_COMPLIANCE', 'VULNERABILITY_EXPOSURE_MANAGEMENT', 'THREAT_INTELLIGENCE', 'WORKFORCE_SECURITY_AWARENESS', 'CYBERSECURITY_STAFF_TRAINING_DEVELOPMENT', 'BACKUP_RESILIENCE', 'ASSET_CONFIGURATION_MANAGEMENT', 'MANAGED_SECURITY_SERVICES', 'PROFESSIONAL_SERVICES', 'OTHER');

-- CreateEnum
CREATE TYPE "CapabilityCategory" AS ENUM ('SIEM', 'SOAR', 'EDR', 'XDR', 'MDR', 'VULNERABILITY_MANAGEMENT', 'EXPOSURE_MANAGEMENT', 'IAM', 'PAM', 'MFA', 'SSO', 'EMAIL_SECURITY', 'DNS_SECURITY', 'SECURE_WEB_GATEWAY', 'FIREWALL', 'IPS', 'CASB', 'CNAPP', 'CSPM', 'CWPP', 'DLP', 'DSPM', 'GRC', 'THIRD_PARTY_RISK', 'SECURITY_AWARENESS', 'PHISHING_SIMULATION', 'STAFF_TRAINING', 'CERTIFICATION_TRAINING', 'ASSET_INVENTORY', 'MDM', 'BACKUP', 'THREAT_INTELLIGENCE', 'DIGITAL_FORENSICS', 'INCIDENT_RESPONSE', 'OTHER');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('PLANNED', 'IMPLEMENTING', 'ACTIVE', 'PARTIALLY_DEPLOYED', 'UNDER_REVIEW', 'RETIRING', 'RETIRED');

-- CreateEnum
CREATE TYPE "StrategicValue" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "Criticality" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AdoptionLevel" AS ENUM ('NOT_USED', 'LOW', 'MEDIUM', 'HIGH', 'FULLY_ADOPTED');

-- CreateEnum
CREATE TYPE "RenewalStage" AS ENUM ('NOT_STARTED', 'DISCOVERY', 'BUSINESS_OWNER_REVIEW', 'PROCUREMENT_REVIEW', 'NEGOTIATION', 'EXECUTIVE_REVIEW', 'COMPLETE');

-- CreateEnum
CREATE TYPE "RenewalStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'APPROVED', 'RENEWED', 'DEFERRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ORDERED', 'CANCELED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'RECEIVED', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'DISPUTED', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SCHEDULED', 'PROCESSING', 'PAID', 'FAILED', 'VOID');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CONTRACT', 'ORDER_FORM', 'QUOTE', 'INVOICE', 'RENEWAL_NOTICE', 'PURCHASE_REQUEST', 'SECURITY_REVIEW', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'AMOUNT_CHANGE', 'OWNER_CHANGE');

-- CreateTable
CREATE TABLE "FiscalYear" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetCategory" (
    "id" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetPlan" (
    "id" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "BudgetPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "version" TEXT NOT NULL,
    "priorFiscalYear" TEXT,
    "planningOwner" TEXT NOT NULL,
    "submissionDueDate" DATE,
    "assumptions" TEXT,
    "executiveNarrative" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetScenario" (
    "id" TEXT NOT NULL,
    "budgetPlanId" TEXT NOT NULL,
    "label" "BudgetScenarioLabel" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetAccount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultWorksheet" "BudgetWorksheetType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "website" TEXT,
    "contactEmail" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyRole" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "CompanyRoleType" NOT NULL,

    CONSTRAINT "CompanyRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capability" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchasingVehicle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contractNumber" TEXT,
    "issuingOrganization" TEXT,
    "startsOn" DATE,
    "endsOn" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notesText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchasingVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchasingVehicleSeller" (
    "id" TEXT NOT NULL,
    "purchasingVehicleId" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "sellerAwardNumber" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notesText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchasingVehicleSeller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchasingVehicleProductEligibility" (
    "id" TEXT NOT NULL,
    "purchasingVehicleSellerId" TEXT NOT NULL,
    "productId" TEXT,
    "productModuleId" TEXT,
    "awardNumber" TEXT,
    "startsOn" DATE,
    "endsOn" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notesText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchasingVehicleProductEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT,
    "resellerId" TEXT,
    "vendorCompanyId" TEXT,
    "sellerCompanyId" TEXT,
    "contractId" TEXT,
    "productId" TEXT,
    "productModuleId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT,
    "strategicProgramArea" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetAnnualFinancial" (
    "id" TEXT NOT NULL,
    "budgetPlanId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "budgetItemId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "worksheet" "BudgetWorksheetType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "priorApprovedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currentApprovedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "baseAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "requestedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "proposedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "approvedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "revisedApprovedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "forecastAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "encumberedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "actualAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "quantity" DECIMAL(14,2) NOT NULL DEFAULT 1,
    "oneTimeAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "recurringAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "savingsAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "costAvoidanceAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "fundingStatus" "BudgetFundingStatus" NOT NULL DEFAULT 'DRAFT',
    "recurrence" "RecurringClassification" NOT NULL DEFAULT 'RECURRING',
    "reviewState" "RowReviewState" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "isNewRequest" BOOLEAN NOT NULL DEFAULT false,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "isOneTime" BOOLEAN NOT NULL DEFAULT false,
    "isRetired" BOOLEAN NOT NULL DEFAULT false,
    "comments" TEXT,
    "businessJustification" TEXT,
    "riskIfNotFunded" TEXT,
    "complianceRequirement" TEXT,
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetAnnualFinancial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRenewal" (
    "id" TEXT NOT NULL,
    "budgetPlanId" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "linkedAnnualFinancialId" TEXT,
    "vendorId" TEXT,
    "resellerId" TEXT,
    "vendorCompanyId" TEXT,
    "sellerCompanyId" TEXT,
    "contractId" TEXT,
    "productId" TEXT,
    "purchaseItemId" TEXT,
    "fundingAccountId" TEXT NOT NULL,
    "productOrService" TEXT NOT NULL,
    "currentAnnualCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "renewalQuote" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "negotiatedCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "renewalDate" DATE NOT NULL,
    "contractStart" DATE,
    "contractEnd" DATE,
    "noticePeriodDays" INTEGER NOT NULL DEFAULT 60,
    "noticeDate" DATE,
    "autoRenewal" BOOLEAN NOT NULL DEFAULT false,
    "paymentFrequency" "PaymentFrequency" NOT NULL DEFAULT 'ANNUAL',
    "renewalStatus" "MaintenanceRenewalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "procurementStatus" "ProcurementStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "quoteReceivedDate" DATE,
    "purchaseRequestNumber" TEXT,
    "purchaseOrderNumber" TEXT,
    "expectedPaymentDate" DATE,
    "renewalOwnerId" TEXT,
    "procurementOwnerId" TEXT,
    "renewalOwner" TEXT,
    "procurementOwner" TEXT,
    "renewalStrategy" TEXT,
    "renewalRisk" "RenewalRiskLevel" NOT NULL DEFAULT 'LOW',
    "notesText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRenewal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsRecord" (
    "id" TEXT NOT NULL,
    "budgetPlanId" TEXT NOT NULL,
    "annualFinancialId" TEXT,
    "maintenanceRenewalId" TEXT,
    "type" "SavingsType" NOT NULL,
    "description" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "costAvoidanceAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "isBudgetReduction" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" TEXT,
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLineItem" (
    "id" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "budgetCategoryId" TEXT NOT NULL,
    "vendorId" TEXT,
    "resellerId" TEXT,
    "vendorCompanyId" TEXT,
    "sellerCompanyId" TEXT,
    "ownerId" TEXT,
    "contractId" TEXT,
    "productId" TEXT,
    "productModuleId" TEXT,
    "renewalId" TEXT,
    "purchaseRequestId" TEXT,
    "name" TEXT NOT NULL,
    "productOrService" TEXT,
    "description" TEXT,
    "status" "BudgetStatus" NOT NULL DEFAULT 'PLANNED',
    "expenseType" "ExpenseType" NOT NULL,
    "fundingType" "FundingType" NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "budgetedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "approvedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "forecastAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "committedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "actualAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "businessJustification" TEXT,
    "riskIfNotFunded" TEXT,
    "notesText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "contactEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reseller" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "contactEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reseller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT,
    "resellerId" TEXT,
    "vendorCompanyId" TEXT,
    "sellerCompanyId" TEXT,
    "ownerId" TEXT,
    "contractNumber" TEXT,
    "title" TEXT NOT NULL,
    "contractType" "ContractType" NOT NULL DEFAULT 'SAAS',
    "associatedProductOrService" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'PENDING',
    "renewalDate" DATE,
    "autoRenewal" BOOLEAN NOT NULL DEFAULT false,
    "noticePeriodDays" INTEGER NOT NULL DEFAULT 60,
    "annualValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "totalValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paymentFrequency" "PaymentFrequency" NOT NULL DEFAULT 'ANNUAL',
    "businessOwner" TEXT,
    "securityOwner" TEXT,
    "procurementContact" TEXT,
    "vendorAccountManager" TEXT,
    "resellerAccountManager" TEXT,
    "renewalRiskLevel" "RenewalRiskLevel" NOT NULL DEFAULT 'LOW',
    "renewalStrategy" TEXT,
    "notesText" TEXT,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "resellerId" TEXT,
    "vendorCompanyId" TEXT,
    "name" TEXT NOT NULL,
    "offeringType" "ProductOfferingType" NOT NULL DEFAULT 'SAAS',
    "productCategory" "ProductCategory" NOT NULL DEFAULT 'OTHER',
    "capabilityCategory" "CapabilityCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deploymentStatus" "DeploymentStatus" NOT NULL DEFAULT 'PLANNED',
    "businessOwner" TEXT,
    "technicalOwner" TEXT,
    "securityOwner" TEXT,
    "primaryUseCase" TEXT,
    "strategicValue" "StrategicValue" NOT NULL DEFAULT 'MEDIUM',
    "criticality" "Criticality" NOT NULL DEFAULT 'MEDIUM',
    "annualCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notesText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductModule" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capabilityCategory" "CapabilityCategory" NOT NULL DEFAULT 'OTHER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "adoptionLevel" "AdoptionLevel" NOT NULL DEFAULT 'MEDIUM',
    "licenseCount" INTEGER NOT NULL DEFAULT 0,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "moduleCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "owner" TEXT,
    "notesText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFeature" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "moduleId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSeller" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sellerCompanyId" TEXT NOT NULL,
    "preferred" BOOLEAN NOT NULL DEFAULT false,
    "sellerSku" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSeller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCapability" (
    "productId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,

    CONSTRAINT "ProductCapability_pkey" PRIMARY KEY ("productId","capabilityId")
);

-- CreateTable
CREATE TABLE "ProductModuleCapability" (
    "productModuleId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,

    CONSTRAINT "ProductModuleCapability_pkey" PRIMARY KEY ("productModuleId","capabilityId")
);

-- CreateTable
CREATE TABLE "ProductFeatureCapability" (
    "productFeatureId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,

    CONSTRAINT "ProductFeatureCapability_pkey" PRIMARY KEY ("productFeatureId","capabilityId")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "sellerCompanyId" TEXT,
    "contractId" TEXT,
    "purchasingVehicleId" TEXT,
    "purchaseRequestId" TEXT,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'APPROVED',
    "purchasingChannel" "PurchasingChannel" NOT NULL DEFAULT 'RESELLER',
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "quoteNumber" TEXT,
    "startsOn" DATE,
    "endsOn" DATE,
    "renewalDate" DATE,
    "notesText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productModuleId" TEXT,
    "description" TEXT,
    "quantity" DECIMAL(14,2),
    "quantityType" "LicenseMetric",
    "unitCost" DECIMAL(14,2),
    "totalCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "recurringCost" DECIMAL(14,2),
    "implementationCost" DECIMAL(14,2),
    "licenseStartsOn" DATE,
    "licenseEndsOn" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItemFeature" (
    "purchaseItemId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PurchaseItemFeature_pkey" PRIMARY KEY ("purchaseItemId","featureId")
);

-- CreateTable
CREATE TABLE "PurchaseBudgetAllocation" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "purchaseItemId" TEXT,
    "fiscalYearId" TEXT NOT NULL,
    "budgetItemId" TEXT,
    "budgetAnnualFinancialId" TEXT,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "allocatedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notesText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseBudgetAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL,
    "purchaseItemId" TEXT NOT NULL,
    "status" "DeploymentStatus" NOT NULL,
    "scopeName" TEXT NOT NULL,
    "environment" TEXT,
    "department" TEXT,
    "wave" TEXT,
    "deploymentPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "targetPopulation" INTEGER,
    "deployedPopulation" INTEGER,
    "adoptionLevel" "AdoptionLevel",
    "businessOwnerId" TEXT,
    "technicalOwnerId" TEXT,
    "securityOwnerId" TEXT,
    "targetDate" DATE,
    "completedDate" DATE,
    "blockers" TEXT,
    "expectedOutcome" TEXT,
    "realizedOutcome" TEXT,
    "valueNarrative" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageMeasurement" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "activeUsageCount" INTEGER,
    "utilizationPercent" DECIMAL(5,2),
    "source" TEXT,
    "notesText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Renewal" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "ownerId" TEXT,
    "title" TEXT NOT NULL,
    "stage" "RenewalStage" NOT NULL DEFAULT 'NOT_STARTED',
    "status" "RenewalStatus" NOT NULL DEFAULT 'PLANNED',
    "renewalDate" DATE NOT NULL,
    "noticeDate" DATE,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "exposureAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Renewal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "vendorId" TEXT,
    "resellerId" TEXT,
    "vendorCompanyId" TEXT,
    "sellerCompanyId" TEXT,
    "contractId" TEXT,
    "productId" TEXT,
    "productModuleId" TEXT,
    "renewalId" TEXT,
    "ownerId" TEXT,
    "requestNumber" TEXT,
    "title" TEXT NOT NULL,
    "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "requestAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "approvedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "vendorId" TEXT,
    "resellerId" TEXT,
    "vendorCompanyId" TEXT,
    "sellerCompanyId" TEXT,
    "purchaseId" TEXT,
    "contractId" TEXT,
    "renewalId" TEXT,
    "purchaseRequestId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'RECEIVED',
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "issuedOn" DATE NOT NULL,
    "dueOn" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "purchaseId" TEXT,
    "contractId" TEXT,
    "renewalId" TEXT,
    "purchaseRequestId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "reference" TEXT,
    "paidOn" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "uploadedById" TEXT,
    "vendorId" TEXT,
    "resellerId" TEXT,
    "companyId" TEXT,
    "purchaseId" TEXT,
    "contractId" TEXT,
    "renewalId" TEXT,
    "purchaseRequestId" TEXT,
    "invoiceId" TEXT,
    "productId" TEXT,
    "productModuleId" TEXT,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "ActivityAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldName" TEXT,
    "previousValue" TEXT,
    "newValue" TEXT,
    "amountBefore" DECIMAL(14,2),
    "amountAfter" DECIMAL(14,2),
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "authorId" TEXT,
    "vendorId" TEXT,
    "resellerId" TEXT,
    "companyId" TEXT,
    "purchaseId" TEXT,
    "contractId" TEXT,
    "renewalId" TEXT,
    "purchaseRequestId" TEXT,
    "invoiceId" TEXT,
    "productId" TEXT,
    "productModuleId" TEXT,
    "budgetLineItemId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ContractProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ContractProducts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ContractProductModules" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ContractProductModules_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RenewalProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RenewalProducts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RenewalProductModules" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RenewalProductModules_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "FiscalYear_label_key" ON "FiscalYear"("label");

-- CreateIndex
CREATE INDEX "FiscalYear_startsOn_endsOn_idx" ON "FiscalYear"("startsOn", "endsOn");

-- CreateIndex
CREATE INDEX "BudgetCategory_fiscalYearId_idx" ON "BudgetCategory"("fiscalYearId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetCategory_fiscalYearId_name_key" ON "BudgetCategory"("fiscalYearId", "name");

-- CreateIndex
CREATE INDEX "BudgetPlan_fiscalYearId_status_idx" ON "BudgetPlan"("fiscalYearId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetPlan_fiscalYearId_version_key" ON "BudgetPlan"("fiscalYearId", "version");

-- CreateIndex
CREATE INDEX "BudgetScenario_budgetPlanId_isActive_idx" ON "BudgetScenario"("budgetPlanId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetScenario_budgetPlanId_label_key" ON "BudgetScenario"("budgetPlanId", "label");

-- CreateIndex
CREATE INDEX "BudgetAccount_active_sortOrder_idx" ON "BudgetAccount"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetAccount_code_key" ON "BudgetAccount"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Company_active_idx" ON "Company"("active");

-- CreateIndex
CREATE INDEX "CompanyRole_role_idx" ON "CompanyRole"("role");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyRole_companyId_role_key" ON "CompanyRole"("companyId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Capability_name_key" ON "Capability"("name");

-- CreateIndex
CREATE INDEX "Capability_active_idx" ON "Capability"("active");

-- CreateIndex
CREATE INDEX "PurchasingVehicle_active_idx" ON "PurchasingVehicle"("active");

-- CreateIndex
CREATE INDEX "PurchasingVehicle_endsOn_idx" ON "PurchasingVehicle"("endsOn");

-- CreateIndex
CREATE UNIQUE INDEX "PurchasingVehicle_name_contractNumber_key" ON "PurchasingVehicle"("name", "contractNumber");

-- CreateIndex
CREATE INDEX "PurchasingVehicleSeller_sellerCompanyId_idx" ON "PurchasingVehicleSeller"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "PurchasingVehicleSeller_active_idx" ON "PurchasingVehicleSeller"("active");

-- CreateIndex
CREATE UNIQUE INDEX "PurchasingVehicleSeller_purchasingVehicleId_sellerCompanyId_key" ON "PurchasingVehicleSeller"("purchasingVehicleId", "sellerCompanyId");

-- CreateIndex
CREATE INDEX "PurchasingVehicleProductEligibility_purchasingVehicleSeller_idx" ON "PurchasingVehicleProductEligibility"("purchasingVehicleSellerId");

-- CreateIndex
CREATE INDEX "PurchasingVehicleProductEligibility_productId_idx" ON "PurchasingVehicleProductEligibility"("productId");

-- CreateIndex
CREATE INDEX "PurchasingVehicleProductEligibility_productModuleId_idx" ON "PurchasingVehicleProductEligibility"("productModuleId");

-- CreateIndex
CREATE INDEX "PurchasingVehicleProductEligibility_active_idx" ON "PurchasingVehicleProductEligibility"("active");

-- CreateIndex
CREATE INDEX "BudgetItem_vendorId_idx" ON "BudgetItem"("vendorId");

-- CreateIndex
CREATE INDEX "BudgetItem_resellerId_idx" ON "BudgetItem"("resellerId");

-- CreateIndex
CREATE INDEX "BudgetItem_vendorCompanyId_idx" ON "BudgetItem"("vendorCompanyId");

-- CreateIndex
CREATE INDEX "BudgetItem_sellerCompanyId_idx" ON "BudgetItem"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "BudgetItem_contractId_idx" ON "BudgetItem"("contractId");

-- CreateIndex
CREATE INDEX "BudgetItem_productId_idx" ON "BudgetItem"("productId");

-- CreateIndex
CREATE INDEX "BudgetItem_productModuleId_idx" ON "BudgetItem"("productModuleId");

-- CreateIndex
CREATE INDEX "BudgetItem_active_idx" ON "BudgetItem"("active");

-- CreateIndex
CREATE INDEX "BudgetAnnualFinancial_budgetPlanId_scenarioId_idx" ON "BudgetAnnualFinancial"("budgetPlanId", "scenarioId");

-- CreateIndex
CREATE INDEX "BudgetAnnualFinancial_fiscalYearId_idx" ON "BudgetAnnualFinancial"("fiscalYearId");

-- CreateIndex
CREATE INDEX "BudgetAnnualFinancial_budgetItemId_idx" ON "BudgetAnnualFinancial"("budgetItemId");

-- CreateIndex
CREATE INDEX "BudgetAnnualFinancial_accountId_idx" ON "BudgetAnnualFinancial"("accountId");

-- CreateIndex
CREATE INDEX "BudgetAnnualFinancial_worksheet_idx" ON "BudgetAnnualFinancial"("worksheet");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceRenewal_linkedAnnualFinancialId_key" ON "MaintenanceRenewal"("linkedAnnualFinancialId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_budgetPlanId_idx" ON "MaintenanceRenewal"("budgetPlanId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_fiscalYearId_renewalStatus_idx" ON "MaintenanceRenewal"("fiscalYearId", "renewalStatus");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_renewalDate_idx" ON "MaintenanceRenewal"("renewalDate");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_vendorCompanyId_idx" ON "MaintenanceRenewal"("vendorCompanyId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_sellerCompanyId_idx" ON "MaintenanceRenewal"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_purchaseItemId_idx" ON "MaintenanceRenewal"("purchaseItemId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewal_fundingAccountId_idx" ON "MaintenanceRenewal"("fundingAccountId");

-- CreateIndex
CREATE INDEX "SavingsRecord_budgetPlanId_idx" ON "SavingsRecord"("budgetPlanId");

-- CreateIndex
CREATE INDEX "SavingsRecord_annualFinancialId_idx" ON "SavingsRecord"("annualFinancialId");

-- CreateIndex
CREATE INDEX "SavingsRecord_maintenanceRenewalId_idx" ON "SavingsRecord"("maintenanceRenewalId");

-- CreateIndex
CREATE INDEX "SavingsRecord_ownerId_idx" ON "SavingsRecord"("ownerId");

-- CreateIndex
CREATE INDEX "SavingsRecord_type_idx" ON "SavingsRecord"("type");

-- CreateIndex
CREATE INDEX "BudgetLineItem_fiscalYearId_status_idx" ON "BudgetLineItem"("fiscalYearId", "status");

-- CreateIndex
CREATE INDEX "BudgetLineItem_budgetCategoryId_idx" ON "BudgetLineItem"("budgetCategoryId");

-- CreateIndex
CREATE INDEX "BudgetLineItem_vendorId_idx" ON "BudgetLineItem"("vendorId");

-- CreateIndex
CREATE INDEX "BudgetLineItem_resellerId_idx" ON "BudgetLineItem"("resellerId");

-- CreateIndex
CREATE INDEX "BudgetLineItem_vendorCompanyId_idx" ON "BudgetLineItem"("vendorCompanyId");

-- CreateIndex
CREATE INDEX "BudgetLineItem_sellerCompanyId_idx" ON "BudgetLineItem"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "BudgetLineItem_contractId_idx" ON "BudgetLineItem"("contractId");

-- CreateIndex
CREATE INDEX "BudgetLineItem_productId_idx" ON "BudgetLineItem"("productId");

-- CreateIndex
CREATE INDEX "BudgetLineItem_productModuleId_idx" ON "BudgetLineItem"("productModuleId");

-- CreateIndex
CREATE INDEX "BudgetLineItem_renewalId_idx" ON "BudgetLineItem"("renewalId");

-- CreateIndex
CREATE INDEX "BudgetLineItem_purchaseRequestId_idx" ON "BudgetLineItem"("purchaseRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_name_key" ON "Vendor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Reseller_name_key" ON "Reseller"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contractNumber_key" ON "Contract"("contractNumber");

-- CreateIndex
CREATE INDEX "Contract_vendorId_idx" ON "Contract"("vendorId");

-- CreateIndex
CREATE INDEX "Contract_resellerId_idx" ON "Contract"("resellerId");

-- CreateIndex
CREATE INDEX "Contract_vendorCompanyId_idx" ON "Contract"("vendorCompanyId");

-- CreateIndex
CREATE INDEX "Contract_sellerCompanyId_idx" ON "Contract"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_startsOn_endsOn_idx" ON "Contract"("startsOn", "endsOn");

-- CreateIndex
CREATE INDEX "Product_vendorId_idx" ON "Product"("vendorId");

-- CreateIndex
CREATE INDEX "Product_resellerId_idx" ON "Product"("resellerId");

-- CreateIndex
CREATE INDEX "Product_vendorCompanyId_idx" ON "Product"("vendorCompanyId");

-- CreateIndex
CREATE INDEX "Product_offeringType_idx" ON "Product"("offeringType");

-- CreateIndex
CREATE INDEX "Product_productCategory_idx" ON "Product"("productCategory");

-- CreateIndex
CREATE INDEX "Product_capabilityCategory_idx" ON "Product"("capabilityCategory");

-- CreateIndex
CREATE INDEX "Product_deploymentStatus_idx" ON "Product"("deploymentStatus");

-- CreateIndex
CREATE INDEX "Product_active_idx" ON "Product"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Product_vendorId_name_key" ON "Product"("vendorId", "name");

-- CreateIndex
CREATE INDEX "ProductModule_productId_idx" ON "ProductModule"("productId");

-- CreateIndex
CREATE INDEX "ProductModule_capabilityCategory_idx" ON "ProductModule"("capabilityCategory");

-- CreateIndex
CREATE INDEX "ProductModule_adoptionLevel_idx" ON "ProductModule"("adoptionLevel");

-- CreateIndex
CREATE INDEX "ProductModule_active_idx" ON "ProductModule"("active");

-- CreateIndex
CREATE UNIQUE INDEX "ProductModule_productId_name_key" ON "ProductModule"("productId", "name");

-- CreateIndex
CREATE INDEX "ProductFeature_productId_idx" ON "ProductFeature"("productId");

-- CreateIndex
CREATE INDEX "ProductFeature_moduleId_idx" ON "ProductFeature"("moduleId");

-- CreateIndex
CREATE INDEX "ProductFeature_active_idx" ON "ProductFeature"("active");

-- CreateIndex
CREATE INDEX "ProductSeller_productId_idx" ON "ProductSeller"("productId");

-- CreateIndex
CREATE INDEX "ProductSeller_sellerCompanyId_idx" ON "ProductSeller"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "ProductSeller_active_idx" ON "ProductSeller"("active");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSeller_productId_sellerCompanyId_key" ON "ProductSeller"("productId", "sellerCompanyId");

-- CreateIndex
CREATE INDEX "ProductCapability_capabilityId_idx" ON "ProductCapability"("capabilityId");

-- CreateIndex
CREATE INDEX "ProductModuleCapability_capabilityId_idx" ON "ProductModuleCapability"("capabilityId");

-- CreateIndex
CREATE INDEX "ProductFeatureCapability_capabilityId_idx" ON "ProductFeatureCapability"("capabilityId");

-- CreateIndex
CREATE INDEX "Purchase_fiscalYearId_status_idx" ON "Purchase"("fiscalYearId", "status");

-- CreateIndex
CREATE INDEX "Purchase_sellerCompanyId_idx" ON "Purchase"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "Purchase_contractId_idx" ON "Purchase"("contractId");

-- CreateIndex
CREATE INDEX "Purchase_purchasingVehicleId_idx" ON "Purchase"("purchasingVehicleId");

-- CreateIndex
CREATE INDEX "Purchase_purchaseRequestId_idx" ON "Purchase"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "PurchaseItem_purchaseId_idx" ON "PurchaseItem"("purchaseId");

-- CreateIndex
CREATE INDEX "PurchaseItem_productId_idx" ON "PurchaseItem"("productId");

-- CreateIndex
CREATE INDEX "PurchaseItem_productModuleId_idx" ON "PurchaseItem"("productModuleId");

-- CreateIndex
CREATE INDEX "PurchaseItemFeature_featureId_idx" ON "PurchaseItemFeature"("featureId");

-- CreateIndex
CREATE INDEX "PurchaseBudgetAllocation_purchaseId_idx" ON "PurchaseBudgetAllocation"("purchaseId");

-- CreateIndex
CREATE INDEX "PurchaseBudgetAllocation_purchaseItemId_idx" ON "PurchaseBudgetAllocation"("purchaseItemId");

-- CreateIndex
CREATE INDEX "PurchaseBudgetAllocation_fiscalYearId_idx" ON "PurchaseBudgetAllocation"("fiscalYearId");

-- CreateIndex
CREATE INDEX "PurchaseBudgetAllocation_budgetItemId_idx" ON "PurchaseBudgetAllocation"("budgetItemId");

-- CreateIndex
CREATE INDEX "PurchaseBudgetAllocation_budgetAnnualFinancialId_idx" ON "PurchaseBudgetAllocation"("budgetAnnualFinancialId");

-- CreateIndex
CREATE INDEX "Deployment_purchaseItemId_idx" ON "Deployment"("purchaseItemId");

-- CreateIndex
CREATE INDEX "Deployment_status_idx" ON "Deployment"("status");

-- CreateIndex
CREATE INDEX "Deployment_businessOwnerId_idx" ON "Deployment"("businessOwnerId");

-- CreateIndex
CREATE INDEX "Deployment_technicalOwnerId_idx" ON "Deployment"("technicalOwnerId");

-- CreateIndex
CREATE INDEX "Deployment_securityOwnerId_idx" ON "Deployment"("securityOwnerId");

-- CreateIndex
CREATE INDEX "UsageMeasurement_deploymentId_measuredAt_idx" ON "UsageMeasurement"("deploymentId", "measuredAt");

-- CreateIndex
CREATE INDEX "Renewal_contractId_idx" ON "Renewal"("contractId");

-- CreateIndex
CREATE INDEX "Renewal_fiscalYearId_status_idx" ON "Renewal"("fiscalYearId", "status");

-- CreateIndex
CREATE INDEX "Renewal_renewalDate_idx" ON "Renewal"("renewalDate");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequest_requestNumber_key" ON "PurchaseRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "PurchaseRequest_fiscalYearId_status_idx" ON "PurchaseRequest"("fiscalYearId", "status");

-- CreateIndex
CREATE INDEX "PurchaseRequest_vendorId_idx" ON "PurchaseRequest"("vendorId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_resellerId_idx" ON "PurchaseRequest"("resellerId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_vendorCompanyId_idx" ON "PurchaseRequest"("vendorCompanyId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_sellerCompanyId_idx" ON "PurchaseRequest"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_contractId_idx" ON "PurchaseRequest"("contractId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_renewalId_idx" ON "PurchaseRequest"("renewalId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_fiscalYearId_status_idx" ON "Invoice"("fiscalYearId", "status");

-- CreateIndex
CREATE INDEX "Invoice_vendorId_idx" ON "Invoice"("vendorId");

-- CreateIndex
CREATE INDEX "Invoice_resellerId_idx" ON "Invoice"("resellerId");

-- CreateIndex
CREATE INDEX "Invoice_vendorCompanyId_idx" ON "Invoice"("vendorCompanyId");

-- CreateIndex
CREATE INDEX "Invoice_sellerCompanyId_idx" ON "Invoice"("sellerCompanyId");

-- CreateIndex
CREATE INDEX "Invoice_purchaseId_idx" ON "Invoice"("purchaseId");

-- CreateIndex
CREATE INDEX "Invoice_contractId_idx" ON "Invoice"("contractId");

-- CreateIndex
CREATE INDEX "Invoice_renewalId_idx" ON "Invoice"("renewalId");

-- CreateIndex
CREATE INDEX "Invoice_purchaseRequestId_idx" ON "Invoice"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "Payment_fiscalYearId_status_idx" ON "Payment"("fiscalYearId", "status");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_purchaseId_idx" ON "Payment"("purchaseId");

-- CreateIndex
CREATE INDEX "Payment_contractId_idx" ON "Payment"("contractId");

-- CreateIndex
CREATE INDEX "Payment_renewalId_idx" ON "Payment"("renewalId");

-- CreateIndex
CREATE INDEX "Payment_purchaseRequestId_idx" ON "Payment"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "Document_vendorId_idx" ON "Document"("vendorId");

-- CreateIndex
CREATE INDEX "Document_resellerId_idx" ON "Document"("resellerId");

-- CreateIndex
CREATE INDEX "Document_companyId_idx" ON "Document"("companyId");

-- CreateIndex
CREATE INDEX "Document_purchaseId_idx" ON "Document"("purchaseId");

-- CreateIndex
CREATE INDEX "Document_contractId_idx" ON "Document"("contractId");

-- CreateIndex
CREATE INDEX "Document_renewalId_idx" ON "Document"("renewalId");

-- CreateIndex
CREATE INDEX "Document_purchaseRequestId_idx" ON "Document"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "Document_invoiceId_idx" ON "Document"("invoiceId");

-- CreateIndex
CREATE INDEX "Document_productId_idx" ON "Document"("productId");

-- CreateIndex
CREATE INDEX "Document_productModuleId_idx" ON "Document"("productModuleId");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_actorId_idx" ON "ActivityLog"("actorId");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_occurredAt_idx" ON "ActivityLog"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Note_vendorId_idx" ON "Note"("vendorId");

-- CreateIndex
CREATE INDEX "Note_resellerId_idx" ON "Note"("resellerId");

-- CreateIndex
CREATE INDEX "Note_companyId_idx" ON "Note"("companyId");

-- CreateIndex
CREATE INDEX "Note_purchaseId_idx" ON "Note"("purchaseId");

-- CreateIndex
CREATE INDEX "Note_contractId_idx" ON "Note"("contractId");

-- CreateIndex
CREATE INDEX "Note_renewalId_idx" ON "Note"("renewalId");

-- CreateIndex
CREATE INDEX "Note_purchaseRequestId_idx" ON "Note"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "Note_invoiceId_idx" ON "Note"("invoiceId");

-- CreateIndex
CREATE INDEX "Note_productId_idx" ON "Note"("productId");

-- CreateIndex
CREATE INDEX "Note_productModuleId_idx" ON "Note"("productModuleId");

-- CreateIndex
CREATE INDEX "Note_budgetLineItemId_idx" ON "Note"("budgetLineItemId");

-- CreateIndex
CREATE INDEX "_ContractProducts_B_index" ON "_ContractProducts"("B");

-- CreateIndex
CREATE INDEX "_ContractProductModules_B_index" ON "_ContractProductModules"("B");

-- CreateIndex
CREATE INDEX "_RenewalProducts_B_index" ON "_RenewalProducts"("B");

-- CreateIndex
CREATE INDEX "_RenewalProductModules_B_index" ON "_RenewalProductModules"("B");

-- AddForeignKey
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetPlan" ADD CONSTRAINT "BudgetPlan_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetScenario" ADD CONSTRAINT "BudgetScenario_budgetPlanId_fkey" FOREIGN KEY ("budgetPlanId") REFERENCES "BudgetPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyRole" ADD CONSTRAINT "CompanyRole_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasingVehicleSeller" ADD CONSTRAINT "PurchasingVehicleSeller_purchasingVehicleId_fkey" FOREIGN KEY ("purchasingVehicleId") REFERENCES "PurchasingVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasingVehicleSeller" ADD CONSTRAINT "PurchasingVehicleSeller_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasingVehicleProductEligibility" ADD CONSTRAINT "PurchasingVehicleProductEligibility_purchasingVehicleSelle_fkey" FOREIGN KEY ("purchasingVehicleSellerId") REFERENCES "PurchasingVehicleSeller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasingVehicleProductEligibility" ADD CONSTRAINT "PurchasingVehicleProductEligibility_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchasingVehicleProductEligibility" ADD CONSTRAINT "PurchasingVehicleProductEligibility_productModuleId_fkey" FOREIGN KEY ("productModuleId") REFERENCES "ProductModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_vendorCompanyId_fkey" FOREIGN KEY ("vendorCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_productModuleId_fkey" FOREIGN KEY ("productModuleId") REFERENCES "ProductModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAnnualFinancial" ADD CONSTRAINT "BudgetAnnualFinancial_budgetPlanId_fkey" FOREIGN KEY ("budgetPlanId") REFERENCES "BudgetPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAnnualFinancial" ADD CONSTRAINT "BudgetAnnualFinancial_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "BudgetScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAnnualFinancial" ADD CONSTRAINT "BudgetAnnualFinancial_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAnnualFinancial" ADD CONSTRAINT "BudgetAnnualFinancial_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "BudgetItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAnnualFinancial" ADD CONSTRAINT "BudgetAnnualFinancial_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BudgetAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_budgetPlanId_fkey" FOREIGN KEY ("budgetPlanId") REFERENCES "BudgetPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_linkedAnnualFinancialId_fkey" FOREIGN KEY ("linkedAnnualFinancialId") REFERENCES "BudgetAnnualFinancial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_vendorCompanyId_fkey" FOREIGN KEY ("vendorCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_purchaseItemId_fkey" FOREIGN KEY ("purchaseItemId") REFERENCES "PurchaseItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_renewalOwnerId_fkey" FOREIGN KEY ("renewalOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_procurementOwnerId_fkey" FOREIGN KEY ("procurementOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewal" ADD CONSTRAINT "MaintenanceRenewal_fundingAccountId_fkey" FOREIGN KEY ("fundingAccountId") REFERENCES "BudgetAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsRecord" ADD CONSTRAINT "SavingsRecord_budgetPlanId_fkey" FOREIGN KEY ("budgetPlanId") REFERENCES "BudgetPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsRecord" ADD CONSTRAINT "SavingsRecord_annualFinancialId_fkey" FOREIGN KEY ("annualFinancialId") REFERENCES "BudgetAnnualFinancial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsRecord" ADD CONSTRAINT "SavingsRecord_maintenanceRenewalId_fkey" FOREIGN KEY ("maintenanceRenewalId") REFERENCES "MaintenanceRenewal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsRecord" ADD CONSTRAINT "SavingsRecord_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLineItem" ADD CONSTRAINT "BudgetLineItem_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLineItem" ADD CONSTRAINT "BudgetLineItem_budgetCategoryId_fkey" FOREIGN KEY ("budgetCategoryId") REFERENCES "BudgetCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLineItem" ADD CONSTRAINT "BudgetLineItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLineItem" ADD CONSTRAINT "BudgetLineItem_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLineItem" ADD CONSTRAINT "BudgetLineItem_vendorCompanyId_fkey" FOREIGN KEY ("vendorCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLineItem" ADD CONSTRAINT "BudgetLineItem_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLineItem" ADD CONSTRAINT "BudgetLineItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLineItem" ADD CONSTRAINT "BudgetLineItem_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLineItem" ADD CONSTRAINT "BudgetLineItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLineItem" ADD CONSTRAINT "BudgetLineItem_productModuleId_fkey" FOREIGN KEY ("productModuleId") REFERENCES "ProductModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLineItem" ADD CONSTRAINT "BudgetLineItem_renewalId_fkey" FOREIGN KEY ("renewalId") REFERENCES "Renewal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLineItem" ADD CONSTRAINT "BudgetLineItem_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_vendorCompanyId_fkey" FOREIGN KEY ("vendorCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorCompanyId_fkey" FOREIGN KEY ("vendorCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductModule" ADD CONSTRAINT "ProductModule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFeature" ADD CONSTRAINT "ProductFeature_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFeature" ADD CONSTRAINT "ProductFeature_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "ProductModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSeller" ADD CONSTRAINT "ProductSeller_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSeller" ADD CONSTRAINT "ProductSeller_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCapability" ADD CONSTRAINT "ProductCapability_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCapability" ADD CONSTRAINT "ProductCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductModuleCapability" ADD CONSTRAINT "ProductModuleCapability_productModuleId_fkey" FOREIGN KEY ("productModuleId") REFERENCES "ProductModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductModuleCapability" ADD CONSTRAINT "ProductModuleCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFeatureCapability" ADD CONSTRAINT "ProductFeatureCapability_productFeatureId_fkey" FOREIGN KEY ("productFeatureId") REFERENCES "ProductFeature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFeatureCapability" ADD CONSTRAINT "ProductFeatureCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_purchasingVehicleId_fkey" FOREIGN KEY ("purchasingVehicleId") REFERENCES "PurchasingVehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_productModuleId_fkey" FOREIGN KEY ("productModuleId") REFERENCES "ProductModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItemFeature" ADD CONSTRAINT "PurchaseItemFeature_purchaseItemId_fkey" FOREIGN KEY ("purchaseItemId") REFERENCES "PurchaseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItemFeature" ADD CONSTRAINT "PurchaseItemFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "ProductFeature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBudgetAllocation" ADD CONSTRAINT "PurchaseBudgetAllocation_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBudgetAllocation" ADD CONSTRAINT "PurchaseBudgetAllocation_purchaseItemId_fkey" FOREIGN KEY ("purchaseItemId") REFERENCES "PurchaseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBudgetAllocation" ADD CONSTRAINT "PurchaseBudgetAllocation_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBudgetAllocation" ADD CONSTRAINT "PurchaseBudgetAllocation_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "BudgetItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseBudgetAllocation" ADD CONSTRAINT "PurchaseBudgetAllocation_budgetAnnualFinancialId_fkey" FOREIGN KEY ("budgetAnnualFinancialId") REFERENCES "BudgetAnnualFinancial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_purchaseItemId_fkey" FOREIGN KEY ("purchaseItemId") REFERENCES "PurchaseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_technicalOwnerId_fkey" FOREIGN KEY ("technicalOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_securityOwnerId_fkey" FOREIGN KEY ("securityOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageMeasurement" ADD CONSTRAINT "UsageMeasurement_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "Deployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Renewal" ADD CONSTRAINT "Renewal_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Renewal" ADD CONSTRAINT "Renewal_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Renewal" ADD CONSTRAINT "Renewal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_vendorCompanyId_fkey" FOREIGN KEY ("vendorCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_productModuleId_fkey" FOREIGN KEY ("productModuleId") REFERENCES "ProductModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_renewalId_fkey" FOREIGN KEY ("renewalId") REFERENCES "Renewal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_vendorCompanyId_fkey" FOREIGN KEY ("vendorCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_sellerCompanyId_fkey" FOREIGN KEY ("sellerCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_renewalId_fkey" FOREIGN KEY ("renewalId") REFERENCES "Renewal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_renewalId_fkey" FOREIGN KEY ("renewalId") REFERENCES "Renewal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_renewalId_fkey" FOREIGN KEY ("renewalId") REFERENCES "Renewal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_productModuleId_fkey" FOREIGN KEY ("productModuleId") REFERENCES "ProductModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_renewalId_fkey" FOREIGN KEY ("renewalId") REFERENCES "Renewal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_productModuleId_fkey" FOREIGN KEY ("productModuleId") REFERENCES "ProductModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_budgetLineItemId_fkey" FOREIGN KEY ("budgetLineItemId") REFERENCES "BudgetLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContractProducts" ADD CONSTRAINT "_ContractProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContractProducts" ADD CONSTRAINT "_ContractProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContractProductModules" ADD CONSTRAINT "_ContractProductModules_A_fkey" FOREIGN KEY ("A") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContractProductModules" ADD CONSTRAINT "_ContractProductModules_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RenewalProducts" ADD CONSTRAINT "_RenewalProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RenewalProducts" ADD CONSTRAINT "_RenewalProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "Renewal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RenewalProductModules" ADD CONSTRAINT "_RenewalProductModules_A_fkey" FOREIGN KEY ("A") REFERENCES "ProductModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RenewalProductModules" ADD CONSTRAINT "_RenewalProductModules_B_fkey" FOREIGN KEY ("B") REFERENCES "Renewal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Partial uniqueness for nullable ProductFeature.moduleId.
-- Prisma cannot currently express these PostgreSQL partial unique indexes in schema.prisma.
CREATE UNIQUE INDEX "ProductFeature_product_level_unique"
  ON "ProductFeature"("productId", "name")
  WHERE "moduleId" IS NULL;

CREATE UNIQUE INDEX "ProductFeature_module_level_unique"
  ON "ProductFeature"("productId", "moduleId", "name")
  WHERE "moduleId" IS NOT NULL;
