# Security

## Current posture

finsec-ops stores financial plans, commercial terms, ownership information,
document metadata, and operational history. The repository now contains a
configurable Auth.js Microsoft Entra ID boundary, database-backed active-user
checks, a role/permission matrix, and Department access grants. No Entra tenant,
application registration, client credential, or production secret is connected
or verified, so this is not evidence of a live identity integration and the
application is not production-secure.

Implemented controls are limited and must not be overstated:

- Prisma access is confined to server-side modules.
- Auth.js configures Microsoft Entra ID only when every required identity
  variable is present.
- Active pages and the Renewal API perform database-backed principal,
  permission, and applicable Department checks close to their reads.
- Many mutations use Zod and server-side relationship validation.
- Active Budget, Contract, Maintenance Renewal, Catalog, Deployment, Document,
  Settings, and Department-reassignment mutations use the central permission
  boundary. Department-scoped writes derive scope from persisted records or
  server-validated relationships rather than browser role or filter values.
- Multi-record invariants use transactions in key services.
- Environment files are ignored by Git.
- Startup validation separates development/test/preview/production tiers and
  rejects unsafe known database reuse without printing secret values.
- Server failures use structured redacted JSON and correlation/request IDs.
- Deployment and Document writes, high-value Settings changes, and selected
  Renewal/Department changes create actor-aware activity events.
- The ORM parameterizes normal database operations.

There is no connected production identity, verified tenant flow, revocation
integration, complete mutation authorization inventory, CSRF policy, complete
audit layer, object-storage security, centralized security-monitoring
integration, or rate limiting.

## Identity and session boundary

`src/auth.ts` follows the Auth.js Next.js pattern and configures the Microsoft
Entra ID provider, an eight-hour JWT session maximum, and a custom sign-in page.
The proxy performs only an optimistic token check. The cached server DAL
re-reads `User` by immutable `(entraTenantId, entraSubject)`, requires
`active = true`, rejects unknown roles, and loads explicit Department grants.
Disabling a user therefore blocks protected reads even if an optimistic session
cookie remains.

Production requires `AUTH_SECRET`,
`AUTH_MICROSOFT_ENTRA_ID_ID`, `AUTH_MICROSOFT_ENTRA_ID_SECRET`,
`AUTH_MICROSOFT_ENTRA_ID_ISSUER`, and
`AUTH_MICROSOFT_ENTRA_ID_TENANT_ID`. The issuer must be the approved
single-tenant `/v2.0` issuer. The configured tenant ID is checked again against
the `tid` claim. Missing configuration leaves sign-in disabled and protected
requests fail closed.

`FINSEC_AUTH_BYPASS=true` is the only local automation bypass. It is ignored
for preview or production tiers and whenever `NODE_ENV=production`; normal
development without the explicit flag is also fail-closed. The bypass must
never be configured in preview, staging, or production.

The external Entra app registration, callback
`/api/auth/callback/microsoft-entra-id`, tenant consent, credential storage,
production callback verification, conditional access, logout, revocation,
absolute-versus-idle timeout policy, and privileged reauthentication remain
required external validation.

## Authorization boundary

Every Server Component read, server action, and service operation must enforce
authorization on the server. Hidden UI controls are not security.

The code-defined role matrix is:

| Role                | Department scope     | Intended access                                                                                            |
| ------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `PLATFORM_ADMIN`    | Cross-Department     | Every defined module, approval, export, Settings, termination, and reassignment permission                 |
| `FINANCE_ADMIN`     | Cross-Department     | Financial/operational reads, Budget approval/export, and selected module edits; no Settings administration |
| `DEPARTMENT_EDITOR` | Explicit grants only | Department-scoped reads and operational edits; no approval, Settings, termination, export, or reassignment |
| `DEPARTMENT_VIEWER` | Explicit grants only | Department-scoped module reads                                                                             |
| `AUDITOR`           | Cross-Department     | Read-only module access plus Budget export                                                                 |

Unknown or null roles deny access. Users without cross-Department permission
cannot select `all`, unassigned scope, or a Department absent from
`UserDepartmentAccess`. Product Catalog is global; Settings requires its
explicit permission.

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

Root route errors show a safe retry state and optional framework digest rather
than exception text. Server request failures are reduced to safe route,
error-type, and digest metadata. Individual route/action responses still
require review as new code is added.

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

`npm audit --omit=dev` reports zero production dependency advisories as of
2026-07-29. This point-in-time result includes transitive dependencies and does
not replace recurring scanning.

The full development dependency audit still reports nine high-severity
advisories in the ESLint 9 toolchain through `minimatch` and
`brace-expansion`. npm's proposed remediation requires the breaking ESLint 10
upgrade, so this remains a development-tooling upgrade to validate rather than
an automatic production dependency change.

## Production blockers

- Live single-tenant Entra registration, secrets, consent, callback, and
  end-to-end OIDC/session validation
- Approved user provisioning and immutable subject/tenant assignment
- Complete server-action/service authorization inventory and negative tests
- Approved session revocation, logout, timeout, and privileged reauthentication
- Complete protected audit trail
- Centralized security monitoring and alert ownership
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
