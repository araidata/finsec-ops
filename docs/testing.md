# Testing

## Tools

- ESLint for static checks.
- Prettier for formatting.
- Vitest for unit and component tests.
- Playwright for browser-level smoke and workflow tests.

## Current Coverage

- `src/components/dashboard/metric-card.test.tsx` verifies a reusable dashboard
  component renders key content.
- `src/lib/financial-calculations.test.ts` verifies approved budget total,
  forecast total, committed spend total, actual spend total, remaining budget,
  and renewal exposure by fiscal year.
- `src/lib/portfolio-analytics.test.ts` verifies Phase 2-4 budget, renewal,
  module utilization, and redundancy helper logic.
- `src/lib/budgets/budget-calculations.test.ts` verifies Phase 4.5 line totals,
  account rollups, fiscal totals, percentage changes, zero prior-year handling,
  savings, cost avoidance, variances, renewal calculations, notice dates,
  exposure windows, historical comparisons, and roll-forward behavior.
- `src/components/budgets/budget-workspace.test.tsx` verifies fiscal-year
  switching, worksheet-specific budget entry recalculation, summary/context
  behavior, maintenance renewal recalculation, and row detail drawer behavior.
- `tests/home.spec.ts` verifies the Phase 0 shell renders in browser contexts.
- `tests/budgets.spec.ts` verifies the Phase 4.5 budget workspace in browser:
  selecting a fiscal year, adding a budget row, editing an inline amount,
  seeing totals update, opening Maintenance Renewals, editing a renewal quote,
  and seeing increase and savings recalculate.

## Expectations

Add focused tests whenever behavior is introduced. Broaden coverage when
changes affect shared services, persistence, provider contracts, or
user-facing workflows.

For current shell and production-review work, desktop behavior is the default
priority. Only spend effort on mobile-specific test expansion or polish when a
task explicitly calls for it.
