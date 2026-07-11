# Operational Maintenance Renewals

## Status

Accepted.

## Context

Maintenance renewal work is a year-round operational process, not only a
budget planning worksheet row or a contract expiration date. Security, Finance,
Purchasing, Legal, business owners, and technical owners need to track
disposition decisions, quote versions, approvals, purchasing progress,
replacement planning, decommissioning, comments, and historical decisions while
Budget only needs renewal financial summaries for planning and variance review.

## Decision

Maintenance Renewals is a top-level module at `/renewals`. Budget may link to a
maintenance renewal and display planned amount, forecast, approved amount,
purchase order amount, actual amount, variance, funding status, current stage,
disposition, decision status, and risk status. Detailed tasks, quotes,
approvals, workflow stages, decision history, comments, replacement planning,
decommissioning planning, and operational follow-through belong to Maintenance
Renewals.

The existing `MaintenanceRenewal` Prisma model is expanded into the operational
cycle record instead of introducing a parallel renewal concept. Legacy
`Renewal` remains in place for contract-renewal compatibility. The operational
model keeps overall status, workflow stage, recommended disposition, approved
disposition, decision status, risk status, funding status, and quote status as
separate concepts.

Child tables preserve quote versions, workflow stage records, tasks, funding
allocations, decision history, replacement plans, decommissioning plans, and
decommissioning checklist tasks. Purchases, purchase requests, invoices,
payments, documents, and notes can link directly to a maintenance renewal case
without being owned exclusively by the renewal module.

## Consequences

- Renewal history is preserved across cycles; a new term creates a new renewal
  case instead of overwriting prior decisions and pricing.
- Budget remains Finance-oriented and avoids owning operational renewal
  workflow details.
- Maintenance Renewals can reuse existing Company, Product Catalog, Contract,
  Purchasing, Deployment, Budget, Document, and Note records instead of
  creating duplicate master data.
- Authorization remains deferred until authentication exists. The new service
  enforces validation and persistence boundaries but cannot enforce user roles
  before the authentication phase.
