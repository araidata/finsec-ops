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
fiscal-year budget planning workspace, separates Maintenance Renewals into its
own database-backed operational module, and now includes database-backed
Product Catalog and Purchases workflows.

The Budget workspace now supports fiscal-year plan selection, scenario labels,
category-specific budget entry worksheets, a Finance-oriented Summary tab,
configured account rollups, row-level account overrides through the detail
drawer, maintenance renewal financial calculations, historical comparisons,
and roll-forward sample behavior in local page state. Detailed renewal
disposition, workflow, quotes, approvals, replacement, decommissioning, tasks,
comments, and history now belong to the Maintenance Renewals module. The
Product Catalog now uses
a full-width Vendors/Resellers workflow that separates vendor-owned products,
commercial Product Components, reusable capabilities, and operational
Functions. Purchases continue to read and mutate Prisma-backed purchase,
allocation, deployment, and usage records through server actions. Purchasing
eligibility, seller agreements, and purchasing vehicles are retained for
transactional workflows but no longer drive the Product Catalog UI. The
Contracts workspace still uses static local page state. Authentication,
notifications, AI, document upload, and real procurement workflow execution
remain deferred.
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
- `src/components/catalog`: database-backed Product Catalog and Purchases
  workspace components, Product Component/Function UI, drawer forms, and
  reusable relational controls
- `src/components/renewals`: database-backed Maintenance Renewals operational
  work queue and case-management workspace
- `src/components/budgets`: Phase 4.5 budget planning, worksheet-specific entry
  grids, Finance summary views, renewal planning, context sheet, and detail
  drawer components
- `src/lib`: shared utilities, static foundation data, and pure calculation
  helpers
- `src/lib/server`: Prisma client helper, action result helpers, validation,
  and database-backed catalog, purchase, and maintenance renewal services
- `src/lib/maintenance-renewal-rules.ts`: renewal disposition definitions,
  helper text, required-field rules, default task rules, and decision-reason
  logic
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
- `docs/vendor-reseller-company-migration-worksheet.md`: transitional
  field-by-field mapping from legacy Vendor and Reseller foreign keys to the
  Company, seller, purchase, allocation, deployment, and usage architecture
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
  CDW-G, Rapid7, KnowBe4, Mimecast, and an expanded Product Catalog seed set.
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
- Added Maintenance Renewals as a top-level navigation item at `/renewals` and
  separated it operationally from Budget.
- Expanded the Prisma `MaintenanceRenewal` model into a distinct operational
  renewal cycle record with separate overall status, workflow stage, renewal
  disposition, recommended disposition, approved disposition, decision status,
  risk status, funding status, quote status, priority, ownership, financial,
  replacement, decommissioning, and purchasing-link fields.
- Added database-backed renewal quotes, workflow stages, tasks, funding
  allocations, disposition decision history, replacement plans,
  decommissioning plans and checklist tasks, plus direct links from purchases,
  purchase requests, invoices, payments, documents, and notes to maintenance
  renewal cases.
- Added Maintenance Renewals server actions and service validations for case
  creation, case summary updates, disposition recommendations, disposition
  decisions, quote versions, workflow advancement, tasks, funding allocations,
  replacement plans, decommissioning plans, comments, and next renewal cycles.
- Refined the Maintenance Renewals workspace into a focused table-first
  operational queue with inline editing for core case fields and side panels
  for create, case, workflow, and disposition actions.
- Added database-backed inline dropdown editing for Renewal product, vendor,
  reseller, recommendation, and decision fields, and corrected native dropdown
  option colors across the dark application shell.
- Added in-interface disposition explanations and a Maintenance Renewal
  Settings reference section that distinguishes Review Required from Decision
  Pending, Renew with Changes from Renegotiate, Replace from Consolidate,
  Decommission from Do Not Renew, and temporary extension from normal renewal.
- Added Savings and Reductions reporting that distinguishes real budget
  reductions from cost avoidance.
- Added pure budget calculation, grouping, validation, and roll-forward helpers
  with unit and component tests.
- Updated the Prisma schema with reviewable Phase 4.5 models without applying a
  migration.
