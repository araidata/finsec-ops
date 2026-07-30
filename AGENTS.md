# AI Development Instructions

## Product mission

finsec-ops is a Technology Financial Operations platform. It initially supports
cybersecurity and departmental technology finance through Dashboard, Budget,
Maintenance Renewals, Contracts, Product Catalog, Deployment, Documents, and
Settings modules. Future IT expansion must preserve these clean domain
boundaries.

Do not redirect the product into ERP, accounting, GRC, ticketing, project
management, vulnerability management, asset management, or a full procurement
execution system.

## Product and UI boundaries

- Preserve the general application shell and navigation model.
- Preserve the Budget worksheet concept and general visual structure.
- Preserve the Maintenance Renewals register and selected-record workspace.
- Preserve current primary workflows unless the user explicitly changes them.
- Do not perform broad visual redesigns without explicit approval.
- Treat purchase, invoice, payment, and legacy renewal records as compatibility
  or integration boundaries unless a task explicitly activates them.

## Required orientation

Before changing the repository:

1. Read `README.md` and `docs/index.md`.
2. Read only the documents relevant to the task.
3. Inspect the actual code, tests, Prisma schema, and migration history before
   relying on documentation.
4. Check `TODO.md` when the task concerns unresolved work.
5. Identify established patterns and local instructions before adding new ones.
6. Review the worktree and preserve unrelated user changes.

Use context, tool calls, and usage tokens efficiently without reducing
correctness or quality. Prefer targeted searches, focused file reads, and
incremental inspection over repeatedly loading large files. Reuse information
already gathered. Avoid duplicating analysis or progress commentary. Efficiency
must never come at the expense of security, data integrity, testing,
architectural correctness, or documentation quality.

## Engineering requirements

- Use strict TypeScript and explicit, narrow types.
- Keep business rules, validation, persistence, and orchestration out of
  presentation components.
- Preserve the route/action/service/Prisma boundaries described in
  `docs/architecture.md`.
- Use explicit serializable DTOs; do not pass large Prisma object graphs to
  Client Components.
- Push production filtering, sorting, grouping, aggregation, and pagination to
  PostgreSQL. Never introduce an unbounded production list query.
- Separate list queries from detail queries.
- Validate dependent selections and invariants on the server, regardless of
  client validation.
- Use transactions for multi-record business operations.
- Add concurrency protection when authoritative records can be edited
  simultaneously.
- Preserve historical financial, contract, renewal, deployment, document, and
  audit data.
- Use minimal, reviewed dependencies. Prefer readability and maintainability
  over cleverness.
- Do not add abstraction without a concrete use case.
- Do not introduce microservices, application-wide state, or a data-fetching
  framework without explicit architectural justification and approval.

## Database safety

- Read `docs/database-and-migrations.md` before any schema, migration, seed, or
  backfill work.
- Never reset a shared, staging, production, or production-like database.
- Never delete or reseed authoritative data to resolve a migration problem.
- Use reviewed, non-destructive migrations by default.
- Make backfills idempotent, resumable where appropriate, and observable.
- Inspect generated SQL and verify migration status before applying it.
- Do not change `prisma/schema.prisma`, migrations, or persisted data unless the
  task explicitly authorizes database work.
- The current seed is destructive and is allowed only against a verified
  disposable database.

## Security

- The current application has no authentication or authorization. Never imply
  otherwise.
- Treat all browser input as untrusted and enforce authorization at the
  server-action and service boundary when identity is introduced.
- Never expose or commit secrets, credentials, tenant identifiers, tokens,
  private hostnames, or real customer data.
- Do not log sensitive financial terms, document metadata, personal data, or
  connection strings.
- Do not implement document upload until storage, malware scanning, access,
  retention, and audit controls are designed.

## Testing and validation

- Add or update tests in proportion to risk and module ownership.
- Run focused tests during development and the broadest relevant checks before
  completion.
- For normal code changes, validate formatting, lint, type checking, tests, and
  production build as applicable.
- Database-backed browser tests require a verified disposable environment.
- Never alter runtime behavior merely to make a documentation or test check
  pass.
- Report commands not run and the reason.

## Documentation discipline

- `docs/index.md` defines the authoritative source for each topic; README is an
  entry point, not a development diary.
- Update documentation when product behavior, architecture, directory
  ownership, data models, migration procedure, testing, deployment, security,
  or operations change.
- Keep `TODO.md` unresolved and actionable. Do not add completed-work history.
- Record durable, consequential decisions under `architecture/decisions`;
  routine implementation details do not require ADRs.
- Use present tense for verified behavior and clearly label requirements or
  backlog work.
- Keep terminology consistent with `docs/product-overview.md`.

## Completion expectations

- Stay within the requested scope and avoid unrelated refactors.
- Confirm source-of-truth relationships and cross-module effects before making
  changes.
- Preserve existing UI and data unless the task authorizes changes.
- Review the final diff, links, commands, tests, and documentation impact.
- Leave the repository understandable to the next developer or AI agent without
  relying on conversation history.
