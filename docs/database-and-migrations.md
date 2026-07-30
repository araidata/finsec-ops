# Database and Migrations

## Supported architecture

Neon PostgreSQL is the supported hosted database. Prisma 7 defines and accesses
the schema. Runtime access uses `@prisma/adapter-neon`; migration commands use
the datasource URL resolved by `prisma.config.ts`.

### Connection precedence

The Prisma CLI loads `.env.local`, then `.env`, without overriding variables
already present in the process. Its datasource chooses:

1. `POSTGRES_URL_NON_POOLING`
2. `DATABASE_URL_UNPOOLED`
3. `DATABASE_URL`
4. `POSTGRES_PRISMA_URL`
5. a local placeholder used only so client generation can run without a real
   database

Runtime code chooses:

1. `DATABASE_URL`
2. `POSTGRES_PRISMA_URL`

Use a pooled Neon URL for runtime traffic and a direct/non-pooled URL for schema
operations when the provider exposes both. Confirm each target by environment
and variable name; never print credentials.

## Repository boundary

- `prisma/schema.prisma` is the desired schema.
- `prisma/migrations/*/migration.sql` is the reviewed evolution path.
- `_prisma_migrations` in each database records applied migrations.
- `prisma.config.ts` owns CLI configuration.
- `src/lib/server/prisma.ts` owns runtime client creation.
- `prisma/seed.mjs` is destructive disposable-data tooling.

The migration directory begins with a Company/purchase transition against an
already established database. A verified initial migration for an empty
database is not present. Provisioning a new environment therefore requires a
formal baseline procedure before production use; `prisma migrate deploy` alone
must not be assumed to bootstrap an empty database.

## Generate Prisma Client

Generation is non-mutating:

```bash
npx prisma generate
```

`npm run build` performs this automatically before `next build`.

## Create and review a migration

Only use a verified disposable development database whose baseline matches the
repository:

```bash
npx prisma migrate dev --name descriptive_change_name
```

Before accepting the result:

1. Review the schema diff and every generated SQL statement.
2. Identify table rewrites, locks, scans, unique constraints, foreign keys,
   defaults, nullability changes, enum changes, and cascading deletes.
3. Prove compatibility with the currently deployed application when rollout is
   not atomic.
4. Separate schema expansion, backfill, constraint enforcement, and cleanup
   when a single operation is unsafe.
5. Add indexes for actual access paths and assess creation cost.
6. Document preservation, verification, rollback, and recovery.
7. Test on representative data and run `npx prisma migrate status`.

Never edit an already-applied migration. Add a corrective migration.

## Apply committed migrations

Local, preview, staging, and production application use the same command:

```bash
npm run migrate:deploy
```

The governance differs by tier:

- **Local:** verify the database is private and disposable or preserved as
  needed.
- **Preview:** prefer an isolated database or branch per preview. Do not share a
  mutable production schema.
- **Staging:** use production-like volume and constraints without authoritative
  production data.
- **Production:** require approval, verified backup/recovery, compatible
  application order, monitoring, and post-migration checks.

Migrations are not part of `npm run build`. This prevents arbitrary build
workers from racing to mutate the database. A release owner or controlled CI
job applies them explicitly.

## Seed behavior

```bash
npx prisma db seed
```

The current seed calls `deleteMany` across the application model before
creating fixtures. It is not idempotent reference-data initialization and is
not safe for any authoritative environment.

- Run it only against a database positively identified as disposable.
- Never use it to repair migration drift.
- Never use it in preview, staging, or production if those environments contain
  data worth preserving.
- Keep production reference-data initialization in non-destructive,
  migration-aware scripts separate from fixture generation.

## Backfills

A backfill must be:

- idempotent, so rerunning does not duplicate or corrupt data;
- bounded and resumable for large tables;
- compatible with old and new application versions during rollout;
- observable through counts, failures, and checkpoints;
- explicit about null, inactive, legacy, and conflicting records; and
- followed by parity and constraint validation.

The Company transition, worksheet-detail migration, and Settings migration
demonstrate data movement in committed SQL, but future work must not assume all
historical records satisfy the newer relationship model.

## Drift and verification

For each environment:

```bash
npx prisma migrate status
```

Also verify:

- expected migration rows exist and no failed row remains;
- application startup and critical reads succeed;
- required partial indexes and foreign keys exist;
- backfill source/target counts and null/conflict counts match the plan;
- representative financial totals and historical links are unchanged; and
- the deployed application version is compatible.

Use read-only database inspection or a reviewed schema-diff workflow. Do not use
`prisma db push` to reconcile shared or authoritative environments.

## Backup and restore

Before a production migration, identify the Neon project/branch, backup or
point-in-time recovery coverage, retention, restore owner, recovery time
objective, and recovery point objective. A backup claim is not sufficient:
restore to an isolated target and verify schema, row counts, relationships, and
critical financial totals on a routine schedule.

Database recovery and application rollback are separate. Rolling back code may
not reverse a schema or data change. Favor expand/backfill/switch/contract
rollouts that permit an older compatible application during recovery.

## Data-preservation rules

- Never run `prisma migrate reset` against shared, staging, production, or
  production-like data.
- Never delete or reseed authoritative data merely to resolve a migration
  problem.
- Production migrations must be non-destructive unless an explicitly reviewed
  migration plan says otherwise.
- Backfills must be idempotent.
- Existing financial, Contract, Maintenance Renewal, Deployment, Document,
  Note, usage, and Activity Log history must be preserved.
- Do not drop legacy Company-transition fields until read/write parity and
  historical linkage are proven.
- Do not change cascade behavior without reviewing every dependent workflow.
- Do not store real credentials in migration SQL, scripts, tests, or docs.

## Entra identity authorization expansion

Migration `20260730060000_entra_identity_authorization` is additive and must
not be applied until application, database, identity, and security owners
approve provisioning and recovery:

- adds nullable `User.entraSubject` and `User.entraTenantId`;
- adds `User.active` as non-null with default `false`, intentionally leaving
  every existing and newly inserted user disabled until explicitly reviewed;
- enforces that subject and tenant are either both null or both present;
- creates a unique `(entraTenantId, entraSubject)` identity key;
- installs an update trigger that prevents changing or clearing an established
  identity pair while permitting a one-time assignment from null;
- creates `UserDepartmentAccess` with a composite user/Department primary key
  and cascading foreign keys that remove only access grants when a User or
  Department is deleted; and
- adds supporting active-role and Department reverse-lookup indexes.

The migration performs no identity backfill, email matching, role assignment,
activation, Department grant, credential storage, or authoritative-record
rewrite. Applying it takes normal PostgreSQL DDL locks and validates one check
constraint over `User`; rehearse lock duration and rollback on a
production-like branch. Code rollback remains schema-compatible because every
new column and table is additive.

## Baseline readiness work

Production readiness requires a deterministic baseline that can provision a new
database, reconcile an existing database without data loss, and pass automated
schema verification. Until that work is approved, treat new-environment
provisioning and disaster recovery as blocked.
