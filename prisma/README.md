# Prisma Boundary

Phase 1 defines the initial PostgreSQL-compatible Prisma schema for the core
cybersecurity financial operations entities.

- `schema.prisma` contains the approved first-pass entity model and enums.
- `seed.mjs` adds realistic cybersecurity financial operations sample data.
- `prisma.config.ts` at the repository root loads the database URL for Prisma
  commands and migrations.

No migrations are committed yet. Create the initial migration only after the
Phase 1 schema is reviewed against the target Vercel-managed Neon database.
