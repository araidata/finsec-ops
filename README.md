# finsec-ops

finsec-ops is a cybersecurity financial operations platform for CISOs and
cybersecurity leadership. The product focuses on the operating discipline around
cybersecurity spend: budgets, planning, forecasting, vendors, resellers,
contracts, products, modules, renewals, procurement lifecycle, financial
reporting, and executive reporting.

README.md is the primary source of truth for the project. Update it whenever
architecture, folder structure, data model, technology decisions, development
workflow, deployment, or testing strategy changes.

## Purpose

The application helps cybersecurity leaders understand and manage financial
operations for the security portfolio. It should feel like modern enterprise
cybersecurity software, not a generic accounting tool.

## Scope

- Cybersecurity budgets and budget planning
- Multi-year forecasting
- Vendors, resellers, contracts, products, and product modules
- Renewals and procurement lifecycle visibility
- Financial and executive reporting
- Documents, notes, and audit-oriented activity history

## Out of Scope

finsec-ops is not intended to become a GRC platform, ERP, general accounting
package, ticketing platform, vulnerability management system, IT asset inventory,
or project management platform.

## Technology Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma ORM
- PostgreSQL
- Neon PostgreSQL through the Vercel Integration
- Vercel
- ESLint
- Prettier
- Vitest
- Playwright

## Architecture Overview

Phase 0 established the application foundation, static visual dashboard shell,
documentation structure, and engineering guardrails. Phase 1 established the
initial database architecture. Phases 2 through 4 add static management
workspaces and reviewed model extensions for budgets, contracts, products, and
modules. Phase 4.5 replaces the flat budget workspace with a Finance-oriented
fiscal-year budget planning and maintenance renewal workspace.

The Budget workspace now supports fiscal-year plan selection, scenario labels,
category-specific budget entry worksheets, a Finance-oriented Summary tab,
configured account rollups, row-level account overrides through the detail
drawer, maintenance renewal calculations, historical comparisons, and
roll-forward sample behavior in local page state. The Contracts and Products
pages still support in-browser create, edit, delete, filtering, sorting,
summaries, and reporting against sample data. These pages do not persist
changes yet; database-backed CRUD, API routes, authentication, notifications,
AI, document upload, and real procurement workflow execution remain deferred.
Current production review and shell usability work should prioritize desktop
behavior. Mobile-specific polish is deferred unless explicitly requested.

Future implementation should keep concerns separated:

- UI: route shells and reusable presentation components
- Services: business workflows and domain operations
- Providers: interchangeable integrations such as database, AI, storage, and
  deployment-specific services
- Database: Prisma and PostgreSQL persistence after model review
- Utilities: small shared helpers without product workflow ownership

Business logic must not live inside React components.

## Folder Structure

- `src/app`: Next.js App Router routes and global app layout
- `src/components`: reusable React components
- `src/components/app`: shared application shell for management workspaces
- `src/components/ui`: shadcn/ui source components
- `src/components/dashboard`: Phase 0 visual dashboard shell components
- `src/components/portfolio`: Phase 2-4 contract, product, and compatibility
  workspace components
- `src/components/budgets`: Phase 4.5 budget planning, worksheet-specific entry
  grids, Finance summary views, renewal planning, context sheet, and detail
  drawer components
- `src/lib`: shared utilities, static foundation data, and pure calculation
  helpers
- `src/lib/budgets`: Phase 4.5 budget calculations, grouping, validation,
  roll-forward, and typed sample data
- `src/hooks`: reusable React hooks
- `src/types`: shared TypeScript option sets and domain interfaces
- `src/styles`: reserved for style modules that do not belong in app globals
- `prisma`: Prisma schema and seed data for the Phase 1 database architecture
- `prisma.config.ts`: Prisma 7 configuration for schema, migrations, seed, and
  database URL loading
- `docs`: product, architecture, data model, development, testing, and
  deployment documentation
- `architecture`: decision records, database notes, diagrams, and UI notes
- `tests`: Playwright end-to-end tests

## Development Standards

