# Architecture

## Current State

Phase 4.5 is the active workspace phase. Phase 0 established the static app
shell, design language, documentation structure, and test tooling. Phase 1
added the initial Prisma database architecture and pure financial calculation
helpers. Phases 2 through 4 added route-level static workspaces for budgets,
contracts, products, and modules. Phase 4.5 replaces the flat budget
implementation with a fiscal-year budget plan workspace, separates Maintenance
Renewals into a database-backed operational module, and adds database-backed
Product Catalog and Purchases workflows.

## Target Separation

- UI: route shells and reusable visual components
- Services: domain workflows and business rules
- Providers: external integrations behind interchangeable boundaries
- Database: Prisma and PostgreSQL persistence after model review
- Utilities: small shared helpers

## Current UI Boundary

`src/components/dashboard` contains the static visual shell. Static sample data
lives in `src/lib/dashboard-data.ts` so the layout can be replaced with real
services later without mixing workflow logic into components.

`src/components/app` contains the shared management workspace shell.
`src/components/portfolio` contains the Phase 2-4 contract, product, and
compatibility route components. `src/components/budgets` contains the Phase 4.5
budget planning workspace, editable grids, maintenance renewal grid, Finance
summary, savings view, and row detail drawer. Business calculations for the new
budget workspace live in `src/lib/budgets` instead of React components.
`src/components/catalog` contains the database-backed Product Catalog and
Purchases workspaces plus reusable relational controls for dependent selects,
multi-selects, active/inactive records, mutation errors, and empty states. The
Product Catalog is taxonomy-first: the visible UI exposes Vendors and
Resellers, vendors own Products, Products contain optional commercial Product
Components, and Products or Components can have reusable Capabilities and
operational Functions. Companies and company roles remain internal master data.
Purchasing eligibility and product-seller mappings are retained for Purchases
and future procurement/contract workflows but are not part of the Product
Catalog hierarchy.
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
Functions, capabilities, optional transactional seller/vehicle constraints,
purchases, purchase items, allocations, deployments, and usage measurements.
The Product Catalog and Purchases routes use server actions instead of local
React-only persistence.
`src/lib/server/maintenance-renewal-service.ts` owns Maintenance Renewal
validation and mutations for persisted renewal cases, recommended and approved
dispositions, decision history, quotes, workflow stages, tasks, funding
allocations, replacement plans, decommissioning plans, comments, and next-cycle
creation. `src/lib/maintenance-renewal-rules.ts` keeps disposition definitions,
helper text, required-field rules, default task rules, and decision-reason
logic out of React components.

Authentication, document upload, AI, notifications, and real procurement
workflow execution are not implemented. The budget and contract workspaces
still keep their create/edit/delete behavior in local page state pending
approved service boundaries and database migration. Maintenance Renewal
case-management actions now persist through Prisma-backed server actions.

Purchase lifecycle boundaries are explicit: `PurchaseRequest` tracks
pre-commit request and approval workflow, `ProcurementStatus` tracks operational
procurement processing, `Purchase` represents approved or committed
acquisitions, `Invoice` records payable obligations, and `Payment` records cash
movement.

## Provider Portability

Vercel and Neon are the initial platform choices. Future providers should be
isolated so the application can later move to internal AWS infrastructure with
PostgreSQL and Amazon Bedrock if required.
