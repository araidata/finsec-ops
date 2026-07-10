# Requirements

## Product Goal

finsec-ops helps cybersecurity leadership manage the financial operations of
the security portfolio.

## In Scope

- Cybersecurity budgets
- Budget planning
- Multi-year forecasting
- Vendors and resellers
- Contracts
- Products and purchased modules
- Renewals
- Procurement lifecycle
- Financial reporting
- Executive reporting
- Documents, notes, and activity history

## Out of Scope

- GRC platform workflows
- ERP workflows
- General accounting
- Ticketing
- Vulnerability management
- IT asset inventory
- Project management

## Phase 0 Requirements

- Scaffold the app and toolchain.
- Establish documentation and AI assistant standards.
- Establish the visual language with a static app shell.
- Avoid all business functionality.

## Phase 4.5 Requirements

- Provide a fiscal-year budget planning workspace for government Finance style
  cybersecurity budget submission.
- Preserve spreadsheet-style speed and density without turning the app into a
  plain Excel clone.
- Support fiscal-year selection, budget scenarios, roll-forward, inline row
  editing, add, duplicate, delete, reorder, search, filter, sort, sticky
  headers, sticky totals, and row detail drawers in local page state.
- Use configurable Finance account records, keep default mappings out of the
  main entry grids, and calculate summary rollups from worksheet detail rows.
- Provide a dedicated `Summary` tab for account rollups, default account
  mappings, and year-over-year worksheet comparisons.
- Provide visible supporting schedule views for software and SaaS, maintenance
  renewals, training, conferences, travel, organizational dues, professional
  services, submission, and export.
- Split conference registration and travel into separate worksheet/account
  paths so the budget entry model stays aligned with Finance account handling.
- Track maintenance renewal quote, negotiated cost, increase, percent increase,
  savings, notice date, exposure window, funding account, renewal status,
  procurement status, owner, and strategy.
- Preserve historical fiscal-year values and distinguish real budget reductions
  from cost avoidance.
- Keep all calculation logic in pure helpers and keep persistence deferred until
  the redesigned schema is reviewed.
