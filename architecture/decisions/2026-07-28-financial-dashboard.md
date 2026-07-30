# Financial Dashboard

## Status

Accepted

## Context

Leadership reporting must aggregate existing authoritative financial and
operational records without introducing a second persistence source or
fabricating time granularity not present in the model.

## Decision

The Dashboard is a read-only reporting layer over Prisma-backed Budget,
Contract, Maintenance Renewal, Deployment, and Purchase Request data.

Selected Departments filter existing ownership relationships. “All
Departments” removes that predicate, includes unassigned records in
organization-wide totals, and presents them explicitly as `Unassigned`.

Budget and Maintenance Renewal records use explicit Fiscal Year relationships.
Contracts use term overlap or renewal-date inclusion. Deployments use target,
completion, or linked-Contract overlap. Purchase Requests resolve Department
through linked operational records when available.

The service returns a typed reporting read model. Fiscal-year trend points use
annual totals because the model has no reviewed period-level financial records.

## Consequences

- Dashboard values remain derivable from module sources of truth.
- No monthly trend is implied without monthly records.
- Production scaling requires database-side aggregation and bounded queries
  without changing the reporting semantics.
