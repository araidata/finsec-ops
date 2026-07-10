"use client";

import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { WorkspaceShell } from "@/components/app/workspace-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  NumberField,
  SelectField,
  SummaryCard,
  TextAreaField,
  TextField,
  ValueBadge,
} from "@/components/portfolio/portfolio-ui";
import {
  calculateBudgetSummary,
  formatCurrency,
  getBudgetIndicator,
  groupBudgetByExpenseType,
  groupBudgetByProgram,
} from "@/lib/portfolio-analytics";
import {
  budgetItems as initialBudgetItems,
  portfolioResellers,
  portfolioVendors,
} from "@/lib/portfolio-data";
import type {
  BudgetCategory,
  BudgetItem,
  ExpenseType,
  FundingStatus,
} from "@/types/portfolio";
import {
  budgetCategories,
  expenseTypes,
  fundingStatuses,
} from "@/types/portfolio";

type SortKey =
  | "budgetYear"
  | "budgetCategory"
  | "expenseType"
  | "vendorId"
  | "budgetedAmount"
  | "forecastedAmount"
  | "actualAmount"
  | "fundingStatus"
  | "owner";

const emptyBudgetItem: BudgetItem = {
  id: "",
  budgetYear: "FY2027",
  budgetCategory: "Security Operations",
  expenseType: "Software / SaaS",
  vendorId: "rapid7",
  resellerId: undefined,
  productOrServiceName: "",
  description: "",
  budgetedAmount: 0,
  forecastedAmount: 0,
  actualAmount: 0,
  fundingStatus: "Planned",
  owner: "",
  businessJustification: "",
  riskIfNotFunded: "",
  notes: "",
};

const vendorOptions = portfolioVendors.map((vendor) => ({
  value: vendor.id,
  label: vendor.name,
}));

const resellerOptions = portfolioResellers.map((reseller) => ({
  value: reseller.id,
  label: reseller.name,
}));

function vendorName(vendorId: string): string {
  return (
    portfolioVendors.find((vendor) => vendor.id === vendorId)?.name ?? vendorId
  );
}

function resellerName(resellerId?: string): string {
  if (!resellerId || resellerId === "direct") {
    return "Direct";
  }

  return (
    portfolioResellers.find((reseller) => reseller.id === resellerId)?.name ??
    resellerId
  );
}

function compareBudgetItems(a: BudgetItem, b: BudgetItem, sortKey: SortKey) {
  const aValue = a[sortKey];
  const bValue = b[sortKey];

  if (typeof aValue === "number" && typeof bValue === "number") {
    return aValue - bValue;
  }

  return String(aValue).localeCompare(String(bValue));
}

