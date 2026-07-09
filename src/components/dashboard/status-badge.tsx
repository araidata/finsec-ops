import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  Approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  "On Track": "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  Review: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  Negotiating: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  "At Risk": "border-red-400/30 bg-red-400/10 text-red-300",
  Pending: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  Triage: "border-amber-400/30 bg-amber-400/10 text-amber-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md border px-2 font-mono text-[0.68rem]",
        statusStyles[status] ??
          "border-slate-400/30 bg-slate-400/10 text-slate-300"
      )}
    >
      {status}
    </Badge>
  );
}
