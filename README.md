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

Phase 1 establishes the initial database architecture. The homepage remains a
static visual shell that defines the design language for future work, while
Prisma now defines the core PostgreSQL model and seed data for cybersecurity
financial operations. The app still has no authentication, CRUD pages, API
routes, AI, notifications, document upload, or real procurement workflows.

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
- `src/components/ui`: shadcn/ui source components
- `src/components/dashboard`: Phase 0 visual dashboard shell components
- `src/lib`: shared utilities, static foundation data, and pure calculation
  helpers
- `src/hooks`: reusable React hooks
- `src/types`: shared TypeScript types
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

Phase 1: Database Architecture.

Completed foundation items:

- Next.js App Router scaffold
- TypeScript, Tailwind CSS, shadcn/ui, ESLint, Prettier, Vitest, Playwright
- Static visual dashboard shell
- Documentation structure
- AI assistant instruction files

Completed Phase 1 items:

- Initial PostgreSQL-compatible Prisma schema
- Vercel-managed Neon environment variable configuration for Prisma commands
- Seed data for Microsoft G5 through a reseller, SentinelOne, Rapid7, KnowBe4,
  and Mimecast
- Pure financial calculation helpers and unit tests

Not implemented yet:

- Database migrations against a real Neon database
- CRUD pages or API routes
- Authentication or authorization
- AI features
- Document upload

## Development Roadmap

- Phase 0: Project Foundation (complete)
- Phase 1: Database Architecture (active)
- Phase 2: Budget Management
- Phase 3: Contracts & Renewals
- Phase 4: Products & Modules
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
or a compatible local PostgreSQL database:

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
Vercel Integration. Phase 1 defines the Prisma schema, but no production
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
- Playwright verifies the app shell renders across desktop and mobile browser
  contexts.
- Prisma validation checks the database schema.

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

## Known Issues

- The Phase 1 Prisma schema has not yet been applied to a real Neon database
  with a committed migration.
- The homepage uses static placeholder data only.
- Authentication, authorization, CRUD, AI, notifications, document upload, and
  real procurement workflows are intentionally absent.
- npm reports moderate dependency audit findings from the current scaffold and
  toolchain; review before production hardening rather than applying breaking
  automatic fixes blindly.

## Current TODO Summary

See `TODO.md` for active work. The next recommended phase after Phase 1 review
is Phase 2: Budget Management.
