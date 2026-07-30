# finsec-ops

finsec-ops is a Technology Financial Operations platform for technology
leadership, finance partners, and operational owners. It connects budgets,
commercial commitments, renewals, products, deployments, utilization, documents,
and reference data so leaders can understand the financial and operational
position of a technology portfolio.

Cybersecurity and departmental technology finance are the initial configured
use case. The architecture can expand to broader IT financial operations without
changing the product into an accounting or procurement suite.

## Core capabilities

- **Dashboard and reporting** — context-scoped budget, forecast, contract,
  renewal, deployment, and department reporting.
- **Budget** — fiscal-year plans, spreadsheet-style supporting schedules,
  annual financial records, account rollups, savings, and cost avoidance.
- **Maintenance Renewals** — a table-first operational register with selected
  record details, commercial parties and amounts, co-op references, product
  lines, comments, history, and deployment traceability.
- **Contracts** — commercial terms and product pricing lines, with controlled
  handoffs to Budget and Maintenance Renewals and preservation of prior terms.
- **Product Catalog** — vendors, resellers, products, Product Components,
  Capabilities, and operational Functions.
- **Deployment** — contract- or renewal-line-backed deployment scopes and
  append-only utilization measurements.
- **Documents and Audit Trail** — metadata records linked to supported business
  entities and a shared activity timeline. Binary file storage is not present.
- **Settings** — organization, Department, Fiscal Year, owner, finance,
  contract, deployment, and renewal reference data.

The Department and Fiscal Year selectors in the application shell carry shared
reporting context across the context-aware workspaces.

## Application boundaries

finsec-ops owns technology planning and portfolio financial operations. It is
not an ERP, general ledger, accounts-payable system, GRC platform, ticketing
system, project-management system, vulnerability-management platform, asset
inventory, or full procurement execution system. Purchase, invoice, payment,
and legacy renewal records exist as compatibility and future integration
boundaries; the active `/purchases` route redirects to Contracts.

## Technology stack

| Area                 | Verified implementation                               |
| -------------------- | ----------------------------------------------------- |
| Application          | Next.js 16 App Router, React 19, strict TypeScript    |
| UI                   | Tailwind CSS 4, shadcn/ui, Base UI, Lucide, Recharts  |
| Validation           | Zod 4                                                 |
| Persistence          | PostgreSQL on Neon, Prisma 7, Neon serverless adapter |
| Unit/component tests | Vitest, Testing Library, jsdom                        |
| Browser tests        | Playwright, Chromium                                  |
| Hosting target       | Vercel                                                |
| Package manager      | npm with a committed lockfile                         |

## Architecture summary

Routes are Server Components that resolve URL context and call server-side
services. Interactive workspaces are Client Components receiving serializable
data. Mutations cross `"use server"` action boundaries, are validated again in
domain services, use Prisma transactions where an invariant spans records, and
invalidate affected routes. Prisma is available only from server-side modules.

The root layout is dynamic, and the application currently performs request-time
database reads rather than maintaining an application cache. Authentication,
authorization, object storage, and production observability remain explicit
boundaries, not implemented controls.

See [System architecture](docs/architecture.md) and
[Codebase map](docs/codebase-map.md).

## Repository structure

```text
src/app/                  App Router pages and server actions
src/components/           Application, feature, and shared UI components
src/lib/server/           Server-only services and Prisma access
src/lib/                  Domain calculations and shared utilities
src/types/                Shared domain and view-model types
prisma/                   Schema, migration history, and destructive sample seed
tests/                    Playwright browser tests
docs/                     Authoritative engineering documentation
architecture/decisions/   Architecture Decision Records (ADRs)
scripts/                  Build orchestration
```

## Local development

### Prerequisites

- Node.js 20 or a compatible current LTS release
- npm
- A PostgreSQL database compatible with the committed Prisma migrations; Neon
  is the supported hosted database

### Setup

1. Install the locked dependencies:

   ```bash
   npm ci
   ```

2. Create `.env.local` and provide a runtime URL:

   ```dotenv
   DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
   ```

   `POSTGRES_PRISMA_URL` is the runtime fallback. Migration commands prefer
   `POSTGRES_URL_NON_POOLING`, then `DATABASE_URL_UNPOOLED`, before the runtime
   variables. Do not commit environment files.

3. Generate Prisma Client:

   ```bash
   npx prisma generate
   ```

4. Inspect migration status and apply committed migrations to an appropriate
   development database:

   ```bash
   npx prisma migrate status
   npm run migrate:deploy
   ```

   The migration directory begins from an established database baseline. Do
   not assume it can bootstrap an empty database until the baseline is
   formalized. See [Database and migrations](docs/database-and-migrations.md).

5. Seed only a disposable development database, if sample data is required:

   ```bash
   npx prisma db seed
   ```

   The seed deletes application data before inserting fixtures. Never run it
   against shared, staging, production, or production-like data.

6. Start the application:

   ```bash
   npm run dev
   ```

7. Run the appropriate validation:

   ```bash
   npm run lint
   npm test
   npm run test:e2e
   npm run build
   ```

Database-backed Playwright cases require a compatible, safely seeded database.

## Common commands

| Command                    | Purpose                                              |
| -------------------------- | ---------------------------------------------------- |
| `npm run dev`              | Start the Next.js development server                 |
| `npm run build`            | Generate Prisma Client and create a production build |
| `npm run start`            | Serve a completed production build                   |
| `npm run lint`             | Run ESLint                                           |
| `npm test`                 | Run Vitest once                                      |
| `npm run test:watch`       | Run Vitest in watch mode                             |
| `npm run test:e2e`         | Run Playwright browser tests                         |
| `npm run format`           | Write Prettier formatting changes                    |
| `npm run format:check`     | Check formatting                                     |
| `npm run migrate:deploy`   | Apply committed Prisma migrations                    |
| `npm run prisma -- <args>` | Run the Prisma CLI                                   |

There is no separate type-check script. Use `npx tsc --noEmit`.

## Documentation

Start with the [documentation index](docs/index.md). Key references include:

- [Product overview](docs/product-overview.md)
- [System architecture](docs/architecture.md)
- [Modules](docs/modules.md)
- [Data model](docs/data-model.md)
- [Development workflow](docs/development.md)
- [Testing](docs/testing.md)
- [Deployment](docs/deployment.md)
- [Security](docs/security.md)
- [Operations](docs/operations.md)
- [Production readiness](docs/production-readiness.md)
- [Performance and production hardening](docs/performance-production-hardening.md)
- [Active backlog](TODO.md)
- [Architecture decisions](architecture/decisions/README.md)

## Production posture

The repository is an engineered application under active development, not a
production-authorized system. It handles sensitive financial and commercial
concepts but does not implement identity, access control, production-grade
audit coverage, file storage, telemetry, backup verification, or production
release controls. See [Production readiness](docs/production-readiness.md) for
the evidence-based gap assessment and acceptance criteria.

## Contributing

Human contributors should follow [CONTRIBUTING.md](CONTRIBUTING.md). AI
development agents must follow [AGENTS.md](AGENTS.md) and the relevant
task-specific documentation. Material architecture, data-model, deployment, or
operational decisions require documentation and, where appropriate, an ADR.
