"use client";

import { useActionState, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, FileArchive, History, Plus, Trash2 } from "lucide-react";
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  deleteDocumentAction,
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
import type { DocumentActivityRecord } from "@/components/documents/document-audit-trail";

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
type PageData = {
  documents: DocumentRecord[];
  activityLogs: DocumentActivityRecord[];
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

const DocumentForm = dynamic(
  () =>
    import("@/components/documents/document-form").then(
      (module) => module.DocumentForm
    ),
  {
    loading: () => (
      <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 text-sm text-muted-foreground">
        Loading document form…
      </div>
    ),
  }
);

const DocumentAuditTrail = dynamic(
  () =>
    import("@/components/documents/document-audit-trail").then(
      (module) => module.DocumentAuditTrail
    ),
  {
    loading: () => (
      <div className="rounded-xl border border-border/80 bg-card/70 p-12 text-center text-sm text-muted-foreground">
        Loading audit trail…
      </div>
    ),
  }
);

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
          <DocumentAuditTrail logs={data.activityLogs} />
          {data.activityPagination ? (
            <Pagination
              pagination={data.activityPagination}
              onPage={(activityPage) => navigate({ activityPage }, false)}
            />
          ) : null}
        </>
      )}
      {showForm ? (
        <DocumentForm
          selection={data.selection}
          onClose={() => setShowForm(false)}
        />
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

function linkedLabel(document: DocumentRecord) {
  return (
    document.contract?.title ??
    document.maintenanceRenewal?.renewalName ??
    document.company?.name ??
    document.product?.name ??
    "Unlinked"
  );
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
