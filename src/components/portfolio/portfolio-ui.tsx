import type { ChangeEvent, ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type SummaryCardProps = {
  label: string;
  value: string;
  detail?: string;
};

type FieldProps = {
  label: string;
  children: ReactNode;
};

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number" | "date";
};

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

type SelectFieldProps<T extends string> = {
  label: string;
  value: T | "All";
  options: readonly (T | { value: T; label: string })[];
  onChange: (value: T | "All") => void;
  includeAll?: boolean;
};

const badgeStyles: Record<string, string> = {
  Approved: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  Active: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  Critical: "border-red-400/20 bg-red-400/10 text-red-300",
  High: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  Medium: "border-blue-400/20 bg-blue-400/10 text-blue-300",
  Low: "border-slate-400/20 bg-slate-400/10 text-slate-300",
  Deferred: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  Rejected: "border-red-400/20 bg-red-400/10 text-red-300",
  Unfunded: "border-red-400/20 bg-red-400/10 text-red-300",
  "Over Budget": "border-red-400/20 bg-red-400/10 text-red-300",
  "Under Budget": "border-blue-400/20 bg-blue-400/10 text-blue-300",
  "Partially Approved": "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  "Under Review": "border-blue-400/20 bg-blue-400/10 text-blue-300",
  Retiring: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  Retired: "border-slate-400/20 bg-slate-400/10 text-slate-300",
};

export function SummaryCard({ label, value, detail }: SummaryCardProps) {
  return (
    <Card className="rounded-lg border-border/80 bg-card/90 shadow-none">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-mono text-2xl font-semibold text-slate-50">
          {value}
        </p>
        {detail ? (
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {detail}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ValueBadge({ value }: { value: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-border bg-secondary/50", badgeStyles[value])}
    >
      {value}
    </Badge>
  );
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium text-slate-300">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
}: TextFieldProps) {
  return (
    <Field label={label}>
      <Input
        value={value}
        type={type}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
        className="border-border/80 bg-secondary/45"
      />
    </Field>
  );
}

export function TextAreaField({ label, value, onChange }: TextAreaFieldProps) {
  return (
    <Field label={label}>
      <Textarea
        value={value}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
          onChange(event.target.value)
        }
        className="border-border/80 bg-secondary/45"
      />
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  includeAll = false,
}: SelectFieldProps<T>) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T | "All")}
        className="h-9 rounded-lg border border-border/80 bg-secondary/45 px-3 text-sm text-slate-100 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {includeAll ? <option value="All">All</option> : null}
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const label = typeof option === "string" ? option : option.label;

          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
    </Field>
  );
}

export function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <TextField
      label={label}
      value={String(value)}
      type="number"
      onChange={(nextValue) => onChange(Number(nextValue))}
    />
  );
}
