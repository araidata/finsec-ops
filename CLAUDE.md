# Claude Repository Instructions

Follow [AGENTS.md](AGENTS.md) as the authoritative AI development policy for
this repository.

Before changing code:

1. Read [README.md](README.md) and [docs/index.md](docs/index.md).
2. Inspect the relevant implementation, tests, Prisma models, and active
   architecture decisions.
3. Read only the task-relevant deeper documentation.
4. Preserve unrelated worktree changes and authoritative data.

## Context and Token Discipline

- Remove irrelevant context to optimize tokens; never sacrifice analysis,
  completeness, implementation quality, correctness, security, maintainability,
  reasoning quality, or verification.
- Use progressive disclosure: begin with the smallest relevant paths, symbols,
  diffs, call sites, documentation sections, and tests; expand only when
  evidence is insufficient.
- Prefer scoped `rg` and focused ranges. Avoid broad scans, recursive dumps, or
  full reads when narrower inspection suffices. Reuse findings; do not reread
  unchanged files or restate them.
- For noisy commands, capture complete output and exit status; inspect scoped
  matches or bounded head/tail; narrow before displaying more. Exclude complete
  logs, generated/minified files, lockfiles, large JSON, database exports, and
  full test output unless necessary.
- Use focused tests, linting, and type checks while iterating; match final
  validation to risk and scope. Never skip a necessary check to save tokens.
- Use subagents when isolated or parallel work materially protects main
  context or improves quality. Give a narrow objective; require concise
  findings, evidence, files, validation, and unresolved risks—not raw output.
- Keep plans, updates, and final reports proportional and nonrepetitive.
  Report outcome, files changed, validation, and uncertainty.
- Keep root instructions a durable map; put specialized guidance in
  authoritative or path-scoped documentation. Quality, correctness, security,
  and verification take precedence over efficiency.

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
- Update authoritative documentation when behavior or engineering practice
  changes.
- Keep `TODO.md` limited to unresolved work; use Git history for completed work.

Database changes require reading
[docs/database-and-migrations.md](docs/database-and-migrations.md). Security
work requires reading [docs/security.md](docs/security.md). Full implementation
and documentation rules remain in [AGENTS.md](AGENTS.md).
