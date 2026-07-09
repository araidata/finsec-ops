# Agent Instructions for finsec-ops

finsec-ops is a cybersecurity financial operations platform for CISOs and
cybersecurity leadership. Keep the product focused on cybersecurity budgets,
planning, forecasting, vendors, resellers, contracts, products, modules,
renewals, procurement lifecycle, financial reporting, and executive reporting.

Before making changes:

- Read `README.md`.
- Read `TODO.md`.
- Confirm the current development phase.
- Work only within the current phase unless explicitly instructed otherwise.
- Update documentation whenever architecture, folder structure, data model,
  technology decisions, development workflow, deployment, or testing changes.
- Update `TODO.md` after meaningful work is completed.
- Record significant architecture decisions under `architecture/decisions`.

Engineering standards:

- Use strict TypeScript and strong types.
- Prefer small reusable components and modular services.
- Keep business logic out of React components.
- Separate UI, services, providers, database, and utilities.
- Keep provider boundaries interchangeable.
- Prefer composition over duplication.
- Add minimal dependencies.
- Favor readability and maintainability over cleverness.

Avoid:

- Scope creep beyond cybersecurity financial operations.
- Premature optimization.
- Hidden assumptions.
- Vendor lock-in when a portable design is practical.
- Over-engineering.
- Implementing database models before the data model is reviewed.

Phase 0 constraint:

The current foundation shell is static visual UI only. Do not add
authentication, CRUD, Prisma models, migrations, financial calculations, AI,
notifications, or real procurement workflows unless the active phase changes.
