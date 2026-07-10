# Product Catalog Reseller Role UX

## Status

Accepted.

## Context

The database-backed Product Catalog initially exposed companies, products,
modules, seller relationships, purchasing vehicles, and agreements as peer CRUD
tables. That made it difficult to understand the relationship between a vendor,
the vendor's products, and the products' modules. It also implied that
resellers must be permanently associated to specific catalog products before
they can be used in budget planning.

Budget entry needs a different model: companies such as SHI, Presidio,
Carahsoft, and CDW-G should be identified once as resellers and then selected
transactionally on budget or renewal rows when a purchase uses that channel.

## Decision

- The Product Catalog UI is organized around vendor-owned products, modules,
  and features.
- Companies remain the reusable master-data record for vendors, resellers,
  service providers, implementation partners, and consultants.
- Reseller selection in the budget workspace is sourced from active `Company`
  records with the `RESELLER` role.
- `ProductSeller` and purchasing vehicle eligibility remain available as
  optional purchasing metadata, but they are not required for normal budget
  reseller selection.
- Catalog create and edit flows use contextual editor panels instead of a
  left-form/right-table CRUD layout.

## Consequences

- Resellers can be managed once in the catalog and reused across budget rows
  without product-specific seller setup.
- Vendor/product/module editing is easier because creation actions are scoped
  to the selected vendor or parent product.
- Purchasing eligibility can still support constrained agreement scenarios
  without driving the main catalog or budget UX.
