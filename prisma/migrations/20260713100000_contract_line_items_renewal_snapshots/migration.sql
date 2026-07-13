-- CreateEnum
CREATE TYPE "RenewalLineAction" AS ENUM ('KEEP', 'CHANGE', 'ADD', 'REMOVE', 'REPLACE');

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN "previousContractId" TEXT;
ALTER TABLE "Contract" ADD COLUMN "contractOwner" TEXT;

-- CreateTable
CREATE TABLE "ContractLineItem" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "productId" TEXT,
    "productModuleId" TEXT,
    "description" TEXT NOT NULL,
    "sku" TEXT,
    "quantity" DECIMAL(14,2) NOT NULL DEFAULT 1,
    "licenseMetric" "LicenseMetric",
    "unitPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "annualAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "startsOn" DATE,
    "endsOn" DATE,
    "renewable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notesText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRenewalLineItem" (
    "id" TEXT NOT NULL,
    "maintenanceRenewalId" TEXT NOT NULL,
    "sourceContractLineId" TEXT,
    "productId" TEXT,
    "productModuleId" TEXT,
    "description" TEXT NOT NULL,
    "sku" TEXT,
    "licenseMetric" "LicenseMetric",
    "currentQuantity" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "proposedQuantity" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currentUnitPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "proposedUnitPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currentAnnualAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "quotedAnnualAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "negotiatedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "finalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "action" "RenewalLineAction" NOT NULL DEFAULT 'KEEP',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notesText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRenewalLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contract_previousContractId_idx" ON "Contract"("previousContractId");

-- CreateIndex
CREATE INDEX "ContractLineItem_contractId_sortOrder_idx" ON "ContractLineItem"("contractId", "sortOrder");

-- CreateIndex
CREATE INDEX "ContractLineItem_productId_idx" ON "ContractLineItem"("productId");

-- CreateIndex
CREATE INDEX "ContractLineItem_productModuleId_idx" ON "ContractLineItem"("productModuleId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalLineItem_maintenanceRenewalId_sortOrder_idx" ON "MaintenanceRenewalLineItem"("maintenanceRenewalId", "sortOrder");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalLineItem_sourceContractLineId_idx" ON "MaintenanceRenewalLineItem"("sourceContractLineId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalLineItem_productId_idx" ON "MaintenanceRenewalLineItem"("productId");

-- CreateIndex
CREATE INDEX "MaintenanceRenewalLineItem_productModuleId_idx" ON "MaintenanceRenewalLineItem"("productModuleId");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_previousContractId_fkey" FOREIGN KEY ("previousContractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractLineItem" ADD CONSTRAINT "ContractLineItem_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractLineItem" ADD CONSTRAINT "ContractLineItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractLineItem" ADD CONSTRAINT "ContractLineItem_productModuleId_fkey" FOREIGN KEY ("productModuleId") REFERENCES "ProductModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewalLineItem" ADD CONSTRAINT "MaintenanceRenewalLineItem_maintenanceRenewalId_fkey" FOREIGN KEY ("maintenanceRenewalId") REFERENCES "MaintenanceRenewal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewalLineItem" ADD CONSTRAINT "MaintenanceRenewalLineItem_sourceContractLineId_fkey" FOREIGN KEY ("sourceContractLineId") REFERENCES "ContractLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewalLineItem" ADD CONSTRAINT "MaintenanceRenewalLineItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRenewalLineItem" ADD CONSTRAINT "MaintenanceRenewalLineItem_productModuleId_fkey" FOREIGN KEY ("productModuleId") REFERENCES "ProductModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
