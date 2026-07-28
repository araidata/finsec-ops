# Phase 7 Documents and Audit Trail

## Decision

Phase 7 introduces a dedicated `/documents` workspace backed by the existing
Prisma `Document` and `ActivityLog` models. Documents are typed records with a
title, description, durable URL, and a link to a contract, maintenance renewal,
company, or product. Create and delete operations write ActivityLog entries in
the same transaction as the document mutation.

The workspace also exposes a shared, read-only audit timeline for recent
ActivityLog records. Existing renewal history remains available in its focused
workspace, while document lifecycle events are now visible globally.

## Storage boundary

The application stores external document URLs rather than binary content. This
keeps the provider boundary portable and avoids pretending that an ephemeral
local filesystem or an unauthenticated Vercel runtime is durable storage. A
future managed storage implementation must be reviewed alongside authentication,
authorization, retention, access checks, and deletion semantics before adding
file upload or preview behavior.

## Consequences

- Finance and security leaders have one place to find linked evidence.
- Document mutations are auditable without coupling the UI to a storage vendor.
- Managed upload, previews, retention, and access control remain explicit future
  work rather than hidden assumptions.