- Added a transitional normalized Company, product catalog, seller
  relationship, purchasing vehicle eligibility, purchase, purchase item, budget
  allocation, deployment wave, and usage measurement architecture while keeping
  the legacy Vendor and Reseller models for backfill parity.
- Added the Vendor and Reseller Company migration worksheet, partial
  ProductFeature uniqueness indexes in migration SQL, seed examples, and pure
  tests for dependent catalog/purchase rules.
- Replaced the visible `/products` workspace with a full-width,
  database-backed Product Catalog with exactly two primary tabs: Vendors and
  Resellers. The visible catalog separates vendor-owned Products, commercial
  Product Components, reusable Capabilities, and operational Functions.
- Added the `/purchases` workspace with database-backed purchase headers,
  purchase items, included functions, budget allocations, deployment scopes, and
  usage measurement history.
- Expanded the Product Catalog seed set with major cybersecurity vendors,
  resellers, products, services, capabilities, and seller relationships.
- Corrected Product Catalog ownership rollups so Unit 42 lives under Palo Alto
  Networks, Splunk lives under Cisco, and Wiz plus Mandiant live under Google.
- Deepened the seeded Product Catalog for active vendors with additional
  products, Product Components, capabilities, and Functions across Microsoft,
  Palo Alto Networks, SentinelOne, Rapid7, Cisco, Google, and Tanium so vendor
  reporting is materially more detailed.
- Further expanded Product Catalog coverage for OneTrust, Palo Alto AIRS,
  SentinelOne endpoint and AI security offerings, Zayo DDoS protection,
  Varonis, Absolute, Bitwarden, FireMon, BeyondTrust Bomgar, CIS/Albert,
  Nomic, Birch Cline, Veracode, Delinea, and KnowBe4 with deeper Products,
  Product Components, capabilities, and Functions.
- Added OneTrust AI Governance to the Product Catalog with AI inventory, risk
  assessment, policy/control, and continuous monitoring coverage.
- Added Product Catalog vendor deletion with dependency checks and aligned the
  vendor list to alphabetical ordering in the UI.
- Added server actions, Zod validation, a shared Prisma client helper, and
  reusable relational controls for active/inactive records, dependent
  selections, mutation errors, and empty states.
- Reworked Product Catalog create/edit UX into a right-side drawer so new
  vendors, resellers, products, Product Components, and Functions inherit the
  selected catalog context without a permanent editor column.
- Removed Companies, Product Seller mappings, Purchasing Eligibility,
  purchasing vehicles, and purchasing agreements from the Product Catalog UI.
  The underlying transactional models remain available for Purchases and future
  contract/procurement workflows.
- Updated the Software and SaaS budget worksheet so reseller selection uses
  active Company records with the `RESELLER` role, with a `Direct` option and
  static fallback values when no database is configured.
- Added a small compatibility migration for seller relationship type,
  purchasing agreement references, agreement dates/titles, and usage
  licensed/deployed counts.
- Confirmed the Vercel-managed Neon integration for Production, Preview, and
  Development, pulled `.env.local`, and verified a local Neon connection.
- Applied the committed Phase 4.5 Prisma migrations to the Vercel-managed Neon
  development database, generated the Prisma client, and seeded Product Catalog
  and Purchases data.
- Updated `prisma/seed.mjs` to load `.env.local` and create purchase item
  related records explicitly against the migrated schema.
- Wired the sidebar Vendors item to the Product Catalog vendor view and added a
  role-filtered vendor company rail.
- Removed Prisma migration execution from the Vercel build path and documented
  `npm run migrate:deploy` as the explicit migration command.
- Applied the operational Maintenance Renewals migration to the configured
  Vercel-managed Neon database.

Remaining before full database-backed workflow execution:

- Complete human review of the Phase 4.5 expanded `prisma/schema.prisma`.
- Smoke-check persisted budget, renewal, contract, Product Catalog, and
  Purchases reads against the migrated development database.
- Define persistence boundaries for budgets and contracts before replacing
  their remaining local page state.
- Extend role-based authorization once authentication is introduced; the
  renewal service enforces validation, but no authentication model exists yet.

