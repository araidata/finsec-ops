# Architecture

## Current State

Phase 4.5 has been implemented as the active static management workspace. Phase 0
established the static app shell, design language, documentation structure, and
test tooling. Phase 1 added the initial Prisma database architecture and pure
financial calculation helpers. Phases 2 through 4 add route-level workspaces for
budgets, contracts, products, and modules with local page-state create, edit,
delete, filtering, sorting, summaries, and reporting. Phase 4.5 replaces the
flat budget implementation with a fiscal-year budget plan workspace,
spreadsheet-style supporting schedules, configurable Finance account rollups,
maintenance renewal tracking, savings reporting, and roll-forward helpers.

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

## Current Database Boundary

`prisma/schema.prisma` defines the PostgreSQL-compatible model for core
cybersecurity financial operations and has been extended for Phase 4.5 budget
planning and maintenance renewal review. The reviewable model separates Budget
Plan, Budget Scenario, Budget Account, Budget Item, Budget Annual Financial,
Maintenance Renewal, and Savings Record.

The schema now also includes a transitional Company/catalog/purchase
architecture. Legacy `Vendor` and `Reseller` models remain in place while new
`Company`, `CompanyRole`, `ProductSeller`, `PurchasingVehicle`,
`PurchasingVehicleSeller`, `PurchasingVehicleProductEligibility`, `Purchase`,
`PurchaseItem`, `PurchaseBudgetAllocation`, `Deployment`, and
`UsageMeasurement` records are backfilled and validated. The transition is
documented in `docs/vendor-reseller-company-migration-worksheet.md`.
`prisma.config.ts` loads Vercel-managed Neon connection strings from
environment variables for Prisma commands.

No persistent CRUD routes, authentication, document upload, AI, or real
procurement workflows are implemented yet. The Phase 4.5 create, edit, delete,
roll-forward, and renewal behavior is intentionally local page state until the
reviewed Prisma schema is migrated and service boundaries are approved.

Purchase lifecycle boundaries are explicit: `PurchaseRequest` tracks
pre-commit request and approval workflow, `ProcurementStatus` tracks operational
procurement processing, `Purchase` represents approved or committed
acquisitions, `Invoice` records payable obligations, and `Payment` records cash
movement.

## Provider Portability

Vercel and Neon are the initial platform choices. Future providers should be
isolated so the application can later move to internal AWS infrastructure with
PostgreSQL and Amazon Bedrock if required.
