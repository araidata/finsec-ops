# TODO

## Current Phase

Phase 4.5: Core Budget and Maintenance Renewal Workspace.

Phases 2 through 4 have static management workspaces, and Phase 4.5 now has an
in-memory operational budget planning and maintenance renewal workflow plus
database-backed Product Catalog and Purchases workflows through Prisma-backed
server actions. The app still does not have authentication, notifications, AI,
document upload, production database migrations, or persistent CRUD for budgets,
maintenance renewals, and contracts.
Desktop production workflow and shell usability are the current priority.
Mobile-specific polish is deferred unless explicitly requested.

## Active Follow-Up Work

- Complete human review of the Phase 4.5 expanded `prisma/schema.prisma`.
- Review the transitional Company/catalog/purchase schema additions and the
  Vendor/Reseller migration worksheet before removing legacy models.
- Run Company backfill/parity checks against a reviewed development database.
- Confirm the Vercel-managed Neon database environment variables locally.
- Apply the reviewed Prisma migrations, including
  `20260710153000_purchase_app_compatibility`, against the development
  database.
- Generate the Prisma client against the reviewed schema.
- Run `prisma/seed.mjs` against the reviewed development database.
- Smoke-check persisted Product Catalog and Purchases reads and mutations
  against the migrated development database.
- Define service boundaries for database-backed budget planning, maintenance
  renewal, and contract CRUD before replacing local page state.
- Add route-level or service-level tests when persistent mutations are
  introduced.

## Tooling And Project Hygiene Still Needed

- Add a CI workflow for lint, tests, build, and Prisma validation.
- Re-run `npm audit` before production hardening and review moderate findings
  manually.
- Decide whether Playwright coverage should remain shell smoke coverage or
  expand to the new Phase 2-4 routes.
- Keep `.env.local` and all database secrets uncommitted.

## Completed

- Completed Phase 0 project foundation.
- Added the Next.js App Router scaffold.
- Added strict TypeScript configuration.
- Added Tailwind CSS and shadcn/ui.
- Added ESLint and Prettier tooling.
- Added Vitest, Testing Library, and Playwright tooling.
- Added reusable dashboard shell components for metrics, charts, renewals,
  procurement queue, and status badges.
- Added static dashboard sample data in `src/lib/dashboard-data.ts`.
- Added the homepage static visual shell for cybersecurity financial operations.
- Added a Playwright smoke test for the homepage shell.
- Added a MetricCard component test.
- Added project documentation under `docs`.
- Added architecture folders for decisions, database notes, diagrams, and UI
  notes.
- Added assistant instruction files for Codex, Claude, Cursor, and Copilot.
- Added the Phase 0 foundation architecture decision record.
- Added the initial PostgreSQL-compatible Prisma schema for core finsec-ops
  entities.
- Added governed enums for budget, contract, renewal, procurement, invoice,
  payment, document, and activity lifecycle/status values.
- Added Prisma 7 configuration in `prisma.config.ts`.
- Added database URL loading for `DATABASE_URL` with `POSTGRES_PRISMA_URL`
  fallback for Vercel-managed Neon projects.
- Added `prisma/README.md` to document the Prisma boundary.
- Added realistic cybersecurity seed data for Microsoft G5 through a reseller,
  SentinelOne, Rapid7, KnowBe4, Mimecast, and SANS.
- Added seeded records for fiscal year, budget categories, budget line items,
  vendors, resellers, contracts, products, product modules, renewal, purchase
  request, invoice, payment, documents, note, user, and activity log.
- Added financial calculation helpers and unit tests for budget totals,
  remaining budget, and renewal exposure by fiscal year.
- Added data model documentation in `docs/data-model.md`.
- Added architecture documentation in `docs/architecture.md`.
- Added development workflow documentation in `docs/development.md`.
- Added deployment documentation for Vercel-managed Neon expectations in
  `docs/deployment.md`.
- Added testing documentation in `docs/testing.md`.
- Added product requirements scope in `docs/requirements.md`.
- Added the Phase 1 initial database model architecture decision record.
- Updated `README.md` with completed work, active blockers, deferred
  capabilities, testing coverage, and known issues.
- Added Phase 2 Budget Management route at `/budgets`.
- Added budget item support for separate security program category and expense
  type, optional reseller, funding status, owner, justification, risk, notes,
  and budget/forecast/actual amounts.
- Added Budget Management summary cards, filters, sortable table columns,
  variance indicators, and reporting by program area and expense type.
- Added sample data that distinguishes Workforce Security Awareness from
  Cybersecurity Staff Training & Development.