- Read `README.md` and `TODO.md` before making changes.
- Confirm the active development phase before changing code.
- Work only within the current phase unless explicitly instructed otherwise.
- Update documentation when architecture, workflow, folder structure, or model
  decisions change.
- Update `TODO.md` after meaningful work is completed.
- Record significant architectural decisions in `architecture/decisions`.
- Keep commits and pull requests small.

## Coding Standards

- Use strict TypeScript and strong types.
- Prefer small, reusable components.
- Keep business logic outside UI components.
- Use modular services for workflows once real behavior begins.
- Keep providers interchangeable.
- Prefer composition over duplication.
- Add dependencies only when they clearly reduce durable complexity.
- Favor readability and maintainability over cleverness.
- Use comments sparingly and only when they clarify non-obvious code.

## Naming Conventions

- Components: `PascalCase`
- Component files: kebab-case or established shadcn filenames
- Hooks: `useSomething`
- Services and providers: domain-first names such as `renewal-service`
- Tests: colocated `*.test.tsx` for unit/component tests and `tests/*.spec.ts`
  for Playwright
- Documentation: lowercase kebab-case Markdown files

## Current Phase

Phase 4.5: Core Budget and Maintenance Renewal Workspace.

Completed foundation items:

- Next.js App Router application scaffold.
- Strict TypeScript configuration with path aliases.
- Tailwind CSS and shadcn/ui component setup.
- ESLint, Prettier, Vitest, Testing Library, and Playwright tooling.
- Static cybersecurity financial operations dashboard shell.
- Static sample dashboard data separated into `src/lib/dashboard-data.ts`.
- Reusable dashboard components for metrics, charts, renewals, procurement
  queue, and status badges.
- Unit/component test coverage for the metric card component.
- Playwright smoke test for the homepage shell.
- Documentation structure under `docs`.
- Architecture folders for decisions, database notes, diagrams, and UI notes.
- AI assistant instruction files for Codex, Claude, Cursor, and Copilot.
- Phase 0 architecture decision record.

Completed Phase 1 items:

- Initial PostgreSQL-compatible Prisma schema for fiscal years, budget
  categories, budget line items, vendors, resellers, contracts, products,
  product modules, renewals, purchase requests, invoices, payments, documents,
  notes, users, and activity logs.
- Governed lifecycle/status enums for budget, contract, renewal, procurement,
  invoice, payment, document, and audit activity concepts.
- Prisma 7 configuration in `prisma.config.ts`.
- Vercel-managed Neon environment variable loading for Prisma commands using
  `DATABASE_URL` with `POSTGRES_PRISMA_URL` fallback.
- Prisma boundary documentation in `prisma/README.md`.
- Seed data for Microsoft 365 G5 purchased through SHI, SentinelOne through
  CDW-G, Rapid7, KnowBe4, and Mimecast.
- Seeded examples for vendors, resellers, contracts, products, product modules,
  budget line items, a renewal, a purchase request, an invoice, a payment,
  documents, a note, and an activity log.
- Pure financial calculation helpers for approved budget, forecast, committed
  spend, actual spend, remaining budget, and renewal exposure by fiscal year.
- Unit tests for financial calculation helpers.
- Data model documentation in `docs/data-model.md`.
- Architecture, development, deployment, testing, and requirements docs.
- Phase 1 initial database model architecture decision record.

Completed Phase 2 items:

- Budget Management route at `/budgets`.
- Budget items with separate budget category and expense type.
- Funding status, vendor, reseller, owner, justification, risk, notes, and
  amount tracking in the UI model.
- Summary cards, filters, sortable table columns, variance indicators, and
  reporting by security program area and expense type.
- Explicit separation of Workforce Security Awareness from Cybersecurity Staff
  Training & Development in sample data and reporting.

Completed Phase 3 items:

- Contracts & Renewals route at `/contracts`.
- Contract model extensions for reseller tracking, renewal date, notice period,
  auto-renewal, payment frequency, owner/contact fields, renewal risk, and
  renewal strategy.
- Summary cards, filters, sortable table columns, renewal urgency logic, status
  badges, spend-channel reporting, and upcoming renewal cards.

