UPDATE "BudgetAnnualFinancial" AS annual
SET "worksheetDetails" = jsonb_build_object(
  'resellerLabel', 'Direct',
  'requestType', 'Replacement',
  'replaces', 'Legacy vendor review tracker',
  'notes', COALESCE(annual."comments", '')
)
FROM "BudgetItem" AS item
WHERE annual."budgetItemId" = item."id"
  AND item."name" = 'OneTrust Platform Enterprise'
  AND annual."worksheetDetails" IS NULL;

UPDATE "BudgetAnnualFinancial" AS annual
SET "worksheetDetails" = jsonb_build_object(
  'resellerLabel', 'Direct',
  'requestType', 'New',
  'replaces', '',
  'notes', COALESCE(annual."comments", '')
)
FROM "BudgetItem" AS item
WHERE annual."budgetItemId" = item."id"
  AND item."name" = 'Rapid7 InsightIDR'
  AND annual."worksheetDetails" IS NULL;

UPDATE "BudgetAnnualFinancial" AS annual
SET "worksheetDetails" = jsonb_build_object(
  'training', 'SANS training vouchers',
  'quantity', 12,
  'costCents', 555900
)
FROM "BudgetItem" AS item
WHERE annual."budgetItemId" = item."id"
  AND item."name" = 'SANS Institute Technical Training'
  AND annual."worksheetDetails" IS NULL;
