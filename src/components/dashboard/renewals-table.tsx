import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { upcomingRenewals } from "@/lib/dashboard-data";
import { StatusBadge } from "@/components/dashboard/status-badge";

export function RenewalsTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/80">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow className="border-border/80 bg-secondary/60 hover:bg-secondary/60">
            <TableHead>Vendor</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Renewal</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {upcomingRenewals.map((renewal) => (
            <TableRow key={renewal.vendor} className="border-border/70">
              <TableCell className="font-medium text-slate-100">
                {renewal.vendor}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {renewal.product}
              </TableCell>
              <TableCell>{renewal.owner}</TableCell>
              <TableCell className="font-mono text-xs">
                {renewal.window}
              </TableCell>
              <TableCell className="text-right font-mono">
                {renewal.amount}
              </TableCell>
              <TableCell>
                <StatusBadge status={renewal.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
