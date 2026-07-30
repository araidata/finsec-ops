# Testing Strategy

## Test layers

| Layer                | Tool and location                                     | Current purpose                                                                                                            |
| -------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Pure unit            | Vitest, `src/**/*.test.ts`                            | Financial calculations, Budget grouping, renewal rules, catalog/purchase relationship rules, search, Dashboard aggregation |
| Component            | Vitest + Testing Library + jsdom, `src/**/*.test.tsx` | Shell, cards, Dashboard chart controls, relational controls, Budget workspace, Catalog Reseller register, Renewal columns  |
| Service              | Vitest with mocked Prisma, `src/lib/server/*.test.ts` | Budget persistence, Contract invariants and transactions, selected Renewal validation                                      |
| Browser              | Playwright Chromium, `tests/*.spec.ts`                | Navigation, Dashboard, Catalog, Settings, Deployment, Budget persistence and Contract-to-Budget handoff                    |
| Database integration | Guarded Playwright environment                        | Browser workflows only; requires an explicitly disposable database                                                         |
| Migration            | No automated suite                                    | Manual status and migration verification                                                                                   |

Vitest discovers `src/**/*.test.{ts,tsx}` in jsdom. Playwright starts the
development server on port 3100 and reuses it outside CI.
Configuration fails closed before server startup unless `TEST_DATABASE_URL` is
set or `TEST_DATABASE_DISPOSABLE=true` accompanies an isolated runtime database
URL. It rejects production execution and a URL equal to
`PRODUCTION_DATABASE_URL`.

## Commands

```bash
npm test
npm run test:watch
npm run test:e2e
npm run lint
npx tsc --noEmit
npm run build
npm run bundle:measure
```

Bundle measurement requires a completed production build. Pass
`--baseline <artifact>` to compare builds and `--output <artifact>` to retain
the route chunk list, raw and gzip bytes, deferred chunks, and exact deltas.

All browser tests are database-backed. Budget tests and some workflows mutate
records. Use a verified disposable, consistently seeded test database:

```bash
TEST_DATABASE_URL=postgresql://... npm run test:e2e
```

`TEST_DATABASE_DISPOSABLE=true` is an explicit operator assertion for an
already configured isolated URL. The guard intentionally prevents even test
discovery without proof, so accidental CI or local execution cannot start a
mutating suite.

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
| Deployment              | Source-line compatibility, Department permission, stale-write rejection, usage append history, summary/audit transaction                              |
| Documents               | Entity and Department permission validation, metadata/audit transaction, delete behavior, context filtering, safe error handling                      |
| Settings                | Permission denial, scoped administration, uniqueness, deactivation, current Fiscal Year/audit transaction, downstream option availability             |
| Department reassignment | Eligibility warnings, cross-module updates, audit events, rollback on failure                                                                         |
| Shared context/shell    | URL preservation, defaults, all-context behavior, navigation, accessibility                                                                           |
| Identity/authorization  | Fail-closed configuration, production bypass rejection, immutable Entra claims, role permissions, API 401/403, and Department denial                  |

Every bug fix should include a regression test at the lowest layer that proves
the failure, plus a higher-level test when the user-visible workflow is
critical.

Local browser automation must set `FINSEC_AUTH_BYPASS=true` explicitly. The
bypass is ignored in production. Tests must not use or require real Entra
credentials, tenant identifiers, client secrets, or production identity data.

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
- Permission-denial unit coverage exists for selected mutation services, but no
  complete real-session, tenant, or cross-Department integration suite
- No accessibility automation
- No load, query-budget, concurrency, restore, or failure-injection tests
- No production-scale synthetic dataset

The critical browser specification covers read paths for Budget, Contracts,
Maintenance Renewals, and Product Catalog. Unit coverage cross-checks Contract
line totals, Renewal variance, and disposition requirements. These do not
replace transactional database integration coverage.

Do not compensate for these gaps by treating mocked service tests or seeded
browser tests as proof of production behavior.

The required scale envelope, database/route/payload/browser budgets, and
performance pull-request evidence are defined in
[Performance and Production Hardening Plan](performance-production-hardening.md).
