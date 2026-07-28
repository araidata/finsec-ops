"use client";

import { ArrowRight, MoveRight, X } from "lucide-react";
import { useState, useTransition } from "react";

import { reassignDepartmentAction } from "@/app/departments/actions";
import { useGlobalContext } from "@/components/app/global-context-provider";
import { Button } from "@/components/ui/button";
import type {
  DepartmentReassignmentResult,
  ReassignmentEntityType,
} from "@/lib/server/department-reassignment-service";

type DepartmentReassignmentProps = {
  entityType: ReassignmentEntityType;
  entityIds: string[];
  currentDepartment?: string | null;
  label: string;
  onClose: () => void;
  onComplete?: (result: DepartmentReassignmentResult) => void;
};

export function DepartmentReassignmentDialog({
  entityType,
  entityIds,
  currentDepartment,
  label,
  onClose,
  onComplete,
}: DepartmentReassignmentProps) {
  const { departments } = useGlobalContext();
  const [departmentId, setDepartmentId] = useState("");
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState<DepartmentReassignmentResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await reassignDepartmentAction({
        entityType,
        entityIds,
        departmentId: departmentId || null,
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      const reassignment = result.data as unknown as DepartmentReassignmentResult;
      onComplete?.(reassignment);
      setCompleted(reassignment);
    });
  }

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="department-move-title" className="w-full max-w-lg rounded-xl border border-border bg-popover shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border/80 px-5 py-4">
          <div>
            <h2 id="department-move-title" className="text-lg font-semibold text-slate-100">Move {label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{entityIds.length} selected record{entityIds.length === 1 ? "" : "s"} will be reassigned.</p>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}><X /></Button>
        </header>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-secondary/25 p-3 text-sm">
            <span className="font-medium text-slate-100">{currentDepartment || "Unassigned"}</span>
            <ArrowRight className="size-4 text-muted-foreground" />
            <span className="font-medium text-cyan-200">{departments.find((department) => department.id === departmentId)?.name ?? "Choose destination"}</span>
          </div>
          <label className="grid gap-1.5 text-sm">
            <span className="text-muted-foreground">Destination Department</span>
            <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="h-10 rounded-md border border-border/80 bg-background px-3 text-sm text-slate-100" autoFocus>
              <option value="">Unassigned</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
          </label>
          <p className="text-xs leading-5 text-muted-foreground">Only the selected {label.toLowerCase()} will move. Linked budgets, contracts, renewals, documents, and deployments remain in their current departments.</p>
          {entityType === "budgetItem" ? <p className="rounded-md border border-cyan-400/25 bg-cyan-400/10 p-3 text-xs text-cyan-100">This budget item has financial rows in multiple fiscal years. All rows will move with it.</p> : null}
          {completed ? (
            <div className="rounded-md border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">
              <p>{completed.moved} record{completed.moved === 1 ? "" : "s"} moved to {completed.departmentName}.</p>
              {completed.warnings.length ? <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">{completed.warnings.map((warning) => <li key={`${warning.entityType}-${warning.entityId}`}>{warning.message}</li>)}</ul> : <p className="mt-1 text-xs">No linked department warnings.</p>}
            </div>
          ) : null}
          {message ? <p className="text-sm text-red-300">{message}</p> : null}
          <div className="flex justify-end gap-2 border-t border-border/70 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>{completed ? "Close" : "Cancel"}</Button>
            {!completed ? <Button type="button" disabled={isPending || !departmentId && !currentDepartment} onClick={submit}><MoveRight data-icon="inline-start" />{isPending ? "Moving…" : "Move records"}</Button> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

export function DepartmentMoveButton({ onClick }: { onClick: () => void }) {
  return <Button type="button" variant="outline" size="sm" onClick={onClick}><MoveRight data-icon="inline-start" /> Move Department</Button>;
}
