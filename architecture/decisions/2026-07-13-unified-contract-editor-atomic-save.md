# Unified Contract Editor And Atomic Save

## Status

Accepted.

## Context

The database-backed Contracts workspace had the correct persistence primitives,
but the user workflow was fragmented. Creating a contract required saving the
header before adding product pricing lines, while editing contract details,
adding batch products, editing individual lines, and viewing contract details
used separate panels and competing actions.

## Decision

The Contracts workspace uses one table-first management view, one selected
contract detail area, and one unified contract editor for both new and existing
contracts. The editor captures required contract header fields and an editable
Products and Pricing table in the same form. Less frequently used contract
fields stay editable in a collapsed Additional Details section.

Contract creation and contract editing use a composite service method that
accepts header fields plus an array of `ContractLineItem` inputs. New contracts
and their line items are created in one Prisma transaction. Existing contracts
are updated by reconciling submitted line items in one transaction. The service
validates active vendor and reseller company roles, vendor-scoped products,
product-scoped components, date order, required fields, and nonnegative pricing
before writing.

`ContractLineItem` remains the pricing and product-scope source of truth.
Contract header annual and total values remain stored for reporting, but they
are synchronized from submitted line item totals.

## Consequences

- New contract entry no longer depends on a header-save-first workflow.
- The same product table pattern supports creation, editing, and detail review.
- Existing standalone line-item actions remain available for maintenance use
  cases such as duplicate, delete, and reorder.
- No destructive schema migration or second contract-product storage mechanism
  is introduced.
