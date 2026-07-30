# Budget Financial Workspace

## Status

Accepted

## Context

Finance planning requires fiscal-year history, account rollups, and distinct
supporting schedules. A flat portfolio row or one generic grid cannot represent
year-specific values, category-specific inputs, or Maintenance Renewal links
without overwriting history or duplicating Finance totals.

## Decision

`BudgetPlan` is the parent financial workspace for a Fiscal Year.
`BudgetItem` represents the continuing logical item, and
`BudgetAnnualFinancial` preserves year- and plan-specific amounts and worksheet
detail.

Supporting schedules are purpose-built for Software and SaaS, Training,
Conferences, Travel, Professional Services, and Organizational Dues. They feed
Finance summary and account rollups; summary totals are not a second editable
source.

Budget accounts are configurable and may provide worksheet defaults. Row-level
overrides remain available in detail editing rather than occupying every grid.
Maintenance Renewals may link to annual records so approved planning values can
be coordinated without merging operational renewal work into Budget.

The interaction model is a dense editable grid with a detail drawer and
collapsible application navigation.

## Consequences

- Fiscal-year history is stored rather than overwritten.
- Category-specific data entry and Finance reporting share one authoritative
  annual dataset.
- Conferences and Travel remain separate schedules.
- Maintenance Renewal operations remain owned by `/renewals`.
- Service validation and transactions must keep the logical item, annual row,
  account, Plan, and Fiscal Year consistent.
