# Modules

This document describes current module ownership and supported workflows.
Implementation locations are summarized in [Codebase map](codebase-map.md).

## Dashboard

**Route:** `/`

The Dashboard provides Department- and Fiscal-Year-scoped financial and
operational reporting. It aggregates approved, actual, forecast, and committed
annual financial values; renewal exposure; Contract annual value; deployment
progress; recent procurement compatibility records; Department comparison; and
Department assignment readiness.

`DashboardShell` owns presentation. `dashboard-service.ts` owns queries and
aggregation, with `aggregateDepartmentComparison` independently tested.
`BudgetAnnualFinancial`, `MaintenanceRenewal`, `Contract`, `Deployment`, and
`PurchaseRequest` are its sources.

The module is read-only. It treats unassigned records explicitly and uses
financial accounts as spend categories. Current limitations include
application-memory aggregation, unbounded source reads, no materialized
reporting layer, and no freshness or reconciliation indicator. Extend it with
server-side reporting queries and narrow chart DTOs rather than loading more
relational data into the component.

## Budget

**Route:** `/budgets`

Budget is a fiscal-year and Department financial workspace. Users select a
supporting schedule, review summaries, edit rows inline, manage row detail,
duplicate or delete records, and send applicable Software rows to Maintenance
Renewals. Contracts can create or update Software annual rows.

The workspace preserves its spreadsheet-style schedules:

- Software and SaaS
- Training
- Conferences
- Travel
- Professional Services
- Organizational Dues

`BudgetItem` is the logical classified item. `BudgetAnnualFinancial` is the
year-specific financial record and stores worksheet-specific detail fields.
`BudgetPlan`, `BudgetScenario`, `FiscalYear`, `BudgetAccount`, `Company`,
`Contract`, and `MaintenanceRenewal` provide context or links. Summary totals are
derived from the annual records, not separately edited.

`budget-service.ts` owns persistence and record coordination.
`src/lib/budgets` owns deterministic calculations, grouping, validation, and
view preparation. Multi-record creates, updates, duplicates, and deletes use
transactions. Deleting an annual row can inactivate an orphaned logical item.

Historical years remain separate records. The current UI does not provide
scenario roll-forward or submission workflow. Concurrent edits, universal
audit events, server-side pagination, and formal monetary rounding remain
limitations. Extend through worksheet detail types and service mappings while
preserving summary-from-schedule behavior.

## Maintenance Renewals

**Route:** `/renewals`

Maintenance Renewals is a table-first operational register with a selected-case
workspace. Users can create cases manually or from a Contract, edit register
fields, manage product lines, review financial and co-op agreement details, add
comments, and inspect history and linked deployment state. Vendor and Product
columns remain anchored while other register columns can be reordered locally.

`MaintenanceRenewal` is the case header. `MaintenanceRenewalLineItem` preserves
current Contract line snapshots and proposed/final terms. Quotes, workflow
steps, tasks, funding allocations, decision history, replacement plans,
decommission plans and tasks, Deployments, Activity Logs, and Notes support the
case. The schema and service layer retain those case-management operations, but
the current register UI does not expose all of them as primary workflows.
Contracts, Products, Product Components, Companies, Capabilities, Budget
records, purchasing compatibility records, Departments, and Team Members are
dependencies.

The service distinguishes recommendation from approved disposition and
validates disposition-specific work for callers of those operations. Renewal
changes do not edit the current Contract. New Contract terms or cycles, when
created through service operations, produce linked records. Selected register
changes and comments write audit events, but audit coverage is incomplete
across all subrecords.

Current limitations include very broad page-data graphs, no pagination, no
authorization, no notifications, no external quote ingestion, and no
concurrency protection. Extend operational subwork through the service and
transaction boundary rather than adding independent client state sources.

## Contracts

**Route:** `/contracts`

Contracts provides a table-first list and an inline selected Contract
workbench. Users create and edit headers and multiple product pricing lines,
reorder or duplicate lines, push a Contract into Budget, create a Maintenance
Renewal, and create a new term from approved renewal work.

`ContractLineItem` is the source of truth for Product and Product Component
scope, quantity, unit price, annual amount, and total amount. The service
synchronizes `Contract.annualValue` and `Contract.totalValue` from its lines.
`Company` records identify vendor and seller. Department, Team Member, payment
frequency, license metric, Fiscal Year, Budget, Renewal, and Deployment records
are dependencies.

Header and lines can be saved atomically. Product choices must belong to the
selected vendor, and Product Components must belong to the selected Product.
Historical inactive selections remain displayable. Dependency-free Contracts
can be deleted; Contracts linked to operational or financial history are
terminated instead. New terms link to the previous Contract.

