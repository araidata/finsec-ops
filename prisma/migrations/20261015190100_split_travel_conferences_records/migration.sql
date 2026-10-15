-- Preserve the existing UI classification: 62026 is Travel; other legacy
-- combined accounts/rows are Conferences. IDs, links, amounts, details, and
-- timestamps remain unchanged. Only legacy values are updated, making this
-- backfill safe to rerun without changing subsequent user classifications.
BEGIN;
UPDATE "BudgetAccount"
SET "defaultWorksheet" = CASE WHEN "code" = '62026'
  THEN 'TRAVEL'::"BudgetWorksheetType" ELSE 'CONFERENCES'::"BudgetWorksheetType" END
WHERE "defaultWorksheet" = 'TRAVEL_CONFERENCES';

UPDATE "BudgetAnnualFinancial" annual
SET "worksheet" = CASE WHEN account."code" = '62026'
  THEN 'TRAVEL'::"BudgetWorksheetType" ELSE 'CONFERENCES'::"BudgetWorksheetType" END
FROM "BudgetAccount" account
WHERE annual."accountId" = account."id" AND annual."worksheet" = 'TRAVEL_CONFERENCES';
COMMIT;
