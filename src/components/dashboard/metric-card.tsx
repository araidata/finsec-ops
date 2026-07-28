import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const accentStyles = {
  teal: "border-teal-400/20 bg-teal-400/10 text-teal-300",
  amber: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  blue: "border-blue-400/20 bg-blue-400/10 text-blue-300",
  red: "border-red-400/20 bg-red-400/10 text-red-300",
  green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
} as const;

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  trend: string;
  accent: keyof typeof accentStyles;
  display: "ring" | "bar";
  icon: LucideIcon;
};

export function MetricCard({
  label,
  value,
  detail,
  trend,
  accent,
  display,
  icon: Icon,
}: MetricCardProps) {
  const ringColor =
    accent === "amber"
      ? "border-t-amber-400 border-r-amber-400"
      : "border-t-cyan-400 border-r-cyan-400";
  const barColor =
    accent === "green"
      ? "bg-emerald-400"
      : accent === "blue"
        ? "bg-blue-400"
        : "bg-cyan-400";

  return (
    <Card className="rounded-lg border-border/80 bg-card/90 shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription className="text-xs font-medium text-slate-300">
              {label}
            </CardDescription>
          </div>
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md border",
              accentStyles[accent]
            )}
          >
            <Icon aria-hidden="true" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-24 items-center gap-4 text-sm">
        {display === "ring" ? (
          <div
            className={cn(
              "size-20 shrink-0 rounded-full border-[10px] border-slate-800",
              ringColor
            )}
          aria-hidden="true"
          />
        ) : (
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="h-2 rounded-full bg-slate-800">
              <div className={cn("h-full w-2/3 rounded-full", barColor)} />
            </div>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <CardTitle className="font-mono text-2xl font-semibold tracking-normal text-foreground">
            {value}
          </CardTitle>
          <span className="text-sm text-slate-200">{detail}</span>
          <span
            className={cn(
              "text-xs",
              accent === "amber"
                ? "text-amber-300"
                : accent === "blue"
                  ? "text-red-300"
                  : "text-emerald-300"
            )}
          >
            {trend}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
