# Renewal-scoped deployments

## Status

Accepted

## Decision

Maintenance Renewals are the source of truth for new Deployment eligibility.
A Maintenance Renewal may contain multiple Product Catalog-backed line items,
and each line item may have multiple Deployment scopes.

The user flow is Department, Vendor, Maintenance Renewal, Product, then Scope.
Deployment stores nullable links to both the renewal and its line item. New
records require the renewal-line link. Existing contract-linked records remain
readable and editable as compatibility records, but they are not offered as a
new-record source.

## Rationale

This keeps deployment planning aligned with the department's maintained
financial renewal register, avoids offering products that are not part of the
department's renewed portfolio, and preserves traceability for multi-product
renewals and phased deployments.

## Consequences

- Maintenance Renewals needs an editable product-line section.
- Deployment selectors must cascade from department to vendor to renewal to
  product line.
- Historical deployments do not receive guessed renewal associations.
- Future reporting can compare renewed products with deployment coverage.
