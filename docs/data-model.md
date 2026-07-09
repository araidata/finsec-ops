# Data Model

The entities below are documented for review only. Do not create Prisma models
or migrations until Phase 1 Database Architecture approves the model.

## Entities

- Fiscal Year: planning period for budgets, forecasts, renewals, invoices, and
  reports.
- Budget Category: governed category for grouping cybersecurity spend.
- Budget Line Item: planned or forecasted spend entry within a fiscal year and
  category.
- Vendor: company providing a product or service.
- Reseller: intermediary selling or managing a vendor relationship.
- Contract: commercial agreement with vendor or reseller terms.
- Product: purchased security product or service.
- Product Module: separately tracked module, entitlement, tier, or capability
  within a product.
- Renewal: future contract or subscription renewal event.
- Purchase Request: procurement request for new spend or change in spend.
- Invoice: vendor or reseller invoice associated with a contract or purchase.
- Payment: payment record associated with an invoice.
- Document: file or external document reference tied to a financial operation.
- Activity Log: audit-oriented record of meaningful system or user activity.
- User: application user participating in planning or review.
- Note: human-authored context attached to a relevant entity.

## Relationship Draft

- A fiscal year has many budget categories, budget line items, forecasts,
  renewals, invoices, and reports.
- A budget category has many budget line items.
- A budget line item may relate to a vendor, reseller, contract, product,
  product module, purchase request, renewal, invoice, or payment.
- A vendor can have many products and contracts.
- A reseller can be associated with many vendors and contracts.
- A contract can cover one vendor, optionally one reseller, and many products or
  modules.
- A product can have many product modules.
- A renewal is typically associated with a contract and may reference products
  or modules.
- A purchase request may become or update a contract, renewal, invoice, or
  budget line item.
- An invoice may be associated with a vendor, reseller, contract, purchase
  request, and one or more payments.
- Documents, notes, and activity log entries may attach to core operational
  entities.

## Review Questions for Phase 1

- Which entities need tenant or organization boundaries?
- Which monetary fields require currency and precision rules?
- Which relationships require history instead of direct overwrite?
- Which fields should be governed enums versus user-managed labels?
- What audit events are mandatory for executive reporting?
