import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { procurementQueue } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

const dotStyles = {
  blue: "bg-blue-400",
  teal: "bg-teal-400",
  amber: "bg-amber-400",
} as const;

export function ProcurementQueue() {
  return (
    <Card className="rounded-lg border-border/80 bg-card/90 shadow-none">
      <CardHeader className="border-b border-border/70 pb-4">
        <CardTitle className="text-base">Procurement Queue</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {procurementQueue.map((item) => (
          <div
            key={item.title}
            className="grid grid-cols-[auto_1fr_auto] gap-3 rounded-lg border border-border/60 bg-secondary/35 p-3"
          >
            <span
              className={cn(
                "mt-1 size-2 rounded-full shadow-[0_0_18px_currentColor]",
                dotStyles[item.accent]
              )}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-100">
                {item.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.owner} / {item.status}
              </p>
            </div>
            <span className="font-mono text-sm text-slate-200">
              {item.amount}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
