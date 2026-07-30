# Development Workflow

## Prerequisites

- Node.js 20 or a compatible current LTS release
- npm and the committed `package-lock.json`
- Git
- A disposable PostgreSQL development database compatible with the committed
  migration baseline; Neon is the supported hosted provider

No Node version file or package-manager `engines` constraint is committed.
Align local and CI versions explicitly when CI is introduced.

## Install and configure

Install exactly the locked dependency graph:

```bash
npm ci
```

Create an untracked `.env.local`. The application needs one runtime connection
variable:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
```

`POSTGRES_PRISMA_URL` is the runtime fallback. Direct migration URLs and exact
precedence are documented in [Database and migrations](database-and-migrations.md).
Never commit environment files or paste their values into issues, tests, logs,
or documentation.

Generate the client:

```bash
npx prisma generate
```

Inspect the target and migration state before applying anything:

```bash
npx prisma migrate status
npm run migrate:deploy
```

The committed migrations depend on an established baseline and are not yet a
verified empty-database bootstrap. Do not improvise with `db push` or
`migrate reset`.

The seed is optional and destructive:

```bash
npx prisma db seed
```

Run it only after verifying that the database is disposable. It deletes
application records and inserts cybersecurity-oriented fixtures.

## Run the application

```bash
npm run dev
```

The standard development URL is printed by Next.js. Without a database URL, the
shell renders and database-backed modules show empty/setup states.

## Engineering workflow

1. Review `git status` and preserve unrelated changes.
2. Locate ownership with [Codebase map](codebase-map.md).
3. Inspect the page, action, service, schema relations, and existing tests.
4. Put presentation changes in feature components and authoritative rules in
   services or pure domain utilities.
5. Add or update focused tests.
6. Run focused validation during development.
7. Update the authoritative document when behavior or boundaries change.
8. Run broad relevant checks and review the final diff.

## Commands

```bash
npm run format:check
npm run lint
npx tsc --noEmit
npm test
npm run test:e2e
npm run build
```

`npm run format` writes formatting changes. There is no separate `typecheck`
script; use `npx tsc --noEmit`. `npm run build` runs Prisma generation before
`next build` and does not migrate the database.

## Test use

- Pure calculations, relationship rules, and service invariants: Vitest.
- Interactive workspace behavior: Testing Library component tests.
- Server service operations: Vitest with a mocked Prisma boundary.
- User-visible navigation and critical database workflows: Playwright.
- True database integration and migration verification: currently incomplete;
  use a disposable environment and document manual evidence.

See [Testing](testing.md) for module expectations.

## Troubleshooting

### Database setup state appears

Confirm `DATABASE_URL` or `POSTGRES_PRISMA_URL` is available to the Next.js
process. Verify network access and TLS options without printing the URL.

### Prisma CLI uses an unexpected database

`prisma.config.ts` loads `.env.local` and then `.env` without overriding an
existing process variable. Inspect variable _names and source_, not values. The
CLI prefers a direct URL while runtime code does not.

### Prisma Client is stale

Run:

```bash
npx prisma generate
```

Restart the dev server and TypeScript tooling after schema-generated type
changes.

### Migration status reports drift or missing baseline

Stop. Do not reset or use `db push` on important data. Compare the database,
`_prisma_migrations`, committed SQL, and baseline history, then create a reviewed
reconciliation plan.

### Browser tests skip or fail on data

Catalog browser tests skip without a database URL; Budget tests mutate records
and depend on compatible fixtures. Verify the Playwright database is disposable
and seeded consistently. Do not point browser tests at shared data.

### Build succeeds locally but deployment fails

Confirm the deployment has a runtime database variable during Prisma generation
and build. The Prisma configuration has a generate-only placeholder, but
runtime-rendered or deployment verification paths still require the real
database.

### Formatting check reports unrelated generated files

Do not format `.next`, reports, or unrelated user work. Inspect the target set
and `.prettierignore`; make only scoped formatting changes.
