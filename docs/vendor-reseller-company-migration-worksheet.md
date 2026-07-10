# Vendor and Reseller Company Migration Worksheet

This worksheet is the required pre-schema map for moving from separate
`Vendor` and `Reseller` master-data tables to normalized `Company` records with
role rows. The transitional migration must keep the existing `Vendor` and
`Reseller` models until every reference has a populated Company-based path and
parity validation passes.

## Foreign Key Mapping

| Current model.field             | Current meaning                                           | New field or path                                                                                                              | Migration rule                                                                                                                           |
| ------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `BudgetItem.vendorId`           | Vendor or provider associated with a planned budget item. | `BudgetItem.vendorCompanyId`, or derive from the catalog product when `productId` is present.                                  | Backfill from old `Vendor` to `Company` with the `VENDOR` role. Keep nullable for generic or non-product budget items.                   |
| `BudgetItem.resellerId`         | Intended seller or channel for planned spend.             | `BudgetItem.sellerCompanyId`, or later `PurchaseBudgetAllocation` when the budget item is tied to a committed purchase.        | Backfill from old `Reseller` to `Company` with the `RESELLER` role. Use only when the budget item already represents an intended seller. |
| `MaintenanceRenewal.vendorId`   | Vendor or provider for renewal planning.                  | `MaintenanceRenewal.vendorCompanyId`, or derive from `purchaseItem.product.vendorCompanyId` after a purchase-item link exists. | Backfill the direct Company FK first. Add a purchase-item link only when a committed purchase is unambiguous.                            |
| `MaintenanceRenewal.resellerId` | Renewal seller or purchasing channel.                     | `MaintenanceRenewal.sellerCompanyId`.                                                                                          | Backfill from old reseller company and validate future sellers have a permitted seller role.                                             |
| `BudgetLineItem.vendorId`       | Vendor or provider on a legacy budget row.                | `BudgetLineItem.vendorCompanyId`, or product-derived vendor.                                                                   | Preserve historical reporting by backfilling to Company.                                                                                 |
| `BudgetLineItem.resellerId`     | Seller or channel on a legacy budget row.                 | `BudgetLineItem.sellerCompanyId`.                                                                                              | Preserve historical reporting by backfilling to Company.                                                                                 |
| `Contract.vendorId`             | Commercial contract vendor or provider.                   | `Contract.vendorCompanyId`.                                                                                                    | Backfill to Company with `VENDOR`; commercial contracts remain separate from purchasing vehicles.                                        |
| `Contract.resellerId`           | Commercial contract seller or reseller.                   | `Contract.sellerCompanyId`.                                                                                                    | Backfill to Company. Do not convert this to a purchasing vehicle.                                                                        |
| `Product.vendorId`              | Catalog owner, publisher, developer, or provider.         | `Product.vendorCompanyId`.                                                                                                     | Backfill as required Company with `VENDOR`. Product names remain unique within vendor.                                                   |
| `Product.resellerId`            | Incorrect seller stored on catalog product.               | `ProductSeller.sellerCompanyId`.                                                                                               | Create one `ProductSeller` row for each populated old reseller value, then remove the catalog reseller field in a later migration.       |
| `PurchaseRequest.vendorId`      | Requested vendor or provider.                             | `PurchaseRequest.vendorCompanyId`, or derived from requested product.                                                          | Preserve request context. Do not create `Purchase` unless the request is approved or committed.                                          |
| `PurchaseRequest.resellerId`    | Requested seller or channel.                              | `PurchaseRequest.sellerCompanyId`.                                                                                             | Preserve requested seller and validate the seller role for new records.                                                                  |
| `Invoice.vendorId`              | Billing vendor context.                                   | Prefer `Invoice.purchaseId`; keep `Invoice.vendorCompanyId` as historical fallback.                                            | Backfill Company FK. Link to `Purchase` only where legacy data is unambiguous.                                                           |
| `Invoice.resellerId`            | Billing seller context.                                   | Prefer `Purchase.sellerCompanyId`; fallback `Invoice.sellerCompanyId`.                                                         | Backfill Company FK and avoid duplicating seller facts where an invoice links to a purchase.                                             |
| `Document.vendorId`             | Document vendor context.                                  | `Document.companyId`, plus optional product, purchase, contract, request, invoice, or payment links.                           | Backfill to Company and keep document context explicit.                                                                                  |
| `Document.resellerId`           | Document reseller or seller context.                      | `Document.companyId`, plus optional purchase or seller context.                                                                | Backfill to Company. Support seller documents without a separate Reseller model.                                                         |
| `Note.vendorId`                 | Note about a vendor.                                      | `Note.companyId`.                                                                                                              | Backfill to Company.                                                                                                                     |
| `Note.resellerId`               | Note about a reseller.                                    | `Note.companyId`.                                                                                                              | Backfill to Company.                                                                                                                     |

## Lifecycle Boundaries

- `PurchaseRequest` is the pre-commit request workflow. It tracks draft,
  submitted, review, approval, rejection, ordered, and canceled states. It is
  not the acquired asset, service, or committed purchase.
- `ProcurementStatus` is a reusable operational status for procurement work on
  requests, renewals, and related planning records. It is not the purchase
  header lifecycle.
- `Purchase` is created only for an approved, ordered, committed, or completed
  acquisition. It may link to a request, commercial contract, purchasing
  vehicle, invoices, payments, and budget allocations, but it does not duplicate
  request approval workflow.
- `Invoice` is a payable document received against a purchase, contract,
  renewal, or legacy context. It records billing obligation, not budget
  approval.
- `Payment` tracks cash movement against an invoice or legacy payable context.

## Migration Phases

1. Add new Company, catalog, seller, purchasing, deployment, usage, and
   allocation tables, plus transitional nullable Company FKs on existing
   records.
2. Backfill `Company` from existing `Vendor` and `Reseller` names. If names
   overlap, create one Company and attach multiple roles.
3. Backfill all transitional Company FKs and create `ProductSeller` rows from
   old product reseller values.
4. Backfill purchasing vehicles, purchases, purchase items, capabilities,
   deployment waves, usage history, and budget allocations from seed/static
   records where the relationship is unambiguous.
5. Run parity validation queries comparing old FK counts with new Company FK
   counts.
6. Switch application reads and writes to Company/catalog/purchase services.
7. Remove old `Vendor` and `Reseller` relations and models only in a follow-up
   migration after parity is proven.

## Transitional Parity Checks

Run these checks against a reviewed development database before removing legacy
models:

- Every non-null old `vendorId` has a non-null matching `vendorCompanyId`.
- Every non-null old `resellerId` has a non-null matching `sellerCompanyId`.
- Every old product `resellerId` produced a `ProductSeller` row.
- Every new seller company has at least one of `VENDOR`, `RESELLER`, or
  `SERVICE_PROVIDER`.
- Every feature with a module has a module belonging to the selected product.
- Every purchase total equals the sum of its line-item totals.
- Every budget allocation amount is nonnegative and does not silently imply a
  one-purchase-to-one-budget-item relationship.
