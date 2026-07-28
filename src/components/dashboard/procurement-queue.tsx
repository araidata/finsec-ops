import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DashboardProcurementItem } from "@/lib/server/dashboard-service";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/dashboard/status-badge";

const dotStyles = {
  blue: "bg-blue-400",
  teal: "bg-teal-400",
  amber: "bg-amber-400",
} as const;

export function ProcurementQueue({ items }: { items: DashboardProcurementItem[] }) {
  return (
    <Card className="rounded-lg border-border/80 bg-card/90 shadow-none">
      <CardHeader className="border-b border-border/70 pb-4">
        <CardTitle className="text-base">Procurement Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-border/80">
          <Table className="min-w-[620px]">
            <TableHeader>
              <TableRow className="border-border/80 bg-secondary/60 hover:bg-secondary/60">
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead className="text-right">Est. Amount</TableHead>
                <TableHead>Stage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length ? items.map((item) => (
                <TableRow key={item.id} className="border-border/70">
                  <TableCell className="font-medium text-slate-100">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "size-2 rounded-full shadow-[0_0_18px_currentColor]",
                          dotStyles[item.status.toLowerCase().includes("review") ? "blue" : item.status.toLowerCase().includes("triage") ? "amber" : "teal"]
                        )}
                      />
                      {item.title}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.category}
                  </TableCell>
                  <TableCell>{item.owner}</TableCell>
                  <TableCell className="text-right font-mono">
                    {item.amount}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No procurement requests are available for this context.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
