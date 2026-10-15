-- Expand separately from the data migration: PostgreSQL requires new enum
-- values to commit before they can be used by subsequent statements.
ALTER TYPE "BudgetWorksheetType" ADD VALUE IF NOT EXISTS 'TRAVEL';
ALTER TYPE "BudgetWorksheetType" ADD VALUE IF NOT EXISTS 'CONFERENCES';
