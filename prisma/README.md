# Prisma Boundary

Phase 1 defined the initial PostgreSQL-compatible Prisma schema for the core
cybersecurity financial operations entities. Phase 4.5 adds a transitional
Company/catalog/purchase architecture and database-backed application
workflows for Product Catalog and Purchases.

- `schema.prisma` contains the reviewable entity model and enums.
- `seed.mjs` adds realistic cybersecurity financial operations sample data,
  including the expanded Product Catalog vendor/reseller set, Company roles,
  seller relationships, purchasing vehicle eligibility, purchases, budget
  allocations, deployment waves, and usage measurements.
- `migrations/20260710120000_company_purchase_transition/migration.sql`
  contains generated SQL for the current reviewable schema plus PostgreSQL
  partial unique indexes for nullable `ProductFeature.moduleId` uniqueness.
- `migrations/20260710153000_purchase_app_compatibility/migration.sql`
  contains the small compatibility additions required by the visible
  application layer: seller relationship type, purchasing agreement linkage,
  agreement titles/dates, and licensed/deployed usage counts.
- `prisma.config.ts` at the repository root loads the database URL for Prisma
  commands and migrations, with a placeholder URL only for generation-time
  commands that do not connect to the database.

Do not run destructive migrations or reset Neon. The legacy `Vendor` and
`Reseller` models intentionally remain until Company backfill, parity checks,
and remaining legacy read/write migration are complete. The field-by-field
migration worksheet lives at
`docs/vendor-reseller-company-migration-worksheet.md`.

The `/products` and `/purchases` routes require `DATABASE_URL` or
`POSTGRES_PRISMA_URL` and the reviewed migrations to be applied. Without a
database URL they render an explicit setup state instead of static fallback
data.
