"use client";

import { useActionState, useEffect, useState } from "react";

import {
  saveDocumentAction,
  searchDocumentLinkTargetsAction,
} from "@/app/documents/actions";
import { Button } from "@/components/ui/button";
import {
  emptyActionResult,
  type ActionResult,
} from "@/lib/server/action-result";

type Entity = {
  id: string;
  name?: string;
  title?: string;
  renewalName?: string;
};

const documentTypes = [
  "CONTRACT",
  "ORDER_FORM",
  "QUOTE",
  "INVOICE",
  "RENEWAL_NOTICE",
  "PURCHASE_REQUEST",
  "SECURITY_REVIEW",
  "OTHER",
];

export function DocumentForm({
  selection,
  onClose,
}: {
  selection: { departmentId: string | null; fiscalYearId: string | null };
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
        departmentId: selection.departmentId ?? undefined,
        fiscalYearId: selection.fiscalYearId ?? undefined,
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
    entitySearch,
    entityType,
    selection.departmentId,
    selection.fiscalYearId,
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
          value={selection.departmentId ?? ""}
        />
        <input
          type="hidden"
          name="fiscalYearId"
          value={selection.fiscalYearId ?? ""}
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
              {documentTypes.map((type) => (
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
        className="h-9 rounded-md border border-border bg-secondary px-3"
      />
    </label>
  );
}

function ActionMessage({ result }: { result: ActionResult }) {
  if (!result.message) return null;
  return (
    <p
      className={`text-xs ${result.ok ? "text-emerald-300" : "text-rose-300"}`}
    >
      {result.message}
    </p>
  );
}
