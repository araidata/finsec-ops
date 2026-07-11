# Product Catalog Taxonomy Redesign

## Status

Accepted.

## Context

The database-backed Product Catalog exposed companies, products, modules,
features, product-seller relationships, purchasing vehicles, and purchasing
agreements in one relationship-heavy workspace. It also treated functional
areas such as SIEM, SOAR, and XDR as modules, which confused commercial
structure with capability reporting.

Future spend analysis needs separate concepts for what is purchased, what
security outcomes are covered, what operational functions are performed, and
which transactional records carry reseller, contract, quote, renewal, and cost
facts.

## Decision

- Product Catalog has exactly two primary visible tabs: Vendors and Resellers.
- Companies and `CompanyRole` remain internal master data; they are not a
  primary catalog tab.
- Vendor-owned Products contain optional Product Components. Components are
  commercial items such as add-ons, support packages, capacity tiers, retention
  tiers, services, training, hardware, or separately renewable items.
- SIEM, SOAR, XDR, MDR, DLP, and similar classifications are Capabilities, not
  Product Components.
- Functions represent operational activities and can belong directly to a
  Product or to a Product Component. A Function can reference one related
  Capability.
- Purchasing eligibility, product-seller relationships, purchasing vehicles,
  and purchasing agreements are removed from the Product Catalog UI and retained
  for transactional Purchases and future contract/procurement workflows.
- Existing `ProductModule` and `ProductFeature` table names are preserved for
  migration safety while the UI, docs, actions, and validation use Product
  Component and Function terminology.

## Consequences

- The catalog supports future spend by vendor, product, component, capability,
  reseller, and contract without requiring manual reseller-to-product mappings.
- Actual cost remains authoritative on transactional purchase records.
  Product and Product Component catalog records may hold planning estimates but
  must not drive spend reporting.
- Capability allocation metadata is prepared so future reporting can allocate a
  purchase line across capabilities without double-counting total spend.
