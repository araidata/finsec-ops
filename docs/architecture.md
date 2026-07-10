# Architecture

## Current State

Phase 4.5 is the active workspace phase. Phase 0 established the static app
shell, design language, documentation structure, and test tooling. Phase 1
added the initial Prisma database architecture and pure financial calculation
helpers. Phases 2 through 4 added route-level static workspaces for budgets,
contracts, products, and modules. Phase 4.5 replaces the flat budget
implementation with a fiscal-year budget plan workspace and adds
database-backed Product Catalog and Purchases workflows.

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
multi-selects, active/inactive records, mutation errors, and empty states.

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

`src/lib/server/prisma.ts` provides the shared Neon-compatible Prisma client.
`src/lib/server/catalog-service.ts` owns server-side validation and mutations
for companies, roles, products, modules, features, capabilities, sellers,
purchasing vehicles, agreements, purchases, purchase items, allocations,
deployments, and usage measurements. The Product Catalog and Purchases routes
use server actions instead of local React-only persistence.

Authentication, document upload, AI, notifications, and real procurement
workflow execution are not implemented. The budget, maintenance renewal, and
contract workspaces still keep their create/edit/delete behavior in local page
state pending approved service boundaries and database migration.

Purchase lifecycle boundaries are explicit: `PurchaseRequest` tracks
pre-commit request and approval workflow, `ProcurementStatus` tracks operational
procurement processing, `Purchase` represents approved or committed
acquisitions, `Invoice` records payable obligations, and `Payment` records cash
movement.

## Provider Portability

Vercel and Neon are the initial platform choices. Future providers should be
isolated so the application can later move to internal AWS infrastructure with
PostgreSQL and Amazon Bedrock if required.
