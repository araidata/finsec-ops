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
} as const;

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  trend: string;
  accent: keyof typeof accentStyles;
  icon: LucideIcon;
};

export function MetricCard({
  label,
  value,
  detail,
  trend,
  accent,
  icon: Icon,
}: MetricCardProps) {
  return (
    <Card className="rounded-lg border-border/80 bg-card/90 shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {label}
            </CardDescription>
            <CardTitle className="mt-2 font-mono text-2xl font-semibold tracking-normal text-foreground">
              {value}
            </CardTitle>
          </div>
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-lg border",
              accentStyles[accent]
            )}
          >
            <Icon aria-hidden="true" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        <span className="text-slate-300">{detail}</span>
        <span className="text-xs text-muted-foreground">{trend}</span>
      </CardContent>
    </Card>
  );
}
