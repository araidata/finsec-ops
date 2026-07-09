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
- `tests/home.spec.ts` verifies the Phase 0 shell renders in browser contexts.

## Expectations

Add focused tests whenever behavior is introduced. Broaden coverage when
changes affect shared services, persistence, provider contracts, or
user-facing workflows.
