# Contract Source Of Truth And Renewal Snapshots

## Status

Accepted.

## Context

The Contracts workspace was still a static local-state Phase 3 surface while
Maintenance Renewals had become the database-backed operational renewal module.
Contract pricing also used one header-level product/service field, which could
not represent multiple priced products, Product Components, quantities, license
metrics, or quote/SOW line pricing.

## Decision

Contracts are the source of truth for the current commercial term. Contract
headers continue to keep stored annual and total values for reporting and
migration compatibility, but the contract service synchronizes those values
from `ContractLineItem` records whenever line pricing changes.

Maintenance Renewals manage the next-term operational process. Creating a
renewal from a contract is an explicit user action, not an automatic side
effect of saving a contract. The service copies contract header values and
renewable contract lines into `MaintenanceRenewal` and
`MaintenanceRenewalLineItem` snapshot records. Renewal line items can track
proposed quantities, quote amounts, negotiated amounts, final amounts, and a
small action enum without editing the current contract.

Completed or approved renewals can create a new Contract term that references
the prior term through `previousContractId`. The prior contract and its line
items remain unchanged; the old term is marked expired when the new term is
created.

## Consequences

- Contract pricing is table-first and product/component-aware without adding a
  pricing engine, entitlement model, clause model, or workflow engine.
- Renewals can compare current and proposed line pricing while preserving the
  current commercial baseline.
- Contract history is represented as linked terms instead of overwriting one
  contract record.
- Authorization, document upload, OCR, legal clause management, automated
  schedulers, and AI remain deferred.
