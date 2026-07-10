# Data Model

Phase 1 defined the initial Prisma model for the core cybersecurity financial
operations domain. Phase 4.5 expands the budget model into a Finance-oriented
planning structure for fiscal-year budget plans, configurable account rollups,
annual financial records, maintenance renewals, and savings records.

## Model Scope

Implemented entities:

- Fiscal Year: planning period for budget plans, forecasts, renewals, purchase
  requests, invoices, and payments.
- Budget Plan: parent fiscal-year financial workspace with status, version,
  planning owner, assumptions, and executive narrative.
- Budget Scenario: version label such as Initial Request, Recommended,
  Submitted, or Final Approved without overwriting other versions.
- Budget Account: configurable Finance account code and name used by rollups.
- Budget Item: continuing logical portfolio item such as OneTrust across years.
- Budget Annual Financial: fiscal-year and scenario-specific financial record
  for prior approved, current approved, proposed, approved, forecast, actual,
  savings, cost avoidance, and worksheet classification.
- Maintenance Renewal: renewal worksheet record that can feed an upcoming
  budget annual amount through an explicit link.
- Savings Record: budget reduction or cost avoidance classification.
- Budget Category: fiscal-year-specific category for grouping cybersecurity
  spend.
- Budget Line Item: approved, forecasted, committed, and actual spend entry
  within a fiscal year and category.
- Vendor: company that makes or owns a cybersecurity product or service.
- Reseller: company the public-sector entity buys through.
- Contract: commercial agreement that may reference both a vendor and a
  reseller.
- Product: cybersecurity product or service owned by a vendor.
- Product Module: tracked module, entitlement, tier, or capability within a
  product.
- Renewal: future contract or subscription renewal event.
- Purchase Request: procurement request for new spend, expansion, renewal, or
  true-up.
- Invoice: invoice tied to a fiscal year and optionally to contract, renewal,
  purchase request, vendor, or reseller.
- Payment: payment record tied to a fiscal year and optionally to invoice,
  contract, renewal, or purchase request.
- Document: external document reference attachable to vendors, resellers,
  contracts, renewals, purchase requests, invoices, products, and modules.
- Activity Log: audit-oriented record for create, update, delete, status,
  amount, and owner changes.
- User: lightweight user record for owners, uploaders, note authors, and audit
  actors. Authentication is not implemented.
- Note: human-authored context attachable to key financial operations entities.

## Relationship Rules

- Vendors and resellers are separate first-class entities.
- A vendor is the company that makes or owns the product.
- A reseller is the company the public-sector entity buys through.
- A contract may have both a vendor and a reseller.
- A product belongs to one vendor.
- A product can have many product modules.
- A contract can cover many products and many product modules.
- A renewal belongs to one contract and one fiscal year.
- Budget annual financial records belong to one logical budget item, one
  scenario, one budget plan, one fiscal year, and one configurable account.
- Supporting schedules feed Finance Summary account rollups automatically.
- Maintenance renewals can link to a budget annual financial record so renewal
  quotes and negotiated costs can feed proposed budget amounts without duplicate
  entry.
- Budget line items may fund contracts, products, modules, renewals, or
  purchase requests through nullable relationships in the legacy Phase 1 model.
- Invoices and payments may tie back to contracts, renewals, or purchase
  requests.
- Documents use nullable relationships for the supported attachment targets.
- Activity logs use `entityType` and `entityId` for a portable audit trail
  instead of forcing a large set of audit-specific foreign keys.

## Enums

Implemented governed enums:

- `BudgetStatus`
- `ExpenseType`
- `FundingType`
- `ContractStatus`
- `RenewalStage`
- `RenewalStatus`
- `PurchaseRequestStatus`
- `InvoiceStatus`
- `PaymentStatus`
- `DocumentType`
- `ActivityAction`

Phase 2 through 4 added governed enum coverage for:

- Budget funding status values matching planned, requested, approved, partially
  approved, deferred, rejected, and unfunded states.
- Budget expense types that separate purchase type from security program area.
- Contract type, payment frequency, and renewal risk.
- Product category, capability category, deployment status, strategic value,
  criticality, and module adoption.

Phase 4.5 adds governed enum coverage for budget plan status, budget scenario
labels, worksheet type, budget funding status, row review state, recurring
classification, maintenance renewal status, procurement status, and savings
type.

## Phase 4.5 Budget Planning Model

Budget Plan is the parent financial workspace because Finance review happens at
the fiscal-year plan level, not at individual product or contract level.
Logical Budget Items preserve continuity across fiscal years, while Budget
Annual Financial records preserve year-specific approved, proposed, actual,
variance, savings, and cost avoidance values.

Budget Accounts are configurable records seeded with the initial government
Finance account codes. They are not hard-coded as the only valid accounts.
Supporting worksheets reference these accounts and the Finance Summary rollup is
calculated from the detail rows.

Maintenance Renewals are first-class records because renewal planning controls a
large share of cybersecurity operating spend. A renewal can link to the annual
financial record that carries its proposed amount into the upcoming fiscal-year
budget.

## Phase 2-4 Model Extensions

Budget line items now support optional vendor and reseller links, a product or
service label, budgeted amount, business justification, risk if not funded, and
notes text. `BudgetCategory` remains the fiscal-year-specific security program
or cost center grouping, while `ExpenseType` represents the purchase or spend
type.

Contracts now support contract type, associated product or service, renewal
date, auto-renewal, notice period, annual value, payment frequency,
business/security/procurement ownership fields, vendor and reseller account
manager fields, renewal risk, renewal strategy, and notes text.

Products now support optional reseller association, broad product category,
specific capability category, deployment status, business/technical/security
owners, primary use case, strategic value, criticality, annual cost, and notes
text. Existing many-to-many contract relationships and budget line item links
remain the practical association points for contracts and budgets.

Product modules now support capability category, enabled state, adoption level,
license count, used count, module cost, owner, and notes text. Modules still
belong to one product.

## Monetary Fields

Money fields use Prisma `Decimal` with PostgreSQL `Decimal(14, 2)` precision
and a `currencyCode` string defaulting to `USD`. TypeScript sample data and
calculation helpers use integer cents. The initial schema does not implement
multi-currency conversion.

## Attachments And Notes

Documents and notes are modeled as first-class records with nullable foreign
keys to supported entities. This keeps Phase 1 simple and queryable without
adding a generic attachment framework or document upload workflow.

## Deferred Questions

- Tenant or organization boundaries are deferred until authentication and
  authorization design.
- Detailed accounting concepts such as GL accounts, cost centers, journal
  entries, and payment reconciliation are out of scope.
- Database migrations should be created only after the Phase 4.5 schema is
  reviewed against the target Vercel-managed Neon database.
