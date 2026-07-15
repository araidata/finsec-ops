# Maintenance Renewals Is an Operational Register

Date: 2026-07-14

Status: Accepted

## Context

The Phase 4.5 Maintenance Renewals implementation had grown into a
case-management surface with side panels, workflow stages, risk, funding,
quotes, approvals, replacement plans, decommission tasks, and procurement
details. The departmental need is materially smaller: scan approaching
renewals, track the commercial parties and amounts, record the current status,
capture co-op agreement details, assign an owner, and retain comments and a
lightweight history.

## Decision

Maintenance Renewals uses two primary areas: a configurable, table-first
register and one full-width selected-renewal workspace below it. Routine work
does not use slide-out panels or row action columns. Important financial, date,
relationship, status, owner, and co-op changes use explicit Save and Cancel.

The register reuses Company roles for vendors and resellers, Product for the
catalog relationship, Purchasing Vehicle names for co-op reference choices,
Note for comments, Team Member for owners, and ActivityLog for meaningful
changes. New vendor selections must be active and have the Vendor role in both
the browser and service validation. Existing inactive references remain
readable so historical data is not broken.

Co-op agreement name, contract number, and expiration are stored as distinct
renewal-cycle snapshots because an agreement can change after a renewal is
created. Legacy case-management fields and child records remain in the schema
for compatibility, but they are not exposed as primary register concepts.
Removed workflow-stage values are compatibility-mapped in the migration and
cannot be newly selected in the register.

## Consequences

- The page remains information-dense without becoming a workflow engine.
- Vendor/Product stay pinned and first; Reseller remains independent.
- Comments and history are available in context without loading hidden forms
  for every row.
- Existing contract-to-renewal links and historical child records remain valid.
- Future removal of legacy case-management storage requires a separate,
  reviewed data-retention migration.
