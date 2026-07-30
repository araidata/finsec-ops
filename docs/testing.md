# Testing Strategy

## Test layers

| Layer                | Tool and location                                     | Current purpose                                                                                                            |
| -------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Pure unit            | Vitest, `src/**/*.test.ts`                            | Financial calculations, Budget grouping, renewal rules, catalog/purchase relationship rules, search, Dashboard aggregation |
| Component            | Vitest + Testing Library + jsdom, `src/**/*.test.tsx` | Shell, cards, relational controls, Budget workspace, Renewal column behavior                                               |
| Service              | Vitest with mocked Prisma, `src/lib/server/*.test.ts` | Budget persistence, Contract invariants and transactions, selected Renewal validation                                      |
| Browser              | Playwright Chromium, `tests/*.spec.ts`                | Navigation, Dashboard, Catalog, Settings, Deployment, Budget persistence and Contract-to-Budget handoff                    |
| Database integration | No dedicated harness                                  | Partially exercised by database-backed Playwright tests                                                                    |
| Migration            | No automated suite                                    | Manual status and migration verification                                                                                   |

Vitest discovers `src/**/*.test.{ts,tsx}` in jsdom. Playwright starts the
development server on port 3100 and reuses it outside CI.

## Commands

```bash
npm test
npm run test:watch
npm run test:e2e
npm run lint
npx tsc --noEmit
npm run build
```

Catalog browser tests skip without `DATABASE_URL` or `POSTGRES_PRISMA_URL`.
Budget browser tests are serial and mutate database records. Use a verified
disposable, consistently seeded test database.

## Fixtures and isolation

`prisma/seed.mjs` supplies broad cybersecurity sample data but deletes existing
application data. It is not safe shared-test setup. Unit/component tests define
local fixtures, and service tests mock Prisma operations.

The repository has no isolated database-per-test harness, transaction rollback
fixture, production-scale synthetic generator, or deterministic migration test
environment. Browser results can therefore depend on prior mutable state. These
are production-readiness gaps.

## Change expectations by module

| Module                  | Minimum material coverage                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard               | Query scoping, aggregation, empty/unassigned behavior, Decimal conversion, chart interaction                                                          |
| Budget                  | Worksheet calculations, validation, create/update/duplicate/delete transactions, totals, context, Contract/Renewal handoffs, persistence              |
| Contracts               | Vendor/Product/Component validation, atomic header/line save, derived totals, dependency-aware deletion, term lineage, Budget/Renewal handoffs        |
| Maintenance Renewals    | Register validation, status/disposition rules, line snapshots, quote/funding/decision transactions, replacement/decommission work, next-cycle history |
| Product Catalog         | Role eligibility, dependent records, active/inactive history, uniqueness, dependency-aware deletion                                                   |
| Deployment              | Source-line compatibility, context, usage append history, summary synchronization                                                                     |
| Documents               | Entity validation, metadata/audit transaction, delete behavior, context filtering, safe error handling                                                |
| Settings                | Uniqueness, deactivation, current Fiscal Year transaction, downstream option availability                                                             |
| Department reassignment | Eligibility warnings, cross-module updates, audit events, rollback on failure                                                                         |
| Shared context/shell    | URL preservation, defaults, all-context behavior, navigation, accessibility                                                                           |

Every bug fix should include a regression test at the lowest layer that proves
the failure, plus a higher-level test when the user-visible workflow is
critical.

## Pull-request checks

The intended required checks are:

1. `npm run format:check`
2. `npm run lint`
3. `npx tsc --noEmit`
4. `npm test`
5. `npm run build`
6. selected or full `npm run test:e2e` against an isolated database
7. migration and schema verification when persistence changes

CI does not currently enforce this matrix. Pull requests must report checks not
run and why.

## Critical gaps

- No dedicated real-PostgreSQL service integration suite
- No deterministic empty-database baseline or migration test
- No isolated browser-test data lifecycle
- Limited tests for Settings, Deployment, Documents, reassignment, Dashboard
  queries, and most Renewal subworkflows
- No authentication, authorization, tenant/Department permission, or security
  regression tests
- No accessibility automation
- No load, query-budget, concurrency, restore, or failure-injection tests
- No production-scale synthetic dataset

Do not compensate for these gaps by treating mocked service tests or seeded
browser tests as proof of production behavior.

The required scale envelope, database/route/payload/browser budgets, and
performance pull-request evidence are defined in
[Performance and Production Hardening Plan](performance-production-hardening.md).
