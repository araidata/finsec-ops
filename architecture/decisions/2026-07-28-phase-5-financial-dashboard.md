# Phase 5 Financial Dashboard

## Decision

The dashboard is a read-only reporting layer over existing Prisma-backed
Budget, Contract, Maintenance Renewal, Deployment, and Purchase Request data.
It introduces no persistence models or financial workflow mutations.

Selected departments filter existing ownership relationships. `All Departments`
removes that predicate, shows organization-wide totals, and adds a department
comparison table. Records without a department remain in organization-wide
totals and appear as `Unassigned` in comparison and detail views.

Budget and renewal records use explicit fiscal-year relationships. Contracts
use term overlap or renewal-date inclusion. Deployments use target, completion,
or linked-contract overlap. Purchase Requests resolve department through a
linked contract, maintenance renewal, or budget line when available.

The service returns a typed read model for metrics, category rollups,
fiscal-year trend points, renewals, procurement, readiness, and comparisons.
The forecast chart uses fiscal-year totals because the current model has no
reviewed period-level financial records and must not fabricate monthly values.
