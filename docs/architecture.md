# Architecture

## Current State

The project is in Phase 4.5 stabilization. Phase 0 established the static app
shell, design language, documentation structure, and test tooling. Phase 1
added the initial Prisma database architecture and pure financial calculation
helpers. Phases 2 through 4 added route-level static workspaces for budgets,
contracts, products, and modules. Phase 4.5 superseded those flat/static
workspaces with database-backed Budget, Maintenance Renewals, Product Catalog,
Contracts, Deployment, and Settings workflows. Purchases remain in the schema
for staged compatibility but are not a primary navigation item. Phase 6 Renewal
Management is complete within the intended operational register scope. Phase 5
Financial Dashboard is implemented as a typed, read-only aggregation layer.

## Target Separation

- UI: route shells and reusable visual components
- Services: domain workflows and business rules
- Providers: external integrations behind interchangeable boundaries
- Database: Prisma and PostgreSQL persistence after model review
- Utilities: small shared helpers

## Current UI Boundary

`src/components/dashboard` contains the dashboard presentation components.
`src/lib/server/dashboard-service.ts` owns the typed read model and department
aggregation so the UI does not own reporting logic.

`src/components/app` contains the shared management workspace shell.
`src/components/portfolio` contains the Phase 2-4 contract, product, and
compatibility route components. `src/components/budgets` contains the Phase 4.5
budget planning workspace, editable grids, maintenance renewal grid, Finance
summary, savings view, and row detail drawer. Business calculations for the new
budget workspace live in `src/lib/budgets` instead of React components.
`src/components/catalog` contains the database-backed Product Catalog workspace
plus reusable relational controls for dependent selects, multi-selects,
active/inactive records, mutation errors, and empty states. The
Product Catalog is taxonomy-first: the visible UI exposes Vendors and
Resellers, vendors own Products, Products contain optional commercial Product
Components, and Products or Components can have reusable Capabilities and
operational Functions. Companies and company roles remain internal master data.
Purchasing eligibility and product-seller mappings are retained for Purchases
and future procurement/contract workflows but are not part of the Product
Catalog hierarchy.
`src/components/deployment` contains the database-backed Deployment register and
usage workflow. Deployments are scoped to contract line items where possible and
use Settings-backed Department, Owner, and Environment choices.
`src/components/settings` contains the database-backed Settings workspace for
Organization, Fiscal Years, Departments, Team Members, Finance reference data,
Contract options, Deployment options, and Renewal options.
`src/components/app/global-context-provider.tsx` owns the shared Department and
Fiscal Year selectors. The root layout loads active reference options from
`src/lib/server/global-context.ts`, while route services apply the context to
their server-side reads. Inclusion semantics are documented in
`docs/global-context.md`.
`src/components/renewals` contains the database-backed Maintenance Renewals
work queue and case-management workspace. The Budget workspace may show renewal
financial summaries and status indicators, but detailed renewal disposition,
decision history, workflow stages, quotes, approvals, tasks, replacement
planning, decommissioning, funding allocations, comments, and linked purchasing
records belong to `/renewals`.

## Current Database Boundary

`prisma/schema.prisma` defines the PostgreSQL-compatible model for core
cybersecurity financial operations and has been extended for Phase 4.5 budget
planning and operational maintenance renewal case management. The reviewable
model separates Budget Plan, Budget Scenario, Budget Account, Budget Item,
Budget Annual Financial, Maintenance Renewal, renewal child records, and
Savings Record.

The schema now also includes a transitional Company/catalog/purchase
architecture. Legacy `Vendor` and `Reseller` models remain in place while new
`Company`, `CompanyRole`, `ProductSeller`, `PurchasingVehicle`,
`PurchasingVehicleSeller`, `PurchasingVehicleProductEligibility`, `Purchase`,
`PurchaseItem`, `PurchaseBudgetAllocation`, `Deployment`, and
`UsageMeasurement` records are backfilled and validated. Existing
`ProductModule` and `ProductFeature` tables are preserved for migration safety
but now carry Product Component and Function fields. The transition is
documented in `docs/vendor-reseller-company-migration-worksheet.md`.
`prisma.config.ts` loads Vercel-managed Neon connection strings from
environment variables for Prisma commands.

`src/lib/server/prisma.ts` provides the shared Neon-compatible Prisma client.
`src/lib/server/catalog-service.ts` owns server-side validation and mutations
for companies, visible vendor/reseller saves, products, Product Components,
Functions, capabilities, and optional transactional seller/vehicle constraints.
The Product Catalog route uses server actions instead of local React-only
persistence.
`src/lib/server/deployment-service.ts` owns Deployment reads and mutations,
including Contract Line Item references, Department and Owner references,
environment assignment, and usage measurement history.
`src/lib/server/settings-service.ts` owns Settings reads and mutations,
including reference-data validation, duplicate active-name checks, fiscal-year
date and current-year rules, and active/inactive toggles.
`src/lib/server/maintenance-renewal-service.ts` owns Maintenance Renewal
validation and mutations for persisted renewal cases, recommended and approved
dispositions, decision history, quotes, workflow stages, tasks, funding
allocations, replacement plans, decommissioning plans, comments, and next-cycle
creation. `src/lib/maintenance-renewal-rules.ts` keeps disposition definitions,
helper text, required-field rules, default task rules, and decision-reason
logic out of React components.

Authentication, authorization, document upload, AI, notifications, and real
procurement workflow execution are not implemented. Budget, Maintenance
Renewals, Product Catalog, Contracts, Deployment, and Settings now persist
through Prisma-backed server actions when a database is configured. Remaining
Phase 4.5 work is stabilization: schema review, migrated-database smoke checks,
budget edge-case hardening, Company/catalog parity checks, and CI workflow
automation.

Purchase lifecycle boundaries are explicit: `PurchaseRequest` tracks
pre-commit request and approval workflow, `ProcurementStatus` tracks operational
procurement processing, `Purchase` represents approved or committed
acquisitions, `Invoice` records payable obligations, and `Payment` records cash
movement.

## Provider Portability

Vercel and Neon are the initial platform choices. Future providers should be
isolated so the application can later move to internal AWS infrastructure with
PostgreSQL and Amazon Bedrock if required.
