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
- Products and purchased Product Components
- Product and service catalog relationships
- Transactional seller relationships and purchasing vehicle eligibility
- Approved or committed purchases, purchased line items, deployment waves, and
  usage measurements
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
- Support fiscal-year selection, inline row editing, add, duplicate, delete,
  reorder, filter, sort, sticky headers, sticky totals, and row detail drawers
  through Prisma-backed budget data where the database is configured.
- Use configurable Finance account records, keep default mappings out of the
  main entry grids, and calculate summary rollups from worksheet detail rows.
- Provide a dedicated `Summary` tab for account rollups, default account
  mappings, and year-over-year worksheet comparisons.
- Provide visible supporting schedule views for software and SaaS, maintenance
  renewal planning, training, conferences, travel, organizational dues, and
  professional services.
- Split conference registration and travel into separate worksheet/account
  paths so the budget entry model stays aligned with Finance account handling.
- Separate the Maintenance Renewals operational register from Budget while
  allowing applicable budget rows and contracts to hand off renewal planning
  records.
- Track maintenance renewal current cost, renewal amount, quote, negotiated
  cost, status, owner, recommendation, decision, co-op agreement, comments, and
  change history in the dedicated Renewal workspace.
- Preserve historical fiscal-year values and distinguish real budget reductions
  from cost avoidance.
- Keep reusable calculation and validation logic in pure helpers or server
  services instead of React components.

## Phase Status

- Phase 0 Project Foundation is complete.
- Phase 1 Database Architecture is complete.
- Phase 2 Budget Management, Phase 3 Contracts & Renewals, and Phase 4 Products
  & Modules are complete as original static workspaces and have been superseded
  by expanded Phase 4.5 database-backed workspaces.
- Phase 4.5 is implemented and in stabilization for Budget, Maintenance
  Renewals, Product Catalog, Contracts, Deployment, and Settings.
- Phase 5 Financial Dashboard has not started.
- Phase 6 Renewal Management is complete through the database-backed
  Maintenance Renewals operational register.
- Phases 7 through 10 remain future work except where Phase 4.5 deliberately
  pulled forward limited note, activity, summary, and local filtering
  capabilities.

## Catalog And Purchase Architecture Requirements

- Use Vendor, not Manufacturer, for the company that owns, develops, publishes,
  provides, or sells a product or service.
- Store vendor, reseller, service provider, implementation partner, and
  consultant roles on `Company` records.
- Keep catalog products free of organization-specific annual cost, seller,
  contract, budget, deployment, usage, and owner facts.
- Distinguish offering type for software, SaaS, hardware, managed services,
  professional services, training, support, and other offerings.
- Model structured capabilities for products and Product Components so
  redundancy analysis can use normalized overlap.
- Model Functions as product-level or component-level operational activities.
- Filter products by vendor, components by product, functions by
  product/component, and transactional purchasing controls by seller and
  product eligibility outside the Product Catalog UI.
- Treat `PurchaseRequest` as pre-commit workflow and `Purchase` as approved or
  committed acquisition. Do not duplicate request approval lifecycle in
  `Purchase`.
- Allow one purchase to allocate across multiple budget items or annual
  financial records.
- Track deployment as one-to-many per purchase item and usage as measurement
  history.
- Back Product Catalog and Purchases create/update workflows with Prisma-backed
  server-side persistence and clear validation errors.
- Show an explicit setup state when database environment variables are absent;
  do not fall back silently to static catalog or purchase arrays.
- Keep old Vendor and Reseller models until Company backfill and parity checks
  prove every reference has a new path.