Current limitations include no document-signature workflow, approval control,
currency model, tax handling, concurrency protection, full audit coverage, or
bounded list/detail reads. Extend Contract pricing through line items and
service-maintained totals; do not introduce a second pricing source.

## Product Catalog

**Route:** `/products`

The Product Catalog has Vendors and Resellers as its two primary views. It
maintains Companies and roles, vendor-owned Products, commercial Product
Components, reusable Capabilities, and operational Functions. Right-side
drawers provide create and edit interactions.

`Company` and `CompanyRole` are the active vendor/reseller identity source.
`Product.vendorCompanyId` owns the Product relationship. `ProductModule` stores
Product Components; `ProductFeature` stores Functions. Join models allocate
Capabilities. Product seller and purchasing-vehicle models remain in the
persistence/service boundary but are not primary Catalog views.

Server validation enforces active parent records and dependent relationships.
Inactive values may remain visible for historical records. Vendor deletion is
blocked by dependencies. Legacy `Vendor` and `Reseller` records remain, so the
Company transition is not complete.

Current limitations include unbounded full-catalog reads, no bulk import,
versioning, merge workflow, authorization, or comprehensive audit log. Extend
the taxonomy through existing ownership relationships and avoid overloading
Capabilities or Functions with contract-specific pricing.

## Deployment

**Route:** `/deployment`

Deployment records operational scope, environment, Department, owner, status,
progress, adoption, usage, dates, blockers, and outcomes. Users create or edit a
scope from a Contract line or Maintenance Renewal line and append usage
measurements.

`Deployment` is the scope record. `UsageMeasurement` is time-based history and
must be appended rather than overwriting earlier measurements. Contract lines
and Renewal lines are preferred commercial sources; `PurchaseItem` remains a
compatibility source. Department, Team Member, deployment-environment Settings,
Product, and Company data provide context.

The service validates that source lines and Product relationships are
compatible. Usage creation and Deployment summary updates are transactional.
Current limitations include no automated telemetry ingestion, no environment
inventory integration, no pagination, partial history/audit coverage, and no
access control. Extend through source-specific adapters and append-only
measurements without turning the module into asset inventory.

## Documents and Audit Trail

**Route:** `/documents`

This workspace creates, searches, filters, links, and deletes document metadata
for Contracts, Maintenance Renewals, Companies, and Products. It also displays
a shared activity timeline.

`Document` stores title, type, validated external URL, description, uploader
reference, timestamp, and entity foreign keys. It does not upload, encrypt,
scan, retain, or deliver file bytes. `ActivityLog` is a generic entity/action
event model. Document create, update, and delete execute with audit event
creation in a transaction.

The displayed activity timeline is capped at 200 records; document metadata is
not paginated. Department and Fiscal Year context constrain linkable Contract
and Maintenance Renewal records, but Company and Product links are global.
Current limitations are the absence of secure object storage, authentication,
authorization, immutable audit controls, retention, and complete mutation
coverage. Do not add binary upload before the security boundary in
[Security](security.md) is satisfied.

## Settings

**Route:** `/settings`

Settings manages Organization preferences, Fiscal Years, Departments, Team
Members, Budget accounts and categories, expense types, purchasing vehicles,
payment frequencies, license metrics, deployment environments, renewal
priorities, and renewal decision reasons.

Settings records are the selectable reference source for the modules that have
adopted them. Enums still govern system-controlled lifecycle values. Reference
records are normally deactivated rather than removed so historical values
remain readable. Changing the current Fiscal Year updates Organization settings
and year flags transactionally. Budget account codes are unique within
Department, with a separate uniqueness rule for global accounts.

Department reassignment is an administrative cross-module workflow for Budget
items, Contracts, and Maintenance Renewals. It validates destination references,
updates records transactionally, and writes Activity Logs.

Current limitations include no administrative authorization, concurrency
protection, complete change audit, hierarchy, organization switching, or
import/export. Extend Settings only for reference data with real cross-module
consumers; keep lifecycle state in governed enums unless configurability is a
reviewed requirement.

## Shared Department and Fiscal Year context

The root layout loads active Departments and Fiscal Years. Context-aware pages
normalize `department` and `fy` on the server before service reads and initialize
the client provider with that same selection. An omitted Fiscal Year defaults
from Organization settings or the current/most recent active year; explicit
`all` remains all years. Invalid or inactive URL values normalize to a safe
active scope. App Router navigation preserves context during supported
navigation.

Dashboard, Budget, Contracts, Maintenance Renewals, Deployment, and Documents
consume some or all of this context. Product Catalog and Settings are global.
“All Departments” and “All Fiscal Years” are reporting selections, not stored
Departments or permission grants.

URL context is not authorization. Historical records with inactive or missing
references must remain visible where needed. Any extension must define whether
the context filters, defaults new records, or both; it must not silently change
record ownership.
