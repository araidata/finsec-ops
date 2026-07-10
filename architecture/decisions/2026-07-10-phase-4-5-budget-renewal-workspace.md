# Phase 4.5 Budget Planning And Maintenance Renewal Redesign

## Status

Accepted.

## Context

The Phase 2 Budget Management page was useful as a static portfolio view, but it
was too flat for government Finance budget submission. Finance users currently
work through fiscal-year Excel worksheets with account rollups and separate
supporting schedules. Maintenance renewals are also a critical source of
cybersecurity operating spend and need to feed upcoming budgets without duplicate
entry.

## Decision

Make Budget Plan the parent financial workspace for a fiscal year. Separate the
continuing logical Budget Item from Budget Annual Financial records so
historical approved, proposed, actual, variance, savings, and cost avoidance
values are preserved by fiscal year and scenario.

Make Finance account codes configurable Budget Account records. Supporting
schedules feed the Finance Summary automatically through those accounts rather
than requiring duplicate total entry.

Make Maintenance Renewal a first-class budget planning record. Renewals can link
to an upcoming Budget Annual Financial record so quote and negotiated cost data
can feed the proposed budget amount.

Use a dense grid plus detail drawer UI. The grid supports fast Finance entry,
while the drawer holds justification, risk, notes, and richer metadata that do
not belong in every visible column.

Keep Phase 4.5 static and in-memory until the redesigned Prisma schema is
reviewed. Do not apply a Neon or production migration in this phase.

## Consequences

- Budget planning now reflects fiscal-year Finance workflows more closely.
- Historical values are retained instead of overwritten by the latest budget
  amount.
- Maintenance renewals become part of the budget foundation rather than a later
  dashboard-only concern.
- The app remains portable because the schema uses standard PostgreSQL-compatible
  Prisma features and pure TypeScript calculations.
- Persistent CRUD, API routes, server actions, authentication, document upload,
  notifications, AI, and real procurement workflow execution remain deferred.
