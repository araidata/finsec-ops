# Claude Repository Instructions

Follow [AGENTS.md](AGENTS.md) as the authoritative AI development policy for
this repository.

Before changing code:

1. Read [README.md](README.md) and [docs/index.md](docs/index.md).
2. Inspect the relevant implementation, tests, Prisma models, and active
   architecture decisions.
3. Read only the task-relevant deeper documentation.
4. Preserve unrelated worktree changes and authoritative data.

finsec-ops is a Technology Financial Operations platform with cybersecurity as
its initial configured domain. Preserve the existing application shell, Budget
worksheet structure, Maintenance Renewals register, and module boundaries. Do
not expand it into ERP, accounting, GRC, ticketing, project management, asset
management, vulnerability management, or full procurement execution.

Non-negotiable requirements:

- Use strict TypeScript and keep business logic outside presentation
  components.
- Preserve route, server-action, service, validation, and Prisma boundaries.
- Use narrow serializable DTOs and bounded server-side queries.
- Validate every mutation on the server and use transactions for multi-record
  invariants.
- Never reset, destructively reseed, or casually migrate shared or
  production-like data.
- Preserve historical financial and operational records.
- Treat authentication, authorization, document storage, and production
  observability as unimplemented until verified in code.
- Run risk-appropriate validation and update the authoritative documentation.
- Keep `TODO.md` limited to unresolved work; use Git history for completed work.

Database changes require reading
[docs/database-and-migrations.md](docs/database-and-migrations.md). Security
work requires reading [docs/security.md](docs/security.md). Full implementation
and documentation rules remain in [AGENTS.md](AGENTS.md).
