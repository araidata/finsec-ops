# Deployment

## Target topology

The supported deployment target is a Next.js application on Vercel connected to
Neon PostgreSQL. Vercel environment tiers must map to isolated Neon databases or
branches. Preview builds must not mutate or depend on the production database.

Required external configuration currently includes:

- Vercel project and environment ownership;
- Neon project/database or branch per tier;
- runtime pooled database URL;
- direct/non-pooled migration URL;
- protected secret access for the migration operator; and
- custom domain and TLS configuration when a production domain is approved.

The application currently has no login or active Entra/Auth.js access boundary.
Tenant registration, credentials, consent, production callback verification,
and identity ownership remain external deployment blockers. Object storage,
monitoring, alerting, and backup/restore ownership are also required production
integrations.

## Environment variables

Runtime:

- `DATABASE_URL` — preferred Neon runtime connection
- `POSTGRES_PRISMA_URL` — runtime fallback
- `APP_ENV` — explicit `development`, `test`, `preview`, or `production`
- `DATABASE_ENVIRONMENT` — must match `preview` or `production`
- `READINESS_TOKEN` — required for protected production readiness
- `VERCEL_GIT_COMMIT_SHA` — release revision when supplied by Vercel
Future identity variables:

- `AUTH_SECRET` — environment-specific Auth.js encryption secret
- `AUTH_MICROSOFT_ENTRA_ID_ID` — Entra application client ID
- `AUTH_MICROSOFT_ENTRA_ID_SECRET` — Entra client secret value
- `AUTH_MICROSOFT_ENTRA_ID_ISSUER` — approved single-tenant `/v2.0` issuer
- `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` — exact allowed Entra tenant ID

These identity variables are not required for the current no-login application
and do not activate an access gate.

Migration:

- `POSTGRES_URL_NON_POOLING` — first preference
- `DATABASE_URL_UNPOOLED` — second preference
- runtime variables as fallback

Use Vercel environment-scoped secrets. For a future identity project, register
`https://<host>/api/auth/callback/microsoft-entra-id` separately for every
approved environment. Do not commit `.env*`, copy production identity or
database values into preview, or expose values in build output.

Startup validation rejects missing preview/production database configuration,
a mismatched `DATABASE_ENVIRONMENT`, production use of `TEST_DATABASE_URL`, and
known non-production reuse of `PRODUCTION_DATABASE_URL`. Errors identify
variable names and tiers, never secret values.
The static production-build phase skips the startup assertion so builds remain
database-independent; `next start` and deployed server startup do not skip it.

## Build

```bash
npm ci
npm run build
```

`scripts/build.mjs` runs `npx prisma generate` and then `npx next build`.
Database migrations are intentionally excluded. The Prisma CLI can generate
with a placeholder URL when no real connection is present; runtime
database-backed verification still requires a configured database.

## Release sequence

1. **Approve the change.** Confirm code, security, data, migration, and
   documentation review.
2. **Verify the target.** Confirm Vercel tier, Neon database/branch, migration
   URL, current application version, and migration status without printing
   secrets.
3. **Protect recovery.** Verify a recoverable backup or point-in-time position
   and the owner of restoration.
4. **Apply compatible migrations.**

   ```bash
   npm run migrate:deploy
   ```

5. **Verify migration state.**

   ```bash
   npx prisma migrate status
   ```

6. **Deploy the built application** through the controlled Vercel release
   process.
7. **Run smoke verification** for shell/navigation, Dashboard, scoped Budget,
   Contracts, Maintenance Renewals, Product Catalog, Deployment, Documents, and
   Settings reads. Exercise a mutation only with approved test data.
8. **Verify data and telemetry.** Check representative totals, historical
   relations, error rate, latency, and database health.
   Verify `/api/health` and call `/api/ready` with the protected token in
   production.
9. **Record the release** with code revision, migrations, operator, time,
   evidence, and residual risk.

The repository provides health/readiness handlers, correlation IDs, and
structured redacted server logs. It does not yet provide centralized telemetry,
alert routing, migration release markers, or a CI/CD release pipeline.

## Preview and staging

Preview should use an ephemeral or isolated Neon branch containing synthetic or
sanitized data. Staging should be stable, production-like, and isolated from
production. Never use the destructive seed where authoritative or shared data
exists.

Schema-changing previews need a lifecycle plan for branch creation, migration,
verification, and deletion. A shared preview database is unsafe when concurrent
branches contain incompatible schemas.

## Verification

At minimum verify:

- Vercel deployment reports ready and serves the expected revision;
- application pages do not expose setup-state database errors;
- migration status is current and no failed migration exists;
- representative Department/Fiscal Year filtering is correct;
- Contract totals, Budget summaries, Renewal links, and deployment history
  remain intact;
- no secrets, SQL, stack traces, or sensitive values appear in user errors;
- browser and server logs show no unexpected errors; and
- rollback and database-recovery owners remain available during the observation
  window.

## Rollback and recovery

Vercel can restore an earlier application deployment, but code rollback is safe
only when the earlier version is compatible with the current schema. Prefer
expand/backfill/switch/contract migrations.

Do not automatically reverse a data migration. If data is corrupted, stop
writes, preserve evidence, assess scope, and restore or repair through the
approved database recovery plan. A Neon branch or point-in-time restore must be
validated before traffic moves to it.

## Production blockers

- Approved login design, live Entra tenant/app registration, and verified
  authentication, provisioning, authorization, logout, and revocation behavior
- Deterministic database baseline
- Protected migration automation and release approvals
- Complete audit and safe administrative operations
- Centralized monitoring and alerting
- Verified backup and restore procedure
- Secure document object storage
- Isolated, deterministic test and preview data

See [Production readiness](production-readiness.md) for acceptance criteria and
[Operations](operations.md) for ownership procedures.
