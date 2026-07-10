# Prisma Boundary

Phase 1 defined the initial PostgreSQL-compatible Prisma schema for the core
cybersecurity financial operations entities. Phase 4.5 adds a transitional
Company/catalog/purchase architecture for review before database-backed
workflow execution.

- `schema.prisma` contains the reviewable entity model and enums.
- `seed.mjs` adds realistic cybersecurity financial operations sample data,
  including Company roles, seller relationships, purchasing vehicle
  eligibility, purchases, budget allocations, deployment waves, and usage
  measurements.
- `migrations/20260710120000_company_purchase_transition/migration.sql`
  contains generated SQL for the current reviewable schema plus PostgreSQL
  partial unique indexes for nullable `ProductFeature.moduleId` uniqueness.
- `prisma.config.ts` at the repository root loads the database URL for Prisma
  commands and migrations.

Do not run destructive migrations or reset Neon. The legacy `Vendor` and
`Reseller` models intentionally remain until Company backfill, parity checks,
and application read/write migration are complete. The field-by-field migration
worksheet lives at `docs/vendor-reseller-company-migration-worksheet.md`.
