"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Copy,
  FilePlus2,
  PanelRightOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import {
  archiveContractAction,
  createRenewalFromContractAction,
  deleteContractLineAction,
  duplicateContractLineAction,
  reorderContractLinesAction,
  saveContractAction,
  saveContractLineAction,
} from "@/app/contracts/actions";
import { WorkspaceShell } from "@/components/app/workspace-shell";
import {
  EmptyState,
  Field,
  FormShell,
  SelectBox,
  SubmitButton,
  TextBlock,
  ToggleField,
  type Option,
} from "@/components/catalog/relational-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { emptyActionResult } from "@/lib/server/action-result";

type ContractData = Record<string, any>;
type SortKey =
  | "title"
  | "vendor"
  | "seller"
  | "startsOn"
  | "endsOn"
  | "annualValue"
  | "totalValue"
  | "notice"
  | "status"
  | "owner";

function money(value: unknown) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function numberValue(value: unknown) {
  return Number(value ?? 0);
}

function dateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function daysUntil(value?: string | null) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${dateOnly(value)}T00:00:00.000`);
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
}

function noticeDeadline(contract: any) {
  const anchor = contract.renewalDate ?? contract.endsOn;
  if (!anchor) return "";
  const date = new Date(`${dateOnly(anchor)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - Number(contract.noticePeriodDays ?? 60));
  return date.toISOString().slice(0, 10);
}

function titleCaseEnum(value?: string | null) {
  if (!value) return "None";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function badgeTone(value: string) {
  if (["CRITICAL", "HIGH", "EXPIRING_SOON", "TERMINATED"].includes(value)) {
    return "border-red-400/40 bg-red-400/10 text-red-200";
  }
  if (["MEDIUM", "RENEWING", "PENDING"].includes(value)) {
    return "border-amber-400/40 bg-amber-400/10 text-amber-200";
  }
  if (["ACTIVE", "LOW", "Renewed"].includes(value)) {
    return "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";
  }
  return "border-cyan-400/30 bg-cyan-400/10 text-cyan-100";
}

function StatusBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-muted-foreground">None</span>;
  return (
    <Badge
      variant="outline"
      className={`${badgeTone(value)} whitespace-nowrap rounded px-1.5 py-0 font-mono text-[0.65rem]`}
    >
      {value.includes("_") ? titleCaseEnum(value) : value}
    </Badge>
  );
}

function roleOptions(companies: any[], roleName: string): Option[] {
  return companies
    .filter((company) =>
      company.roles?.some((role: any) => role.role === roleName)
    )
    .map((company) => ({
      id: company.id,
      label: company.name,
      active: company.active,
    }));
}

function optionRows(rows: any[], label: (row: any) => string): Option[] {
  return rows.map((row) => ({
    id: row.id,
    label: label(row),
    active: row.active,
    parentId: row.vendorCompanyId ?? row.productId,
  }));
}

function renewalStatus(contract: any) {
  const renewals = contract.maintenanceRenewals ?? [];
  if (!renewals.length) return "Renewal Not Created";
  if (
    renewals.some(
      (renewal: any) =>
        renewal.overallStatus === "NOT_RENEWING" ||
        renewal.approvedDisposition === "DO_NOT_RENEW" ||
        renewal.approvedDisposition === "DECOMMISSION"
    )
  ) {
    return "Not Renewing";
  }
  if (renewals.some((renewal: any) => renewal.overallStatus === "COMPLETED")) {
    return "Renewed";
  }
  return "Renewal In Progress";
}

function compareContracts(a: any, b: any, sortKey: SortKey) {
  const value = (contract: any) => {
    if (sortKey === "vendor") return contract.vendorCompany?.name ?? "";
    if (sortKey === "seller") return contract.sellerCompany?.name ?? "Direct";
    if (sortKey === "notice") return noticeDeadline(contract);
    if (sortKey === "owner") return contract.businessOwner ?? "";
    if (sortKey === "annualValue" || sortKey === "totalValue") {
      return Number(contract[sortKey] ?? 0);
    }
    return contract[sortKey] ?? "";
  };
  const aValue = value(a);
  const bValue = value(b);
  if (typeof aValue === "number" && typeof bValue === "number") {
    return aValue - bValue;
  }
  return String(aValue).localeCompare(String(bValue));
}

function renewalWindow(contract: any) {
  const days = daysUntil(contract.renewalDate ?? contract.endsOn);
  if (days === null) return "No date";
  if (days < 0) return "Past due";
  if (days <= 30) return "30 days";
  if (days <= 60) return "60 days";
  if (days <= 90) return "90 days";
  return "Later";
}

