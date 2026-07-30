# Engineering Documentation

This index is the authoritative map for finsec-ops documentation. Each topic has
one primary owner; other documents link to it rather than duplicating it.

## Start here

| Audience                          | Reading path                                                                                                                              |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Product and technology leadership | [Product overview](product-overview.md), [Architecture](architecture.md), [Production readiness](production-readiness.md)                 |
| New developer                     | Repository [README](../README.md), [Codebase map](codebase-map.md), [Development](development.md), then the relevant [module](modules.md) |
| AI development agent              | [AGENTS.md](../AGENTS.md), this index, then task-relevant code and documents                                                              |
| Data engineer or reviewer         | [Data model](data-model.md), [Database and migrations](database-and-migrations.md), [ADRs](../architecture/decisions/README.md)           |
| Release or operations owner       | [Deployment](deployment.md), [Operations](operations.md), [Security](security.md)                                                         |
| Test engineer                     | [Testing](testing.md), [Modules](modules.md), [Production readiness](production-readiness.md)                                             |

## Authoritative documents

| Document                                                     | Purpose and audience                                                                  | Authority                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ---------------------------- |
| [Product overview](product-overview.md)                      | Mission, users, capabilities, boundaries, terminology                                 | Product scope and vocabulary |
| [Architecture](architecture.md)                              | Context, runtime and logical design, data flows, trust boundaries, quality principles | System architecture          |
| [Codebase map](codebase-map.md)                              | Directory ownership and extension patterns                                            | Source organization          |
| [Modules](modules.md)                                        | Workflows, records, source-of-truth rules, dependencies, limitations                  | Functional module behavior   |
| [Data model](data-model.md)                                  | Domain-oriented Prisma model and transition guide                                     | Persistent data concepts     |
| [Development](development.md)                                | Local setup and developer workflow                                                    | Local engineering process    |
| [Database and migrations](database-and-migrations.md)        | Connection, migration, seed, backfill, and preservation rules                         | Database operations          |
| [Testing](testing.md)                                        | Test layers, commands, coverage, and module expectations                              | Verification strategy        |
| [Deployment](deployment.md)                                  | Vercel/Neon release sequence, configuration, verification, and rollback               | Release process              |
| [Security](security.md)                                      | Implemented controls, required boundaries, blockers, and enhancements                 | Security posture             |
| [Operations](operations.md)                                  | Verification, triage, recovery, monitoring, and maintenance                           | Operational ownership        |
| [Production readiness](production-readiness.md)              | Evidence-based gaps and acceptance criteria                                           | Production gate              |
| [Performance hardening](performance-production-hardening.md) | Repository-wide performance audit, measurable targets, and phased execution plan      | Performance plan and gates   |
| [Active backlog](../TODO.md)                                 | Concise unresolved work queue                                                         | Work prioritization          |
| [Contributing](../CONTRIBUTING.md)                           | Branch, review, validation, data, and definition-of-done expectations                 | Contribution process         |
| [ADRs](../architecture/decisions/README.md)                  | Durable architectural decisions and their status                                      | Decision history             |

## Documentation rules

- Source code, Prisma schema, and committed migrations are the ultimate evidence
  for implemented behavior.
- README is an entry point, not a status report or changelog.
- Git history records completed work.
- `TODO.md` contains only unresolved work.
- Present-tense statements describe verified implementation. Requirements and
  future work are explicitly labeled.
- When a topic changes, update its authoritative document and links rather than
  copying the same explanation elsewhere.
