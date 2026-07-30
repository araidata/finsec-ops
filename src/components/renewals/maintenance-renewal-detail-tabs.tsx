"use client";

import { MessageSquare } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useActionState, useEffect } from "react";

import { addCommentAction } from "@/app/renewals/actions";
import { Button } from "@/components/ui/button";
import { titleCaseEnum } from "@/lib/maintenance-renewal-rules";
import { invalidateMaintenanceRenewalRegisters } from "@/lib/renewals/maintenance-renewal-query-cache";
import {
  emptyActionResult,
  type ActionResult,
} from "@/lib/server/action-result";

type CommentRenewal = {
  id: string;
  notes: Array<{
    id: string;
    body: string;
    createdAt: string;
    author?: { name: string } | null;
  }>;
};

type HistoryRenewal = {
  decisionHistory: Array<{
    id: string;
    changedAt: string;
    changedBy?: string | null;
    decisionStatus: string;
  }>;
};

type Activity = {
  id: string;
  fieldName?: string | null;
  previousValue?: string | null;
  newValue?: string | null;
  occurredAt: string;
  actor?: { name: string } | null;
};

type HistoryReferences = {
  companies: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string }>;
  teamMembers: Array<{ id: string; fullName: string }>;
};

function dateTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ActionMessage({ result }: { result: ActionResult }) {
  if (!result.message) return null;
  return (
    <div
      role="status"
      className={`rounded-md border px-3 py-2 text-sm ${
        result.ok
          ? "border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-200"
          : "border-red-400/25 bg-red-400/[0.06] text-red-200"
      }`}
    >
      {result.message}
    </div>
  );
}

export function MaintenanceRenewalComments({
  renewal,
}: {
  renewal: CommentRenewal;
}) {
  const queryClient = useQueryClient();
  const [result, formAction, pending] = useActionState(
    addCommentAction,
    emptyActionResult
  );
  useEffect(() => {
    if (!result.ok) return;
    void invalidateMaintenanceRenewalRegisters(queryClient);
  }, [queryClient, result.ok]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="maintenanceRenewalId" value={renewal.id} />
        <label className="block text-sm font-medium" htmlFor="renewal-comment">
          Add Comment
        </label>
        <textarea
          id="renewal-comment"
          name="body"
          required
          rows={5}
          placeholder="Add a concise update for this renewal…"
          className="w-full resize-y rounded-lg border bg-secondary/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <ActionMessage result={result} />
        <Button type="submit" disabled={pending}>
          <MessageSquare data-icon="inline-start" />{" "}
          {pending ? "Adding…" : "Add Comment"}
        </Button>
      </form>
      <div>
        <h3 className="text-sm font-semibold">Comment history</h3>
        {renewal.notes.length ? (
          <ol className="mt-3 space-y-3">
            {renewal.notes.map((note) => (
              <li
                key={note.id}
                className="rounded-lg border border-border/70 bg-secondary/20 p-4"
              >
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">
                  {note.body}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {note.author?.name ?? "System user"} ·{" "}
                  {dateTime(note.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed p-8 text-center">
            <MessageSquare className="mx-auto mb-2 size-5 text-muted-foreground" />
            <p className="text-sm font-medium">No comments yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add the first update for this renewal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function MaintenanceRenewalHistory({
  renewal,
  activities,
  data,
}: {
  renewal: HistoryRenewal;
  activities: Activity[];
  data: HistoryReferences;
}) {
  const history = [
    ...activities.map((activity) => ({
      id: activity.id,
      at: activity.occurredAt,
      by: activity.actor?.name ?? "System user",
      text: historyText(activity, data),
    })),
    ...renewal.decisionHistory.map((item) => ({
      id: item.id,
      at: item.changedAt,
      by: item.changedBy ?? "System user",
      text: `Renewal decision updated to ${titleCaseEnum(item.decisionStatus)}`,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return history.length ? (
    <ol className="relative space-y-0 before:absolute before:bottom-3 before:left-[5px] before:top-3 before:w-px before:bg-border">
      {history.map((item) => (
        <li
          key={item.id}
          className="relative grid grid-cols-[12px_1fr] gap-3 pb-5"
        >
          <span className="mt-1.5 size-3 rounded-full border-2 border-card bg-cyan-300 ring-1 ring-border" />
          <div>
            <p className="text-sm text-slate-200">{item.text}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.by} · {dateTime(item.at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  ) : (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      No recorded changes yet.
    </div>
  );
}

function historyText(activity: Activity, data: HistoryReferences) {
  const label = titleCaseEnum(
    (activity.fieldName ?? "record").replace(/([a-z])([A-Z])/g, "$1_$2")
  );
  const resolve = (value?: string | null) =>
    data.companies.find((item) => item.id === value)?.name ??
    data.products.find((item) => item.id === value)?.name ??
    data.teamMembers.find((item) => item.id === value)?.fullName ??
    (value ? titleCaseEnum(value) : "None");
  if (activity.fieldName === "comment") return "Comment added";
  return `${label} changed from ${resolve(activity.previousValue)} to ${resolve(
    activity.newValue
  )}`;
}