Completed Phase 4 items:

- Products & Modules route at `/products`.
- Product model extensions for broad portfolio category, capability category,
  deployment status, owners, use case, strategic value, criticality, annual
  cost, contract association, and budget association.
- Product module model extensions for capability category, enabled state,
  adoption, license/use counts, cost, owner, and notes.
- Product and module create, edit, and delete interactions in local page state.
- Summary cards, filters, sortable table columns, product detail view,
  underused-module flags, and helpful redundancy candidate indicators.

Completed Phase 4.5 items:

- Replaced the generic flat Budget Management page with a fiscal-year budget
  planning workspace.
- Added typed static budget domain data for FY2025, FY2026, and FY2027.
- Added configurable Finance account records for the initial government account
  codes used by the supporting schedules.
- Added budget plan, scenario, logical item, annual financial, maintenance
  renewal, and savings record type design.
- Added spreadsheet-style editable budget grids with add, duplicate, delete,
  reorder, filtering, search, sorting, sticky headers, sticky totals, and row
  detail drawer behavior in local page state.
- Added Finance Summary rollups that are calculated from supporting schedule
  rows instead of being entered separately.
- Redesigned the budget workspace into a finance-balanced entry model with a
  dedicated Summary tab, worksheet-specific column sets, and default account
  mappings surfaced outside the main entry grids.
- Split conference registration and travel into separate worksheets so account
  mapping and summary totals stay Finance-aligned.
- Added optional budget context sheets and a hideable shared navigation sidebar
  so the budget worksheets can use the full page width during entry.
- Added a dedicated Maintenance Renewals worksheet with renewal quote,
  negotiated cost, increase, savings, notice date, account, status,
  procurement status, and owner calculations.
- Added Savings and Reductions reporting that distinguishes real budget
  reductions from cost avoidance.
- Added pure budget calculation, grouping, validation, and roll-forward helpers
  with unit and component tests.
- Updated the Prisma schema with reviewable Phase 4.5 models without applying a
  migration.

Remaining before database-backed workflow execution:

- Complete human review of the Phase 4.5 expanded `prisma/schema.prisma`.
- Confirm the Vercel-managed Neon database environment variables locally.
- Create and apply the first Prisma migration against the reviewed development
  database.
- Generate the Prisma client against the reviewed schema.
- Run `prisma/seed.mjs` against the reviewed development database.
- Add API routes, server actions, or service boundaries for persistent CRUD
  after the data model and migration are approved.
- Smoke-check persisted budget, renewal, contract, product, and module reads
  before replacing local page state.

Not implemented by design:

- Database-backed CRUD routes, server actions, or API routes.
- Authentication or authorization.
- AI features.
- Notification functionality.
- Document upload or document storage.
- Real procurement workflow execution.
- Financial workflow automation beyond pure calculation helpers.
- Production database migration.
- CI workflow automation.

## Development Roadmap

- Phase 0: Project Foundation (complete)
- Phase 1: Database Architecture (complete pending migration application)
- Phase 2: Budget Management (static workspace complete)
- Phase 3: Contracts & Renewals (static workspace complete)
- Phase 4: Products & Modules (static workspace complete)
- Phase 4.5: Core Budget and Maintenance Renewal Workspace (static and
  in-memory operational workflow complete pending model review)
- Phase 5: Financial Dashboard
- Phase 6: Renewal Management
- Phase 7: Documents & Audit Trail
- Phase 8: Reporting
- Phase 9: Search
- Phase 10: Authentication & Hardening

Later roadmap topics: advanced analytics, procurement enhancements, security
investment mapping, compliance mapping, risk mapping, staffing and training,
executive reporting, AI assistance, business justification library, scenario
planning, and integrations.

## Local Development

```bash
npm install
vercel env pull .env.local --yes
npm run dev
```

Open `http://localhost:3000`.

Prisma commands require a database URL from the Vercel-managed Neon integration
or a compatible local PostgreSQL database. `prisma validate` and
`prisma format` can use a disposable PostgreSQL-shaped URL when only schema
shape is being checked:

