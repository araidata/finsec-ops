# Phase 4.5 Budget Entry Redesign

## Status

Accepted.

## Context

The first Phase 4.5 budget workspace improved Finance alignment, but its main
grid still centered review-heavy columns such as prior approved, current
approved, proposed, and rollup-oriented comparisons. The user feedback for the
next iteration was clear: enter the budget in category-specific worksheets
first, keep account handling available but less intrusive, move comparisons and
rollups into a dedicated summary surface, and reclaim horizontal space by
hiding secondary rails and navigation when needed.

## Decision

Keep the Budget page Finance-oriented, but reorganize it around category-
specific entry worksheets instead of a single generic Finance grid.

Make `Summary` the Finance view for the workspace. It owns account rollups,
default account mappings, and year-over-year comparisons across the visible
worksheets.

Use purpose-built worksheet column sets for `Software and SaaS`, `Training`,
`Conferences`, `Travel`, `Organizational Dues`, and `Professional Services`.
These worksheets stay row-based and editable in local page state.

Split conference registration and travel into separate worksheets so the UI and
account rollups stay consistent with the underlying Finance account mappings.

Hide default account handling from the main entry grids. Keep worksheet default
accounts visible on `Summary`, and allow row-level overrides only from the
detail drawer.

Replace the always-visible budget right rail with an optional context sheet, and
make the shared application navigation hideable through the reusable sidebar
primitive.

Keep the redesign static and in-memory during Phase 4.5. Do not introduce
persistence, migrations, server actions, or procurement workflow automation in
this redesign.

## Consequences

- Budget entry is simpler and more category-specific for day-to-day planning.
- Finance context remains available, but the main data-entry screens have more
  usable width and less visual noise.
- Conferences and travel now map cleanly to separate default accounts.
- Account overrides remain possible without forcing Finance metadata into every
  row of every worksheet.
- The shared shell now supports off-canvas navigation across the dashboard and
  management workspaces.
