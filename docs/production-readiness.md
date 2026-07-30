# Production Readiness

## Status

finsec-ops is not approved for production use. The application demonstrates
connected Technology Financial Operations workflows, but the controls below are
required before it can protect authoritative financial, commercial, personal,
document, and operational data.

This is the authoritative readiness assessment. `TODO.md` is the concise work
queue and does not duplicate these acceptance criteria.

## Production gates

### Authentication and sessions

- **Current condition:** No authentication; `User` and `TeamMember` are data
  models only.
- **Required condition:** Microsoft Entra ID/OIDC identity and secure,
  revocable, server-managed sessions.
- **Why it matters:** All records and administrative actions are otherwise
  reachable by any network user.
- **Acceptance criteria:** Tenant/issuer/audience validation, immutable subject
  mapping, secure cookie policy, timeout/revocation/logout, disabled-user
  handling, environment isolation, and tested failure cases.
- **Dependencies:** Entra application ownership, identity-to-person mapping,
  secret management, security review.

### Authorization

- **Current condition:** URL Department/Fiscal Year filters and hidden controls
  do not enforce permission.
- **Required condition:** Server-side role, Department, record, and action
  authorization on every read and mutation.
- **Why it matters:** Financial and commercial data requires least privilege and
  separation of duties.
- **Acceptance criteria:** Approved permission matrix; default deny; privileged
  Settings/reassignment/decision controls; cross-Department rules; unassigned
  and historical behavior; negative tests; audited denials.
- **Dependencies:** Authentication, organizational ownership, data
  classification.

### Performance and scalability

- **Current condition:** Multiple services execute unbounded `findMany` calls,
  broad relational includes, in-memory filters and aggregates, and large client
  serialization.
- **Required condition:** Bounded indexed reads, list/detail separation,
  server-side filtering/aggregation, explicit DTOs, and responsive large grids.
- **Why it matters:** Dataset growth can increase latency, memory, cost, and
  failure risk nonlinearly.
- **Acceptance criteria:** Representative synthetic scale; query and payload
  budgets per module; pagination or bounded contracts; execution-plan review;
  no unapproved unbounded production query; browser responsiveness targets.
- **Dependencies:** Data-volume forecast, monitoring, index review, test-data
  generator.

### Data integrity and concurrency

- **Current condition:** Key operations use transactions and constraints, but
  concurrent edits have no version check; several invariants are service-only;
  Decimal serialization and rounding are not centrally governed.
- **Required condition:** Explicit financial rounding, optimistic concurrency or
  equivalent conflict policy, enforced source relationships, and reviewed
  deletion behavior.
- **Why it matters:** Silent lost updates or inconsistent derived totals damage
  decision evidence.
- **Acceptance criteria:** Currency/rounding specification; record versioning or
  tested conflict mechanism; transaction and constraint matrix; reconciliation
  tests for Contract totals, Budget summaries, Renewal snapshots, and usage
  history.
- **Dependencies:** Product/finance approval, schema and migration review,
  integration test harness.

### Database baseline and migration safety

- **Current condition:** Committed migrations start from a pre-existing
  baseline; the fixture seed deletes application data.
- **Required condition:** Deterministic provisioning and reconciliation,
  non-destructive migration automation, safe reference initialization, and
  verified recovery.
- **Why it matters:** New environments and disaster recovery cannot rely on an
  unproven schema history.
- **Acceptance criteria:** Approved baseline; empty and existing-database tests;
  migration status gate; destructive-operation protection; idempotent
  backfills; reviewed rollout/recovery plans; seed separated from initialization.
- **Dependencies:** Database owner, representative schema/data snapshot, CI
  environment, backup plan.

### Company and compatibility-model transition

- **Current condition:** `Company`/`CompanyRole` is active, while legacy
  `Vendor`/`Reseller` and older Budget, Renewal, procurement, and owner models
  remain linked.
- **Required condition:** Canonical relationship policy with verified parity and
  deliberately retained or retired compatibility models.
- **Why it matters:** Dual sources can diverge and make historical records
  ambiguous.
- **Acceptance criteria:** Field/foreign-key inventory; conflict report;
  idempotent backfill; read/write cutover tests; historical rendering proof;
  explicit retain/remove decisions and non-destructive migrations.
- **Dependencies:** Data ownership decisions, baseline, integration tests.

### Audit completeness

- **Current condition:** Selected document, reassignment, and Renewal operations
  write `ActivityLog`; most authoritative writes do not.
- **Required condition:** Complete, actor-attributed, protected, monitored audit
  events for defined high-value operations.
- **Why it matters:** Financial and administrative changes must be
  reconstructable.