Not implemented by design:

- Authentication or authorization.
- AI features.
- Notification functionality.
- Document upload or document storage.
- Real procurement workflow execution.
- Financial workflow automation beyond pure calculation helpers.
- A separate production database migration process.
- CI workflow automation.

## Development Roadmap

- Phase 0: Project Foundation (complete)
- Phase 1: Database Architecture (complete pending migration application)
- Phase 2: Budget Management (static workspace complete)
- Phase 3: Contracts & Renewals (static workspace complete)
- Phase 4: Products & Modules (superseded by the Phase 4.5 Product Catalog)
- Phase 4.5: Core Budget, Maintenance Renewal, Product Catalog, and Purchases
  Workspace
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
vercel env pull .env.local --environment=development --yes
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
npm run migrate:deploy
npm run prisma -- validate
npm run prisma -- format
```

## Deployment

The target host is Vercel. The intended database is Neon PostgreSQL through the
Vercel Integration. The expanded Prisma schema is defined and applied to the
Vercel-managed Neon database currently shared by Production, Preview, and
Development.

Vercel builds generate the Prisma client but do not run migrations. Apply
reviewed migrations explicitly with `npm run migrate:deploy` before deploying
schema-dependent code so repeated builds do not contend for Prisma advisory
migration locks.

The application should remain portable enough to move later to an internal AWS
environment with PostgreSQL and Amazon Bedrock.

## Environment Variables

Prisma commands and seed data expect a PostgreSQL connection string.

Expected variables:

- `POSTGRES_URL_NON_POOLING` or `DATABASE_URL_UNPOOLED`: preferred Prisma CLI
  connection strings for migrations.
- `DATABASE_URL`: preferred runtime connection string. For Vercel-managed Neon,
  set this to the pooled Neon PostgreSQL URL.
- `POSTGRES_PRISMA_URL`: supported fallback for Vercel-managed Neon projects
  that expose the pooled Prisma URL under this integration variable.

Use `vercel env pull .env.local --environment=development --yes` to pull local
development secrets.
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
- `src/lib/maintenance-renewal-rules.test.ts` verifies renewal disposition
  definitions, required decision rationale rules, and disposition-specific
  required-field rules.
- `src/components/budgets/budget-workspace.test.tsx` verifies worksheet-specific
  entry recalculation, context and summary behavior, renewal recalculation,
  fiscal year switching, and row detail behavior.
- `tests/home.spec.ts` verifies the static dashboard shell renders.
- `tests/budgets.spec.ts` verifies the Phase 4.5 budget workspace browser
  workflow.
- `tests/catalog-purchases.spec.ts` verifies Product Catalog and Purchases
  browser surfaces when a development database URL is configured.

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
The Product Catalog reseller role UX is recorded in
`architecture/decisions/2026-07-10-product-catalog-reseller-role-ux.md`.
The operational Maintenance Renewals separation is recorded in
`architecture/decisions/2026-07-11-operational-maintenance-renewals.md`.

## Known Issues

- Production, Preview, and Development currently share the same Vercel-managed
  Neon database; future environment isolation needs a reviewed database branch
  or project plan.
- Legacy Vendor and Reseller models are intentionally still present until the
  Company backfill, parity checks, and application read/write migration are
  reviewed.
- Budget and contract create/edit/delete actions are local page state only and
  are not persisted. Maintenance Renewal case-management actions persist
  through Prisma-backed server actions.
- Product Catalog and Purchases require the reviewed migrations to be applied
  to a configured database; without `DATABASE_URL` or `POSTGRES_PRISMA_URL`,
  they show an explicit setup state.
- Authentication, authorization, AI, notifications, document upload, and real
  procurement workflows are intentionally absent.
- The repository has no CI workflow yet.
- npm reports moderate dependency audit findings from the current scaffold and
  toolchain; review before production hardening rather than applying breaking
  automatic fixes blindly.

## Current TODO Summary

See `TODO.md` for the current task ledger. The next recommended work is human
review of the Phase 4.5 financial and renewal model, smoke testing against the
migrated development database, and persistent service wiring for the remaining
budget and contract workspaces.
