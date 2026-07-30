# Codebase Map

This guide identifies ownership boundaries and the expected place for a change.

## Top-level layout

| Path                       | Owns                                                            | Must not own                                     | Extension pattern                                                          |
| -------------------------- | --------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| `src/app`                  | Routes, layouts, URL context parsing, server actions            | Domain calculations or direct UI-heavy workflows | Add a route folder with a thin `page.tsx`; place mutations in `actions.ts` |
| `src/components/app`       | Application shell, navigation, global context controls          | Module business rules                            | Extend shell-level behavior shared by multiple modules                     |
| `src/components/<feature>` | Interactive workspaces and feature presentation                 | Direct Prisma access                             | Add focused components under the owning feature                            |
| `src/components/ui`        | Reusable presentation primitives                                | Product-specific workflow or persistence         | Compose primitives in feature components                                   |
| `src/lib/server`           | Prisma access, server validation, domain services, DTO assembly | Client hooks or browser APIs                     | Add one service per coherent domain; expose narrow operations              |
| `src/lib/budgets`          | Pure Budget calculations, grouping, validation, fixtures        | Database access                                  | Add deterministic functions with colocated tests                           |
| `src/lib`                  | Cross-feature calculations and utilities                        | Route rendering                                  | Add only when ownership is genuinely shared                                |
| `src/types`                | Shared domain and view-model types                              | Runtime validation or persistence                | Prefer types colocated with a module unless reused broadly                 |
| `prisma`                   | Prisma schema, migrations, disposable seed                      | UI logic or undocumented production data fixes   | Change schema and reviewed migration together                              |
| `tests`                    | Playwright browser workflows                                    | Unit-level implementation details                | Add user-visible critical paths                                            |
| `docs`                     | Current authoritative engineering knowledge                     | Development history                              | Update the topic owner listed in `docs/index.md`                           |
| `architecture/decisions`   | Durable consequential decisions                                 | Routine implementation notes                     | Add an ADR only when the decision has lasting tradeoffs                    |

## Routes and module entry points

| Route         | Page                          | Workspace                                                                                                   | Service                                                | Actions                                 |
| ------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------- |
| `/`           | `src/app/page.tsx`            | `src/components/dashboard/dashboard-shell.tsx`                                                              | `src/lib/server/dashboard-service.ts`                  | Read-only                               |
| `/budgets`    | `src/app/budgets/page.tsx`    | `src/components/budgets/budget-workspace.tsx`, composed by `src/components/portfolio/budget-management.tsx` | `src/lib/server/budget-service.ts`                     | `src/app/budgets/actions.ts`            |
| `/contracts`  | `src/app/contracts/page.tsx`  | `src/components/portfolio/contracts-management.tsx`                                                         | `src/lib/server/contract-service.ts`                   | `src/app/contracts/actions.ts`          |
| `/renewals`   | `src/app/renewals/page.tsx`   | `src/components/renewals/maintenance-renewals-workspace.tsx`                                                | `src/lib/server/maintenance-renewal-service.ts`        | `src/app/renewals/actions.ts`           |
| `/products`   | `src/app/products/page.tsx`   | `src/components/catalog/product-catalog-workspace.tsx`                                                      | `src/lib/server/catalog-service.ts`                    | `src/app/products/actions.ts`           |
| `/deployment` | `src/app/deployment/page.tsx` | `src/components/deployment/deployment-workspace.tsx`                                                        | `src/lib/server/deployment-service.ts`                 | `src/app/deployment/actions.ts`         |
| `/documents`  | `src/app/documents/page.tsx`  | `src/components/documents/documents-workspace.tsx`                                                          | `src/lib/server/documents-service.ts`                  | `src/app/documents/actions.ts`          |
| `/settings`   | `src/app/settings/page.tsx`   | `src/components/settings/settings-workspace.tsx`                                                            | `src/lib/server/settings-service.ts`                   | `src/app/settings/actions.ts`           |
| `/purchases`  | `src/app/purchases/page.tsx`  | None; redirects to `/contracts`                                                                             | Compatibility functions remain in `catalog-service.ts` | Inactive route actions remain in source |

Department reassignment is a cross-module administrative operation in
`src/app/departments/actions.ts` and
`src/lib/server/department-reassignment-service.ts`.

## Shared runtime

`src/app/layout.tsx` configures fonts, global styles, tooltips, and
`GlobalContextProvider`. It declares dynamic rendering for the application.

`src/components/app/workspace-shell.tsx` owns the common header, sidebar,
context selectors, and optional title actions.
`src/components/app/app-navigation-sidebar.tsx` owns navigation.
`src/lib/server/global-context.ts` reads active Department and Fiscal Year
options and resolves the default year. The client provider reads and changes
`department` and `fy` URL parameters.

`src/lib/server/prisma.ts` is the only shared Prisma client factory. It uses the
Neon adapter and reuses a process-global client. Server code must call
`getPrisma()` rather than instantiate clients.

`src/lib/server/action-result.ts` standardizes form success, field errors, and
mutation errors. Actions adapt `FormData`, call services, invalidate affected
routes, and return serializable results.

## Validation and serialization

Most mutation schemas are colocated with the owning service in
`src/lib/server`. Budget also has pure worksheet validation under
`src/lib/budgets`. Client validation improves usability but is never the
authority.

Pages serialize Prisma-derived results before passing them to Client Components,
commonly with `JSON.parse(JSON.stringify(data))`. This is an implementation
boundary, not a license to return full relational graphs. New code should define
narrow DTOs and explicit Decimal/Date conversion.

## Persistence

- `prisma/schema.prisma` defines the current model.
- `prisma/migrations` contains the committed transition history after an
  established baseline.
- `prisma/seed.mjs` is destructive fixture generation for disposable databases.
- `prisma.config.ts` owns schema, migration, seed, and migration-connection URL
  resolution.

Read [Database and migrations](database-and-migrations.md) before changing any
of these files.

## Tests

Unit, component, and mocked service tests are colocated as
`src/**/*.test.{ts,tsx}` and run through Vitest. Browser tests are under
`tests/*.spec.ts` and run through Playwright. See [Testing](testing.md).

## Configuration

| File                                 | Responsibility                              |
| ------------------------------------ | ------------------------------------------- |
| `package.json` / `package-lock.json` | Runtime, toolchain, and commands            |
| `next.config.ts`                     | Next.js configuration                       |
| `scripts/build.mjs`                  | Prisma generation followed by Next.js build |
| `prisma.config.ts`                   | Prisma CLI configuration and URL precedence |
| `tsconfig.json`                      | Strict TypeScript and `@/*` alias           |
| `eslint.config.mjs`                  | ESLint configuration                        |
| `.prettierrc` / `.prettierignore`    | Formatting                                  |
| `vitest.config.ts`                   | jsdom unit/component test discovery         |
| `playwright.config.ts`               | Chromium browser tests on local port 3100   |
| `components.json`                    | shadcn/ui configuration                     |

## Safe extension examples

- A new Contract rule belongs in `contract-service.ts`, with a service test;
  the action adapts input and the component presents the result.
- A new Dashboard aggregation belongs in a server query or pure aggregation
  helper, not in chart components.
- A new reference option requires a reviewed model/migration, settings service
  validation, Settings UI, downstream read integration, tests, and data-model
  documentation.
- A cross-module invariant may require an ADR before implementation.
