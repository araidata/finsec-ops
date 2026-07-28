# Department-Scoped Financial Accounts

## Decision

Financial account definitions may be global or assigned to one Department.
Account codes are unique within each department scope. A department-specific
account is preferred when creating a new budget row; a global account is the
fallback.

## Rationale

The shared Department selector is useful for operational workspaces but does
not mean every Settings record is department-scoped. Explicit scope on each
financial account prevents the Settings page from implying that a global
account changed for one department only.

Existing accounts remain global during migration so historical budget and
renewal records preserve their account relationships.