- **Acceptance criteria:** Event catalog; shared emission pattern; transactional
  coupling; actor/correlation/outcome fields; append-only access; retention;
  gap monitoring; coverage tests.
- **Dependencies:** Authentication, authorization, retention policy, logging
  design.

### Observability and error handling

- **Current condition:** No structured logger, correlation ID, metrics, tracing,
  health checks, alerting, or route error boundaries; some setup states expose
  raw errors.
- **Required condition:** Safe errors and actionable, redacted operational
  telemetry.
- **Why it matters:** Failures cannot be detected, scoped, or resolved reliably.
- **Acceptance criteria:** Correlation IDs; structured redacted logs; error and
  latency monitoring; failed-mutation and slow-query signals; liveness/readiness;
  dashboards; alert owners; route error/loading boundaries; no sensitive error
  leakage.
- **Dependencies:** Monitoring provider, security logging rules, operations
  ownership.

### CI/CD and release control

- **Current condition:** Commands exist, but no repository CI or controlled
  migration/release pipeline is documented in code.
- **Required condition:** Protected, reproducible build, test, migration,
  approval, deployment, and verification flow.
- **Why it matters:** Manual releases are inconsistent and can apply incompatible
  code or schema.
- **Acceptance criteria:** Pinned Node/npm; locked install; format/lint/type/test/
  build checks; isolated browser tests; migration review/status; environment
  approvals; artifact/revision traceability; rollback and smoke evidence.
- **Dependencies:** CI platform, Vercel/Neon roles, test isolation, branch policy.

### Test adequacy

- **Current condition:** Useful unit, component, mocked service, and selected
  Playwright coverage exists; real database, migration, access-control,
  concurrency, accessibility, and load coverage is incomplete.
- **Required condition:** Risk-based automated coverage at production-like scale
  and isolation.
- **Why it matters:** Mocked and mutable seeded tests cannot prove cross-system
  correctness.
- **Acceptance criteria:** Disposable database harness; deterministic fixtures;
  migration tests; critical workflow matrix; authorization negatives;
  concurrency tests; accessibility scans; performance tests; stable required CI
  checks.
- **Dependencies:** Baseline, authentication/authorization, synthetic data, CI.

### Backup and recovery

- **Current condition:** Neon is the target, but repository evidence does not
  establish backup retention, RPO/RTO, or restore testing.
- **Required condition:** Owned, monitored backup and point-in-time recovery with
  routine restore proof.
- **Why it matters:** Historical financial and commercial data may be
  irrecoverable after corruption or operator error.
- **Acceptance criteria:** Approved RPO/RTO; retention and access; pre-migration
  recovery points; isolated restore test; schema/count/financial reconciliation;
  documented elapsed time and escalation.
- **Dependencies:** Neon plan/configuration, database owner, operations runbook.

### Document storage

- **Current condition:** Metadata and an external document URL exist; there is
  no binary upload/storage security boundary.
- **Required condition:** Private, authorized, malware-scanned, encrypted,
  retained, and audited object storage.
- **Why it matters:** Contracts and commercial documents are sensitive and
  untrusted files can compromise users.
- **Acceptance criteria:** Approved provider boundary; upload/download
  authorization; signed access; type/size checks; quarantine/scanning;
  encryption; retention/legal hold/deletion/recovery; full access audit.
- **Dependencies:** Authentication/authorization, storage provider, retention
  policy, security review.

### Accessibility

- **Current condition:** Components use semantic primitives in places, but no
  automated or manual accessibility conformance evidence exists; dense grids
  and drawers are high risk.
- **Required condition:** Keyboard, focus, semantic, screen-reader, contrast,
  zoom, and error behavior meeting the organization's adopted WCAG level.
- **Why it matters:** Financial operations must be usable without pointer or
  visual-only interaction.
- **Acceptance criteria:** Adopted standard; automated checks; manual keyboard
  and screen-reader review of each module; documented grid semantics; remediated
  critical/serious issues; regression checks.
- **Dependencies:** Design/QA ownership, test tooling, supported browser matrix.

### Operational readiness

- **Current condition:** No named on-call model, incident process, health
  signals, capacity review, dependency cadence, or proven runbooks.
- **Required condition:** Owned service operation with monitoring, incidents,
  maintenance, recovery, and documentation review.
- **Why it matters:** A technically functioning deployment is not a supportable
  production service.
- **Acceptance criteria:** Named owners; severity/escalation; release and
  incident runbooks; capacity and dependency cadence; provider access review;
  incident exercise; restore exercise; current private contact records.
- **Dependencies:** Organization staffing, observability, backup/recovery,
  security process.

## Launch decision

Production authorization requires evidence that every blocker above is
satisfied or an explicitly accepted risk with accountable owner, expiry, and
compensating control. Feature completeness alone is not production readiness.
