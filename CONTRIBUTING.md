# Contributing

## Orientation

Read `README.md` and `docs/index.md`, then inspect the implementation and the
task-relevant documents. Review `TODO.md` only when the work addresses an active
backlog item. Significant existing decisions are indexed in
`architecture/decisions/README.md`.

## Change workflow

1. Start from an up-to-date branch with a focused purpose.
2. Review `git status` and preserve unrelated work.
3. Identify the owning route, component, service, validation, data, and test
   boundaries before editing.
4. Keep the change small enough to review. Separate unrelated refactors.
5. Add or update tests for changed behavior.
6. Update authoritative documentation when behavior or engineering practice
   changes.
7. Run the risk-appropriate validation and review the final diff.

Use descriptive commits. Pull requests should state the problem, approach,
user-visible effects, data or migration impact, security considerations,
validation performed, documentation changes, and known follow-up work. Do not
mix generated artifacts, unrelated formatting, or local environment files into
a change.

## Engineering expectations

- Use strict TypeScript and explicit serializable boundaries.
- Keep presentation components free of persistence and business rules.
- Reuse the established Server Component, server action, service, Zod, and
  Prisma patterns.
- Use bounded, indexed server-side reads and transactions for multi-record
  invariants.
- Preserve historical records and inactive values needed to render history.
- Avoid dependencies and abstractions without a concrete, reviewed need.
- Preserve the existing primary layouts and workflows unless the change is
  explicitly a redesign.

## Validation

Run checks in proportion to the change:

```bash
npm run format:check
npm run lint
npx tsc --noEmit
npm test
npm run test:e2e
npm run build
```

Database-backed browser tests must use a verified disposable database. A pull
request must identify checks that were not run and why. See `docs/testing.md`
for module-specific expectations.

## Database and data changes

Read `docs/database-and-migrations.md` before changing the schema or data.
Migration pull requests must include reviewed SQL, compatibility and rollback
analysis, backfill behavior, deployment order, and preservation evidence.

Never reset a shared or production-like database. Never delete or reseed
authoritative data to simplify development. Production migrations are
non-destructive unless an explicitly approved migration plan provides backup,
validation, recovery, and business ownership. Backfills must be idempotent.

## Security review

Changes that affect identity, authorization, financial values, commercial
terms, documents, logging, secrets, administrative operations, or dependencies
require explicit security review. Validate authorization on the server, redact
sensitive errors and logs, and avoid exposing Prisma records directly to the
browser. See `docs/security.md`.

## Documentation and ADRs

`docs/index.md` identifies the authoritative document for each topic. Update the
specific owner document rather than copying explanations into multiple files.
Use an ADR for a durable decision that changes system boundaries, data
ownership, deployment, security, or a cross-module invariant. Do not use ADRs
as changelogs.

## Definition of done

A change is complete when its requested behavior is implemented, scope is
controlled, data is preserved, tests cover the material risk, relevant checks
pass, documentation and ADRs are current, no secrets or local artifacts are
introduced, and the pull request explains residual risk.
