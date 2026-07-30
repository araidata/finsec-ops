"use client";

export type DocumentActivityRecord = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  fieldName?: string | null;
  previousValue?: string | null;
  newValue?: string | null;
  metadata?: unknown;
  occurredAt: string;
  actor?: { name: string } | null;
};

export function DocumentAuditTrail({
  logs,
}: {
  logs: DocumentActivityRecord[];
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/70">
      {logs.length ? (
        <ol className="divide-y divide-border/60">
          {logs.map((log) => (
            <li
              key={log.id}
              className="grid gap-1 px-5 py-4 sm:grid-cols-[150px_1fr_auto] sm:items-start"
            >
              <span className="text-xs text-muted-foreground">
                {new Date(log.occurredAt).toLocaleString()}
              </span>
              <div>
                <p className="text-sm text-slate-200">
                  <span className="font-medium text-cyan-200">
                    {log.actor?.name ?? "System"}
                  </span>{" "}
                  {auditText(log)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {log.entityType} · {log.entityId}
                </p>
              </div>
              <span className="rounded-full border border-border px-2 py-1 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                {titleCase(log.action)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="p-12 text-center text-sm text-muted-foreground">
          No audit events have been recorded.
        </div>
      )}
    </div>
  );
}

function auditText(log: DocumentActivityRecord) {
  const field = log.fieldName ? ` field ${log.fieldName}` : "";
  if (log.action === "CREATE") return `created ${log.entityType}`;
  if (log.action === "DELETE") return `deleted ${log.entityType}`;
  return `updated ${log.entityType}${field}`;
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
