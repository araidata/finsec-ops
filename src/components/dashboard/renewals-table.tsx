import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DashboardRenewal } from "@/lib/server/dashboard-service";
import { StatusBadge } from "@/components/dashboard/status-badge";

export function RenewalsTable({ renewals }: { renewals: DashboardRenewal[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/80">
      <Table className="w-full min-w-[680px] table-fixed">
        <TableHeader>
          <TableRow className="border-border/80 bg-secondary/60 hover:bg-secondary/60">
            <TableHead className="w-[23%]">Vendor</TableHead>
            <TableHead className="w-[18%]">Product</TableHead>
            <TableHead className="w-[16%]">Owner</TableHead>
            <TableHead className="w-[23%]">Renewal</TableHead>
            <TableHead className="w-[10%] text-right">Amount</TableHead>
            <TableHead className="w-[10%]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {renewals.length ? renewals.map((renewal) => (
            <TableRow key={renewal.id} className="border-border/70">
              <TableCell className="font-medium text-slate-100">
                <div className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded bg-cyan-400/10 font-mono text-[0.65rem] text-cyan-200 ring-1 ring-cyan-400/25">
                    {renewal.vendor.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="truncate">{renewal.vendor}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                <span className="block truncate">{renewal.product}</span>
              </TableCell>
              <TableCell>
                <span className="block truncate">{renewal.owner}</span>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {renewal.renewalDate}
              </TableCell>
              <TableCell className="text-right font-mono">
                {renewal.amount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
              </TableCell>
              <TableCell>
                <StatusBadge status={renewal.status} />
              </TableCell>
            </TableRow>
          )) : <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No upcoming renewals are available for this context.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );
}
