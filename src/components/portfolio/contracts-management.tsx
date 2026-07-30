"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CircleDollarSign,
  Copy,
  FilePlus2,
  MoreHorizontal,
  MoveRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  createRenewalFromContractAction,
  deleteContractAction,
  deleteContractLineAction,
  duplicateContractLineAction,
  loadContractEditorOptionsAction,
  loadContractHandoffOptionsAction,
  pushContractToBudgetAction,
  reorderContractLinesAction,
  saveContractWithLinesAction,
} from "@/app/contracts/actions";
import { WorkspaceShell } from "@/components/app/workspace-shell";
import {
  DepartmentMoveButton,
  DepartmentReassignmentDialog,
} from "@/components/app/department-reassignment";
import { useGlobalContext } from "@/components/app/global-context-provider";
import {
  EmptyState,
  Field,
  FormShell,
  MutationError,
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
import { resolveTableUpdater } from "@/lib/client/manual-table-state";
import type { GlobalContextSelection } from "@/lib/server/global-context";
import type {
  ContractDetailDto,
  ContractEditorOptionsDto,
  ContractHandoffOptionsDto,
  ContractListRowDto,
  ContractPageDataDto,
  ContractSortKey,
} from "@/types/contracts";

type RoleName = "VENDOR" | "RESELLER";
type SortKey = ContractSortKey;

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

type ContractLineItemRecord = ContractDetailDto["lineItems"][number];
type ContractRecord = ContractListRowDto &
  Partial<
    Pick<
      ContractDetailDto,
      | "renewalStrategy"
      | "notesText"
      | "lineItems"
      | "maintenanceRenewals"
      | "documents"
    >
  >;
type ContractPageData = ContractPageDataDto;

const contractRegisterColumns: Array<
  ColumnDef<ContractRecord> & {
    id: SortKey;
    header: string;
    meta: { width: string };
  }
> = [
  { id: "title", header: "Contract", meta: { width: "w-[22%]" } },
  { id: "department", header: "Department", meta: { width: "w-[13%]" } },
  { id: "vendor", header: "Vendor", meta: { width: "w-[12%]" } },
  { id: "seller", header: "Reseller", meta: { width: "w-[13%]" } },
  { id: "term", header: "Term", meta: { width: "w-[10%]" } },
  { id: "annualValue", header: "Value", meta: { width: "w-[12%]" } },
  { id: "notice", header: "Renewal", meta: { width: "w-[12%]" } },
  { id: "status", header: "Status", meta: { width: "w-[9%]" } },
];

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

function noticeDeadline(contract: ContractRecord) {
  const anchor = contract.renewalDate ?? contract.endsOn;
  if (!anchor) return "";
  const date = new Date(`${dateOnly(anchor)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - Number(contract.noticePeriodDays ?? 60));
  return date.toISOString().slice(0, 10);
}

function renewalStatus(contract: ContractRecord) {
  const renewal =
    contract.maintenanceRenewals?.[0] ?? contract.latestRenewal ?? null;
  if (!renewal) return "Renewal Not Created";
  if (
    renewal.overallStatus === "NOT_RENEWING" ||
    renewal.approvedDisposition === "DO_NOT_RENEW" ||
    renewal.approvedDisposition === "DECOMMISSION"
  ) {
    return "Not Renewing";
  }
  if (renewal.overallStatus === "COMPLETED") {
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

export function ContractsManagement({
  data,
  selection,
}: {
  data: ContractPageData;
  selection: GlobalContextSelection;
}) {
  return (
    <ContractsPageClient
      key={data.filters.search ?? ""}
      data={data}
      selection={selection}
    />
  );
}

function ContractsPageClient({
  data,
  selection,
}: {
  data: ContractPageData;
  selection: GlobalContextSelection;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startNavigation] = useTransition();
  const contracts = data.contracts;
  const vendors = useMemo(() => roleOptions(data.companies, "VENDOR"), [data]);
  const sellers = useMemo(
    () => roleOptions(data.companies, "RESELLER"),
    [data]
  );
  const [editorOptions, setEditorOptions] = useState<ContractEditorOptionsDto>({
    products: [],
    modules: [],
    paymentFrequencies: [],
    licenseMetrics: [],
  });
  const products = useMemo(
    () => productOptions(editorOptions.products),
    [editorOptions.products]
  );
  const modules = useMemo(
    () => moduleOptions(editorOptions.modules),
    [editorOptions.modules]
  );
  const [handoffOptions, setHandoffOptions] =
    useState<ContractHandoffOptionsDto | null>(null);
  const [query, setQuery] = useState(data.filters.search ?? "");
  const vendorFilter = data.filters.vendorCompanyId ?? "All";
  const sellerFilter = data.filters.sellerCompanyId ?? "All";
  const statusFilter = data.filters.status ?? "All";
  const windowFilter = data.filters.renewalWindow ?? "All";
  const sortKey = data.filters.sortBy;
  const sortDirection = data.filters.sortDirection;
  const selected = data.selectedContract;
  const [editor, setEditor] = useState<EditorState>({
    open: false,
    appendBlank: false,
  });
  const [renewalOpen, setRenewalOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [workspaceError, setWorkspaceError] = useState("");
  const [moveIds, setMoveIds] = useState<string[]>([]);
  const [moveOpen, setMoveOpen] = useState(false);

  const metrics = [
    { label: "Active", value: data.metrics.active },
    { label: "Annual Value", value: money(data.metrics.annualValue) },
    { label: "Total Value", value: money(data.metrics.totalValue) },
    { label: "Due 90", value: data.metrics.due90 },
    { label: "No Renewal", value: data.metrics.noRenewal },
    { label: "Line Items", value: data.metrics.lineItems },
  ];

  const navigate = (
    changes: Record<string, string | undefined>,
    clearCursor = true
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (!value || value === "All") params.delete(key);
      else params.set(key, value);
    }
    if (clearCursor) params.delete("cursor");
    startNavigation(() => {
      router.push(`/contracts${params.size ? `?${params.toString()}` : ""}`);
    });
  };

  const updateSort = (
    nextSortKey: SortKey,
    nextSortDirection: "asc" | "desc"
  ) => {
    navigate({
      sort: nextSortKey,
      direction: nextSortDirection,
    });
  };

  const loadEditorOptions = async (
    vendorCompanyId?: string,
    productIds?: string[]
  ) => {
    const loaded = await loadContractEditorOptionsAction({
      vendorCompanyId,
      productIds,
    });
    setEditorOptions(loaded);
    return loaded;
  };

  const openEditor = async (contract?: ContractRecord, appendBlank = false) => {
    setRenewalOpen(false);
    setBudgetOpen(false);
    if (
      contract &&
      contract.lineItemCount > (contract.lineItems?.length ?? 0)
    ) {
      setWorkspaceError(
        "This Contract has more than 100 pricing lines. The bounded editor will not open because saving a partial line set would be unsafe."
      );
      return;
    }
    setWorkspaceError("");
    const productIds = contract?.lineItems
      ?.map((line) => line.productId)
      .filter((id): id is string => Boolean(id));
    await loadEditorOptions(contract?.vendorCompanyId ?? undefined, productIds);
    setEditor({ open: true, contract, appendBlank });
  };

  const loadHandoff = async () => {
    if (handoffOptions) return handoffOptions;
    const loaded = await loadContractHandoffOptionsAction(selection);
    setHandoffOptions(loaded);
    return loaded;
  };

  const openRenewal = async (contract: ContractRecord) => {
    navigate({ selected: contract.id });
    setEditor({ open: false, appendBlank: false });
    setBudgetOpen(false);
    await loadHandoff();
    setRenewalOpen(true);
  };

  const openBudget = async (contract: ContractRecord) => {
    navigate({ selected: contract.id });
    setEditor({ open: false, appendBlank: false });
    setRenewalOpen(false);
    await loadHandoff();
    setBudgetOpen(true);
  };

  return (
    <WorkspaceShell
      title="Contracts"
      description="Commercial contract source of truth for current term pricing, product scope, and renewal handoff."
    >
      <div className="grid min-w-0 gap-3">
        <MetricRail metrics={metrics} />
        {successMessage ? (
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
            {successMessage}
          </div>
        ) : null}
        {workspaceError ? (
          <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200">
            {workspaceError}
          </div>
        ) : null}
        <div className="min-w-0 overflow-hidden rounded-lg border border-border/80 bg-card/95">
          <ContractsToolbar
            query={query}
            setQuery={setQuery}
            onSearch={() => navigate({ q: query })}
            vendorFilter={vendorFilter}
            setVendorFilter={(value) => navigate({ vendor: value })}
            sellerFilter={sellerFilter}
            setSellerFilter={(value) => navigate({ seller: value })}
            statusFilter={statusFilter}
            setStatusFilter={(value) => navigate({ status: value })}
            windowFilter={windowFilter}
            setWindowFilter={(value) => navigate({ window: value })}
            vendorOptions={vendors}
            sellerOptions={sellers}
            statusOptions={data.optionSets.contractStatuses}
            onNewContract={() => void openEditor()}
          />
          {moveIds.length ? (
            <div className="flex items-center justify-between gap-2 border-b border-border/70 bg-cyan-400/10 px-3 py-2 text-xs">
              <span>
                {moveIds.length} contract{moveIds.length === 1 ? "" : "s"}{" "}
                selected
              </span>
              <DepartmentMoveButton onClick={() => setMoveOpen(true)} />
            </div>
          ) : null}
          <ContractsTable
            contracts={contracts}
            selectedId={selected?.id}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={updateSort}
            vendorOptions={vendors}
            sellerOptions={sellers}
            statusOptions={data.optionSets.contractStatuses}
            onSelect={(contractId) => navigate({ selected: contractId }, false)}
            onOpen={(contract) => navigate({ selected: contract.id }, false)}
            onSaved={(contractId, message) => {
              navigate({ selected: contractId }, false);
              setSuccessMessage(message);
            }}
            onRenewal={(contract) => {
              void openRenewal(contract);
            }}
            selectedForMove={moveIds}
            onToggleMove={(id) =>
              setMoveIds((current) =>
                current.includes(id)
                  ? current.filter((value) => value !== id)
                  : [...current, id]
              )
            }
            onMove={(contract) => {
              setMoveIds([contract.id]);
              setMoveOpen(true);
            }}
          />
          {data.filters.cursor || data.nextCursor ? (
            <div className="flex justify-end gap-2 border-t border-border/70 p-2">
              {data.filters.cursor ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate({ cursor: undefined }, false)}
                >
                  First page
                </Button>
              ) : null}
              {data.nextCursor ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate({ cursor: data.nextCursor ?? undefined }, false)
                  }
                >
                  Next 50
                </Button>
              ) : null}
            </div>
          ) : null}
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
          onLoadOptions={loadEditorOptions}
          optionSets={{
            ...data.optionSets,
            paymentFrequencies: editorOptions.paymentFrequencies.length
              ? editorOptions.paymentFrequencies
              : data.optionSets.paymentFrequencies,
            licenseMetrics: editorOptions.licenseMetrics.length
              ? editorOptions.licenseMetrics
              : data.optionSets.licenseMetrics,
          }}
          onSaved={(contractId, message) => {
            navigate({ selected: contractId }, false);
            setSuccessMessage(message);
            setEditor({ open: false, appendBlank: false });
          }}
        />

        {selected && !editor.open && !renewalOpen && !budgetOpen ? (
          <ContractDetails
            contract={selected}
            productOptions={products}
            moduleOptions={modules}
            onEditContract={() => void openEditor(selected)}
            onAddProduct={() => void openEditor(selected, true)}
            onBudget={() => void openBudget(selected)}
            onRenewal={() => void openRenewal(selected)}
          />
        ) : !editor.open && !renewalOpen && !budgetOpen ? (
          <EmptyState>No contracts match the current filters.</EmptyState>
        ) : null}

        {moveOpen ? (
          <DepartmentReassignmentDialog
            entityType="contract"
            entityIds={moveIds}
            currentDepartment={selected?.department?.name}
            label="Contract"
            onClose={() => {
              setMoveIds([]);
              setMoveOpen(false);
            }}
            onComplete={() => undefined}
          />
        ) : null}

        {handoffOptions ? (
          <PushBudgetDialog
            key={`${selected?.id ?? "none"}-${budgetOpen ? "budget-open" : "budget-closed"}`}
            open={budgetOpen}
            onOpenChange={setBudgetOpen}
            contract={selected ?? undefined}
            fiscalOptions={optionRows(
              handoffOptions.fiscalYears,
              (fy) => fy.label
            )}
            budgetPlanOptions={optionRows(
              handoffOptions.budgetPlans,
              (plan) =>
                `${plan.fiscalYear.label} / ${plan.name} ${plan.version}`
            )}
            accountOptions={optionRows(
              handoffOptions.budgetAccounts,
              (account) => `${account.code} ${account.name}`
            )}
          />
        ) : null}

        {handoffOptions ? (
          <CreateRenewalDialog
            key={`${selected?.id ?? "none"}-${renewalOpen ? "open" : "closed"}`}
            open={renewalOpen}
            onOpenChange={setRenewalOpen}
            contract={selected ?? undefined}
            fiscalOptions={optionRows(
              handoffOptions.fiscalYears,
              (fy) => fy.label
            )}
            budgetPlanOptions={optionRows(
              handoffOptions.budgetPlans,
              (plan) =>
                `${plan.fiscalYear.label} / ${plan.name} ${plan.version}`
            )}
            accountOptions={optionRows(
              handoffOptions.budgetAccounts,
              (account) => `${account.code} ${account.name}`
            )}
            annualOptions={optionRows(
              handoffOptions.annualFinancials,
              (row) =>
                `${row.budgetPlan.name} / ${titleCaseEnum(row.scenario.label)} / ${row.account.code} / ${row.budgetItem.name}`
            )}
          />
        ) : null}
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
  onSearch,
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
  onSearch: () => void;
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
      <form
        className="relative min-w-72 flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
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
      </form>
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
  sortDirection,
  onSortChange,
  vendorOptions,
  sellerOptions,
  statusOptions,
  onSelect,
  onOpen,
  onSaved,
  onRenewal,
  selectedForMove,
  onToggleMove,
  onMove,
}: {
  contracts: ContractRecord[];
  selectedId?: string;
  sortKey: SortKey;
  sortDirection: "asc" | "desc";
  onSortChange: (key: SortKey, direction: "asc" | "desc") => void;
  vendorOptions: Option[];
  sellerOptions: Option[];
  statusOptions: readonly string[];
  onSelect: (contractId: string) => void;
  onOpen: (contract: ContractRecord) => void;
  onSaved: (contractId: string, message: string) => void;
  onRenewal: (contract: ContractRecord) => void;
  selectedForMove: string[];
  onToggleMove: (contractId: string) => void;
  onMove: (contract: ContractRecord) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, ContractInlineDraft>>({});
  const sorting: SortingState = [
    { id: sortKey, desc: sortDirection === "desc" },
  ];
  // TanStack Table exposes stateful methods and intentionally opts this component out of compiler memoization.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: contracts,
    columns: contractRegisterColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (contract) => contract.id,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    enableSortingRemoval: false,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = resolveTableUpdater(updater, sorting);
      const first = next[0];
      if (first) onSortChange(first.id as SortKey, first.desc ? "desc" : "asc");
    },
  });
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
            <TableHead className="w-[4%]" />
            {table.getHeaderGroups()[0]?.headers.map((header) => (
              <TableHead
                key={header.id}
                className={
                  (
                    header.column.columnDef.meta as
                      | { width: string }
                      | undefined
                  )?.width
                }
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-1 text-xs"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <ArrowUpDown data-icon="inline-start" />
                  {String(header.column.columnDef.header)}
                  {header.column.getIsSorted() ? (
                    <span className="sr-only">sorted</span>
                  ) : null}
                </Button>
              </TableHead>
            ))}
            <TableHead className="w-[10%] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => {
            const contract = row.original;
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
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${contract.title} for department move`}
                    checked={selectedForMove.includes(contract.id)}
                    onChange={() => onToggleMove(contract.id)}
                  />
                </TableCell>
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
                        {contract.lineItemCount} products
                      </span>
                    </button>
                  )}
                </TableCell>
                <TableCell className="truncate text-muted-foreground">
                  {contract.department?.name ?? "Unassigned"}
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
                        aria-label={`Move ${contract.title} to another department`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onMove(contract);
                        }}
                      >
                        <MoveRight />
                      </Button>
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
      <input
        type="hidden"
        name="expectedUpdatedAt"
        value={contract.updatedAt}
      />
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
  onLoadOptions,
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
  onLoadOptions: (
    vendorCompanyId?: string,
    productIds?: string[]
  ) => Promise<ContractEditorOptionsDto>;
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
          onLoadOptions={onLoadOptions}
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
  onLoadOptions,
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
  onLoadOptions: (
    vendorCompanyId?: string,
    productIds?: string[]
  ) => Promise<ContractEditorOptionsDto>;
  optionSets: ContractPageData["optionSets"];
  onCancel: () => void;
  onSaved: (contractId: string, message: string) => void;
}) {
  const { departments } = useGlobalContext();
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
  const requestedOptions = useRef("");
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

  useEffect(() => {
    const selectedVendorId = vendorId === "none" ? "" : vendorId;
    if (!selectedVendorId) return;
    const productIds = [
      ...new Set(rows.map((row) => row.productId).filter(Boolean)),
    ].sort();
    const key = `${selectedVendorId}:${productIds.join(",")}`;
    if (requestedOptions.current === key) return;
    requestedOptions.current = key;
    void onLoadOptions(selectedVendorId, productIds);
  }, [onLoadOptions, rows, vendorId]);

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
      <input
        type="hidden"
        name="expectedUpdatedAt"
        value={contract?.updatedAt ?? ""}
      />
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
          <label className="grid gap-1.5 text-xs text-muted-foreground">
            Department
            <select
              name="departmentId"
              defaultValue={contract?.departmentId ?? "none"}
              className="h-9 rounded-md border border-border/80 bg-secondary/45 px-2 text-sm text-slate-100"
            >
              <option value="none">Unassigned</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
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
            label="Technical / security owner"
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
                      expectedUpdatedAt={contract.updatedAt}
                      lineItems={contract.lineItems ?? []}
                      index={index}
                      direction="up"
                    />
                    <ReorderLineForm
                      contractId={contract.id}
                      expectedUpdatedAt={contract.updatedAt}
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
        label="Technical / Security Owner"
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
              <TableCell>{renewal.lineItemCount} products</TableCell>
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
  const [state, formAction, pending] = useActionState(
    pushContractToBudgetAction,
    emptyActionResult
  );
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
        <form
          action={formAction}
          className="grid gap-3 rounded-lg border border-border/80 bg-card/80 p-4"
        >
          <h3 className="text-sm font-semibold text-slate-100">
            {contract.title}
          </h3>
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
          <MutationError result={state} />
        </form>
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
  const [state, formAction, pending] = useActionState(
    deleteContractAction,
    emptyActionResult
  );

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
  expectedUpdatedAt,
  lineItems,
  index,
  direction,
}: {
  contractId: string;
  expectedUpdatedAt: string;
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
      <input type="hidden" name="expectedUpdatedAt" value={expectedUpdatedAt} />
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
