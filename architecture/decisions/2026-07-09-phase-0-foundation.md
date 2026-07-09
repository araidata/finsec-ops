# 2026-07-09 Phase 0 Foundation Decisions

## Decision: Use Next.js App Router

Reason: App Router is the current Next.js default and fits Vercel deployment,
server components, and future route organization.

Alternatives considered: Pages Router. It was rejected because this is a new
application with no legacy routing constraints.

## Decision: Use npm

Reason: The repository had no package manager metadata, and the Phase 0 plan
selected npm as the default.

Alternatives considered: pnpm, yarn, bun. They can be revisited later if the
team standardizes differently.

## Decision: Use shadcn/ui with Tailwind CSS

Reason: The project needs a reusable enterprise design system from the start
while keeping components locally owned and customizable.

Alternatives considered: fully custom components or a closed component library.
shadcn/ui offers better local control and long-term portability.

## Decision: Defer Prisma schema and migrations

Reason: The initial domain model must be reviewed before implementation.
Installing Prisma now establishes the boundary without prematurely committing
to table shapes.

Alternatives considered: generating an initial schema immediately. Rejected to
avoid locking in unreviewed entities.

## Decision: Target PostgreSQL portability

Reason: Neon PostgreSQL is the initial database path, but the application may
later migrate to internal AWS infrastructure.

Alternatives considered: Vercel-only storage services. Rejected for core system
of record data because portability is a project requirement.

## Decision: Use a dark cybersecurity financial operations visual language

Reason: The product should feel like enterprise cybersecurity operations, not a
generic accounting package. The approved direction uses near-black backgrounds,
navy/graphite panels, and restrained cyan, teal, blue, amber, green, and red
operational accents.

Alternatives considered: lighter SaaS dashboard styling and generic finance UI.
Rejected because they would undercut the cybersecurity leadership audience.
