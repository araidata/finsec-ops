# GitHub Copilot Instructions

Use `AGENTS.md` as the authoritative engineering policy and `docs/index.md` as
the documentation map. Inspect the relevant implementation and Prisma
relationships before suggesting substantial changes.

finsec-ops is a Technology Financial Operations platform initially configured
for cybersecurity. Keep suggestions within Dashboard, Budget, Contracts,
Maintenance Renewals, Product Catalog, Deployment, Documents, Settings, and
their financial and operational boundaries. Do not redirect the product into
ERP, accounting, GRC, ticketing, project management, vulnerability management,
asset management, or full procurement execution.

- Use strict TypeScript and narrow serializable types.
- Keep persistence and business rules out of React presentation components.
- Preserve page/action/service/validation/Prisma separation.
- Use bounded server-side reads and transactions for multi-record invariants.
- Preserve historical records and inactive referenced values.
- Never recommend database reset or destructive seed for shared or
  production-like data.
- Do not imply authentication, authorization, secure file storage, complete
  audit, or production observability exists.
- Prefer established patterns and minimal dependencies.
- Update topic-owner documentation and ADRs for material decisions.
- Keep `TODO.md` limited to unresolved work; do not generate status history.
