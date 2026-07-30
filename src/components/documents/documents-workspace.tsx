"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, FileArchive, History, Plus, Trash2 } from "lucide-react";
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  saveDocumentAction,
  deleteDocumentAction,
  searchDocumentLinkTargetsAction,
} from "@/app/documents/actions";
import { WorkspaceShell } from "@/components/app/workspace-shell";
import { Button } from "@/components/ui/button";
import {
  emptyActionResult,
  type ActionResult,
} from "@/lib/server/action-result";
import {
  documentSortFromState,
  documentSortingState,
  type DocumentTableSort,
  resolveTableUpdater,
} from "@/lib/client/manual-table-state";

type Entity = {
  id: string;
  name?: string;
  title?: string;
  renewalName?: string;
};
type DocumentRecord = {
  id: string;
  title: string;
  type: string;
  url: string;
  description?: string | null;
  uploadedAt: string;
  uploadedBy?: { name: string } | null;
  contract?: Entity | null;
  maintenanceRenewal?: Entity | null;
  company?: Entity | null;
  product?: Entity | null;
};
type ActivityRecord = {
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
type PageData = {
  documents: DocumentRecord[];
  activityLogs: ActivityRecord[];
  companies: Entity[];
  contracts: Entity[];
  renewals: Entity[];
  products: Entity[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  activityPagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  } | null;
  query: {
    search: string;
    type: string;
    entityType: string;
    sort: string;
    activeTab: "documents" | "audit";
  };
  selection: { departmentId: string | null; fiscalYearId: string | null };
};

const types = [
  "CONTRACT",
  "ORDER_FORM",
  "QUOTE",
  "INVOICE",
  "RENEWAL_NOTICE",
  "PURCHASE_REQUEST",
  "SECURITY_REVIEW",
  "OTHER",
];

const documentColumns: ColumnDef<DocumentRecord>[] = [
  { id: "title", header: "Document" },
  { id: "type", header: "Type", enableSorting: false },
  { id: "linkedRecord", header: "Linked record", enableSorting: false },
  { id: "uploadedAt", header: "Added" },
  { id: "actions", header: "", enableSorting: false },
];

export function DocumentsWorkspace({ data }: { data: PageData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState(data.query.search);
  const documents = data.documents;
  const tab = data.query.activeTab;
  function navigate(
    updates: Record<string, string | number | null>,
    resetPage = true
  ) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "" || value === "all") params.delete(key);
      else params.set(key, String(value));
    }
    if (resetPage) params.delete("page");
    router.replace(params.size ? `/documents?${params}` : "/documents", {
      scroll: false,
    });
  }
  const sorting = documentSortingState(
    data.query.sort as DocumentTableSort
  );
  const pagination = {
    pageIndex: data.pagination.page - 1,
    pageSize: data.pagination.pageSize,
  };
  // TanStack Table exposes stateful methods and intentionally opts this component out of compiler memoization.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: documents,
    columns: documentColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (document) => document.id,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: data.pagination.totalPages,
    state: {
      globalFilter: data.query.search,
      pagination,
      sorting,
    },
    onGlobalFilterChange: (updater) => {
      const next = resolveTableUpdater(updater, data.query.search);
      navigate({ q: String(next) });
    },
    onPaginationChange: (updater) => {
      const next = resolveTableUpdater(updater, pagination);
      if (next.pageSize !== pagination.pageSize) {
        navigate({ pageSize: next.pageSize });
      } else {
        navigate({ page: next.pageIndex + 1 }, false);
      }
    },
    onSortingChange: (updater) => {
      const next = resolveTableUpdater(updater, sorting);
      navigate({ sort: documentSortFromState(next) });
    },
  });

  return (
    <WorkspaceShell
      title="Documents & Audit Trail"
      description="Centralize financial operations evidence and review the history of important changes."
      titleActions={
        <Button
          onClick={() => setShowForm(true)}
          className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
        >
          <Plus data-icon="inline-start" /> Add document
        </Button>
      }
    >
      <div className="flex gap-1 border-b border-border/70">
        <button
          className={tabClass(tab === "documents")}
          onClick={() => navigate({ tab: null }, false)}
        >
          <FileArchive className="size-4" /> Documents{" "}
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
            {data.pagination.totalCount}
          </span>
        </button>
        <button
          className={tabClass(tab === "audit")}
          onClick={() => navigate({ tab: "audit" }, false)}
        >
          <History className="size-4" /> Audit trail{" "}
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
            {data.activityPagination?.totalCount ?? 0}
          </span>
        </button>
      </div>
      {tab === "documents" ? (
        <>
          <form
            className="flex flex-wrap items-center justify-between gap-3 py-3"
            onSubmit={(event) => {
              event.preventDefault();
              table.setGlobalFilter(query);
            }}
          >
            <input
              aria-label="Search documents"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search documents, types, linked records…"
              className="h-9 w-full max-w-md rounded-md border border-border/80 bg-secondary/35 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <select
              aria-label="Document type filter"
              value={data.query.type || "all"}
              onChange={(event) => navigate({ type: event.target.value })}
              className="h-9 rounded-md border bg-secondary/35 px-2 text-sm"
            >
              <option value="all">All types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {titleCase(type)}
                </option>
              ))}
            </select>
            <select
              aria-label="Linked record filter"
              value={data.query.entityType}
              onChange={(event) => navigate({ entity: event.target.value })}
              className="h-9 rounded-md border bg-secondary/35 px-2 text-sm"
            >
              <option value="all">All links</option>
              <option value="contract">Contracts</option>
              <option value="maintenanceRenewal">Renewals</option>
              <option value="company">Companies</option>
              <option value="product">Products</option>
            </select>
            <select
              aria-label="Document sort"
              value={data.query.sort}
              onChange={(event) =>
                table.setSorting(
                  documentSortingState(
                    event.target.value as DocumentTableSort
                  )
                )
              }
              className="h-9 rounded-md border bg-secondary/35 px-2 text-sm"
            >
              <option value="uploadedDesc">Newest added</option>
              <option value="uploadedAsc">Oldest added</option>
              <option value="titleAsc">Title</option>
            </select>
            <Button type="submit" variant="outline" size="sm">
              Search
            </Button>
            <p className="text-xs text-muted-foreground">
              {documents.length} of {data.pagination.totalCount} shown
            </p>
          </form>
          <div className="overflow-hidden rounded-xl border border-border/80 bg-card/70">
            <div className="grid grid-cols-[minmax(0,1.8fr)_140px_minmax(180px,1fr)_170px_90px] border-b border-border/70 px-4 py-3 text-[0.68rem] uppercase tracking-wide text-muted-foreground">
              <span>Document</span>
              <span>Type</span>
              <span>Linked record</span>
              <span>Added</span>
              <span />
            </div>
            {documents.length ? (
              table.getRowModel().rows.map((row) => (
                <DocumentRow key={row.id} document={row.original} />
              ))
            ) : (
              <div className="p-12 text-center text-sm text-muted-foreground">
                No documents match this search.
              </div>
            )}
          </div>
          <Pagination
            pagination={data.pagination}
            onPage={(page) => table.setPageIndex(page - 1)}
            onPageSize={(pageSize) => table.setPageSize(pageSize)}
          />
        </>
      ) : (
        <>
          <AuditTrail logs={data.activityLogs} />
          {data.activityPagination ? (
            <Pagination
              pagination={data.activityPagination}
              onPage={(activityPage) => navigate({ activityPage }, false)}
            />
          ) : null}
        </>
      )}
      {showForm ? (
        <DocumentForm data={data} onClose={() => setShowForm(false)} />
      ) : null}
    </WorkspaceShell>
  );
}

