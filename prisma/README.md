# Prisma Boundary

The authoritative database guide is
[`docs/database-and-migrations.md`](../docs/database-and-migrations.md), and the
domain model is documented in [`docs/data-model.md`](../docs/data-model.md).

This directory contains:

- `schema.prisma` — current desired schema;
- `migrations/` — reviewed SQL evolution after an established baseline; and
- `seed.mjs` — destructive sample fixture generation for verified disposable
  databases only.

Runtime Prisma construction belongs in `src/lib/server/prisma.ts`. UI and Client
Components must never import Prisma.

Before any change:

1. Verify the target database and migration baseline.
2. Review schema, SQL, compatibility, preservation, and recovery.
3. Never reset or destructively seed shared, staging, production, or
   production-like data.
4. Never edit an already-applied migration.
5. Make backfills idempotent and preserve financial and operational history.

The migration directory does not currently constitute a verified empty-database
bootstrap. See the authoritative guide before provisioning or reconciling an
environment.
