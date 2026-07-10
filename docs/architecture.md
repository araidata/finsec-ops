# Architecture

## Current State

Phase 4 has been implemented as static management workspaces. Phase 0
established the static app shell, design language, documentation structure, and
test tooling. Phase 1 added the initial Prisma database architecture and pure
financial calculation helpers. Phases 2 through 4 add route-level workspaces for
budgets, contracts, products, and modules with local page-state create, edit,
delete, filtering, sorting, summaries, and reporting.

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
`src/components/portfolio` contains the Phase 2-4 budget, contract, product,
and module route components. Business calculations for summaries, urgency,
variance, underused modules, and redundancy indicators live in
`src/lib/portfolio-analytics.ts`.

## Current Database Boundary

`prisma/schema.prisma` defines the PostgreSQL-compatible model for core
cybersecurity financial operations and has been extended for Phase 2-4 budget,
contract, product, and module management. `prisma.config.ts` loads
Vercel-managed Neon connection strings from environment variables for Prisma
commands.

No persistent CRUD routes, authentication, document upload, AI, or real
procurement workflows are implemented yet. The Phase 2-4 create, edit, and
delete behavior is intentionally local page state until the reviewed Prisma
schema is migrated and service boundaries are approved.

## Provider Portability

Vercel and Neon are the initial platform choices. Future providers should be
isolated so the application can later move to internal AWS infrastructure with
PostgreSQL and Amazon Bedrock if required.