export function ContractsManagement({ data }: { data: ContractData }) {
  const contracts = data.contracts as any[];
  const [query, setQuery] = useState("");
  const [vendorFilter, setVendorFilter] = useState("All");
  const [sellerFilter, setSellerFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [windowFilter, setWindowFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("endsOn");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedId, setSelectedId] = useState(contracts[0]?.id ?? "");
  const [editContract, setEditContract] = useState<any | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [lineEdit, setLineEdit] = useState<any | null>(null);
  const [renewalOpen, setRenewalOpen] = useState(false);

  useEffect(() => {
    if (editContract) {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editContract]);

  const openContractEditor = (contract: any) => {
    setEditContract(contract);
    setDetailOpen(false);
  };

  const selected =
    contracts.find((contract) => contract.id === selectedId) ?? contracts[0];
  const vendorOptions = roleOptions(data.companies, "VENDOR");
  const sellerOptions = roleOptions(data.companies, "RESELLER");
  const productOptions = optionRows(
    data.products,
    (product) =>
      `${product.name}${product.vendorCompany?.name ? ` / ${product.vendorCompany.name}` : ""}`
  );
  const moduleOptions = optionRows(
    data.modules,
    (module) => `${module.product?.name ?? "Product"} / ${module.name}`
  );
  const fiscalOptions = optionRows(data.fiscalYears, (fy) => fy.label);
  const budgetPlanOptions = optionRows(
    data.budgetPlans,
    (plan) => `${plan.fiscalYear.label} / ${plan.name} ${plan.version}`
  );
  const accountOptions = optionRows(
    data.budgetAccounts,
    (account) => `${account.code} ${account.name}`
  );
  const annualOptions = optionRows(
    data.annualFinancials,
    (row) =>
      `${row.budgetPlan.name} / ${titleCaseEnum(row.scenario.label)} / ${row.account.code} / ${row.budgetItem.name}`
  );

  const owners = useMemo(
    () =>
      Array.from(
        new Set(contracts.map((contract) => contract.businessOwner).filter(Boolean))
      ),
    [contracts]
  );

  const filtered = useMemo(() => {
    const lowerQuery = query.toLowerCase();
    return [...contracts]
      .filter((contract) => {
        const haystack = [
          contract.title,
          contract.contractNumber,
          contract.vendorCompany?.name,
          contract.sellerCompany?.name,
          contract.businessOwner,
          contract.securityOwner,
          contract.procurementContact,
          renewalStatus(contract),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return !lowerQuery || haystack.includes(lowerQuery);
      })
      .filter(
        (contract) =>
          vendorFilter === "All" || contract.vendorCompanyId === vendorFilter
      )
      .filter(
        (contract) =>
          sellerFilter === "All" ||
          (contract.sellerCompanyId ?? "direct") === sellerFilter
      )
      .filter(
        (contract) => statusFilter === "All" || contract.status === statusFilter
      )
      .filter(
        (contract) =>
          windowFilter === "All" || renewalWindow(contract) === windowFilter
      )
      .sort((a, b) => {
        const sorted = compareContracts(a, b, sortKey);
        return sortDirection === "asc" ? sorted : -sorted;
      });
  }, [
    contracts,
    query,
    sellerFilter,
    sortDirection,
    sortKey,
    statusFilter,
    vendorFilter,
    windowFilter,
  ]);

  const metrics = [
    {
      label: "Active",
      value: contracts.filter((contract) => contract.status === "ACTIVE").length,
    },
    {
      label: "Annual Value",
      value: money(
        contracts.reduce(
          (total, contract) => total + numberValue(contract.annualValue),
          0
        )
      ),
    },
    {
      label: "Total Value",
      value: money(
        contracts.reduce(
          (total, contract) => total + numberValue(contract.totalValue),
          0
        )
      ),
    },
    {
      label: "Due 90",
      value: contracts.filter((contract) =>
        ["30 days", "60 days", "90 days"].includes(renewalWindow(contract))
      ).length,
    },
    {
      label: "No Renewal",
      value: contracts.filter(
        (contract) => renewalStatus(contract) === "Renewal Not Created"
      ).length,
    },
    {
      label: "High Risk",
      value: contracts.filter((contract) =>
        ["HIGH", "CRITICAL"].includes(contract.renewalRiskLevel)
      ).length,
    },
    {
      label: "Line Items",
      value: contracts.reduce(
        (total, contract) => total + (contract.lineItems?.length ?? 0),
        0
      ),
    },
    {
      label: "Direct",
      value: money(
        contracts
          .filter((contract) => !contract.sellerCompanyId)
          .reduce(
            (total, contract) => total + numberValue(contract.annualValue),
            0
          )
      ),
    },
  ];

  function toggleSort(nextSortKey: SortKey) {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextSortKey);
    setSortDirection("asc");
  }

  return (
    <WorkspaceShell
      title="Contracts"
      description="Commercial contract source of truth for current term pricing, product scope, and renewal handoff."
      actionLabel="New Contract"
    >
      <div className="grid min-w-0 gap-3">
        <MetricRail metrics={metrics} />

        <div className="min-w-0 overflow-hidden rounded-lg border border-border/80 bg-card/95">
          <div className="flex flex-wrap items-end gap-2 border-b border-border/80 p-3">
            <div className="relative min-w-72 flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                aria-label="Search contracts"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search contract, vendor, reseller, owner, status"
                className="h-9 border-border/80 bg-secondary/45 pl-8"
              />
            </div>
            <ToolbarSelect
              label="Vendor"
              value={vendorFilter}
              options={[{ id: "All", label: "All" }, ...vendorOptions]}
              onChange={setVendorFilter}
            />
            <ToolbarSelect
              label="Reseller"
              value={sellerFilter}
              options={[
                { id: "All", label: "All" },
                { id: "direct", label: "Direct" },
                ...sellerOptions,
              ]}
              onChange={setSellerFilter}
            />
            <ToolbarSelect
              label="Status"
              value={statusFilter}
              options={[
                { id: "All", label: "All" },
                ...data.optionSets.contractStatuses.map((status: string) => ({
                  id: status,
                  label: titleCaseEnum(status),
                })),
              ]}
              onChange={setStatusFilter}
            />
            <ToolbarSelect
              label="Window"
              value={windowFilter}
              options={[
                "All",
                "Past due",
                "30 days",
                "60 days",
                "90 days",
                "Later",
              ].map((value) => ({ id: value, label: value }))}
              onChange={setWindowFilter}
            />
            <Button
              className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              onClick={() => openContractEditor({})}
            >
              <Plus data-icon="inline-start" />
              New Contract
            </Button>
          </div>

          <ContractsTable
            contracts={filtered}
            selectedId={selected?.id}
            sortKey={sortKey}
            toggleSort={toggleSort}
            setSelectedId={setSelectedId}
            openDetail={() => setDetailOpen(true)}
            editContract={openContractEditor}
            openRenewal={(contract) => {
              setSelectedId(contract.id);
              setRenewalOpen(true);
            }}
          />
        </div>

        {selected ? (
          <SelectedContractSummary contract={selected} owners={owners} />
        ) : (
          <EmptyState>
            No contracts match the current filters. Adjust the toolbar or create
            a contract from the editor panel.
          </EmptyState>
        )}

        {editContract ? (
          <div ref={editorRef}>
            <ContractEditorPanel
              contract={editContract}
              vendorOptions={vendorOptions}
              sellerOptions={sellerOptions}
              data={data}
              onCancel={() => setEditContract(null)}
            />
          </div>
        ) : null}
      </div>
      <ContractDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        contract={selected}
        productOptions={productOptions}
        moduleOptions={moduleOptions}
        data={data}
        onEditContract={openContractEditor}
        onEditLine={(line) => setLineEdit(line)}
        onNewLine={() =>
          setLineEdit({
            contractId: selected?.id,
            sortOrder: selected?.lineItems?.length ?? 0,
            renewable: true,
          })
        }
        onRenewal={() => setRenewalOpen(true)}
      />
      <LineItemSheet
        open={Boolean(lineEdit)}
        onOpenChange={(open) => !open && setLineEdit(null)}
        line={lineEdit}
        contract={selected}
        productOptions={productOptions}
        moduleOptions={moduleOptions}
        data={data}
      />
      <CreateRenewalSheet
        open={renewalOpen}
        onOpenChange={setRenewalOpen}
        contract={selected}
        fiscalOptions={fiscalOptions}
        budgetPlanOptions={budgetPlanOptions}
        accountOptions={accountOptions}
        annualOptions={annualOptions}
      />
    </WorkspaceShell>
  );
}

function MetricRail({
  metrics,
}: {
  metrics: Array<{ label: string; value: string | number }>;
}) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-lg border border-border/80 bg-card/95">
      <div className="grid min-w-[1040px] grid-cols-8 divide-x divide-border/70">
        {metrics.map((metric) => (
          <div key={metric.label} className="px-3 py-2">
            <p className="text-[0.64rem] uppercase tracking-[0.12em] text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-slate-50">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolbarSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-40 flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-lg border border-border/80 bg-secondary/45 px-3 text-sm text-slate-100"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ContractsTable({
  contracts,
  selectedId,
  sortKey,
  toggleSort,
  setSelectedId,
  openDetail,
  editContract,
  openRenewal,
}: {
  contracts: any[];
  selectedId?: string;
  sortKey: SortKey;
  toggleSort: (key: SortKey) => void;
  setSelectedId: (value: string) => void;
  openDetail: () => void;
  editContract: (contract: any) => void;
  openRenewal: (contract: any) => void;
}) {
  const columns: Array<[SortKey, string, string]> = [
    ["title", "Contract", "w-72"],
    ["vendor", "Vendor", "w-56"],
    ["seller", "Reseller", "w-52"],
    ["startsOn", "Start", "w-32"],
    ["endsOn", "End", "w-32"],
    ["annualValue", "Annual Value", "w-36"],
    ["totalValue", "Total Value", "w-36"],
    ["notice", "Notice", "w-32"],
    ["status", "Renewal Status", "w-40"],
    ["owner", "Owner", "w-44"],
  ];

  return (
    <div className="w-full max-w-full overflow-auto">
      <div className="max-h-[620px] min-w-[1580px]">
        <Table className="min-w-[1580px] text-xs">
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="border-border/80">
              {columns.map(([key, label, width]) => (
                <TableHead key={key} className={width}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1 text-xs"
                    onClick={() => toggleSort(key)}
                  >
                    <ArrowUpDown data-icon="inline-start" />
                    {label}
                    {sortKey === key ? <span className="sr-only">sorted</span> : null}
                  </Button>
                </TableHead>
              ))}
              <TableHead className="w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => {
              const selected = contract.id === selectedId;
              return (
                <TableRow
                  key={contract.id}
                  className={`cursor-pointer border-border/60 ${selected ? "bg-cyan-400/12" : "hover:bg-secondary/35"}`}
                  onClick={() => setSelectedId(contract.id)}
                >
                  <TableCell className="sticky left-0 z-[2] bg-card font-medium text-slate-100">
                    <button
                      className="grid text-left"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedId(contract.id);
                        openDetail();
                      }}
                    >
                      <span>{contract.title}</span>
                      <span className="font-mono text-[0.68rem] text-muted-foreground">
                        {contract.contractNumber ?? "No number"} /{" "}
                        {contract.lineItems?.length ?? 0} lines
                      </span>
                    </button>
                  </TableCell>
                  <TableCell>{contract.vendorCompany?.name ?? "Unassigned"}</TableCell>
                  <TableCell>{contract.sellerCompany?.name ?? "Direct"}</TableCell>
                  <TableCell className="font-mono">{dateOnly(contract.startsOn)}</TableCell>
                  <TableCell className="font-mono">{dateOnly(contract.endsOn)}</TableCell>
                  <TableCell className="font-mono text-right">
                    {money(contract.annualValue)}
                  </TableCell>
                  <TableCell className="font-mono text-right">
                    {money(contract.totalValue)}
                  </TableCell>
                  <TableCell className="font-mono">{noticeDeadline(contract)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <StatusBadge value={renewalStatus(contract)} />
                      <StatusBadge value={contract.status} />
                    </div>
                  </TableCell>
                  <TableCell>{contract.businessOwner ?? "Unassigned"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Open ${contract.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedId(contract.id);
                          openDetail();
                        }}
                      >
                        <PanelRightOpen />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Edit ${contract.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          editContract(contract);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Create renewal for ${contract.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          openRenewal(contract);
                        }}
                      >
                        <FilePlus2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SelectedContractSummary({
  contract,
  owners,
}: {
  contract: any;
  owners: string[];
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-border/80 bg-card/95 p-3 lg:grid-cols-[1fr_1fr_1fr]">
      <Fact label="Selected Contract" value={contract.title} />
      <Fact label="Vendor" value={contract.vendorCompany?.name ?? "Unassigned"} />
      <Fact label="Reseller" value={contract.sellerCompany?.name ?? "Direct"} />
      <Fact label="Annual Value" value={money(contract.annualValue)} />
      <Fact label="Total Value" value={money(contract.totalValue)} />
      <Fact label="Renewal Status" value={renewalStatus(contract)} />
      <Fact label="Notice Deadline" value={noticeDeadline(contract) || "None"} />
      <Fact label="Line Items" value={String(contract.lineItems?.length ?? 0)} />
      <Fact label="Known Owners" value={owners.length ? owners.join(", ") : "None"} />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.64rem] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="truncate text-sm text-slate-100">{value}</p>
    </div>
  );
}

function ContractEditorPanel({
  contract,
  vendorOptions,
  sellerOptions,
  data,
  onCancel,
}: {
  contract?: any;
  vendorOptions: Option[];
  sellerOptions: Option[];
  data: ContractData;
  onCancel: () => void;
}) {
  return (
    <section className="rounded-lg border border-border/80 bg-card/95">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/80 p-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            {contract?.id ? "Edit Contract" : "Create Contract"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Header fields only. Product scope and pricing are managed as line
            items from the detail drawer.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Close Editor
        </Button>
      </div>
      <div className="p-3">
        <FormShell title="Contract Header" action={saveContractAction}>
          {(_state, pending) => (
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
              <input type="hidden" name="id" value={contract?.id ?? ""} />
              <Field label="Contract name" name="title" defaultValue={contract?.title ?? ""} />
              <Field
                label="Contract number"
                name="contractNumber"
                defaultValue={contract?.contractNumber ?? ""}
              />
              <SelectBox
                label="Vendor"
                name="vendorCompanyId"
                options={vendorOptions}
                defaultValue={contract?.vendorCompanyId ?? vendorOptions[0]?.id}
              />
              <SelectBox
                label="Reseller or Direct"
                name="sellerCompanyId"
                options={sellerOptions}
                includeNone
                defaultValue={contract?.sellerCompanyId ?? "none"}
              />
              <SelectBox
                label="Contract type"
                name="contractType"
                options={enumOptions(data.optionSets.contractTypes)}
                defaultValue={contract?.contractType ?? "SAAS"}
              />
              <SelectBox
                label="Contract status"
                name="status"
                options={enumOptions(data.optionSets.contractStatuses)}
                defaultValue={contract?.status ?? "PENDING"}
              />
              <Field label="Start date" name="startsOn" type="date" defaultValue={dateOnly(contract?.startsOn)} />
              <Field label="End date" name="endsOn" type="date" defaultValue={dateOnly(contract?.endsOn)} />
              <Field
                label="Renewal date"
                name="renewalDate"
                type="date"
                defaultValue={dateOnly(contract?.renewalDate)}
              />
              <Field
                label="Notice days"
                name="noticePeriodDays"
                type="number"
                defaultValue={Number(contract?.noticePeriodDays ?? 60)}
              />
              <SelectBox
                label="Payment frequency"
                name="paymentFrequency"
                options={enumOptions(data.optionSets.paymentFrequencies)}
                defaultValue={contract?.paymentFrequency ?? "ANNUAL"}
              />
              <SelectBox
                label="Renewal risk"
                name="renewalRiskLevel"
                options={enumOptions(data.optionSets.renewalRisks)}
                defaultValue={contract?.renewalRiskLevel ?? "LOW"}
              />
              <Field
                label="Contract owner"
                name="contractOwner"
                defaultValue={contract?.contractOwner ?? contract?.owner?.name ?? ""}
              />
              <Field label="Business owner" name="businessOwner" defaultValue={contract?.businessOwner ?? ""} />
              <Field label="Security owner" name="securityOwner" defaultValue={contract?.securityOwner ?? ""} />
              <Field
                label="Procurement contact"
                name="procurementContact"
                defaultValue={contract?.procurementContact ?? ""}
              />
              <Field
                label="Vendor account manager"
                name="vendorAccountManager"
                defaultValue={contract?.vendorAccountManager ?? ""}
              />
              <Field
                label="Reseller account manager"
                name="resellerAccountManager"
                defaultValue={contract?.resellerAccountManager ?? ""}
              />
              <ToggleField
                name="autoRenewal"
                label="Auto-renewal"
                defaultChecked={contract?.autoRenewal ?? false}
              />
              <div className="md:col-span-3 xl:col-span-2">
                <TextBlock
                  label="Renewal strategy"
                  name="renewalStrategy"
                  defaultValue={contract?.renewalStrategy ?? ""}
                />
              </div>
              <div className="md:col-span-3 xl:col-span-2">
                <TextBlock label="Notes" name="notesText" defaultValue={contract?.notesText ?? ""} />
              </div>
              <div className="flex gap-2 md:col-span-3 xl:col-span-4">
                <SubmitButton pending={pending}>Save Contract</SubmitButton>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </FormShell>
      </div>
    </section>
  );
}

function ContractDetailSheet({
  open,
  onOpenChange,
  contract,
  productOptions,
  moduleOptions,
  data,
  onEditContract,
  onEditLine,
  onNewLine,
  onRenewal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: any;
  productOptions: Option[];
  moduleOptions: Option[];
  data: ContractData;
  onEditContract: (contract: any) => void;
  onEditLine: (line: any) => void;
  onNewLine: () => void;
  onRenewal: () => void;
}) {
  const [tab, setTab] = useState("Products & Pricing");
  if (!contract) return null;
  const contractProductOptions = productOptions.filter(
    (option) => !contract.vendorCompanyId || option.parentId === contract.vendorCompanyId
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-border bg-popover/98 sm:max-w-6xl">
        <SheetHeader className="border-b border-border/80">
          <SheetTitle>{contract.title}</SheetTitle>
          <SheetDescription>
            Current commercial term, line-item scope, documents, and renewal
            history.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-3 overflow-auto px-4 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1">
              {["Overview", "Products & Pricing", "Documents", "Renewal History"].map(
                (item) => (
                  <Button
                    key={item}
                    variant={tab === item ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTab(item)}
                  >
                    {item}
                  </Button>
                )
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onEditContract(contract)}>
                <Pencil data-icon="inline-start" />
                Edit Header
              </Button>
              <Button variant="outline" onClick={onRenewal}>
                <FilePlus2 data-icon="inline-start" />
                Create Renewal
              </Button>
              <ArchiveContractForm contractId={contract.id} />
            </div>
          </div>

          {tab === "Overview" ? <OverviewTab contract={contract} /> : null}
          {tab === "Products & Pricing" ? (
            <PricingTab
              contract={contract}
              productOptions={contractProductOptions}
              moduleOptions={moduleOptions}
              data={data}
              onEditLine={onEditLine}
              onNewLine={onNewLine}
            />
          ) : null}
          {tab === "Documents" ? <DocumentsTab contract={contract} /> : null}
          {tab === "Renewal History" ? <RenewalHistoryTab contract={contract} /> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function OverviewTab({ contract }: { contract: any }) {
  return (
    <div className="grid gap-3 rounded-lg border border-border/80 bg-card/80 p-3 md:grid-cols-3">
      <Fact label="Vendor" value={contract.vendorCompany?.name ?? "Unassigned"} />
      <Fact label="Reseller" value={contract.sellerCompany?.name ?? "Direct"} />
      <Fact label="Term" value={`${dateOnly(contract.startsOn)} to ${dateOnly(contract.endsOn)}`} />
      <Fact label="Annual Value" value={money(contract.annualValue)} />
      <Fact label="Total Value" value={money(contract.totalValue)} />
      <Fact label="Payment" value={titleCaseEnum(contract.paymentFrequency)} />
      <Fact label="Business Owner" value={contract.businessOwner ?? "Unassigned"} />
      <Fact label="Security Owner" value={contract.securityOwner ?? "Unassigned"} />
      <Fact label="Procurement" value={contract.procurementContact ?? "Unassigned"} />
      <div className="md:col-span-3">
        <p className="text-[0.64rem] uppercase tracking-[0.12em] text-muted-foreground">
          Renewal Strategy
        </p>
        <p className="text-sm leading-5 text-slate-100">
          {contract.renewalStrategy ?? "No strategy recorded."}
        </p>
      </div>
    </div>
  );
}

function PricingTab({
  contract,
  productOptions,
  moduleOptions,
  data,
  onEditLine,
  onNewLine,
}: {
  contract: any;
  productOptions: Option[];
  moduleOptions: Option[];
  data: ContractData;
  onEditLine: (line: any) => void;
  onNewLine: () => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-100">Products & Pricing</p>
          <p className="text-xs text-muted-foreground">
            Header values are synchronized from these line-item amounts.
          </p>
        </div>
        <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={onNewLine}>
          <Plus data-icon="inline-start" />
          Add Line
        </Button>
      </div>
      <div className="overflow-auto rounded-lg border border-border/80">
        <Table className="min-w-[1320px] text-xs">
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead className="w-52">Product</TableHead>
              <TableHead className="w-52">Component</TableHead>
              <TableHead className="w-64">Description</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Metric</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Annual</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Renewable</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(contract.lineItems ?? []).map((line: any, index: number) => (
              <TableRow key={line.id} className="border-border/60">
                <TableCell>{line.product?.name ?? "Unassigned"}</TableCell>
                <TableCell>{line.productModule?.name ?? "None"}</TableCell>
                <TableCell>{line.description}</TableCell>
                <TableCell className="font-mono">{line.sku ?? ""}</TableCell>
                <TableCell className="font-mono text-right">{line.quantity}</TableCell>
                <TableCell>{titleCaseEnum(line.licenseMetric)}</TableCell>
                <TableCell className="font-mono text-right">{money(line.unitPrice)}</TableCell>
                <TableCell className="font-mono text-right">{money(line.annualAmount)}</TableCell>
                <TableCell className="font-mono text-right">{money(line.totalAmount)}</TableCell>
                <TableCell className="font-mono">{dateOnly(line.startsOn)}</TableCell>
                <TableCell className="font-mono">{dateOnly(line.endsOn)}</TableCell>
                <TableCell>
                  <StatusBadge value={line.renewable ? "Yes" : "No"} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Edit ${line.description}`}
                      onClick={() => onEditLine(line)}
                    >
                      <Pencil />
                    </Button>
                    <DuplicateLineForm lineId={line.id} />
                    <ReorderLineForm
                      contractId={contract.id}
                      lineItems={contract.lineItems}
                      index={index}
                      direction="up"
                    />
                    <ReorderLineForm
                      contractId={contract.id}
                      lineItems={contract.lineItems}
                      index={index}
                      direction="down"
                    />
                    <DeleteLineForm lineId={line.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="grid gap-3 rounded-lg border border-border/80 bg-secondary/30 p-3 md:grid-cols-4">
        <Fact label="Vendor-filtered Products" value={String(productOptions.length)} />
        <Fact label="Available Components" value={String(moduleOptions.length)} />
        <Fact label="Annual Total" value={money(contract.annualValue)} />
        <Fact label="Total Contract Value" value={money(contract.totalValue)} />
      </div>
      {data.products.length && !contract.lineItems?.length ? (
        <EmptyState>
          Add line items to make this contract the pricing source of truth.
        </EmptyState>
      ) : null}
    </div>
  );
}

function DocumentsTab({ contract }: { contract: any }) {
  const documents = contract.documents ?? [];
  if (!documents.length) {
    return (
      <EmptyState>
        No documents are linked yet. Document upload and extraction remain out
        of scope for this phase.
      </EmptyState>
    );
  }
  return (
    <div className="grid gap-2">
      {documents.map((document: any) => (
        <div key={document.id} className="rounded-lg border border-border/80 bg-card/80 p-3">
          <p className="text-sm font-medium text-slate-100">{document.title}</p>
          <p className="text-xs text-muted-foreground">{titleCaseEnum(document.type)}</p>
        </div>
      ))}
    </div>
  );
}

function RenewalHistoryTab({ contract }: { contract: any }) {
  const renewals = contract.maintenanceRenewals ?? [];
  if (!renewals.length) {
    return <EmptyState>No maintenance renewal has been created for this contract.</EmptyState>;
  }
  return (
    <div className="overflow-auto rounded-lg border border-border/80">
      <Table className="min-w-[920px] text-xs">
        <TableHeader>
          <TableRow>
            <TableHead>Renewal</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Disposition</TableHead>
            <TableHead className="text-right">Current Annual</TableHead>
            <TableHead className="text-right">Forecast</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {renewals.map((renewal: any) => (
            <TableRow key={renewal.id}>
              <TableCell>{renewal.renewalName}</TableCell>
              <TableCell className="font-mono">{dateOnly(renewal.renewalDate)}</TableCell>
              <TableCell>{renewal.lineItems?.length ?? 0} products</TableCell>
              <TableCell>
                <StatusBadge value={renewal.workflowStage} />
              </TableCell>
              <TableCell>
                <StatusBadge value={renewal.approvedDisposition ?? renewal.recommendedDisposition} />
              </TableCell>
              <TableCell className="font-mono text-right">{money(renewal.currentAnnualCost)}</TableCell>
              <TableCell className="font-mono text-right">{money(renewal.forecastedRenewalCost)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LineItemSheet({
  open,
  onOpenChange,
  line,
  contract,
  productOptions,
  moduleOptions,
  data,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  line?: any;
  contract?: any;
  productOptions: Option[];
  moduleOptions: Option[];
  data: ContractData;
}) {
  const [productId, setProductId] = useState(line?.productId ?? "");
  if (!contract) return null;
  const contractProducts = productOptions.filter(
    (option) => !contract.vendorCompanyId || option.parentId === contract.vendorCompanyId
  );
  const selectedProductId = productId || line?.productId || "";
  const productModules = moduleOptions.filter(
    (option) => option.parentId === selectedProductId
  );
  const quantity = Number(line?.quantity ?? 1);
  const unitPrice = Number(line?.unitPrice ?? 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-border bg-popover/98 sm:max-w-2xl">
        <SheetHeader className="border-b border-border/80">
          <SheetTitle>{line?.id ? "Edit Contract Line" : "Add Contract Line"}</SheetTitle>
          <SheetDescription>
            Enter commercial line values from the quote or SOW. Amounts can be
            overridden directly.
          </SheetDescription>
        </SheetHeader>
        <div className="overflow-auto px-4 pb-6">
          <FormShell title="Product & Pricing Line" action={saveContractLineAction}>
            {(_state, pending) => (
              <div className="grid gap-3 md:grid-cols-2">
                <input type="hidden" name="id" value={line?.id ?? ""} />
                <input type="hidden" name="contractId" value={contract.id} />
                <SelectBox
                  label="Product"
                  name="productId"
                  options={contractProducts}
                  includeNone
                  defaultValue={line?.productId ?? "none"}
                  onChange={setProductId}
                />
                <SelectBox
                  label="Product Component"
                  name="productModuleId"
                  options={productModules}
                  includeNone
                  defaultValue={line?.productModuleId ?? "none"}
                />
                <div className="md:col-span-2">
                  <Field label="Description" name="description" defaultValue={line?.description ?? ""} />
                </div>
                <Field label="SKU" name="sku" defaultValue={line?.sku ?? ""} />
                <SelectBox
                  label="Metric"
                  name="licenseMetric"
                  options={enumOptions(data.optionSets.licenseMetrics)}
                  includeNone
                  defaultValue={line?.licenseMetric ?? "none"}
                />
                <Field label="Quantity" name="quantity" type="number" defaultValue={quantity} />
                <Field label="Unit price" name="unitPrice" type="number" defaultValue={unitPrice} />
                <Field
                  label="Annual amount"
                  name="annualAmount"
                  type="number"
                  defaultValue={Number(line?.annualAmount ?? quantity * unitPrice)}
                />
                <Field
                  label="Total amount"
                  name="totalAmount"
                  type="number"
                  defaultValue={Number(line?.totalAmount ?? quantity * unitPrice)}
                />
                <Field label="Start" name="startsOn" type="date" defaultValue={dateOnly(line?.startsOn ?? contract.startsOn)} />
                <Field label="End" name="endsOn" type="date" defaultValue={dateOnly(line?.endsOn ?? contract.endsOn)} />
                <Field label="Sort order" name="sortOrder" type="number" defaultValue={Number(line?.sortOrder ?? 0)} />
                <ToggleField name="renewable" label="Renewable" defaultChecked={line?.renewable ?? true} />
                <div className="md:col-span-2">
                  <TextBlock label="Notes" name="notesText" defaultValue={line?.notesText ?? ""} />
                </div>
                <div className="md:col-span-2">
                  <SubmitButton pending={pending}>Save Line</SubmitButton>
                </div>
              </div>
            )}
          </FormShell>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CreateRenewalSheet({
  open,
  onOpenChange,
  contract,
  fiscalOptions,
  budgetPlanOptions,
  accountOptions,
  annualOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: any;
  fiscalOptions: Option[];
  budgetPlanOptions: Option[];
  accountOptions: Option[];
  annualOptions: Option[];
}) {
  if (!contract) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-border bg-popover/98 sm:max-w-xl">
        <SheetHeader className="border-b border-border/80">
          <SheetTitle>Create Maintenance Renewal</SheetTitle>
          <SheetDescription>
            Copies the contract header and renewable line-item baseline into a
            new operational renewal case.
          </SheetDescription>
        </SheetHeader>
        <div className="overflow-auto px-4 pb-6">
          <FormShell title={contract.title} action={createRenewalFromContractAction}>
            {(_state, pending) => (
              <div className="grid gap-3">
                <input type="hidden" name="contractId" value={contract.id} />
                <SelectBox label="Target fiscal year" name="fiscalYearId" options={fiscalOptions} defaultValue={fiscalOptions[0]?.id} />
                <SelectBox label="Budget plan" name="budgetPlanId" options={budgetPlanOptions} defaultValue={budgetPlanOptions[0]?.id} />
                <SelectBox label="Funding account" name="fundingAccountId" options={accountOptions} defaultValue={accountOptions[0]?.id} />
                <SelectBox label="Linked annual financial" name="linkedAnnualFinancialId" options={annualOptions} includeNone />
                <Field label="Department" name="department" defaultValue="" />
                <Field label="Cost center" name="costCenter" defaultValue="" />
                <Field label="Renewal owner" name="renewalOwner" defaultValue={contract.businessOwner ?? ""} />
                <div className="rounded-lg border border-border/80 bg-secondary/30 p-3 text-xs text-muted-foreground">
                  {contract.lineItems?.filter((line: any) => line.renewable).length ?? 0} renewable lines will be copied as renewal pricing snapshots.
                </div>
                <SubmitButton pending={pending}>Create Renewal</SubmitButton>
              </div>
            )}
          </FormShell>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ArchiveContractForm({ contractId }: { contractId: string }) {
  const [state, formAction, pending] = useActionState(
    archiveContractAction,
    emptyActionResult
  );
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={contractId} />
      <Button variant="destructive" disabled={pending} size="sm">
        <Trash2 data-icon="inline-start" />
        Archive
      </Button>
      {state.message ? <span className="text-xs text-muted-foreground">{state.message}</span> : null}
    </form>
  );
}

function DeleteLineForm({ lineId }: { lineId: string }) {
  const [state, formAction, pending] = useActionState(
    deleteContractLineAction,
    emptyActionResult
  );
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={lineId} />
      <Button variant="destructive" size="icon-sm" disabled={pending} aria-label="Delete line">
        <Trash2 />
      </Button>
      {state.ok ? <span className="sr-only">{state.message}</span> : null}
    </form>
  );
}

function DuplicateLineForm({ lineId }: { lineId: string }) {
  const [state, formAction, pending] = useActionState(
    duplicateContractLineAction,
    emptyActionResult
  );
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={lineId} />
      <Button variant="outline" size="icon-sm" disabled={pending} aria-label="Duplicate line">
        <Copy />
      </Button>
      {state.ok ? <span className="sr-only">{state.message}</span> : null}
    </form>
  );
}

function ReorderLineForm({
  contractId,
  lineItems,
  index,
  direction,
}: {
  contractId: string;
  lineItems: any[];
  index: number;
  direction: "up" | "down";
}) {
  const [state, formAction, pending] = useActionState(
    reorderContractLinesAction,
    emptyActionResult
  );
  const next = [...lineItems];
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  const disabled = swapIndex < 0 || swapIndex >= lineItems.length || pending;
  if (!disabled) {
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return (
    <form action={formAction}>
      <input type="hidden" name="contractId" value={contractId} />
      <input type="hidden" name="orderedIds" value={next.map((line) => line.id).join(",")} />
      <Button
        variant="outline"
        size="icon-sm"
        disabled={disabled}
        aria-label={direction === "up" ? "Move line up" : "Move line down"}
      >
        {direction === "up" ? <ArrowUp /> : <ArrowDown />}
      </Button>
      {state.ok ? <span className="sr-only">{state.message}</span> : null}
    </form>
  );
}

function enumOptions(values: readonly string[]): Option[] {
  return values.map((value) => ({ id: value, label: titleCaseEnum(value) }));
}
