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

Phase 0 establishes the application foundation only. The homepage is a static
visual shell that defines the design language for future work. It has no
authentication, CRUD, database models, migrations, financial calculations, AI,
notifications, or API routes.

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
- `src/lib`: shared utilities and static foundation data
- `src/hooks`: reusable React hooks
- `src/types`: shared TypeScript types
- `src/styles`: reserved for style modules that do not belong in app globals
- `prisma`: Prisma boundary placeholder; no schema yet
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

Phase 0: Project Foundation.

Completed foundation items:

- Next.js App Router scaffold
- TypeScript, Tailwind CSS, shadcn/ui, ESLint, Prettier, Vitest, Playwright
- Prisma dependency boundary without models or migrations
- Static visual dashboard shell
- Documentation structure
- AI assistant instruction files

## Development Roadmap

- Phase 0: Project Foundation
- Phase 1: Database Architecture
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
npm run dev
```

Open `http://localhost:3000`.

## Useful Commands

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
npm run format:check
```

## Deployment

The target host is Vercel. The intended database is Neon PostgreSQL through the
Vercel Integration. No production database is required for Phase 0 because the
application has no persistence path yet.

The application should remain portable enough to move later to an internal AWS
environment with PostgreSQL and Amazon Bedrock.

## Environment Variables

Phase 0 does not require environment variables.

Expected future variables include:

- `DATABASE_URL`: PostgreSQL connection string for Prisma
- AI provider variables only when an approved AI phase begins

Do not add placeholder secrets or unused environment variables.

## Testing Strategy

- ESLint checks static code quality.
- Prettier keeps formatting consistent.
- Vitest covers utilities and reusable React components.
- Playwright verifies the app shell renders across desktop and mobile browser
  contexts.

Add test coverage in proportion to workflow risk as real behavior is introduced.

## Portability Strategy

Avoid unnecessary vendor lock-in. Vercel and Neon are the initial deployment
path, but domain services, database access, and future AI providers should be
organized behind replaceable boundaries.

Prisma should target standard PostgreSQL features unless a reviewed decision
approves otherwise.

## Decision Log

Initial decisions are recorded in
`architecture/decisions/2026-07-09-phase-0-foundation.md`.

## Known Issues

- Prisma has been installed but not initialized with a schema by design.
- The homepage uses static placeholder data only.
- Authentication, authorization, persistence, calculations, CRUD, AI, and
  notifications are intentionally absent.
- npm reports moderate dependency audit findings from the current scaffold and
  toolchain; review before production hardening rather than applying breaking
  automatic fixes blindly.

## Current TODO Summary

See `TODO.md` for active work. The next recommended phase is Phase 1: Database
Architecture.
