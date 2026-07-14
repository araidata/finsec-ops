# Settings Reference Data

## Status

Accepted.

## Context

Phase 4.5 needs a real Settings workspace so administrators can maintain basic
organizational, financial, contract, deployment, and renewal reference data
without editing code. The existing application mixed hard-coded dropdown values,
free-text Department and Owner fields, and workflow enums that should remain
stable for reporting and validation.

The implementation must stay focused on one organization, one Department field,
and one Owner field. Authentication, permissions, configurable workflows,
custom fields, department hierarchy, multiple organizations, and multiple owner
types are out of scope.

## Decision

Use concept-specific Settings models instead of one generic dropdown-options
table.

Settings now manages:

- Organization settings.
- Fiscal Years.
- Departments.
- Team Members.
- Budget Accounts, Budget Categories, and Expense Types.
- Purchasing Vehicles, Payment Frequencies, and License Metrics.
- Deployment Environments.
- Renewal Priority labels and Renewal Decision Reasons.

Department means the organizational department that owns the item. Owner means
the Team Member assigned responsibility for the item. Budget, Contract,
Deployment, and Maintenance Renewal records get nullable Department and Owner
foreign keys while preserving existing text values during the transition.

Workflow values remain controlled when application logic depends on them.
Contract status, Deployment status, Renewal workflow stage, renewal status,
quote status, funding status, approval status, payment status, and similar
lifecycle states are not administrator-configurable reference data.

## Consequences

- Settings data can be reused by operational workspaces without silently
  falling back to code-only dropdown lists.
- Historical records can keep inactive Departments and Owners through nullable
  foreign keys and preserved text snapshots.
- Future work can bind Budget, Contract, Renewal, and global context filters
  more deeply to Settings without redesigning the schema.
- More Settings models exist than a generic dropdown design would require, but
  each model keeps clear business meaning, validation, and reporting semantics.
