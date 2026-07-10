# Company, Catalog, And Purchase Transition

## Status

Accepted for review.

## Context

The previous model used separate `Vendor` and `Reseller` master-data tables and
stored reseller, annual cost, deployment, owner, contract, and budget context
directly on catalog products/modules. That shape would not support reusable
catalog data, database-backed cascading dropdowns, product seller eligibility,
or durable purchase/deployment reporting.

## Decision

Introduce a transitional normalized architecture while preserving legacy
`Vendor` and `Reseller` models for backfill parity:

- `Company` plus `CompanyRole` represents vendors, resellers, service
  providers, implementation partners, and consultants.
- `Product`, `ProductModule`, and `ProductFeature` represent reusable catalog
  data, with `ProductOfferingType` for software, SaaS, hardware, services,
  training, support, and other offerings.
- `Capability` relationships normalize product, module, and feature overlap for
  future redundancy analysis.
- `ProductSeller`, `PurchasingVehicleSeller`, and
  `PurchasingVehicleProductEligibility` define optional seller and vehicle
  eligibility for constrained purchasing scenarios. Reseller companies remain
  reusable Company records with the `RESELLER` role and do not need a
  product-specific seller row before budget selection.
- `Purchase` represents approved or committed acquisition only;
  `PurchaseRequest` remains pre-commit workflow, `Invoice` remains billing
  obligation, and `Payment` remains cash movement.
- `PurchaseBudgetAllocation` allows purchases to split across budget records.
- `Deployment` is one-to-many per purchase item, and `UsageMeasurement` stores
  usage history.

## Consequences

- Existing Vendor and Reseller references can be migrated gradually through the
  worksheet in `docs/vendor-reseller-company-migration-worksheet.md`.
- Header purchase totals are denormalized for reporting but must be derived
  from line items by service logic.
- Nullable feature uniqueness requires PostgreSQL partial unique indexes in
  migration SQL because Prisma cannot represent the rule directly.
- UI and service work can move toward database-backed dependent dropdowns
  without hard-coding names or storing seller/cost/deployment facts on catalog
  products.
