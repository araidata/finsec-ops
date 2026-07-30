# Security

## Current posture

finsec-ops stores financial plans, commercial terms, ownership information,
document metadata, and operational history. The repository is not
production-secure because it has no authentication or authorization. Any user
who can reach the application can invoke reads, writes, Settings changes, and
administrative operations.

Implemented controls are limited and must not be overstated:

- Prisma access is confined to server-side modules.
- Many mutations use Zod and server-side relationship validation.
- Multi-record invariants use transactions in key services.
- Environment files are ignored by Git.
- Document metadata and selected Renewal/Department changes create activity
  events.
- The ORM parameterizes normal database operations.

There is no implemented identity, permission enforcement, session policy, CSRF
policy, complete audit layer, object-storage security, structured security
logging, rate limiting, or security-monitoring integration.

## Identity and session requirement

The expected identity boundary is Microsoft Entra ID using OIDC. The production
design must:

- validate issuer, audience, signature, nonce, state, and authorized tenant;
- map immutable directory subject identifiers rather than email alone;
- use secure, HTTP-only, same-site cookies and server-managed session expiry;
- define idle and absolute timeouts, revocation, logout, and reauthentication
  for sensitive administration;
- handle disabled or removed accounts; and
- prevent preview and development callbacks from receiving production tokens.

The repository contains `User` and `TeamMember` records, but neither is an
identity implementation. Mapping identity to people and ownership references
requires an explicit design and migration.

## Authorization requirement

Every Server Component read, server action, and service operation must enforce
authorization on the server. Hidden UI controls are not security.

The permission model must define:

- platform and reference-data administrators;
- read, edit, approve, and export permissions by module;
- Department-scoped access and approved cross-Department reporting;
- field or action restrictions for financial approvals, renewal decisions,
  Contract termination, reassignment, and Settings;
- treatment of unassigned and historical records; and
- service-to-service or automation identities if integrations are introduced.

`department` and `fy` URL parameters are filters only. They are attacker-
controlled input and cannot grant or constrain access.

## Audit requirements

High-value reads and mutations require actor, action, target, timestamp,
correlation ID, outcome, and approved change detail. At minimum audit:

- authentication and session events;
- permission and role changes;
- financial amount and classification changes;
- Contract header, line, status, and term changes;
- Renewal recommendation, approval, amount, funding, and lifecycle changes;
- Department reassignment;
- Settings and reference-data changes;
- document metadata, upload, access, download, and deletion;
- exports and bulk operations; and
- failed privileged operations.

Audit records must be append-only to application users, retained according to
policy, time-synchronized, monitored for gaps, and protected from sensitive
payload overcollection. The current `ActivityLog` is flexible but is not
complete or immutable.

## Secure configuration and secrets

- Store secrets only in approved Vercel/CI secret stores.
- Isolate credentials by environment and purpose.
- Use least-privilege runtime and migration database roles.
- Rotate database, OIDC, storage, and monitoring credentials.
- Reject missing required production configuration at startup without exposing
  values.
- Never log connection strings, tokens, cookies, credentials, private hostnames,
  tenant identifiers, or file-access URLs.
- Scan repositories and build artifacts for secrets.

## Errors and logging

User responses must be safe, actionable, and paired with a correlation ID.
Stack traces, SQL, schema names, constraint details, connection information,
provider responses, and internal identifiers must not be exposed.

Structured logs must redact or omit:

- financial amounts and forecasts unless explicitly required and access
  controlled;
- Contract terms, document metadata, notes, and comments;
- personal data from Team Members or users;
- authentication material and session identifiers;
- database and provider secrets; and
- full request/form payloads.

The current database setup states can display raw exception messages. This must
be replaced before production.

## Document security boundary

`Document.url` is an external location reference, not a secure storage
implementation. Binary upload is prohibited until the system implements:

- approved private object storage and tenant/environment separation;
- authenticated, authorized upload and download;
- short-lived signed access;
- server-enforced file type and size policy;
- malware scanning and quarantine;
- encryption in transit and at rest;
- retention, legal hold, deletion, and recovery;
- content-disposition and browser-execution protections; and
- audit of upload, access, download, replacement, and deletion.

Do not store binary content in PostgreSQL or trust client-provided MIME type,
filename, or storage path.

## Dependency and platform security

Production engineering must pin supported Node and npm versions, run dependency
and license scanning, patch on defined severity timelines, review new packages,
produce a software inventory, and protect the build provenance. Vercel, Neon,
OIDC, storage, DNS, and monitoring administration require MFA, least privilege,
separate production roles, and periodic access review.

## Production blockers

- Entra ID/OIDC authentication and secure sessions
- Server-enforced module/action/Department authorization
- Complete protected audit trail
- Safe errors, redacted structured logs, and security monitoring
- Runtime/migration least-privilege database roles and secret rotation
- CSRF, rate-limit, abuse, and privileged-action controls
- Secure document storage boundary
- Dependency, secret, and supply-chain scanning
- Security testing and incident-response ownership

## Future enhancements

After blockers are satisfied, evaluate just-in-time privileged access, approval
workflows, field-level encryption, data-loss prevention, export watermarking,
advanced anomaly detection, and policy-driven retention. These are not current
implementation commitments.
