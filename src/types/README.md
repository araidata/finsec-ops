# Shared Types

This directory contains domain and view-model types shared by multiple modules.
Prefer colocating a type with its owning feature when it is not broadly reused.

Types do not replace runtime validation. Server boundaries validate untrusted
input with Zod, and browser DTOs must be explicit and serializable. Prisma model
types and large relational result graphs must not be exposed directly to Client
Components.

See [`docs/codebase-map.md`](../../docs/codebase-map.md) and
[`docs/architecture.md`](../../docs/architecture.md).
