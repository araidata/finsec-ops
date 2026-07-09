# Claude Instructions for finsec-ops

finsec-ops is a long-lived enterprise web application for cybersecurity
financial operations. Prioritize maintainability, clarity, production-quality
code, and strict scope discipline.

Always start by reading:

- `README.md`
- `TODO.md`

Then confirm the active phase. Work only in the current phase unless the user
explicitly changes scope.

Keep the product focused on cybersecurity budgets, budget planning, multi-year
forecasting, vendors, resellers, contracts, products, purchased product modules,
renewals, procurement lifecycle, financial reporting, and executive reporting.
Avoid GRC, ERP, accounting, ticketing, vulnerability management, asset inventory,
and project management expansion.

Engineering expectations:

- Strict TypeScript.
- Strong typing.
- Small reusable components.
- Business logic outside UI.
- Modular services.
- Interchangeable providers.
- Clean separation of UI, services, providers, database, and utilities.
- Minimal dependencies.
- Readability over cleverness.

Documentation expectations:

- `README.md` is the primary source of truth.
- Update docs when architecture, folder structure, data model, technology
  decisions, development workflow, deployment, or testing changes.
- Keep `TODO.md` limited to active work.
- Record significant architecture decisions in `architecture/decisions`.

Current Phase 0 restriction:

The application shell is static visual foundation work only. Do not implement
authentication, database models, migrations, CRUD, financial calculations, AI,
notifications, or real procurement workflows.
