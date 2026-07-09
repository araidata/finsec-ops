# Phase 1 Initial Database Model

## Status

Accepted for initial implementation.

## Context

finsec-ops is moving from the Phase 0 static foundation into Phase 1 Database
Architecture. The product needs a PostgreSQL-compatible Prisma model for the
core cybersecurity financial operations domain without implementing CRUD pages,
authentication, AI, document upload, full accounting, GRC, asset inventory, or
ticketing concepts.

The model must keep vendors and resellers separate because cybersecurity
products are often owned by one company and purchased through another,
especially in public-sector procurement.

## Decision

Create the initial Prisma schema around these core entities:

- Fiscal years, budget categories, and budget line items for planning,
  forecasts, commitments, actuals, and remaining-budget calculations.
- Vendors, resellers, contracts, products, and product modules as separate
  commercial portfolio entities.
- Renewals and purchase requests as procurement lifecycle entities.
- Invoices and payments as lightweight financial execution records tied back to
  contracts, renewals, or purchase requests.
- Documents, notes, users, and activity logs as supporting context and audit
  records.

Use PostgreSQL `Decimal(14, 2)` money fields with `currencyCode` defaulting to
`USD`. Use enums for governed lifecycle and status fields. Use nullable foreign
keys for optional funding, invoice, payment, document, and note attachments.
Use `ActivityLog.entityType` and `ActivityLog.entityId` for the audit trail so
important changes can be recorded without over-modeling every possible audited
relationship.

Configure Prisma 7 with `prisma.config.ts`, loading `DATABASE_URL` first and
falling back to Vercel-managed Neon `POSTGRES_PRISMA_URL`.

## Consequences

- The schema supports the core portfolio, budget, renewal, procurement, and
  financial reporting concepts needed for the next phases.
- Vendor and reseller reporting can stay accurate without collapsing distinct
  procurement roles.
- Documents and notes are queryable for the main entities without introducing a
  full document management or upload system.
- Activity logging can capture create, update, delete, status, amount, and
  owner changes, but detailed historical snapshots remain a future workflow
  decision.
- Tenant and authentication boundaries remain deferred until Phase 10.

## Alternatives Considered

- A generic polymorphic attachment table for every entity type. Rejected for
  Phase 1 because explicit nullable relationships are easier to understand and
  query for the limited attachment targets.
- Full accounting models such as ledger accounts, purchase orders, and journal
  entries. Rejected as out of scope for cybersecurity financial operations
  planning and executive reporting.
- Combining vendors and resellers into one organization table. Rejected because
  the product needs distinct first-class reporting semantics for product owner
  versus public-sector purchasing channel.
