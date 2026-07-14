"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CircleDollarSign,
  Copy,
  FilePlus2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import {
  createRenewalFromContractAction,
  deleteContractAction,
  deleteContractLineAction,
  duplicateContractLineAction,
  pushContractToBudgetAction,
  reorderContractLinesAction,
  saveContractWithLinesAction,
} from "@/app/contracts/actions";
import { WorkspaceShell } from "@/components/app/workspace-shell";
import {
  EmptyState,
  Field,
  FormShell,
  SelectBox,
  type Option,
} from "@/components/catalog/relational-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  emptyActionResult,
  type ActionResult,
} from "@/lib/server/action-result";

type RoleName = "VENDOR" | "RESELLER";
type SortKey =
  | "title"
  | "vendor"
  | "seller"
  | "term"
  | "annualValue"
  | "totalValue"
  | "notice"
  | "status"
  | "owner";

type CompanyRecord = {
  id: string;
  name: string;
  active: boolean;
  roles?: Array<{ role: string }>;
};

type ProductRecord = {
  id: string;
  name: string;
  active: boolean;
  vendorCompanyId?: string | null;
  vendorCompany?: { name: string } | null;
};

type ProductModuleRecord = {
  id: string;
  name: string;
  active: boolean;
  productId?: string | null;
  product?: { name: string } | null;
};

type ContractLineItemRecord = {
  id: string;
  productId?: string | null;
  productModuleId?: string | null;
  description: string;
  sku?: string | null;
  quantity: string | number;
  licenseMetric?: string | null;
  unitPrice: string | number;
  annualAmount: string | number;
  totalAmount: string | number;
  startsOn?: string | null;
  endsOn?: string | null;
  renewable: boolean;
  sortOrder: number;
  notesText?: string | null;
  product?: { name: string } | null;
  productModule?: { name: string } | null;
};

type ContractRecord = {
  id: string;
  contractNumber?: string | null;
  title: string;
  vendorCompanyId?: string | null;
  sellerCompanyId?: string | null;
  contractType: string;
  status: string;
  renewalDate?: string | null;
  autoRenewal: boolean;
  noticePeriodDays: number;
  annualValue: string | number;
  totalValue: string | number;
  paymentFrequency: string;
  businessOwner?: string | null;
  securityOwner?: string | null;
  procurementContact?: string | null;
  contractOwner?: string | null;
  vendorAccountManager?: string | null;
  resellerAccountManager?: string | null;
  renewalRiskLevel: string;
  renewalStrategy?: string | null;
  notesText?: string | null;
  startsOn: string;
  endsOn: string;
  vendorCompany?: { name: string; active?: boolean } | null;
  sellerCompany?: { name: string; active?: boolean } | null;
  owner?: { name: string } | null;
  lineItems?: ContractLineItemRecord[];
  maintenanceRenewals?: MaintenanceRenewalRecord[];
  documents?: DocumentRecord[];
};

type MaintenanceRenewalRecord = {
  id: string;
  renewalName: string;
  renewalDate?: string | null;
  workflowStage?: string | null;
  overallStatus?: string | null;
  approvedDisposition?: string | null;
  recommendedDisposition?: string | null;
  currentAnnualCost?: string | number | null;
  forecastedRenewalCost?: string | number | null;
  lineItems?: Array<{ id: string }>;
};

type DocumentRecord = {
  id: string;
  title: string;
  type?: string | null;
};

type ContractPageData = {
  contracts: ContractRecord[];
  companies: CompanyRecord[];
  products: ProductRecord[];
  modules: ProductModuleRecord[];
  fiscalYears: Array<{ id: string; label: string }>;
  budgetPlans: Array<{
    id: string;
    name: string;
    version: string;
    fiscalYear: { label: string };
  }>;
  budgetAccounts: Array<{ id: string; code: string; name: string }>;
  annualFinancials: Array<{
    id: string;
    budgetPlan: { name: string };
    scenario: { label: string };
    account: { code: string };
    budgetItem: { name: string };
  }>;
  optionSets: {
    contractTypes: readonly string[];
    contractStatuses: readonly string[];
    paymentFrequencies: readonly string[];
    renewalRisks: readonly string[];
    licenseMetrics: readonly string[];
  };
};

type ProductLineFormRow = {
  key: string;
  id: string;
  productId: string;
  productModuleId: string;
  description: string;
  sku: string;
  quantity: string;
  licenseMetric: string;
  unitPrice: string;
  annualAmount: string;
  totalAmount: string;
  startsOn: string;
  endsOn: string;
  renewable: boolean;
  notesText: string;
  annualOverridden: boolean;
  totalOverridden: boolean;
};

type EditorState = {
  open: boolean;
  contract?: ContractRecord;
  appendBlank: boolean;
};

type ContractInlineDraft = {
  title: string;
  contractNumber: string;
  vendorCompanyId: string;
  sellerCompanyId: string;
  startsOn: string;
  endsOn: string;
  status: string;
  businessOwner: string;
};

function money(value: unknown) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function dateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function titleCaseEnum(value?: string | null) {
  if (!value) return "None";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function daysUntil(value?: string | null) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${dateOnly(value)}T00:00:00.000`);
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
}

function noticeDeadline(contract: ContractRecord) {
  const anchor = contract.renewalDate ?? contract.endsOn;
  if (!anchor) return "";
  const date = new Date(`${dateOnly(anchor)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - Number(contract.noticePeriodDays ?? 60));
  return date.toISOString().slice(0, 10);
}

function renewalWindow(contract: ContractRecord) {
  const days = daysUntil(contract.renewalDate ?? contract.endsOn);
  if (days === null) return "No date";
  if (days < 0) return "Past due";
  if (days <= 30) return "30 days";
  if (days <= 60) return "60 days";
  if (days <= 90) return "90 days";
  return "Later";
}

function renewalStatus(contract: ContractRecord) {
  const renewals = contract.maintenanceRenewals ?? [];
  if (!renewals.length) return "Renewal Not Created";
  if (
    renewals.some(
      (renewal) =>
        renewal.overallStatus === "NOT_RENEWING" ||
        renewal.approvedDisposition === "DO_NOT_RENEW" ||
        renewal.approvedDisposition === "DECOMMISSION"
    )
  ) {
    return "Not Renewing";
  }
  if (renewals.some((renewal) => renewal.overallStatus === "COMPLETED")) {
    return "Renewed";
  }
  return "Renewal In Progress";
}

