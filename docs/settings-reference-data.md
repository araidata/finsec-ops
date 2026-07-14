# Settings Reference Data

The Settings workspace at `/settings` manages shared reference data for the
single-organization finsec-ops application.

## Boundaries

- Department is the organizational department that owns the item.
- Owner is the Team Member assigned responsibility for the item.
- This first version intentionally uses one Department field and one Owner
  field per operational record.
- Team Members are reference records, not authentication accounts.
- Workflow states remain system-controlled when application rules, reporting,
  or calculations depend on stable values.

## Configurable Records

- Organization Settings: name, short name, default currency, current fiscal
  year, fiscal-year start month, and default timezone.
- Fiscal Years: label, dates, status, current indicator, planning enabled, and
  active state.
- Departments: name and active state.
- Team Members: full name, job title, Department, email, and active state.
- Financial Accounts: existing `BudgetAccount` records with code, name, active
  state, and worksheet mapping.
- Budget Categories: fiscal-year category labels with active state and display
  order.
- Expense Types: stable enum keys with configurable labels and active state.
- Purchasing Vehicles: reusable Contract purchasing vehicle names and
  descriptions.
- Payment Frequencies and License Metrics: stable enum keys with configurable
  labels and active state.
- Deployment Environments: business-managed environment labels.
- Renewal Priorities and Decision Reasons: stable priority keys and
  configurable decision-reason records.

## System-Controlled Values

These remain controlled in code and schema:

- Contract status.
- Deployment status.
- Renewal workflow stage, renewal status, quote status, funding status, and
  decision status.
- Renewal disposition.
- Payment status.
- Draft, completed, canceled, retired, and archived workflow states.

## Migration Notes

The Settings migration is staged and non-destructive. It adds nullable
Department and Team Member foreign keys beside legacy free-text owner and
department fields, creates matching reference records from existing values, and
backfills references where a safe match exists. Legacy text values remain in
place until parity is reviewed.

Only one Fiscal Year may be marked current through a partial unique database
index. Closed and archived fiscal years remain available for historical
reporting.
