# TODO

## Current Phase

Phase 4: Products & Modules.

Phases 2 through 4 now have static management workspaces and expanded Prisma
model coverage. The app still does not have persistent CRUD, API routes, server
actions, authentication, or production database migrations.

## Active Follow-Up Work

- Complete human review of the expanded `prisma/schema.prisma`.
- Confirm the Vercel-managed Neon database environment variables locally.
- Create and apply the first Prisma migration against the reviewed development
  database.
- Generate the Prisma client against the reviewed schema.
- Run `prisma/seed.mjs` against the reviewed development database.
- Smoke-check persisted budget, contract, product, and module reads.
- Define service boundaries for database-backed budget, contract, product, and
  module CRUD before replacing local page state.
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

## Explicitly Deferred

- No authentication or authorization.
- No AI functionality.
- No notification functionality.
- No document upload or document storage workflow.
- No real procurement workflow implementation.
- No persistent CRUD, API routes, or server actions yet.
- No production financial workflow automation beyond pure calculation helpers.
- No tenant or organization boundaries until authentication and authorization
  design.
- No detailed accounting concepts such as GL accounts, journal entries, or
  payment reconciliation.
