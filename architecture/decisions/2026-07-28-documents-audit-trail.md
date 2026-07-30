# Documents and Audit Trail

## Status

Accepted

## Context

Financial and commercial workflows need linked evidence and a shared view of
important changes, but the application has no approved object-storage or
identity boundary.

## Decision

`/documents` uses the existing `Document` and `ActivityLog` models. A Document
is typed metadata with description, external storage reference, and a link to a
supported business entity. Create and delete operations write Activity Log
entries in the same transaction as the metadata mutation.

The workspace exposes a read-only timeline of recent Activity Log records.
Module-specific histories may remain available in their owning workspaces.

The application does not store binary content. Binary upload or preview requires
approved authentication, authorization, private object storage, malware
scanning, retention, access, recovery, and audit controls.

## Consequences

- Linked evidence metadata is provider-portable.
- Document mutation and its event succeed or fail together.
- `ActivityLog` remains only partially populated until a complete audit policy
  is implemented.
- A stored external URL must not be represented as secure file storage by
  itself.
