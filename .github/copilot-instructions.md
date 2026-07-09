# GitHub Copilot Instructions for finsec-ops

finsec-ops is a cybersecurity financial operations platform for CISOs and
security leadership. Keep suggestions scoped to budgets, planning, forecasting,
vendors, resellers, contracts, products, product modules, renewals, procurement
lifecycle, financial reporting, and executive reporting.

Before suggesting substantial changes, account for:

- `README.md` as the primary source of truth.
- `TODO.md` as the active work list.
- The current development phase.
- Existing architecture decisions in `architecture/decisions`.

Code guidance:

- Use strict TypeScript.
- Prefer small reusable components.
- Keep business logic outside React components.
- Separate UI, services, providers, database, and utilities.
- Keep providers interchangeable and portable.
- Prefer composition over duplication.
- Use minimal dependencies.
- Favor readable, maintainable, production-quality code.

Documentation guidance:

- Update README and relevant docs when architecture, folder structure, data
  model, technology decisions, development workflow, deployment, or testing
  strategy changes.
- Keep TODO.md focused on active work only.
- Record significant architecture decisions.

Phase 0 restriction:

Do not suggest authentication, CRUD pages, Prisma models, migrations, financial
calculations, AI functionality, notifications, or real business workflows unless
the phase changes or the user explicitly requests it.
