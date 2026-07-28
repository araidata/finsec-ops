# Global Department and Fiscal-Year Context

The application exposes Department and Fiscal Year selectors in the shared top
bar. Selections use the `department` and `fy` URL query parameters and are
carried forward by sidebar navigation. An omitted parameter means no filter.

## Department behavior

Operational records use the existing single Department relationship. A
department selection filters Budget, Contracts, Maintenance Renewals,
Deployment, Documents, and Dashboard data. `All Departments` shows the
organization-wide view.

Catalog, Vendors, and Settings remain organization-wide reference-data
workspaces.

## Fiscal-year behavior

- Budget and Maintenance Renewals use their explicit `fiscalYearId`.
- Contracts are included when their term overlaps the selected fiscal year or
  their renewal date falls inside it.
- Deployments are included when their target or completion date falls inside
  the selected year, or when their linked contract overlaps that year.
- Documents linked to filtered contracts or renewals follow the same context.
- Dashboard metrics, charts, renewals, procurement, readiness, and department
  comparisons use the same budget, renewal, contract, deployment, and
  fiscal-year context rules. `All Departments` adds an organization-wide
  department comparison while selected departments show filtered details.

Fiscal year is a reporting lens for date-based records without an artificial
permanent fiscal-year owner field on contracts or deployments.
