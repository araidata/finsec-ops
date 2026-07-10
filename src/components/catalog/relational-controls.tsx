"use client";

import { useActionState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  emptyActionResult,
  type ActionResult,
} from "@/lib/server/action-result";

export type Option = {
  id: string;
  label: string;
  active?: boolean;
  hint?: string;
  parentId?: string;
};

export function FormShell({
  title,
  action,
  children,
}: {
  title: string;
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  children: (state: ActionResult, pending: boolean) => ReactNode;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    emptyActionResult
  );

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-lg border border-border/80 bg-card/80 p-4"
    >
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      {children(state, pending)}
      <MutationError result={state} />
    </form>
  );
}

export function Field({
  label,
  name,
  defaultValue = "",
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-300">
      {label}
      <Input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="border-border/80 bg-secondary/45"
      />
    </label>
  );
}

export function TextBlock({
  label,
  name,
  defaultValue = "",
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-300">
      {label}
      <Textarea
        name={name}
        defaultValue={defaultValue}
        className="border-border/80 bg-secondary/45"
      />
    </label>
  );
}

export function SelectBox({
  label,
  name,
  options,
  defaultValue = "",
  includeNone = false,
  onChange,
}: {
  label: string;
  name: string;
  options: Option[];
  defaultValue?: string;
  includeNone?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-300">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-9 rounded-lg border border-border/80 bg-secondary/45 px-3 text-sm text-slate-100"
      >
        {includeNone ? <option value="none">None</option> : null}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
            {option.active === false ? " (inactive)" : ""}
            {option.hint ? ` - ${option.hint}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MultiSelect({
  label,
  name,
  options,
  defaultValues = [],
}: {
  label: string;
  name: string;
  options: Option[];
  defaultValues?: string[];
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-300">
      {label}
      <select
        name={name}
        multiple
        defaultValue={defaultValues}
        className="min-h-24 rounded-lg border border-border/80 bg-secondary/45 px-3 py-2 text-sm text-slate-100"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
            {option.active === false ? " (inactive)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ToggleField({
  name = "active",
  label = "Active",
  defaultChecked = true,
}: {
  name?: string;
  label?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-slate-300">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: ReactNode;
}) {
  return <Button disabled={pending}>{pending ? "Saving..." : children}</Button>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={active ? "text-emerald-300" : "text-amber-300"}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function LoadingState() {
  return <div className="text-sm text-muted-foreground">Loading...</div>;
}

export function MutationError({ result }: { result: ActionResult }) {
  if (!result.message) return null;
  return (
    <div
      className={
        result.ok
          ? "rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-2 text-xs text-emerald-200"
          : "rounded-lg border border-red-400/30 bg-red-400/10 p-2 text-xs text-red-200"
      }
    >
      {result.message}
      {result.fields ? (
        <ul className="mt-1 list-disc pl-4">
          {Object.entries(result.fields).map(([field, errors]) => (
            <li key={field}>
              {field}: {errors.join(", ")}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
