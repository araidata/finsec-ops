# Product Overview

## Purpose

finsec-ops is a Technology Financial Operations platform. It gives technology
leaders, finance partners, and operational owners a connected view of planned
spend, commercial commitments, renewal decisions, product scope, deployment,
utilization, documents, and audit-oriented history.

Cybersecurity and departmental technology finance are the initial configured
domain. The underlying concepts—Department, Fiscal Year, budget, contract,
catalog, renewal, deployment, and ownership—support future expansion into
broader IT financial operations without collapsing module boundaries.

## Primary users

- Technology and cybersecurity executives reviewing financial position,
  renewal exposure, deployment progress, and reporting completeness
- Budget and finance owners maintaining annual plans and supporting schedules
- Contract and vendor managers maintaining commercial terms and product pricing
- Renewal owners coordinating commercial parties, amounts, product scope,
  ownership, status, comments, and operational follow-through
- Product and service owners maintaining portfolio taxonomy and deployment data
- Administrators maintaining shared reference data

The application does not currently identify or authorize these personas. They
are domain roles; authentication and permissions remain production
requirements.

## Business outcomes

The application is designed to:

- establish traceable sources of truth for annual financial plans and
  commercial commitments;
- connect contracts and renewal decisions to budget and deployment context;
- preserve prior terms and time-based utilization instead of overwriting
  history;
- distinguish vendors from selling intermediaries and products from commercial
  components and operational Functions;
- support Department- and Fiscal-Year-oriented reporting; and
- expose missing ownership or categorization that reduces reporting quality.

## Current capabilities

The implemented modules are Dashboard, Budget, Contracts, Maintenance Renewals,
Product Catalog, Deployment, Documents and Audit Trail, and Settings. Shared
Department and Fiscal Year selectors apply URL context to the modules that
support those dimensions. The active product workflows are described in
[Modules](modules.md).

The Prisma schema also contains purchase, invoice, payment, procurement request,
legacy renewal, and compatibility records. These do not constitute a supported
end-to-end procurement or accounting product. `/purchases` redirects to
`/contracts`.

## Boundaries

finsec-ops is not:

- an ERP, general ledger, invoicing, or payment-reconciliation system;
- a full sourcing or procurement execution platform;
- a GRC, vulnerability, ticketing, project-management, or asset-management
  system;
- a document repository or records-management platform; or
- an identity provider or authorization service.

New work must strengthen the Technology Financial Operations mission and
maintain explicit integration boundaries with systems that own those concerns.

## Terminology

| Term                            | Meaning                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Technology Financial Operations | Planning and operational control of technology spend, commitments, renewals, and realized use        |
| Department                      | Reporting and ownership scope applied to financial and operational records                           |
| Fiscal Year                     | Configurable reporting period; not assumed to match the calendar year                                |
| Vendor                          | Company that owns or provides a product or service                                                   |
| Reseller                        | Company that sells another company's offering                                                        |
| Product                         | Vendor-owned commercial or service offering                                                          |
| Product Component               | Purchasable or licensable part of a Product; stored as `ProductModule` during the current transition |
| Capability                      | Reusable outcome or competency delivered by products, components, or Functions                       |
| Function                        | Operational behavior or feature; stored as `ProductFeature`                                          |
| Contract line item              | Pricing and product-scope source of truth within a Contract                                          |
| Maintenance Renewal             | Operational case for a renewal decision and its follow-through                                       |
| Renewal line item               | Snapshot of current contract product scope plus proposed renewal terms                               |
| Deployment                      | Scoped implementation or use record linked to an authoritative commercial line where available       |
| Document                        | Metadata and external location reference; no binary storage exists                                   |
| Activity Log                    | Audit-oriented event record; current coverage is partial                                             |

Use “Maintenance Renewals” for the active operational module and `Renewal` only
when discussing the separate compatibility model.
