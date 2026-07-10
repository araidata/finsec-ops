# Phase 2-4 Static Management Workspaces

## Status

Accepted.

## Context

The repository had a Phase 1 Prisma model with vendors, resellers, budget line
items, contracts, products, and product modules, but no applied migration,
database-backed CRUD boundary, authentication, or API routes. Phase 2 through 4
needed budget management, contracts and renewals, and products and modules
without rebuilding the app or duplicating vendor data.

## Decision

Extend the existing Prisma models instead of creating parallel tables. Keep
vendors and resellers as separate first-class entities and add optional reseller
links where direct and reseller-supported spend must be distinguished.

Add route-level static management workspaces for:

- `/budgets`
- `/contracts`
- `/products`

The workspaces use local React state for create, edit, and delete interactions
until the expanded schema is reviewed, migrated, seeded, and smoke-tested
against the development database. Shared calculation logic lives in
`src/lib/portfolio-analytics.ts` instead of inside route components.

## Consequences

- The UI can demonstrate Phase 2-4 workflows immediately without introducing
  unreviewed persistence behavior.
- The schema is ready for migration review and future service-boundary work.
- Local page-state changes are not durable and must be replaced by server
  actions, API routes, or service-layer CRUD after migration approval.
- The data model explicitly separates Workforce Security Awareness from
  Cybersecurity Staff Training & Development for budget and product reporting.
