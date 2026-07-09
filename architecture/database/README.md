# Database Architecture

Phase 1 defines the initial Prisma database architecture for PostgreSQL and
Vercel-managed Neon.

The first schema covers fiscal years, budget categories, budget line items,
vendors, resellers, contracts, products, modules, renewals, purchase requests,
invoices, payments, documents, activity logs, users, and notes.

Migrations are intentionally not committed yet. Review the model and then run
the first migration against the selected Neon database when the environment is
ready.