function badgeTone(value: string) {
  if (["CRITICAL", "HIGH", "EXPIRING_SOON", "TERMINATED"].includes(value)) {
    return "border-red-400/40 bg-red-400/10 text-red-200";
  }
  if (["MEDIUM", "RENEWING", "PENDING"].includes(value)) {
    return "border-amber-400/40 bg-amber-400/10 text-amber-200";
  }
  if (["ACTIVE", "LOW", "Renewed", "Yes"].includes(value)) {
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

function roleOptions(companies: CompanyRecord[], roleName: RoleName): Option[] {
  return companies
    .filter((company) => company.roles?.some((role) => role.role === roleName))
    .map((company) => ({
      id: company.id,
      label: company.name,
      active: company.active,
    }))
    .sort((a, b) => {
      if (a.active !== false && b.active === false) return -1;
      if (a.active === false && b.active !== false) return 1;
      return a.label.localeCompare(b.label);
    });
}

function productOptions(products: ProductRecord[]): Option[] {
  return products.map((product) => ({
    id: product.id,
    label: product.name,
    active: product.active,
    parentId: product.vendorCompanyId ?? undefined,
    hint: product.vendorCompany?.name ?? undefined,
  }));
}

function moduleOptions(modules: ProductModuleRecord[]): Option[] {
  return modules.map((module) => ({
    id: module.id,
    label: module.name,
    active: module.active,
    parentId: module.productId ?? undefined,
    hint: module.product?.name ?? undefined,
  }));
}

function enumOptions(values: readonly string[]): Option[] {
  return values.map((value) => ({ id: value, label: titleCaseEnum(value) }));
}

function firstActiveOption(options: Option[]) {
  return (
    options.find((option) => option.active !== false)?.id ??
    options[0]?.id ??
    ""
  );
}

function ensureOption(
  options: Option[],
  id?: string | null,
  label?: string | null,
  active?: boolean
) {
  if (!id || options.some((option) => option.id === id)) return options;
  return [{ id, label: label ?? "Historical record", active }, ...options];
}

function optionRows<T extends { id: string }>(
  rows: T[],
  label: (row: T) => string
): Option[] {
  return rows.map((row) => ({ id: row.id, label: label(row) }));
}

function compareContracts(
  a: ContractRecord,
  b: ContractRecord,
  sortKey: SortKey
) {
  const value = (contract: ContractRecord) => {
    if (sortKey === "vendor") return contract.vendorCompany?.name ?? "";
    if (sortKey === "seller") return contract.sellerCompany?.name ?? "Direct";
    if (sortKey === "notice") return noticeDeadline(contract);
    if (sortKey === "owner") return contract.businessOwner ?? "";
    if (sortKey === "term") return contract.endsOn ?? "";
    if (sortKey === "status") return renewalStatus(contract);
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

function termYears(startsOn: string, endsOn: string) {
  if (!startsOn || !endsOn) return 1;
  const start = new Date(`${startsOn}T00:00:00.000`);
  const end = new Date(`${endsOn}T00:00:00.000`);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start > end
  ) {
    return 1;
  }
  const days = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1
  );
  return Math.max(1, days / 365);
}

function calculatedAnnual(row: ProductLineFormRow) {
  return Number(row.quantity || 0) * Number(row.unitPrice || 0);
}

function calculatedTotal(
  row: ProductLineFormRow,
  startsOn: string,
  endsOn: string
) {
  return Number(row.annualAmount || 0) * termYears(startsOn, endsOn);
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function blankLine(startsOn = "", endsOn = ""): ProductLineFormRow {
  return {
    key: crypto.randomUUID(),
    id: "",
    productId: "",
    productModuleId: "",
    description: "",
    sku: "",
    quantity: "1",
    licenseMetric: "none",
    unitPrice: "0",
    annualAmount: "0",
    totalAmount: "0",
    startsOn,
    endsOn,
    renewable: true,
    notesText: "",
    annualOverridden: false,
    totalOverridden: false,
  };
}

function lineFormRow(line: ContractLineItemRecord): ProductLineFormRow {
  return {
    key: line.id,
    id: line.id,
    productId: line.productId ?? "",
    productModuleId: line.productModuleId ?? "",
    description: line.description,
    sku: line.sku ?? "",
    quantity: String(line.quantity ?? 1),
    licenseMetric: line.licenseMetric ?? "none",
    unitPrice: String(line.unitPrice ?? 0),
    annualAmount: String(line.annualAmount ?? 0),
    totalAmount: String(line.totalAmount ?? 0),
    startsOn: dateOnly(line.startsOn),
    endsOn: dateOnly(line.endsOn),
    renewable: line.renewable,
    notesText: line.notesText ?? "",
    annualOverridden:
      Number(line.annualAmount ?? 0) !==
      Number(line.quantity ?? 0) * Number(line.unitPrice ?? 0),
    totalOverridden: true,
  };
}

function initialRows(contract?: ContractRecord, appendBlank = false) {
  const rows = (contract?.lineItems ?? []).map(lineFormRow);
  if (!rows.length || appendBlank) {
    rows.push(
      blankLine(dateOnly(contract?.startsOn), dateOnly(contract?.endsOn))
    );
  }
  return rows;
}

function fieldErrors(result: ActionResult, name: string) {
  return result.fields?.[name] ?? [];
}

function ErrorText({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-[0.7rem] text-red-200">{errors.join(", ")}</p>;
}

export function ContractsManagement({ data }: { data: ContractPageData }) {
  return <ContractsPageClient data={data} />;
}

function ContractsPageClient({ data }: { data: ContractPageData }) {
  const router = useRouter();
  const contracts = data.contracts;
  const vendors = useMemo(() => roleOptions(data.companies, "VENDOR"), [data]);
  const sellers = useMemo(
    () => roleOptions(data.companies, "RESELLER"),
    [data]
  );
  const products = useMemo(() => productOptions(data.products), [data]);
  const modules = useMemo(() => moduleOptions(data.modules), [data]);
  const [query, setQuery] = useState("");
  const [vendorFilter, setVendorFilter] = useState("All");
  const [sellerFilter, setSellerFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [windowFilter, setWindowFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("term");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedId, setSelectedId] = useState(contracts[0]?.id ?? "");
  const [editor, setEditor] = useState<EditorState>({
    open: false,
    appendBlank: false,
  });
  const [renewalOpen, setRenewalOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const selected =
    contracts.find((contract) => contract.id === selectedId) ?? contracts[0];

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
          contract.contractOwner,
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
      value: contracts.filter((contract) => contract.status === "ACTIVE")
        .length,
    },
    {
      label: "Annual Value",
      value: money(
        contracts.reduce(
          (total, contract) => total + Number(contract.annualValue ?? 0),
          0
        )
      ),
    },
    {
      label: "Total Value",
      value: money(
        contracts.reduce(
          (total, contract) => total + Number(contract.totalValue ?? 0),
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
      label: "Line Items",
      value: contracts.reduce(
        (total, contract) => total + (contract.lineItems?.length ?? 0),
        0
      ),
    },
  ];

  const toggleSort = (nextSortKey: SortKey) => {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextSortKey);
    setSortDirection("asc");
  };

  const openEditor = (contract?: ContractRecord, appendBlank = false) => {
    setRenewalOpen(false);
    setBudgetOpen(false);
    setEditor({ open: true, contract, appendBlank });
  };

  const openRenewal = (contract: ContractRecord) => {
    setSelectedId(contract.id);
    setEditor({ open: false, appendBlank: false });
    setBudgetOpen(false);
    setRenewalOpen(true);
  };

  const openBudget = (contract: ContractRecord) => {
    setSelectedId(contract.id);
    setEditor({ open: false, appendBlank: false });
    setRenewalOpen(false);
    setBudgetOpen(true);
  };

  return (
    <WorkspaceShell
      title="Contracts"
      description="Commercial contract source of truth for current term pricing, product scope, and renewal handoff."
      actionLabel="New Contract"
    >
      <div className="grid min-w-0 gap-3">
        <MetricRail metrics={metrics} />
        {successMessage ? (
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
            {successMessage}
          </div>
        ) : null}
        <div className="min-w-0 overflow-hidden rounded-lg border border-border/80 bg-card/95">
          <ContractsToolbar
            query={query}
            setQuery={setQuery}
            vendorFilter={vendorFilter}
            setVendorFilter={setVendorFilter}
            sellerFilter={sellerFilter}
            setSellerFilter={setSellerFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            windowFilter={windowFilter}
            setWindowFilter={setWindowFilter}
            vendorOptions={vendors}
            sellerOptions={sellers}
            statusOptions={data.optionSets.contractStatuses}
            onNewContract={() => openEditor()}
          />
          <ContractsTable
            contracts={filtered}
            selectedId={selected?.id}
            sortKey={sortKey}
            toggleSort={toggleSort}
            vendorOptions={vendors}
            sellerOptions={sellers}
            statusOptions={data.optionSets.contractStatuses}
            onSelect={setSelectedId}
            onOpen={(contract) => setSelectedId(contract.id)}
            onSaved={(contractId, message) => {
              setSelectedId(contractId);
              setSuccessMessage(message);
              router.refresh();
            }}
            onRenewal={(contract) => {
              openRenewal(contract);
            }}
          />
        </div>

        <ContractEditor
          open={editor.open}
          onOpenChange={(open) =>
            setEditor((current) => ({ ...current, open }))
          }
          contract={editor.contract}
          appendBlank={editor.appendBlank}
          vendorOptions={vendors}
          sellerOptions={sellers}
          productOptions={products}
          moduleOptions={modules}
          optionSets={data.optionSets}
          onSaved={(contractId, message) => {
            setSelectedId(contractId);
            setSuccessMessage(message);
            setEditor({ open: false, appendBlank: false });
            router.refresh();
          }}
        />

        {selected && !editor.open && !renewalOpen && !budgetOpen ? (
          <ContractDetails
            contract={selected}
            productOptions={products}
            moduleOptions={modules}
            onEditContract={() => openEditor(selected)}
            onAddProduct={() => openEditor(selected, true)}
            onBudget={() => openBudget(selected)}
            onRenewal={() => openRenewal(selected)}
          />
        ) : !editor.open && !renewalOpen && !budgetOpen ? (
          <EmptyState>No contracts match the current filters.</EmptyState>
        ) : null}

        <PushBudgetDialog
          key={`${selected?.id ?? "none"}-${budgetOpen ? "budget-open" : "budget-closed"}`}
          open={budgetOpen}
          onOpenChange={setBudgetOpen}
          contract={selected}
          fiscalOptions={optionRows(data.fiscalYears, (fy) => fy.label)}
          budgetPlanOptions={optionRows(
            data.budgetPlans,
            (plan) => `${plan.fiscalYear.label} / ${plan.name} ${plan.version}`
          )}
          accountOptions={optionRows(
            data.budgetAccounts,
            (account) => `${account.code} ${account.name}`
          )}
        />

        <CreateRenewalDialog
          key={`${selected?.id ?? "none"}-${renewalOpen ? "open" : "closed"}`}
          open={renewalOpen}
          onOpenChange={setRenewalOpen}
          contract={selected}
          fiscalOptions={optionRows(data.fiscalYears, (fy) => fy.label)}
          budgetPlanOptions={optionRows(
            data.budgetPlans,
            (plan) => `${plan.fiscalYear.label} / ${plan.name} ${plan.version}`
          )}
          accountOptions={optionRows(
            data.budgetAccounts,
            (account) => `${account.code} ${account.name}`
          )}
          annualOptions={optionRows(
            data.annualFinancials,
            (row) =>
              `${row.budgetPlan.name} / ${titleCaseEnum(row.scenario.label)} / ${row.account.code} / ${row.budgetItem.name}`
          )}
        />
      </div>
    </WorkspaceShell>
  );
}

function MetricRail({
  metrics,
}: {
  metrics: Array<{ label: string; value: string | number }>;
}) {
  return (
    <div className="grid rounded-lg border border-border/80 bg-card/95 sm:grid-cols-3 xl:grid-cols-6">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="border-border/70 px-3 py-2 sm:border-r"
        >
          <p className="text-[0.64rem] uppercase text-muted-foreground">
            {metric.label}
          </p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-50">
            {metric.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function ContractsToolbar({
  query,
  setQuery,
  vendorFilter,
  setVendorFilter,
  sellerFilter,
  setSellerFilter,
  statusFilter,
  setStatusFilter,
  windowFilter,
  setWindowFilter,
  vendorOptions,
  sellerOptions,
  statusOptions,
  onNewContract,
}: {
  query: string;
  setQuery: (value: string) => void;
  vendorFilter: string;
  setVendorFilter: (value: string) => void;
  sellerFilter: string;
  setSellerFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  windowFilter: string;
  setWindowFilter: (value: string) => void;
  vendorOptions: Option[];
  sellerOptions: Option[];
  statusOptions: readonly string[];
  onNewContract: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2 border-b border-border/80 p-3">
      <label className="relative min-w-72 flex-1">
        <span className="sr-only">Search contracts</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="Search contracts"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search contract, vendor, reseller, owner"
          className="h-9 border-border/80 bg-secondary/45 pl-8"
        />
      </label>
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
          ...statusOptions.map((status) => ({
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
        onClick={onNewContract}
      >
        <Plus data-icon="inline-start" />
        New Contract
      </Button>
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
    <label className="flex min-w-36 flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-lg border border-border/80 bg-secondary/45 px-2 text-sm text-slate-100"
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
  vendorOptions,
  sellerOptions,
  statusOptions,
  onSelect,
  onOpen,
  onSaved,
  onRenewal,
}: {
  contracts: ContractRecord[];
  selectedId?: string;
  sortKey: SortKey;
  toggleSort: (key: SortKey) => void;
  vendorOptions: Option[];
  sellerOptions: Option[];
  statusOptions: readonly string[];
  onSelect: (contractId: string) => void;
  onOpen: (contract: ContractRecord) => void;
  onSaved: (contractId: string, message: string) => void;
  onRenewal: (contract: ContractRecord) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, ContractInlineDraft>>({});
  const columns: Array<[SortKey, string, string]> = [
    ["title", "Contract", "w-[22%]"],
    ["vendor", "Vendor", "w-[12%]"],
    ["seller", "Reseller", "w-[13%]"],
    ["term", "Term", "w-[10%]"],
    ["annualValue", "Value", "w-[12%]"],
    ["notice", "Renewal", "w-[12%]"],
    ["status", "Status", "w-[9%]"],
  ];
  const startEdit = (contract: ContractRecord) => {
    setDrafts((current) => ({
      ...current,
      [contract.id]: {
        title: contract.title,
        contractNumber: contract.contractNumber ?? "",
        vendorCompanyId:
          contract.vendorCompanyId ?? firstActiveOption(vendorOptions),
        sellerCompanyId: contract.sellerCompanyId ?? "none",
        startsOn: dateOnly(contract.startsOn),
        endsOn: dateOnly(contract.endsOn),
        status: contract.status,
        businessOwner: contract.businessOwner ?? "",
      },
    }));
  };
  const updateDraft = (
    contractId: string,
    patch: Partial<ContractInlineDraft>
  ) => {
    setDrafts((current) => ({
      ...current,
      [contractId]: { ...current[contractId], ...patch },
    }));
  };
  const cancelEdit = (contractId: string) => {
    setDrafts((current) => {
      const next = { ...current };
      delete next[contractId];
      return next;
    });
  };

  return (
    <div className="max-h-[620px] overflow-y-auto overflow-x-hidden">
      <Table className="w-full table-fixed text-xs">
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
                  {sortKey === key ? (
                    <span className="sr-only">sorted</span>
                  ) : null}
                </Button>
              </TableHead>
            ))}
            <TableHead className="w-[10%] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => {
            const selected = contract.id === selectedId;
            const draft = drafts[contract.id];
            const vendorChoices = ensureOption(
              vendorOptions,
              contract.vendorCompanyId,
              contract.vendorCompany?.name,
              contract.vendorCompany?.active
            );
            const sellerChoices = ensureOption(
              sellerOptions,
              contract.sellerCompanyId,
              contract.sellerCompany?.name,
              contract.sellerCompany?.active
            );
            return (
              <TableRow
                key={contract.id}
                className={`cursor-pointer border-border/60 ${selected ? "bg-cyan-400/12" : "hover:bg-secondary/35"}`}
                onClick={() => onSelect(contract.id)}
              >
                <TableCell className="font-medium text-slate-100">
                  {draft ? (
                    <div className="grid gap-1">
                      <Input
                        value={draft.title}
                        onChange={(event) =>
                          updateDraft(contract.id, {
                            title: event.target.value,
                          })
                        }
                        className="h-8 border-border/80 bg-secondary/45 text-xs"
                        onClick={(event) => event.stopPropagation()}
                      />
                      <Input
                        value={draft.contractNumber}
                        onChange={(event) =>
                          updateDraft(contract.id, {
                            contractNumber: event.target.value,
                          })
                        }
                        className="h-7 border-border/80 bg-secondary/45 font-mono text-[0.68rem]"
                        onClick={(event) => event.stopPropagation()}
                      />
                    </div>
                  ) : (
                    <button
                      className="grid min-w-0 text-left"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpen(contract);
                      }}
                    >
                      <span className="truncate">{contract.title}</span>
                      <span className="truncate font-mono text-[0.68rem] text-muted-foreground">
                        {contract.contractNumber ?? "No number"} /{" "}
                        {contract.lineItems?.length ?? 0} products
                      </span>
                    </button>
                  )}
                </TableCell>
                <TableCell className="truncate">
                  {draft ? (
                    <InlineSelect
                      value={draft.vendorCompanyId}
                      options={vendorChoices}
                      onChange={(value) =>
                        updateDraft(contract.id, { vendorCompanyId: value })
                      }
                    />
                  ) : (
                    (contract.vendorCompany?.name ?? "Unassigned")
                  )}
                </TableCell>
                <TableCell className="truncate">
                  {draft ? (
                    <InlineSelect
                      value={draft.sellerCompanyId}
                      options={sellerChoices}
                      includeNone
                      noneLabel="Direct"
                      onChange={(value) =>
                        updateDraft(contract.id, { sellerCompanyId: value })
                      }
                    />
                  ) : (
                    (contract.sellerCompany?.name ?? "Direct")
                  )}
                </TableCell>
                <TableCell className="font-mono">
                  {draft ? (
                    <div className="grid gap-1">
                      <Input
                        type="date"
                        value={draft.startsOn}
                        onChange={(event) =>
                          updateDraft(contract.id, {
                            startsOn: event.target.value,
                          })
                        }
                        className="h-7 border-border/80 bg-secondary/45 text-xs"
                        onClick={(event) => event.stopPropagation()}
                      />
                      <Input
                        type="date"
                        value={draft.endsOn}
                        onChange={(event) =>
                          updateDraft(contract.id, {
                            endsOn: event.target.value,
                          })
                        }
                        className="h-7 border-border/80 bg-secondary/45 text-xs"
                        onClick={(event) => event.stopPropagation()}
                      />
                    </div>
                  ) : (
                    <>
                      <span className="block truncate">
                        {dateOnly(contract.startsOn)}
                      </span>
                      <span className="block truncate text-muted-foreground">
                        {dateOnly(contract.endsOn)}
                      </span>
                    </>
                  )}
                </TableCell>
                <TableCell className="font-mono text-right">
                  <span className="block truncate">
                    {money(contract.annualValue)}
                  </span>
                  <span className="block truncate text-[0.68rem] text-muted-foreground">
                    total {money(contract.totalValue)}
                  </span>
                </TableCell>
                <TableCell className="font-mono">
                  <span className="block truncate">
                    {dateOnly(contract.renewalDate ?? contract.endsOn)}
                  </span>
                  <span className="block truncate text-muted-foreground">
                    {noticeDeadline(contract)}
                  </span>
                </TableCell>
                <TableCell>
                  {draft ? (
                    <InlineSelect
                      value={draft.status}
                      options={enumOptions(statusOptions)}
                      onChange={(value) =>
                        updateDraft(contract.id, { status: value })
                      }
                    />
                  ) : (
                    <div className="grid min-w-0 gap-1">
                      <StatusBadge value={contract.status} />
                      <span className="truncate text-[0.68rem] text-muted-foreground">
                        {renewalStatus(contract)}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {draft ? (
                    <InlineContractSaveForm
                      contract={contract}
                      draft={draft}
                      onCancel={() => cancelEdit(contract.id)}
                      onSaved={(contractId, message) => {
                        cancelEdit(contract.id);
                        onSaved(contractId, message);
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Open ${contract.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpen(contract);
                        }}
                      >
                        <MoreHorizontal />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Edit ${contract.title} in table`}
                        onClick={(event) => {
                          event.stopPropagation();
                          startEdit(contract);
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
                          onRenewal(contract);
                        }}
                      >
                        <FilePlus2 />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function InlineSelect({
  value,
  options,
  onChange,
  includeNone = false,
  noneLabel = "None",
}: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  includeNone?: boolean;
  noneLabel?: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      className="h-8 w-full rounded-lg border border-border/80 bg-secondary/45 px-2 text-xs text-slate-100"
    >
      {includeNone ? <option value="none">{noneLabel}</option> : null}
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function InlineContractSaveForm({
  contract,
  draft,
  onCancel,
  onSaved,
}: {
  contract: ContractRecord;
  draft: ContractInlineDraft;
  onCancel: () => void;
  onSaved: (contractId: string, message: string) => void;
}) {
  const [state, formAction, pending] = useActionState(
    saveContractWithLinesAction,
    emptyActionResult
  );
  const handledSaveId = useRef("");

  useEffect(() => {
    if (!state.ok) return;
    const savedId = String(state.data?.id ?? "");
    if (!savedId || handledSaveId.current === savedId) return;
    handledSaveId.current = savedId;
    onSaved(savedId, state.message);
  }, [onSaved, state]);

  return (
    <form
      action={formAction}
      className="flex items-center justify-end gap-1"
      onClick={(event) => event.stopPropagation()}
    >
      <input type="hidden" name="id" value={contract.id} />
      <input type="hidden" name="lineCount" value="0" />
      <input type="hidden" name="title" value={draft.title} />
      <input type="hidden" name="contractNumber" value={draft.contractNumber} />
      <input
        type="hidden"
        name="vendorCompanyId"
        value={draft.vendorCompanyId}
      />
      <input
        type="hidden"
        name="sellerCompanyId"
        value={draft.sellerCompanyId}
      />
      <input type="hidden" name="contractType" value={contract.contractType} />
      <input type="hidden" name="startsOn" value={draft.startsOn} />
      <input type="hidden" name="endsOn" value={draft.endsOn} />
      <input
        type="hidden"
        name="renewalDate"
        value={dateOnly(contract.renewalDate)}
      />
      <input
        type="hidden"
        name="noticePeriodDays"
        value={String(contract.noticePeriodDays ?? 60)}
      />
      {contract.autoRenewal ? (
        <input type="hidden" name="autoRenewal" value="on" />
      ) : null}
      <input
        type="hidden"
        name="paymentFrequency"
        value={contract.paymentFrequency}
      />
      <input type="hidden" name="status" value={draft.status} />
      <input
        type="hidden"
        name="contractOwner"
        value={contract.contractOwner ?? ""}
      />
      <input type="hidden" name="businessOwner" value={draft.businessOwner} />
      <input
        type="hidden"
        name="securityOwner"
        value={contract.securityOwner ?? ""}
      />
      <input
        type="hidden"
        name="procurementContact"
        value={contract.procurementContact ?? ""}
      />
      <input
        type="hidden"
        name="vendorAccountManager"
        value={contract.vendorAccountManager ?? ""}
      />
      <input
        type="hidden"
        name="resellerAccountManager"
        value={contract.resellerAccountManager ?? ""}
      />
      <input
        type="hidden"
        name="renewalRiskLevel"
        value={contract.renewalRiskLevel}
      />
      <input
        type="hidden"
        name="renewalStrategy"
        value={contract.renewalStrategy ?? ""}
      />
      <input type="hidden" name="notesText" value={contract.notesText ?? ""} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onCancel}>
        Cancel
      </Button>
      {state.message && !state.ok ? (
        <span className="sr-only">{state.message}</span>
      ) : null}
    </form>
  );
}

function ContractEditor({
  open,
  onOpenChange,
  contract,
  appendBlank,
  vendorOptions,
  sellerOptions,
  productOptions,
  moduleOptions,
  optionSets,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: ContractRecord;
  appendBlank: boolean;
  vendorOptions: Option[];
  sellerOptions: Option[];
  productOptions: Option[];
  moduleOptions: Option[];
  optionSets: ContractPageData["optionSets"];
  onSaved: (contractId: string, message: string) => void;
}) {
  if (!open) return null;
  const addingProducts = Boolean(contract?.id && appendBlank);
  return (
    <section className="rounded-lg border border-border/80 bg-card/95">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/80 p-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            {addingProducts
              ? "Add Contract Products"
              : contract?.id
                ? "Edit Contract"
                : "New Contract"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {addingProducts
              ? "Add one or more product, component, or pricing lines while keeping the current contract scope visible."
              : "Save contract details and product pricing together."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          Close Editor
        </Button>
      </div>
      <div className="p-3">
        <ContractEditorForm
          key={`${contract?.id ?? "new"}-${appendBlank ? "append" : "base"}`}
          contract={contract}
          appendBlank={appendBlank}
          vendorOptions={vendorOptions}
          sellerOptions={sellerOptions}
          productOptions={productOptions}
          moduleOptions={moduleOptions}
          optionSets={optionSets}
          onCancel={() => onOpenChange(false)}
          onSaved={onSaved}
        />
      </div>
    </section>
  );
}

function ContractEditorForm({
  contract,
  appendBlank,
  vendorOptions,
  sellerOptions,
  productOptions,
  moduleOptions,
  optionSets,
  onCancel,
  onSaved,
}: {
  contract?: ContractRecord;
  appendBlank: boolean;
  vendorOptions: Option[];
  sellerOptions: Option[];
  productOptions: Option[];
  moduleOptions: Option[];
  optionSets: ContractPageData["optionSets"];
  onCancel: () => void;
  onSaved: (contractId: string, message: string) => void;
}) {
  const [state, formAction, pending] = useActionState(
    saveContractWithLinesAction,
    emptyActionResult
  );
  const handledSaveId = useRef("");
  const [vendorId, setVendorId] = useState(contract?.vendorCompanyId ?? "none");
  const [startsOn, setStartsOn] = useState(dateOnly(contract?.startsOn));
  const [endsOn, setEndsOn] = useState(dateOnly(contract?.endsOn));
  const [rows, setRows] = useState<ProductLineFormRow[]>(
    initialRows(contract, appendBlank)
  );
  const compactHeader = Boolean(contract?.id && appendBlank);
  const vendorChoices = ensureOption(
    vendorOptions,
    contract?.vendorCompanyId,
    contract?.vendorCompany?.name,
    contract?.vendorCompany?.active
  );
  const sellerChoices = ensureOption(
    sellerOptions,
    contract?.sellerCompanyId,
    contract?.sellerCompany?.name,
    contract?.sellerCompany?.active
  );

  useEffect(() => {
    if (!state.ok) return;
    const savedId = String(state.data?.id ?? "");
    if (!savedId || handledSaveId.current === savedId) return;
    handledSaveId.current = savedId;
    onSaved(savedId, state.message);
  }, [onSaved, state]);

  const selectedVendorId = vendorId === "none" ? "" : vendorId;
  const contractProducts = selectedVendorId
    ? productOptions.filter((option) => option.parentId === selectedVendorId)
    : [];
  const annualTotal = rows.reduce(
    (total, row) => total + Number(row.annualAmount || 0),
    0
  );
  const totalValue = rows.reduce(
    (total, row) => total + Number(row.totalAmount || 0),
    0
  );

  const updateRow = (key: string, patch: Partial<ProductLineFormRow>) => {
    setRows((current) =>
      current.map((row) => {
        if (row.key !== key) return row;
        const next = { ...row, ...patch };
        if (
          "quantity" in patch ||
          "unitPrice" in patch ||
          "annualOverridden" in patch
        ) {
          if (!next.annualOverridden) {
            next.annualAmount = formatNumber(calculatedAnnual(next));
          }
        }
        if (
          "quantity" in patch ||
          "unitPrice" in patch ||
          "annualAmount" in patch ||
          "totalOverridden" in patch
        ) {
          if (!next.totalOverridden) {
            next.totalAmount = formatNumber(
              calculatedTotal(next, startsOn, endsOn)
            );
          }
        }
        return next;
      })
    );
  };

  const updateVendor = (nextVendorId: string) => {
    setVendorId(nextVendorId);
    setRows((current) =>
      current.map((row) => {
        const product = productOptions.find(
          (option) => option.id === row.productId
        );
        if (!row.productId || product?.parentId === nextVendorId) return row;
        return { ...row, productId: "", productModuleId: "" };
      })
    );
  };

  const addRow = () =>
    setRows((current) => [...current, blankLine(startsOn, endsOn)]);
  const removeRow = (key: string) => {
    setRows((current) =>
      current.length === 1 ? current : current.filter((row) => row.key !== key)
    );
  };

  const setDateRange = (field: "startsOn" | "endsOn", value: string) => {
    if (field === "startsOn") setStartsOn(value);
    if (field === "endsOn") setEndsOn(value);
    setRows((current) =>
      current.map((row) => {
        const next = {
          ...row,
          startsOn: row.startsOn || (field === "startsOn" ? value : startsOn),
          endsOn: row.endsOn || (field === "endsOn" ? value : endsOn),
        };
        if (!next.totalOverridden) {
          next.totalAmount = formatNumber(
            calculatedTotal(
              next,
              field === "startsOn" ? value : startsOn,
              field === "endsOn" ? value : endsOn
            )
          );
        }
        return next;
      })
    );
  };

  return (
    <form action={formAction} className="grid gap-3 pt-2">
      <input type="hidden" name="id" value={contract?.id ?? ""} />
      <input type="hidden" name="lineCount" value={rows.length} />
      <details
        open={!compactHeader}
        className="max-w-[1700px] rounded-lg border border-border/80 bg-card/80 p-3"
      >
        <summary className="cursor-pointer text-sm font-semibold text-slate-100">
          Contract Details
          {compactHeader ? (
            <span className="ml-2 font-normal text-muted-foreground">
              {contract?.title ?? "Current contract"} / {money(annualTotal)}{" "}
              annual
            </span>
          ) : null}
        </summary>
        <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <LabeledInput
              label="Contract name"
              name="title"
              defaultValue={contract?.title ?? ""}
              errors={fieldErrors(state, "title")}
            />
          </div>
          <LabeledInput
            label="Contract number"
            name="contractNumber"
            defaultValue={contract?.contractNumber ?? ""}
          />
          <div className="xl:col-span-2">
            <LabeledSelect
              label="Vendor"
              name="vendorCompanyId"
              value={vendorId}
              options={vendorChoices}
              includeNone
              noneLabel="Select vendor"
              onChange={updateVendor}
              errors={fieldErrors(state, "vendorCompanyId")}
            />
          </div>
          <LabeledSelect
            label="Reseller or Direct"
            name="sellerCompanyId"
            defaultValue={contract?.sellerCompanyId ?? "none"}
            options={sellerChoices}
            includeNone
            noneLabel="Direct"
            errors={fieldErrors(state, "sellerCompanyId")}
          />
          <LabeledInput
            label="Start date"
            name="startsOn"
            type="date"
            defaultValue={startsOn}
            onChange={(value) => setDateRange("startsOn", value)}
            errors={fieldErrors(state, "startsOn")}
          />
          <LabeledInput
            label="End date"
            name="endsOn"
            type="date"
            defaultValue={endsOn}
            onChange={(value) => setDateRange("endsOn", value)}
            errors={fieldErrors(state, "endsOn")}
          />
          <LabeledSelect
            label="Contract status"
            name="status"
            defaultValue={contract?.status ?? "PENDING"}
            options={enumOptions(optionSets.contractStatuses)}
          />
          <LabeledSelect
            label="Contract type"
            name="contractType"
            defaultValue={contract?.contractType ?? "SAAS"}
            options={enumOptions(optionSets.contractTypes)}
          />
          <LabeledSelect
            label="Payment frequency"
            name="paymentFrequency"
            defaultValue={contract?.paymentFrequency ?? "ANNUAL"}
            options={enumOptions(optionSets.paymentFrequencies)}
          />
        </div>
      </details>

      <section className="grid max-w-[1900px] gap-3 rounded-lg border border-border/80 bg-card/80 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Products and Pricing
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {rows.length} pricing lines in this contract.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus data-icon="inline-start" />
            Add Product Line
          </Button>
        </div>
        <ContractProductsEditorTable
          rows={rows}
          productOptions={contractProducts}
          moduleOptions={moduleOptions}
          optionSets={optionSets}
          startsOn={startsOn}
          endsOn={endsOn}
          updateRow={updateRow}
          removeRow={removeRow}
        />
        <ErrorText errors={fieldErrors(state, "lines")} />
        <div className="grid gap-3 rounded-lg border border-border/80 bg-secondary/30 p-3 sm:grid-cols-2">
          <Fact label="Annual Contract Value" value={money(annualTotal)} />
          <Fact label="Total Contract Value" value={money(totalValue)} />
        </div>
      </section>

      <details className="max-w-[1700px] rounded-lg border border-border/80 bg-card/80 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-100">
          Additional Details
        </summary>
        <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <LabeledInput
            label="Renewal date"
            name="renewalDate"
            type="date"
            defaultValue={dateOnly(contract?.renewalDate)}
          />
          <LabeledInput
            label="Notice period"
            name="noticePeriodDays"
            type="number"
            defaultValue={String(contract?.noticePeriodDays ?? 60)}
          />
          <LabeledSelect
            label="Renewal risk"
            name="renewalRiskLevel"
            defaultValue={contract?.renewalRiskLevel ?? "LOW"}
            options={enumOptions(optionSets.renewalRisks)}
          />
          <label className="flex items-center gap-2 self-end text-xs font-medium text-slate-300">
            <input
              name="autoRenewal"
              type="checkbox"
              defaultChecked={contract?.autoRenewal ?? false}
            />
            Auto-renewal
          </label>
          <LabeledInput
            label="Contract owner"
            name="contractOwner"
            defaultValue={
              contract?.contractOwner ?? contract?.owner?.name ?? ""
            }
          />
          <LabeledInput
            label="Business owner"
            name="businessOwner"
            defaultValue={contract?.businessOwner ?? ""}
          />
          <LabeledInput
            label="Security owner"
            name="securityOwner"
            defaultValue={contract?.securityOwner ?? ""}
          />
          <LabeledInput
            label="Procurement contact"
            name="procurementContact"
            defaultValue={contract?.procurementContact ?? ""}
          />
          <LabeledInput
            label="Vendor account manager"
            name="vendorAccountManager"
            defaultValue={contract?.vendorAccountManager ?? ""}
          />
          <LabeledInput
            label="Reseller account manager"
            name="resellerAccountManager"
            defaultValue={contract?.resellerAccountManager ?? ""}
          />
          <div className="md:col-span-3 xl:col-span-2">
            <LabeledTextarea
              label="Renewal strategy"
              name="renewalStrategy"
              defaultValue={contract?.renewalStrategy ?? ""}
            />
          </div>
          <div className="md:col-span-3 xl:col-span-2">
            <LabeledTextarea
              label="Notes"
              name="notesText"
              defaultValue={contract?.notesText ?? ""}
            />
          </div>
        </div>
      </details>

      {state.message ? (
        <div
          className={
            state.ok
              ? "rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-2 text-xs text-emerald-200"
              : "rounded-lg border border-red-400/30 bg-red-400/10 p-2 text-xs text-red-200"
          }
        >
          {state.message}
        </div>
      ) : null}
      <div className="flex max-w-[1900px] justify-end gap-2 border-t border-border/80 bg-popover/95 py-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={pending}
          className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
        >
          {pending ? "Saving..." : "Save Contract"}
        </Button>
      </div>
    </form>
  );
}

function ContractProductsEditorTable({
  rows,
  productOptions,
  moduleOptions,
  optionSets,
  startsOn,
  endsOn,
  updateRow,
  removeRow,
}: {
  rows: ProductLineFormRow[];
  productOptions: Option[];
  moduleOptions: Option[];
  optionSets: ContractPageData["optionSets"];
  startsOn: string;
  endsOn: string;
  updateRow: (key: string, patch: Partial<ProductLineFormRow>) => void;
  removeRow: (key: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/80">
      <div className="min-w-[1220px]">
        <div className="grid grid-cols-[minmax(180px,260px)_minmax(160px,240px)_minmax(260px,1fr)_82px_110px_118px_118px_92px_38px] gap-2 border-b border-border/80 bg-secondary/30 px-2 py-2 text-[0.64rem] font-medium uppercase text-muted-foreground">
          <span>Product</span>
          <span>Component</span>
          <span>Description</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Unit</span>
          <span className="text-right">Annual</span>
          <span className="text-right">Total</span>
          <span>Renewable</span>
          <span className="sr-only">Actions</span>
        </div>
        {rows.map((row, index) => {
          const modules = moduleOptions.filter(
            (option) => option.parentId === row.productId
          );
          const rowHasValues =
            Boolean(row.id) ||
            Boolean(row.productId) ||
            Boolean(row.productModuleId) ||
            Boolean(row.description.trim()) ||
            Boolean(row.sku.trim()) ||
            Boolean(row.notesText.trim()) ||
            Number(row.unitPrice || 0) > 0 ||
            Number(row.annualAmount || 0) > 0 ||
            Number(row.totalAmount || 0) > 0;
          const productMissing = rowHasValues && !row.productId;
          const descriptionMissing = rowHasValues && !row.description.trim();

          return (
            <div
              key={row.key}
              className="border-b border-border/60 bg-secondary/10 last:border-b-0"
            >
              <input type="hidden" name={`line_${index}_id`} value={row.id} />
              <input
                type="hidden"
                name={`line_${index}_sortOrder`}
                value={index}
              />
              <div className="grid grid-cols-[minmax(180px,260px)_minmax(160px,240px)_minmax(260px,1fr)_82px_110px_118px_118px_92px_38px] items-start gap-2 px-2 py-2">
                <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-300">
                  <span className="sr-only">Product</span>
                  <select
                    name={`line_${index}_productId`}
                    value={row.productId || "none"}
                    onChange={(event) =>
                      updateRow(row.key, {
                        productId:
                          event.target.value === "none"
                            ? ""
                            : event.target.value,
                        productModuleId: "",
                      })
                    }
                    className={`h-9 w-full rounded-lg border bg-secondary/45 px-2 text-sm text-slate-100 ${
                      productMissing ? "border-red-400/70" : "border-border/80"
                    }`}
                    aria-invalid={productMissing}
                  >
                    <option value="none">Select product</option>
                    {productOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {productMissing ? (
                    <span className="text-[0.7rem] text-red-200">Required</span>
                  ) : null}
                </label>
                <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-300">
                  <span className="sr-only">Component</span>
                  <select
                    name={`line_${index}_productModuleId`}
                    value={row.productModuleId || "none"}
                    onChange={(event) =>
                      updateRow(row.key, {
                        productModuleId:
                          event.target.value === "none"
                            ? ""
                            : event.target.value,
                      })
                    }
                    className="h-9 w-full rounded-lg border border-border/80 bg-secondary/45 px-2 text-sm text-slate-100"
                  >
                    <option value="none">None</option>
                    {modules.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-300">
                  <span className="sr-only">Description</span>
                  <Input
                    name={`line_${index}_description`}
                    value={row.description}
                    onChange={(event) =>
                      updateRow(row.key, { description: event.target.value })
                    }
                    placeholder="What this line buys"
                    className={`h-9 bg-secondary/45 text-sm ${
                      descriptionMissing
                        ? "border-red-400/70"
                        : "border-border/80"
                    }`}
                    aria-invalid={descriptionMissing}
                  />
                  {descriptionMissing ? (
                    <span className="text-[0.7rem] text-red-200">Required</span>
                  ) : null}
                </label>
                <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-300">
                  <span className="sr-only">Qty</span>
                  <Input
                    name={`line_${index}_quantity`}
                    type="number"
                    min="0"
                    value={row.quantity}
                    onChange={(event) =>
                      updateRow(row.key, { quantity: event.target.value })
                    }
                    className="h-9 border-border/80 bg-secondary/45 text-right text-sm"
                  />
                </label>
                <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-300">
                  <span className="sr-only">Unit Price</span>
                  <Input
                    name={`line_${index}_unitPrice`}
                    type="number"
                    min="0"
                    value={row.unitPrice}
                    onChange={(event) =>
                      updateRow(row.key, { unitPrice: event.target.value })
                    }
                    className="h-9 border-border/80 bg-secondary/45 text-right text-sm"
                  />
                </label>
                <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-300">
                  <span className="sr-only">Annual</span>
                  <Input
                    name={`line_${index}_annualAmount`}
                    type="number"
                    min="0"
                    value={row.annualAmount}
                    onChange={(event) =>
                      updateRow(row.key, {
                        annualAmount: event.target.value,
                        annualOverridden:
                          Number(event.target.value || 0) !==
                          calculatedAnnual(row),
                      })
                    }
                    className="h-9 border-border/80 bg-secondary/45 text-right text-sm"
                  />
                  <button
                    type="button"
                    className="justify-self-end text-[0.7rem] text-cyan-200"
                    onClick={() =>
                      updateRow(row.key, {
                        annualOverridden: false,
                        annualAmount: formatNumber(calculatedAnnual(row)),
                      })
                    }
                  >
                    {row.annualOverridden ? "Use calc" : "Calculated"}
                  </button>
                </label>
                <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-300">
                  <span className="sr-only">Total</span>
                  <Input
                    name={`line_${index}_totalAmount`}
                    type="number"
                    min="0"
                    value={row.totalAmount}
                    onChange={(event) =>
                      updateRow(row.key, {
                        totalAmount: event.target.value,
                        totalOverridden:
                          Number(event.target.value || 0) !==
                          calculatedTotal(row, startsOn, endsOn),
                      })
                    }
                    className="h-9 border-border/80 bg-secondary/45 text-right text-sm"
                  />
                  <button
                    type="button"
                    className="justify-self-end text-[0.7rem] text-cyan-200"
                    onClick={() =>
                      updateRow(row.key, {
                        totalOverridden: false,
                        totalAmount: formatNumber(
                          calculatedTotal(row, startsOn, endsOn)
                        ),
                      })
                    }
                  >
                    {row.totalOverridden ? "Use calc" : "Calculated"}
                  </button>
                </label>
                <label className="flex h-9 items-center gap-2 text-xs font-medium text-slate-300">
                  <input
                    name={`line_${index}_renewable`}
                    type="checkbox"
                    checked={row.renewable}
                    onChange={(event) =>
                      updateRow(row.key, { renewable: event.target.checked })
                    }
                  />
                  Renewable
                </label>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => removeRow(row.key)}
                    disabled={rows.length === 1}
                    aria-label="Remove product row"
                  >
                    <X />
                  </Button>
                </div>
              </div>

              <details className="px-2 pb-2">
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                  More line details
                </summary>
                <div className="mt-2 grid max-w-[1200px] gap-2 md:grid-cols-2 xl:grid-cols-4">
                  <Input
                    name={`line_${index}_sku`}
                    value={row.sku}
                    onChange={(event) =>
                      updateRow(row.key, { sku: event.target.value })
                    }
                    placeholder="SKU"
                    className="h-9 border-border/80 bg-secondary/45 text-sm"
                  />
                  <select
                    name={`line_${index}_licenseMetric`}
                    value={row.licenseMetric}
                    onChange={(event) =>
                      updateRow(row.key, { licenseMetric: event.target.value })
                    }
                    className="h-9 rounded-lg border border-border/80 bg-secondary/45 px-2 text-sm text-slate-100"
                  >
                    <option value="none">No metric</option>
                    {optionSets.licenseMetrics.map((metric) => (
                      <option key={metric} value={metric}>
                        {titleCaseEnum(metric)}
                      </option>
                    ))}
                  </select>
                  <Input
                    name={`line_${index}_startsOn`}
                    type="date"
                    value={row.startsOn || startsOn}
                    onChange={(event) =>
                      updateRow(row.key, { startsOn: event.target.value })
                    }
                    className="h-9 border-border/80 bg-secondary/45 text-sm"
                  />
                  <Input
                    name={`line_${index}_endsOn`}
                    type="date"
                    value={row.endsOn || endsOn}
                    onChange={(event) =>
                      updateRow(row.key, { endsOn: event.target.value })
                    }
                    className="h-9 border-border/80 bg-secondary/45 text-sm"
                  />
                  <div className="md:col-span-2 xl:col-span-4">
                    <Textarea
                      name={`line_${index}_notesText`}
                      value={row.notesText}
                      onChange={(event) =>
                        updateRow(row.key, { notesText: event.target.value })
                      }
                      placeholder="Line notes"
                      className="min-h-16 border-border/80 bg-secondary/45 text-sm"
                    />
                  </div>
                </div>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  name,
  defaultValue,
  value,
  type = "text",
  onChange,
  errors,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  value?: string;
  type?: string;
  onChange?: (value: string) => void;
  errors?: string[];
}) {
  return (
    <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-300">
      {label}
      <Input
        name={name}
        type={type}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={(event) => onChange?.(event.target.value)}
        className="border-border/80 bg-secondary/45"
        aria-invalid={Boolean(errors?.length)}
      />
      <ErrorText errors={errors} />
    </label>
  );
}

function LabeledTextarea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-300">
      {label}
      <Textarea
        name={name}
        defaultValue={defaultValue}
        className="border-border/80 bg-secondary/45"
      />
    </label>
  );
}

function LabeledSelect({
  label,
  name,
  options,
  defaultValue,
  value,
  onChange,
  includeNone = false,
  noneLabel = "None",
  errors,
}: {
  label: string;
  name: string;
  options: Option[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  includeNone?: boolean;
  noneLabel?: string;
  errors?: string[];
}) {
  return (
    <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-300">
      {label}
      <select
        name={name}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-9 w-full min-w-0 rounded-lg border border-border/80 bg-secondary/45 px-3 text-sm text-slate-100"
        aria-invalid={Boolean(errors?.length)}
      >
        {includeNone ? <option value="none">{noneLabel}</option> : null}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
            {option.active === false ? " (inactive)" : ""}
            {option.hint ? ` - ${option.hint}` : ""}
          </option>
        ))}
      </select>
      <ErrorText errors={errors} />
    </label>
  );
}

function ContractDetails({
  contract,
  productOptions,
  moduleOptions,
  onEditContract,
  onAddProduct,
  onBudget,
  onRenewal,
}: {
  contract: ContractRecord;
  productOptions: Option[];
  moduleOptions: Option[];
  onEditContract: () => void;
  onAddProduct: () => void;
  onBudget: () => void;
  onRenewal: () => void;
}) {
  const [tab, setTab] = useState("Products and Pricing");
  return (
    <section className="rounded-lg border border-border/80 bg-card/95">
      <div className="grid gap-3 border-b border-border/80 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              {contract.title}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {contract.vendorCompany?.name ?? "Unassigned"} /{" "}
              {contract.sellerCompany?.name ?? "Direct"} /{" "}
              {money(contract.annualValue)} annual
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onEditContract}>
              <Pencil data-icon="inline-start" />
              Edit
            </Button>
            <Button variant="outline" onClick={onBudget}>
              <CircleDollarSign data-icon="inline-start" />
              Push to Budget
            </Button>
            <Button variant="outline" onClick={onRenewal}>
              <FilePlus2 data-icon="inline-start" />
              Push to Renewal
            </Button>
            <DeleteContractForm
              contractId={contract.id}
              contractTitle={contract.title}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {[
            "Products and Pricing",
            "Contract Overview",
            "Documents",
            "Renewal History",
          ].map((item) => (
            <Button
              key={item}
              variant={tab === item ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 p-3">
        {tab === "Products and Pricing" ? (
          <ContractProductsTable
            contract={contract}
            productOptions={productOptions}
            moduleOptions={moduleOptions}
            onAddProduct={onAddProduct}
            onEditProduct={onEditContract}
          />
        ) : null}
        {tab === "Contract Overview" ? (
          <ContractOverview contract={contract} />
        ) : null}
        {tab === "Documents" ? <DocumentsTab contract={contract} /> : null}
        {tab === "Renewal History" ? (
          <ContractRenewalHistory contract={contract} />
        ) : null}
      </div>
    </section>
  );
}

function ContractProductsTable({
  contract,
  productOptions,
  moduleOptions,
  onAddProduct,
  onEditProduct,
}: {
  contract: ContractRecord;
  productOptions: Option[];
  moduleOptions: Option[];
  onAddProduct: () => void;
  onEditProduct: () => void;
}) {
  const vendorProducts = productOptions.filter(
    (option) =>
      !contract.vendorCompanyId || option.parentId === contract.vendorCompanyId
  );
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="grid gap-1 sm:grid-cols-3 sm:gap-6">
          <Fact label="Vendor Products" value={String(vendorProducts.length)} />
          <Fact label="Annual Total" value={money(contract.annualValue)} />
          <Fact
            label="Total Contract Value"
            value={money(contract.totalValue)}
          />
        </div>
        <Button
          className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
          onClick={onAddProduct}
        >
          <Plus data-icon="inline-start" />
          Add Product
        </Button>
      </div>
      <div className="overflow-auto rounded-lg border border-border/80">
        <Table className="min-w-[1120px] table-fixed text-xs">
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead className="w-48">Product</TableHead>
              <TableHead className="w-44">Component</TableHead>
              <TableHead className="w-64">Description</TableHead>
              <TableHead className="w-20 text-right">Qty</TableHead>
              <TableHead className="w-28 text-right">Unit</TableHead>
              <TableHead className="w-28 text-right">Annual</TableHead>
              <TableHead className="w-28 text-right">Total</TableHead>
              <TableHead className="w-24">Renewable</TableHead>
              <TableHead className="w-44">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(contract.lineItems ?? []).map((line, index) => (
              <TableRow key={line.id}>
                <TableCell className="truncate">
                  {line.product?.name ?? "Unassigned"}
                </TableCell>
                <TableCell className="truncate">
                  {line.productModule?.name ?? "None"}
                </TableCell>
                <TableCell className="truncate">{line.description}</TableCell>
                <TableCell className="font-mono text-right">
                  {line.quantity}
                </TableCell>
                <TableCell className="font-mono text-right">
                  {money(line.unitPrice)}
                </TableCell>
                <TableCell className="font-mono text-right">
                  {money(line.annualAmount)}
                </TableCell>
                <TableCell className="font-mono text-right">
                  {money(line.totalAmount)}
                </TableCell>
                <TableCell>
                  <StatusBadge value={line.renewable ? "Yes" : "No"} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Edit ${line.description}`}
                      onClick={onEditProduct}
                    >
                      <Pencil />
                    </Button>
                    <DuplicateLineForm lineId={line.id} />
                    <ReorderLineForm
                      contractId={contract.id}
                      lineItems={contract.lineItems ?? []}
                      index={index}
                      direction="up"
                    />
                    <ReorderLineForm
                      contractId={contract.id}
                      lineItems={contract.lineItems ?? []}
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
      {moduleOptions.length || contract.lineItems?.length ? null : (
        <EmptyState>
          Add a product row to make this contract useful for renewals.
        </EmptyState>
      )}
    </div>
  );
}

function ContractOverview({ contract }: { contract: ContractRecord }) {
  return (
    <div className="grid gap-3 rounded-lg border border-border/80 bg-card/80 p-3 md:grid-cols-3">
      <Fact
        label="Vendor"
        value={contract.vendorCompany?.name ?? "Unassigned"}
      />
      <Fact label="Reseller" value={contract.sellerCompany?.name ?? "Direct"} />
      <Fact
        label="Term"
        value={`${dateOnly(contract.startsOn)} to ${dateOnly(contract.endsOn)}`}
      />
      <Fact
        label="Contract Type"
        value={titleCaseEnum(contract.contractType)}
      />
      <Fact label="Payment" value={titleCaseEnum(contract.paymentFrequency)} />
      <Fact
        label="Notice Deadline"
        value={noticeDeadline(contract) || "None"}
      />
      <Fact
        label="Contract Owner"
        value={contract.contractOwner ?? "Unassigned"}
      />
      <Fact
        label="Business Owner"
        value={contract.businessOwner ?? "Unassigned"}
      />
      <Fact
        label="Security Owner"
        value={contract.securityOwner ?? "Unassigned"}
      />
      <Fact
        label="Procurement"
        value={contract.procurementContact ?? "Unassigned"}
      />
      <Fact
        label="Vendor AM"
        value={contract.vendorAccountManager ?? "Unassigned"}
      />
      <Fact
        label="Reseller AM"
        value={contract.resellerAccountManager ?? "Unassigned"}
      />
      <div className="md:col-span-3">
        <p className="text-[0.64rem] uppercase text-muted-foreground">
          Renewal Strategy
        </p>
        <p className="text-sm leading-5 text-slate-100">
          {contract.renewalStrategy ?? "No strategy recorded."}
        </p>
      </div>
      <div className="md:col-span-3">
        <p className="text-[0.64rem] uppercase text-muted-foreground">Notes</p>
        <p className="text-sm leading-5 text-slate-100">
          {contract.notesText ?? "No notes recorded."}
        </p>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.64rem] uppercase text-muted-foreground">{label}</p>
      <p className="truncate text-sm text-slate-100">{value}</p>
    </div>
  );
}

function DocumentsTab({ contract }: { contract: ContractRecord }) {
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
      {documents.map((document) => (
        <div
          key={document.id}
          className="rounded-lg border border-border/80 bg-card/80 p-3"
        >
          <p className="text-sm font-medium text-slate-100">{document.title}</p>
          <p className="text-xs text-muted-foreground">
            {titleCaseEnum(document.type)}
          </p>
        </div>
      ))}
    </div>
  );
}

function ContractRenewalHistory({ contract }: { contract: ContractRecord }) {
  const renewals = contract.maintenanceRenewals ?? [];
  if (!renewals.length) {
    return (
      <EmptyState>
        No maintenance renewal has been created for this contract.
      </EmptyState>
    );
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
          {renewals.map((renewal) => (
            <TableRow key={renewal.id}>
              <TableCell>{renewal.renewalName}</TableCell>
              <TableCell className="font-mono">
                {dateOnly(renewal.renewalDate)}
              </TableCell>
              <TableCell>{renewal.lineItems?.length ?? 0} products</TableCell>
              <TableCell>
                <StatusBadge value={renewal.workflowStage} />
              </TableCell>
              <TableCell>
                <StatusBadge
                  value={
                    renewal.approvedDisposition ??
                    renewal.recommendedDisposition
                  }
                />
              </TableCell>
              <TableCell className="font-mono text-right">
                {money(renewal.currentAnnualCost)}
              </TableCell>
              <TableCell className="font-mono text-right">
                {money(renewal.forecastedRenewalCost)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CreateRenewalDialog({
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
  contract?: ContractRecord;
  fiscalOptions: Option[];
  budgetPlanOptions: Option[];
  accountOptions: Option[];
  annualOptions: Option[];
}) {
  const renewableLineCount =
    contract?.lineItems?.filter((line) => line.renewable).length ?? 0;
  const [fiscalYearId, setFiscalYearId] = useState(fiscalOptions[0]?.id ?? "");
  const [budgetPlanId, setBudgetPlanId] = useState(
    budgetPlanOptions[0]?.id ?? ""
  );
  const [fundingAccountId, setFundingAccountId] = useState(
    accountOptions[0]?.id ?? ""
  );
  const [linkedAnnualFinancialId, setLinkedAnnualFinancialId] =
    useState("none");

  if (!open || !contract) return null;
  return (
    <section className="rounded-lg border border-border/80 bg-card/95">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/80 p-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Push Contract to Renewal
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Copies the contract header and renewable line-item baseline into a
            new operational renewal case.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          Close Renewal
        </Button>
      </div>
      <div className="p-3">
        <FormShell
          title={contract.title}
          action={createRenewalFromContractAction}
        >
          {(_state, pending) => (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input type="hidden" name="contractId" value={contract.id} />
              <SelectBox
                label="Target fiscal year"
                name="fiscalYearId"
                options={fiscalOptions}
                value={fiscalYearId}
                onChange={setFiscalYearId}
              />
              <SelectBox
                label="Budget plan"
                name="budgetPlanId"
                options={budgetPlanOptions}
                value={budgetPlanId}
                onChange={setBudgetPlanId}
              />
              <SelectBox
                label="Funding account"
                name="fundingAccountId"
                options={accountOptions}
                value={fundingAccountId}
                onChange={setFundingAccountId}
              />
              <SelectBox
                label="Linked annual financial"
                name="linkedAnnualFinancialId"
                options={annualOptions}
                value={linkedAnnualFinancialId}
                onChange={setLinkedAnnualFinancialId}
                includeNone
              />
              <Field label="Department" name="department" defaultValue="" />
              <Field label="Cost center" name="costCenter" defaultValue="" />
              <Field
                label="Renewal owner"
                name="renewalOwner"
                defaultValue={contract.businessOwner ?? ""}
              />
              <div
                className={`rounded-lg border p-3 text-xs ${
                  renewableLineCount
                    ? "border-border/80 bg-secondary/30 text-muted-foreground"
                    : "border-amber-400/40 bg-amber-400/10 text-amber-100"
                }`}
              >
                {renewableLineCount} renewable lines will be copied as renewal
                pricing snapshots.
              </div>
              <div className="md:col-span-2 xl:col-span-4">
                <Button
                  type="submit"
                  disabled={pending || renewableLineCount === 0}
                >
                  {pending ? "Pushing..." : "Push to Renewal"}
                </Button>
              </div>
            </div>
          )}
        </FormShell>
      </div>
    </section>
  );
}

function PushBudgetDialog({
  open,
  onOpenChange,
  contract,
  fiscalOptions,
  budgetPlanOptions,
  accountOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: ContractRecord;
  fiscalOptions: Option[];
  budgetPlanOptions: Option[];
  accountOptions: Option[];
}) {
  const defaultAccount =
    accountOptions.find((option) => option.label.includes("63256")) ??
    accountOptions.find((option) => option.label.includes("62094")) ??
    accountOptions[0];
  const [fiscalYearId, setFiscalYearId] = useState(fiscalOptions[0]?.id ?? "");
  const [budgetPlanId, setBudgetPlanId] = useState(
    budgetPlanOptions[0]?.id ?? ""
  );
  const [accountId, setAccountId] = useState(defaultAccount?.id ?? "");

  if (!open || !contract) return null;
  return (
    <section className="rounded-lg border border-border/80 bg-card/95">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/80 p-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Push Contract to Budget
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Creates or updates a budget planning row from this contract&apos;s
            annual value.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          Close Budget
        </Button>
      </div>
      <div className="p-3">
        <FormShell title={contract.title} action={pushContractToBudgetAction}>
          {(_state, pending) => (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input type="hidden" name="contractId" value={contract.id} />
              <SelectBox
                label="Target fiscal year"
                name="fiscalYearId"
                options={fiscalOptions}
                value={fiscalYearId}
                onChange={setFiscalYearId}
              />
              <SelectBox
                label="Budget plan"
                name="budgetPlanId"
                options={budgetPlanOptions}
                value={budgetPlanId}
                onChange={setBudgetPlanId}
              />
              <SelectBox
                label="Budget account"
                name="accountId"
                options={accountOptions}
                value={accountId}
                onChange={setAccountId}
              />
              <div className="rounded-lg border border-border/80 bg-secondary/30 p-3 text-xs text-muted-foreground">
                <span className="block uppercase">Annual value</span>
                <span className="text-base font-semibold text-slate-100">
                  {money(contract.annualValue)}
                </span>
              </div>
              <div className="md:col-span-2 xl:col-span-4">
                <Button type="submit" disabled={pending}>
                  {pending ? "Pushing..." : "Push to Budget"}
                </Button>
              </div>
            </div>
          )}
        </FormShell>
      </div>
    </section>
  );
}

function DeleteContractForm({
  contractId,
  contractTitle,
}: {
  contractId: string;
  contractTitle: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    deleteContractAction,
    emptyActionResult
  );

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [router, state.ok]);

  return (
    <form
      action={formAction}
      className="flex items-center gap-2"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Delete ${contractTitle}? Contracts with linked renewal, budget, deployment, procurement, invoice, or payment records will be marked terminated instead.`
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={contractId} />
      <Button type="submit" variant="destructive" disabled={pending} size="sm">
        <Trash2 data-icon="inline-start" />
        {pending ? "Deleting..." : "Delete"}
      </Button>
      {state.message ? (
        <span
          className={
            state.ok ? "text-xs text-emerald-200" : "text-xs text-red-200"
          }
        >
          {state.message}
        </span>
      ) : null}
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
      <Button
        variant="destructive"
        size="icon-sm"
        disabled={pending}
        aria-label="Delete product row"
      >
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
      <Button
        variant="outline"
        size="icon-sm"
        disabled={pending}
        aria-label="Duplicate product row"
      >
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
  lineItems: ContractLineItemRecord[];
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
      <input
        type="hidden"
        name="orderedIds"
        value={next.map((line) => line.id).join(",")}
      />
      <Button
        variant="outline"
        size="icon-sm"
        disabled={disabled}
        aria-label={
          direction === "up" ? "Move product row up" : "Move product row down"
        }
      >
        {direction === "up" ? <ArrowUp /> : <ArrowDown />}
      </Button>
      {state.ok ? <span className="sr-only">{state.message}</span> : null}
    </form>
  );
}
