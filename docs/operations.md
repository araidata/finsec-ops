# Operations

This runbook defines the required ownership model and current operational gaps.
It does not claim that the required telemetry or automation already exists.

## Deployment verification

For every release, record the code revision, Vercel deployment, target
environment, database/branch, applied migrations, operator, approvals, smoke
results, and observation window. Follow [Deployment](deployment.md). Verify
representative financial totals and historical relationships, not only HTTP
availability.

## Database health and migration verification

Review Neon connection availability, capacity, storage, connection count,
long-running queries, locks, replication/provider incidents, and error rate.
After a migration, run `npx prisma migrate status`, confirm expected indexes and
constraints, inspect failed migrations, and validate backfill counts.

Do not resolve drift with reset, destructive seed, or `db push`. Escalate to the
database owner and follow [Database and migrations](database-and-migrations.md).

## Logs and error triage

The application emits newline-delimited JSON server logs with environment,
revision, event, and correlation/request IDs. Sensitive keys and values are
redacted, and errors are reduced to safe type/digest metadata.
`instrumentation.onRequestError` records failed Server Component, Route
Handler, and Server Action requests without logging query strings or payloads.
Vercel log collection is the current transport; alert routing, retention,
search, and a centralized error platform still require operational ownership.
For an alert:

1. Identify environment, revision, route/action, correlation ID, time window,
   and affected scope.
2. Determine whether the issue is presentation, application service, database,
   external provider, configuration, migration, or data integrity.
3. Protect data: stop or restrict unsafe writes when corruption is possible.
4. Preserve logs and database evidence without copying sensitive payloads into
   tickets.
5. Reproduce with synthetic data where possible.
6. Mitigate through compatible rollback, feature isolation, or reviewed data
   repair.
7. Verify recovery and document root cause and prevention.

Route Handlers should echo `X-Request-Id`; instrumentation accepts a bounded,
safe incoming `X-Request-Id` or `X-Correlation-Id` and otherwise creates one.

## Failed mutation triage

For a failed action, capture safe error class, operation, target type, actor
identity when available, correlation ID, application revision, and transaction
outcome. Confirm whether Prisma rolled back all related writes. Check for
constraint conflict, stale relationship, invalid inactive reference,
concurrent edit, or migration mismatch. Never manually delete related history
to make a retry succeed.

## Backup and restore

An operations owner must verify Neon backup/point-in-time recovery coverage,
retention, RPO, RTO, access, and escalation contacts. On a defined schedule:

1. Restore to an isolated database.
2. Verify migration state and constraints.
3. Compare row counts and representative financial totals.
4. Exercise critical read-only workflows.
5. Record elapsed time and exceptions.
6. Destroy the restored environment securely after evidence is retained.

No repository automation currently proves restore readiness.

## Performance monitoring

Monitor:

- route and server-action latency and error rate;
- Prisma/SQL latency, rows returned, timeouts, and connection pressure;
- slow and frequently executed queries;
- Vercel function duration, memory, and cold starts;
- payload size and browser responsiveness for large grids;
- mutation conflict/retry rate; and
- Neon resource saturation and provider incidents.

For a slow query, capture a redacted query fingerprint, parameters by shape
rather than sensitive value, execution plan, row estimate/actuals, indexes,
calling service, payload size, and dataset scale. Fix query shape and indexing
before increasing platform capacity.

## Health and readiness

Implemented probes:

- `GET /api/health` is dependency-free liveness;
- `GET /api/ready` validates configuration and performs a bounded `SELECT 1`;
  production requires `Authorization: Bearer <READINESS_TOKEN>`;
- both responses disable caching and return `X-Request-Id`.

Production still needs:

- release and migration version reporting beyond the Git revision;
- synthetic checks for critical read paths; and
- alerts with owners and runbooks.

## Incident ownership

Before launch, assign application, database, security, identity, storage, and
release owners; severity definitions; an on-call/escalation path; communication
channels; evidence retention; and post-incident review. Security incidents must
follow credential rotation, access review, containment, and regulatory or
organizational notification policies.

## Routine maintenance

| Cadence           | Required review                                                                   |
| ----------------- | --------------------------------------------------------------------------------- |
| Each release      | Deployment/migration evidence, smoke tests, errors, docs                          |
| Weekly            | Error trends, failed mutations, dependency/provider notices                       |
| Monthly           | Slow queries, capacity, inactive access, dependency updates                       |
| Quarterly         | Restore test, incident exercise, privileged access, runbooks                      |
| At least annually | Architecture, threat model, retention, RPO/RTO, production-readiness reassessment |

Dependencies must be updated through focused pull requests with release notes,
security impact, type/lint/test/build evidence, and migration review where
Prisma changes. Do not batch unrelated major upgrades.

## Documentation maintenance

Operational changes update this runbook, Deployment, Security, and Production
readiness as applicable. Keep provider contacts and sensitive procedures in an
approved private operations system; repository docs describe roles and process
without credentials or internal endpoints.
