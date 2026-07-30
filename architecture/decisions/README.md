# Architecture Decision Records

Architecture Decision Records (ADRs) capture durable choices whose rationale
and consequences matter beyond one implementation change. Current architecture
is described in `docs/architecture.md`; ADRs explain why consequential choices
were made.

## When an ADR is required

Create an ADR for a change to:

- system or trust boundaries;
- data ownership, source of truth, or historical preservation;
- cross-module workflow or transaction semantics;
- deployment topology or database strategy;
- identity, authorization, storage, or external-provider boundary; or
- an enduring UI interaction model that constrains multiple implementations.

Routine refactors, component details, field additions, and work-status notes do
not require ADRs.

## Format and naming

Use `YYYY-MM-DD-short-decision-name.md`. Each record contains:

- title;
- status;
- context;
- decision; and
- consequences.

Allowed statuses are **Proposed**, **Accepted**, **Superseded**, **Deprecated**,
and **Rejected**. Do not rewrite the substance of an accepted historical
decision merely because implementation evolved. If a new choice replaces it,
add a new ADR and mark the old one Superseded with a link.

## Retained decisions

| ADR                                                                                            | Status   | Durable decision                                                                     |
| ---------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| [Budget financial workspace](2026-07-10-budget-financial-workspace.md)                         | Accepted | Fiscal-year annual records and supporting schedules feed Finance summaries           |
| [Company, Catalog, and Purchase transition](2026-07-10-company-catalog-purchase-transition.md) | Accepted | Company roles and normalized commercial boundaries coexist with legacy compatibility |
| [Product Catalog reseller role UX](2026-07-10-product-catalog-reseller-role-ux.md)             | Accepted | Reseller role reuse does not require product-specific seller mappings                |
| [Product Catalog taxonomy](2026-07-10-product-catalog-taxonomy-redesign.md)                    | Accepted | Product, Component, Capability, and Function are distinct concepts                   |
| [Operational Maintenance Renewals](2026-07-11-operational-maintenance-renewals.md)             | Accepted | Renewal operations are separate from Budget and preserve cycle history               |
| [Contract source of truth](2026-07-13-contract-source-of-truth-renewal-snapshots.md)           | Accepted | Contract lines own current pricing; Renewal lines snapshot proposed terms            |
| [Unified Contract editor](2026-07-13-unified-contract-editor-atomic-save.md)                   | Accepted | Contract header and pricing lines save atomically                                    |
| [Maintenance Renewals register](2026-07-14-maintenance-renewals-register.md)                   | Accepted | Register-first interaction and explicit save preserve dense operational use          |
| [Settings reference data](2026-07-14-settings-reference-data.md)                               | Accepted | Concept-specific reference tables coexist with governed lifecycle enums              |
| [Department reassignment](2026-07-28-department-reassignment.md)                               | Accepted | Reassignment is explicit, transactional, non-cascading, and audited                  |
| [Financial Dashboard](2026-07-28-financial-dashboard.md)                                       | Accepted | Dashboard is a read-only aggregation over authoritative modules                      |
| [Documents and Audit Trail](2026-07-28-documents-audit-trail.md)                               | Accepted | Document metadata is provider-portable and mutation events are transactional         |
| [Renewal-scoped Deployments](2026-07-28-renewal-scoped-deployments.md)                         | Accepted | New Deployments derive from maintained Renewal product lines                         |
| [Department-scoped financial accounts](department-scoped-financial-accounts.md)                | Accepted | Accounts may be global or Department-specific                                        |

Records that only described temporary implementation stages, deferred schema
work, or static demonstrations were removed after their durable content was
incorporated into current documentation or the consolidated Budget ADR. Git
history remains the implementation record.
