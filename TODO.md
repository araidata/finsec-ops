# Active Engineering Backlog

This file is a concise list of unresolved engineering work. Detailed evidence,
required conditions, and acceptance criteria are maintained in
[Production readiness](docs/production-readiness.md). Git history records
completed implementation work. Performance findings, targets, and sequencing
are maintained in the
[Performance and Production Hardening Plan](docs/performance-production-hardening.md).

## Production blockers

- Implement Microsoft Entra ID authentication and secure server-managed
  sessions.
- Define and enforce server-side role, Department, and record-level
  authorization for every read and mutation.
- Complete audit coverage for authoritative financial, contract, renewal,
  deployment, settings, and document-metadata mutations.
- Establish separate development, preview, staging, and production databases,
  with protected secrets and documented ownership.
- Formalize the database baseline so committed migrations can provision and
  validate a new environment deterministically.
- Replace the destructive fixture seed with clearly separated disposable-data
  tooling and non-destructive reference-data initialization.
- Establish automated, verified database backups and routine restore testing.
- Implement structured logging, correlation IDs, error monitoring, health
  checks, and actionable alerts.
- Add CI checks for lint, type checking, unit/component tests, production build,
  migration review, and selected browser workflows.

## Data integrity and scalability

- Add pagination or bounded server-side query contracts to all production list
  and reference-data reads; separate list DTOs from detail graphs.
- Move remaining in-memory filtering, sorting, grouping, and cross-year
  aggregation to indexed PostgreSQL queries.
- Define optimistic concurrency or equivalent conflict handling for
  simultaneously edited authoritative records.
- Complete and verify the `Vendor`/`Reseller` to `Company`/`CompanyRole`
  transition without losing historical relationships.
- Define a consistent monetary rounding and serialization policy at service and
  client boundaries.
- Review delete behaviors and migration constraints against financial and
  historical preservation requirements.
- Create production-scale synthetic datasets and performance budgets for the
  Dashboard, Budget, Contracts, Maintenance Renewals, Catalog, Deployment, and
  Documents workspaces.

## Security and documents

- Add malware-scanned object storage, access control, retention, encryption,
  and signed delivery before accepting document binaries.
- Add secure response headers, dependency and secret scanning, and a supported
  vulnerability-remediation process.
- Replace raw database error details in user-visible setup states with safe
  errors and correlation identifiers.
- Define log redaction rules for financial values, commercial terms, document
  metadata, personal data, connection strings, and tokens.

## Quality and operations

- Add route-level error, loading, and not-found boundaries for critical
  workspaces.
- Expand service and integration coverage for Settings, Deployment, Documents,
  Dashboard reads, Department reassignment, and renewal lifecycle operations.
- Isolate browser tests from mutable shared data and make fixtures repeatable.
- Add accessibility testing and remediate keyboard, focus, semantic, contrast,
  and large-grid issues.
- Define release approval, migration verification, rollback, incident response,
  dependency maintenance, and documentation review procedures.
- Add tested database recovery and application rollback runbooks.

## Product follow-up

- Validate global Department and Fiscal Year context semantics for every module,
  including all-context and historical-record behavior.
- Decide and implement whether Budget's “Send to Maintenance” interaction
  persists a Maintenance Renewal; the current interaction is client-local.
- Decide whether compatibility purchase, invoice, payment, and legacy renewal
  models remain integration boundaries or become supported workflows before
  exposing new UI.
- Define approved integrations and provider interfaces only when a concrete
  external-system requirement exists.