```bash
npm run prisma -- validate
npm run prisma -- generate
npm run prisma -- migrate dev
npm run prisma -- db seed
```

## Useful Commands

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
npm run format:check
npm run prisma -- validate
npm run prisma -- format
```

## Deployment

The target host is Vercel. The intended database is Neon PostgreSQL through the
Vercel Integration. The expanded Prisma schema is defined, but no production
migration has been committed yet.

The application should remain portable enough to move later to an internal AWS
environment with PostgreSQL and Amazon Bedrock.

## Environment Variables

Prisma commands and seed data expect a PostgreSQL connection string.

Expected variables:

- `DATABASE_URL`: preferred Prisma connection string. For Vercel-managed Neon,
  set this to the pooled Neon PostgreSQL URL.
- `POSTGRES_PRISMA_URL`: supported fallback for Vercel-managed Neon projects
  that expose the pooled Prisma URL under this integration variable.

Use `vercel env pull .env.local --yes` to pull local development secrets.
`.env.local` is gitignored. Do not commit database secrets, placeholder
secrets, or unused environment variables.

AI provider variables are intentionally not expected until an approved AI phase
begins.

## Testing Strategy

- ESLint checks static code quality.
- Prettier keeps formatting consistent.
- Vitest covers utilities and reusable React components.
- Playwright verifies the app shell renders in browser contexts, with desktop
  workflows treated as the current priority unless a mobile task is explicitly
  requested.
- Prisma validation checks the database schema.

Current coverage:

- `src/components/dashboard/metric-card.test.tsx` verifies a reusable dashboard
  component renders its key content.
- `src/lib/financial-calculations.test.ts` verifies the financial calculation
  helpers.
- `src/lib/portfolio-analytics.test.ts` verifies Phase 2-4 budget, renewal,
  module utilization, and redundancy helper logic.
- `src/lib/budgets/budget-calculations.test.ts` verifies Phase 4.5 line totals,
  account rollups, fiscal totals, changes, variances, renewal calculations,
  exposure windows, historical comparisons, and roll-forward behavior.
- `src/components/budgets/budget-workspace.test.tsx` verifies worksheet-specific
  entry recalculation, context and summary behavior, renewal recalculation,
  fiscal year switching, and row detail behavior.
- `tests/home.spec.ts` verifies the static dashboard shell renders.
- `tests/budgets.spec.ts` verifies the Phase 4.5 budget workspace browser
  workflow.

Add test coverage in proportion to workflow risk as real behavior is introduced.

## Portability Strategy

Avoid unnecessary vendor lock-in. Vercel and Neon are the initial deployment
path, but domain services, database access, and future AI providers should be
organized behind replaceable boundaries.

Prisma should target standard PostgreSQL features unless a reviewed decision
approves otherwise.

## Decision Log

Initial decisions are recorded in
`architecture/decisions/2026-07-09-phase-0-foundation.md` and
`architecture/decisions/2026-07-09-phase-1-initial-database-model.md`.
Phase 2-4 and Phase 4.5 decisions are recorded in
`architecture/decisions/2026-07-09-phase-2-4-static-management-workspaces.md`
and
`architecture/decisions/2026-07-10-phase-4-5-budget-renewal-workspace.md`.
The budget entry redesign is recorded in
`architecture/decisions/2026-07-10-phase-4-5-budget-entry-redesign.md`.

## Known Issues

- The expanded Prisma schema has not yet been applied to a real Neon database
  with a committed migration.
- Budget, maintenance renewal, contract, product, and module create/edit/delete
  actions are local page state only and are not persisted.
- Authentication, authorization, AI, notifications, document upload, and real
  procurement workflows are intentionally absent.
- The repository has no CI workflow yet.
- npm reports moderate dependency audit findings from the current scaffold and
  toolchain; review before production hardening rather than applying breaking
  automatic fixes blindly.

## Current TODO Summary

See `TODO.md` for the current task ledger. The next recommended work is human
review of the Phase 4.5 financial model, migration planning, seed review, smoke
testing, and persistent service wiring for the budget and renewal workspace.
