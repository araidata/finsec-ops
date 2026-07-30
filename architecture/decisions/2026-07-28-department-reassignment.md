# Department Reassignment Workflow

## Status

Accepted

## Decision

Department reassignment is implemented as a shared transactional service for
Budget Items, Contracts, and Maintenance Renewals. The selected record moves
by default; linked records remain unchanged and are reported as warnings.

## Rationale

Budget Items own the department relationship for all of their annual financial
rows. Contracts and Maintenance Renewals have independent department
relationships, so automatic cascading would create surprising cross-workspace
mutations. Users can move linked records explicitly through the same workflow.

The service records the prior and new department in ActivityLog and keeps the
legacy Maintenance Renewal text Department synchronized with its foreign-key
relationship.

## UI contract

Each workspace exposes a row-level move action and bulk selection toolbar. The
move dialog uses active Settings departments, reserves `All Departments` for
the global context, and displays linked-record warnings after a successful
transaction.