export function BudgetManagement() {
  const [items, setItems] = useState<BudgetItem[]>(initialBudgetItems);
  const [draft, setDraft] = useState<BudgetItem>({
    ...emptyBudgetItem,
    id: "budget-new",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("budgetedAmount");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [yearFilter, setYearFilter] = useState<string | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<BudgetCategory | "All">(
    "All"
  );
  const [expenseFilter, setExpenseFilter] = useState<ExpenseType | "All">(
    "All"
  );
  const [statusFilter, setStatusFilter] = useState<FundingStatus | "All">(
    "All"
  );
  const [vendorFilter, setVendorFilter] = useState<string | "All">("All");
  const [resellerFilter, setResellerFilter] = useState<string | "All">("All");
  const [ownerFilter, setOwnerFilter] = useState<string | "All">("All");

  const years = useMemo(
    () => [...new Set(items.map((item) => item.budgetYear))],
    [items]
  );
  const owners = useMemo(
    () => [...new Set(items.map((item) => item.owner))],
    [items]
  );

  const filteredItems = useMemo(() => {
    return [...items]
      .filter((item) => yearFilter === "All" || item.budgetYear === yearFilter)
      .filter(
        (item) =>
          categoryFilter === "All" || item.budgetCategory === categoryFilter
      )
      .filter(
        (item) => expenseFilter === "All" || item.expenseType === expenseFilter
      )
      .filter(
        (item) => statusFilter === "All" || item.fundingStatus === statusFilter
      )
      .filter(
        (item) => vendorFilter === "All" || item.vendorId === vendorFilter
      )
      .filter((item) => {
        if (resellerFilter === "All") {
          return true;
        }

        return (item.resellerId ?? "direct") === resellerFilter;
      })
      .filter((item) => ownerFilter === "All" || item.owner === ownerFilter)
      .sort((a, b) => {
        const sorted = compareBudgetItems(a, b, sortKey);
        return sortDirection === "asc" ? sorted : -sorted;
      });
  }, [
    categoryFilter,
    expenseFilter,
    items,
    ownerFilter,
    resellerFilter,
    sortDirection,
    sortKey,
    statusFilter,
    vendorFilter,
    yearFilter,
  ]);

  const summary = calculateBudgetSummary(filteredItems);
  const byProgram = groupBudgetByProgram(filteredItems).slice(0, 6);
  const byExpenseType = groupBudgetByExpenseType(filteredItems).slice(0, 6);

  function toggleSort(nextSortKey: SortKey) {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection("asc");
  }

  function saveDraft() {
    const normalized: BudgetItem = {
      ...draft,
      id: editingId ?? `budget-${Date.now()}`,
      resellerId: draft.resellerId === "direct" ? undefined : draft.resellerId,
    };

    setItems((current) =>
      editingId
        ? current.map((item) => (item.id === editingId ? normalized : item))
        : [normalized, ...current]
    );
    setEditingId(null);
    setDraft({ ...emptyBudgetItem, id: "budget-new" });
  }

  function editItem(item: BudgetItem) {
    setEditingId(item.id);
    setDraft({ ...item, resellerId: item.resellerId ?? "direct" });
  }

  function deleteItem(itemId: string) {
    setItems((current) => current.filter((item) => item.id !== itemId));
    if (editingId === itemId) {
      setEditingId(null);
      setDraft({ ...emptyBudgetItem, id: "budget-new" });
    }
  }

  return (
    <WorkspaceShell
      title="Budget Management"
      description="Plan, forecast, and report cybersecurity spend by program category and expense type."
      actionLabel="New Budget Item"
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          label="Total Budgeted"
          value={formatCurrency(summary.totalBudgeted)}
        />
        <SummaryCard
          label="Total Forecasted"
          value={formatCurrency(summary.totalForecasted)}
        />
        <SummaryCard
          label="Total Actual"
          value={formatCurrency(summary.totalActual)}
        />
        <SummaryCard
          label="Variance"
          value={formatCurrency(summary.variance)}
        />
        <SummaryCard
          label="Approved Funding"
          value={formatCurrency(summary.approvedFunding)}
        />
        <SummaryCard
          label="Unfunded Amount"
          value={formatCurrency(summary.unfundedAmount)}
        />
      </section>

      <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle>
            {editingId ? "Edit Budget Item" : "Create Budget Item"}
          </CardTitle>
          <CardDescription>
            Tracks security program funding separately from purchase expense
            type.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextField
            label="Budget year"
            value={draft.budgetYear}
            onChange={(budgetYear) => setDraft({ ...draft, budgetYear })}
          />
          <SelectField
            label="Budget category"
            value={draft.budgetCategory}
            options={budgetCategories}
            onChange={(budgetCategory) =>
              setDraft({
                ...draft,
                budgetCategory: budgetCategory as BudgetCategory,
              })
            }
          />
          <SelectField
            label="Expense type"
            value={draft.expenseType}
            options={expenseTypes}
            onChange={(expenseType) =>
              setDraft({ ...draft, expenseType: expenseType as ExpenseType })
            }
          />
          <SelectField
            label="Funding status"
            value={draft.fundingStatus}
            options={fundingStatuses}
            onChange={(fundingStatus) =>
              setDraft({
                ...draft,
                fundingStatus: fundingStatus as FundingStatus,
              })
            }
          />
          <SelectField
            label="Vendor"
            value={draft.vendorId}
            options={vendorOptions}
            onChange={(vendorId) => setDraft({ ...draft, vendorId })}
          />
          <SelectField
            label="Reseller"
            value={draft.resellerId ?? "direct"}
            options={resellerOptions}
            onChange={(resellerId) => setDraft({ ...draft, resellerId })}
          />
          <TextField
            label="Product or service"
            value={draft.productOrServiceName}
            onChange={(productOrServiceName) =>
              setDraft({ ...draft, productOrServiceName })
            }
          />
          <TextField
            label="Owner"
            value={draft.owner}
            onChange={(owner) => setDraft({ ...draft, owner })}
          />
          <NumberField
            label="Budgeted amount"
            value={draft.budgetedAmount}
            onChange={(budgetedAmount) =>
              setDraft({ ...draft, budgetedAmount })
            }
          />
          <NumberField
            label="Forecasted amount"
            value={draft.forecastedAmount}
            onChange={(forecastedAmount) =>
              setDraft({ ...draft, forecastedAmount })
            }
          />
          <NumberField
            label="Actual amount"
            value={draft.actualAmount}
            onChange={(actualAmount) => setDraft({ ...draft, actualAmount })}
          />
          <TextAreaField
            label="Description"
            value={draft.description}
            onChange={(description) => setDraft({ ...draft, description })}
          />
          <TextAreaField
            label="Business justification"
            value={draft.businessJustification}
            onChange={(businessJustification) =>
              setDraft({ ...draft, businessJustification })
            }
          />
          <TextAreaField
            label="Risk if not funded"
            value={draft.riskIfNotFunded}
            onChange={(riskIfNotFunded) =>
              setDraft({ ...draft, riskIfNotFunded })
            }
          />
          <TextAreaField
            label="Notes"
            value={draft.notes}
            onChange={(notes) => setDraft({ ...draft, notes })}
          />
          <div className="flex items-end gap-2">
            <Button onClick={saveDraft}>
              {editingId ? "Save Changes" : "Create Item"}
            </Button>
            {editingId ? (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setDraft({ ...emptyBudgetItem, id: "budget-new" });
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle>Budget Items</CardTitle>
          <CardDescription>
            Filterable and sortable plan with direct and reseller-supported
            spend.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <SelectField
              label="Budget year"
              value={yearFilter}
              options={years}
              includeAll
              onChange={setYearFilter}
            />
            <SelectField
              label="Budget category"
              value={categoryFilter}
              options={budgetCategories}
              includeAll
              onChange={setCategoryFilter}
            />
            <SelectField
              label="Expense type"
              value={expenseFilter}
              options={expenseTypes}
              includeAll
              onChange={setExpenseFilter}
            />
            <SelectField
              label="Funding status"
              value={statusFilter}
              options={fundingStatuses}
              includeAll
              onChange={setStatusFilter}
            />
            <SelectField
              label="Vendor"
              value={vendorFilter}
              options={vendorOptions}
              includeAll
              onChange={setVendorFilter}
            />
            <SelectField
              label="Reseller"
              value={resellerFilter}
              options={resellerOptions}
              includeAll
              onChange={setResellerFilter}
            />
            <SelectField
              label="Owner"
              value={ownerFilter}
              options={owners}
              includeAll
              onChange={setOwnerFilter}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                {[
                  ["budgetYear", "Year"],
                  ["budgetCategory", "Category"],
                  ["expenseType", "Expense"],
                  ["vendorId", "Vendor"],
                  ["budgetedAmount", "Budgeted"],
                  ["actualAmount", "Actual"],
                  ["fundingStatus", "Status"],
                  ["owner", "Owner"],
                ].map(([key, label]) => (
                  <TableHead key={key}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort(key as SortKey)}
                    >
                      <ArrowUpDown data-icon="inline-start" />
                      {label}
                    </Button>
                  </TableHead>
                ))}
                <TableHead>Indicator</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono">{item.budgetYear}</TableCell>
                  <TableCell>{item.budgetCategory}</TableCell>
                  <TableCell>{item.expenseType}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{vendorName(item.vendorId)}</span>
                      <span className="text-xs text-muted-foreground">
                        {resellerName(item.resellerId)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(item.budgetedAmount)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(item.actualAmount)}
                  </TableCell>
                  <TableCell>
                    <ValueBadge value={item.fundingStatus} />
                  </TableCell>
                  <TableCell>{item.owner}</TableCell>
                  <TableCell>
                    <ValueBadge value={getBudgetIndicator(item)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Edit ${item.productOrServiceName}`}
                        onClick={() => editItem(item)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        aria-label={`Delete ${item.productOrServiceName}`}
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle>Reporting By Security Program Area</CardTitle>
            <CardDescription>
              Separates workforce awareness from security staff development.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {byProgram.map((row) => (
              <div
                key={row.label}
                className="grid gap-2 rounded-lg border border-border/70 bg-secondary/30 p-3 sm:grid-cols-[1fr_auto_auto_auto]"
              >
                <span className="text-sm font-medium text-slate-100">
                  {row.label}
                </span>
                <span className="font-mono text-sm">
                  {formatCurrency(row.budgeted)}
                </span>
                <span className="font-mono text-sm text-muted-foreground">
                  F {formatCurrency(row.forecasted)}
                </span>
                <span className="font-mono text-sm text-muted-foreground">
                  A {formatCurrency(row.actual)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle>Reporting By Expense Type</CardTitle>
            <CardDescription>
              Shows spend type independently from funded security function.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {byExpenseType.map((row) => (
              <div
                key={row.label}
                className="grid gap-2 rounded-lg border border-border/70 bg-secondary/30 p-3 sm:grid-cols-[1fr_auto_auto_auto]"
              >
                <span className="text-sm font-medium text-slate-100">
                  {row.label}
                </span>
                <span className="font-mono text-sm">
                  {formatCurrency(row.budgeted)}
                </span>
                <span className="font-mono text-sm text-muted-foreground">
                  F {formatCurrency(row.forecasted)}
                </span>
                <span className="font-mono text-sm text-muted-foreground">
                  A {formatCurrency(row.actual)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </WorkspaceShell>
  );
}