- Added Phase 3 Contracts & Renewals route at `/contracts`.
- Added contract support for reseller tracking, renewal date, notice period,
  auto-renewal, payment frequency, owner/contact fields, renewal risk, and
  renewal strategy.
- Added contract summary cards, filters, sortable table columns, renewal
  urgency logic, spend-channel reporting, and upcoming renewal cards.
- Added Phase 4 Products & Modules route at `/products`.
- Added product support for broad product category, capability category,
  deployment status, owners, use case, strategic value, criticality, annual
  cost, contract association, and budget association.
- Added module support for capability category, enabled state, adoption level,
  license/use counts, cost, owner, and notes.
- Added product and module create, edit, and delete interactions in local page
  state.
- Added product summary cards, filters, sortable table columns, detail view,
  underused-module flags, and redundancy candidate indicators.
- Added portfolio analytics helpers and unit tests for Phase 2-4 calculations.
- Added the Phase 2-4 static workspace architecture decision record.
- Added Phase 4.5 Core Budget and Maintenance Renewal Workspace at `/budgets`.
- Added fiscal-year budget plans, scenario labels, configurable Finance
  accounts, logical budget items, annual financial records, maintenance
  renewals, and savings records in TypeScript domain types and Prisma schema.
- Added dense spreadsheet-style budget worksheet grids with inline editing,
  add, duplicate, delete, reorder, search, filtering, sorting, sticky headers,
  sticky totals, validation, and row detail drawer behavior in local page state.
- Added Finance Summary rollups calculated from supporting schedule rows.
- Redesigned the budget workspace into a finance-balanced entry model with a
  dedicated Summary tab, worksheet-specific budget-entry columns, split
  conference and travel worksheets, optional context sheets, and row-level
  account overrides through the detail drawer.
- Added a hideable shared navigation sidebar so budget entry and dashboard
  workflows can reclaim horizontal workspace.
- Updated the shared navigation sidebar to open by default and moved the
  minimize action into the sidebar footer so full-width entry is opt-in.
- Added a dedicated Maintenance Renewals worksheet with renewal increase,
  percent increase, negotiated savings, notice date, exposure, funding account,
  renewal status, procurement status, and owner tracking.
- Added Savings and Reductions reporting that distinguishes real budget
  reductions from cost avoidance.
- Added Phase 4.5 budget calculation, grouping, validation, and roll-forward
  helpers with unit, component, and Playwright coverage.
- Added the Phase 4.5 budget planning and maintenance renewal architecture
  decision record.
- Added the Phase 4.5 budget entry redesign architecture decision record.
- Documented desktop-first review and shell usability priority so mobile polish
  is not treated as default work unless explicitly requested.
- Added a pre-schema Vendor/Reseller to Company migration worksheet with
  field-by-field foreign-key mapping and lifecycle definitions for
  PurchaseRequest, ProcurementStatus, Purchase, Invoice, and Payment.
- Added transitional Company, CompanyRole, product feature, product seller,
  capability, purchasing vehicle eligibility, purchase, purchase item, budget
  allocation, deployment, and usage measurement models while preserving legacy
  Vendor and Reseller models.
- Added seed data and pure tests for Company role filtering, dependent
  catalog selections, seller and vehicle eligibility, purchase lifecycle rules,
  cost derivation, budget allocation splits, deployment usage history, and
  nullable ProductFeature uniqueness behavior.
- Replaced `/products` with a database-backed Product Catalog covering
  companies, products and services, modules, features, capabilities, seller
  relationships, purchasing vehicles, and purchasing agreements.
- Added `/purchases` with database-backed purchase headers, purchase items,
  included features, budget allocations, deployment scopes, and usage
  measurement history.
- Added server actions, Zod validation, a shared Prisma client helper, and
  reusable relational controls for active/inactive records, dependent
  selections, mutation errors, and empty states.
- Added Product Catalog and Purchases unit/component coverage and
  database-gated Playwright coverage.
- Expanded the Product Catalog seed set with major cybersecurity vendors,
  resellers, products, services, capabilities, and seller relationships.

## Explicitly Deferred

- No authentication or authorization.
- No AI functionality.
- No notification functionality.
- No document upload or document storage workflow.
- No real procurement workflow implementation.
- No persistent budget, maintenance renewal, or contract CRUD yet.
- No production financial workflow automation beyond pure calculation helpers.
- No tenant or organization boundaries until authentication and authorization
  design.
- No detailed accounting concepts such as GL accounts, journal entries, or
  payment reconciliation.