function DocumentRow({ document }: { document: DocumentRecord }) {
  const [result, formAction, pending] = useActionState(
    deleteDocumentAction,
    emptyActionResult
  );
  return (
    <div className="grid grid-cols-[minmax(0,1.8fr)_140px_minmax(180px,1fr)_170px_90px] items-center gap-2 border-b border-border/50 px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <a
          href={document.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 truncate text-sm font-medium text-cyan-200 hover:text-cyan-100"
        >
          <FileArchive className="size-4 shrink-0" />
          {document.title}
          <ExternalLink className="size-3 shrink-0" />
        </a>
        {document.description ? (
          <p className="truncate text-xs text-muted-foreground">
            {document.description}
          </p>
        ) : null}
      </div>
      <span className="text-xs text-slate-300">{titleCase(document.type)}</span>
      <span className="truncate text-sm text-slate-300">
        {linkedLabel(document)}
      </span>
      <span className="text-xs text-muted-foreground">
        {new Date(document.uploadedAt).toLocaleDateString()}
      </span>
      <form action={formAction} className="flex justify-end">
        <input type="hidden" name="id" value={document.id} />
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${document.title}`}
          disabled={pending}
        >
          <Trash2 className="size-4 text-muted-foreground hover:text-rose-300" />
        </Button>
        <ActionMessage result={result} />
      </form>
    </div>
  );
}

function DocumentForm({
  data,
  onClose,
}: {
  data: PageData;
  onClose: () => void;
}) {
  const [result, formAction, pending] = useActionState(
    saveDocumentAction,
    emptyActionResult
  );
  const [entityType, setEntityType] = useState("contract");
  const [entitySearch, setEntitySearch] = useState("");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(true);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoadingEntities(true);
      const result = await searchDocumentLinkTargetsAction({
        entityType: entityType as
          "contract" | "maintenanceRenewal" | "company" | "product",
        search: entitySearch,
        departmentId: data.selection.departmentId ?? undefined,
        fiscalYearId: data.selection.fiscalYearId ?? undefined,
      });
      if (!active) return;
      setEntities(result.ok ? result.data : []);
      setLoadingEntities(false);
    }, 200);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    data.selection.departmentId,
    data.selection.fiscalYearId,
    entitySearch,
    entityType,
  ]);
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/60 p-4 md:p-10">
      <form
        action={formAction}
        className="w-full max-w-2xl space-y-4 rounded-xl border border-border bg-card p-5 shadow-2xl"
      >
        <input
          type="hidden"
          name="departmentId"
          value={data.selection.departmentId ?? ""}
        />
        <input
          type="hidden"
          name="fiscalYearId"
          value={data.selection.fiscalYearId ?? ""}
        />
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Add document</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Store a durable link to a contract, quote, invoice, or review
              artifact.
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" name="title" required />
          <label className="grid gap-1 text-sm">
            <span>Type</span>
            <select
              name="type"
              defaultValue="CONTRACT"
              className="h-9 rounded-md border border-border bg-secondary px-2"
            >
              <option>CONTRACT</option>
              {types.slice(1).map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
        </div>
        <Field
          label="Document URL"
          name="url"
          type="url"
          placeholder="https://…"
          required
        />
        <label className="grid gap-1 text-sm">
          <span>Description</span>
          <textarea
            name="description"
            rows={3}
            className="rounded-md border border-border bg-secondary px-3 py-2"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span>Link to</span>
            <select
              name="entityType"
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
              className="h-9 rounded-md border border-border bg-secondary px-2"
            >
              <option value="contract">Contract</option>
              <option value="maintenanceRenewal">Maintenance renewal</option>
              <option value="company">Company</option>
              <option value="product">Product</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Record</span>
            <input
              aria-label="Search linked records"
              value={entitySearch}
              onChange={(event) => setEntitySearch(event.target.value)}
              placeholder={
                loadingEntities ? "Loading…" : "Search linked records…"
              }
              className="h-9 rounded-md border border-border bg-secondary px-2"
            />
            <select
              name="entityId"
              required
              className="h-9 rounded-md border border-border bg-secondary px-2"
            >
              <option value="">Select a record…</option>
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name ?? entity.title ?? entity.renewalName}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ActionMessage result={result} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={pending}
            className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
          >
            {pending ? "Saving…" : "Save document"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function AuditTrail({ logs }: { logs: ActivityRecord[] }) {
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

function Pagination({
  pagination,
  onPage,
  onPageSize,
}: {
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  onPage: (page: number) => void;
  onPageSize?: (pageSize: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-sm">
      <span className="text-muted-foreground">
        Page {pagination.page} of {pagination.totalPages} ·{" "}
        {pagination.totalCount} records
      </span>
      <div className="flex items-center gap-2">
        {onPageSize ? (
          <select
            aria-label="Rows per page"
            value={pagination.pageSize}
            onChange={(event) => onPageSize(Number(event.target.value))}
            className="h-8 rounded-md border bg-secondary px-2"
          >
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPage(pagination.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="h-9 rounded-md border border-border bg-secondary px-3 outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
function linkedLabel(document: DocumentRecord) {
  return (
    document.contract?.title ??
    document.maintenanceRenewal?.renewalName ??
    document.company?.name ??
    document.product?.name ??
    "Unlinked"
  );
}
function auditText(log: ActivityRecord) {
  const verb =
    log.action === "CREATE"
      ? "created"
      : log.action === "DELETE"
        ? "removed"
        : log.action === "UPDATE"
          ? "updated"
          : titleCase(log.action).toLowerCase();
  return `${verb} ${log.entityType.toLowerCase()}`;
}
function titleCase(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
function tabClass(active: boolean) {
  return `flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium ${active ? "border-cyan-300 text-cyan-100" : "border-transparent text-muted-foreground hover:text-slate-200"}`;
}
function ActionMessage({ result }: { result: ActionResult }) {
  if (!result.message) return null;
  return (
    <div
      role="status"
      className={`rounded-md border px-2 py-1 text-xs ${result.ok ? "border-emerald-400/25 text-emerald-200" : "border-red-400/25 text-red-200"}`}
    >
      {result.message}
    </div>
  );
}
