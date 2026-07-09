# Architecture

## Current State

Phase 1 has begun. Phase 0 established the static app shell, design language,
documentation structure, and test tooling. Phase 1 adds the initial Prisma
database architecture and pure financial calculation helpers, while the
homepage remains a static visual shell.

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

## Current Database Boundary

`prisma/schema.prisma` defines the initial PostgreSQL-compatible model for core
cybersecurity financial operations. `prisma.config.ts` loads Vercel-managed
Neon connection strings from environment variables for Prisma commands.

No CRUD routes, authentication, document upload, AI, or real procurement
workflows are implemented in Phase 1.

## Provider Portability

Vercel and Neon are the initial platform choices. Future providers should be
isolated so the application can later move to internal AWS infrastructure with
PostgreSQL and Amazon Bedrock if required.
