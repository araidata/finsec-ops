"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  Columns3,
  MessageSquare,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  addCommentAction,
  createRenewalAction,
  updateRenewalRegisterAction,
} from "@/app/renewals/actions";
import { WorkspaceShell } from "@/components/app/workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  coOpExpirationState,
  renewalAmountChange,
  titleCaseEnum,
} from "@/lib/maintenance-renewal-rules";
import { emptyActionResult } from "@/lib/server/action-result";
import type { ActionResult } from "@/lib/server/action-result";

type Company = {
  id: string;
  name: string;
  active: boolean;
  roles: { role: string }[];
};

type Product = {
  id: string;
  name: string;
  active: boolean;
  vendorCompanyId?: string | null;
};

type TeamMember = {
  id: string;
  fullName: string;
  active: boolean;
};

type Note = {
  id: string;
  body: string;
  createdAt: string;
  author?: { name: string } | null;
};

type Activity = {
  id: string;
  entityId: string;
  fieldName?: string | null;
  previousValue?: string | null;
  newValue?: string | null;
  occurredAt: string;
  actor?: { name: string } | null;
};

type Renewal = {
  id: string;
  renewalName: string;
  productOrService: string;
  vendorCompanyId?: string | null;
  sellerCompanyId?: string | null;
  productId?: string | null;
  vendorCompany?: Company | null;
  sellerCompany?: Company | null;
  product?: Product | null;
  ownerTeamMemberId?: string | null;
  ownerTeamMember?: TeamMember | null;
  renewalOwner?: string | null;
  renewalDate: string;
  currentAnnualCost: number | string;
  approvedAmount: number | string;
  renewalStatus: string;
  coOpAgreement?: string | null;
  coOpContractNumber?: string | null;
  coOpAgreementExpirationDate?: string | null;
  purchasingVehicle?: { name: string; contractNumber?: string | null; endsOn?: string | null } | null;
  purchasingAgreement?: {
    sellerAwardNumber?: string | null;
    endsOn?: string | null;
    purchasingVehicle?: { name: string } | null;
  } | null;
  notes: Note[];
  decisionHistory: {
    id: string;
    changedAt: string;
    changedBy?: string | null;
    decisionStatus: string;
  }[];
  createdAt: string;
  updatedAt: string;
};

type PageData = {
  renewals: Renewal[];
  companies: Company[];
  products: Product[];
  teamMembers: TeamMember[];
  activityLogs: Activity[];
  purchasingVehicles: { id: string; name: string }[];
  fiscalYears: { id: string; label: string }[];
  budgetPlans: { id: string; fiscalYearId: string }[];
  budgetAccounts: { id: string }[];
  optionSets: { registerStatuses: string[] };
};

export type ColumnId =
  | "vendor"
  | "product"
  | "reseller"
  | "coOpAgreement"
  | "coOpContractNumber"
  | "coOpExpiration"
  | "renewalDate"
  | "daysRemaining"
  | "currentCost"
  | "renewalAmount"
  | "change"
  | "status"
  | "owner"
  | "comments"
  | "lastUpdated";

type Density = "comfortable" | "dense";
type Tab = "overview" | "financial" | "coop" | "comments" | "history";
type Preset = "standard" | "financial" | "tracking";

type ColumnDefinition = {
  id: ColumnId;
  label: string;
  defaultWidth: number;
  min: number;
  max: number;
  align?: "right";
};

const columns: ColumnDefinition[] = [
  { id: "vendor", label: "Vendor", defaultWidth: 190, min: 160, max: 220 },
  { id: "product", label: "Product", defaultWidth: 260, min: 220, max: 320 },
  { id: "reseller", label: "Reseller", defaultWidth: 165, min: 140, max: 190 },
  { id: "coOpAgreement", label: "Co-Op Agreement", defaultWidth: 140, min: 120, max: 160 },
  { id: "coOpContractNumber", label: "Co-Op Contract Number", defaultWidth: 170, min: 145, max: 190 },
  { id: "coOpExpiration", label: "Co-Op Agreement Exp. Date", defaultWidth: 150, min: 130, max: 165 },
  { id: "renewalDate", label: "Renewal Date", defaultWidth: 130, min: 120, max: 140 },
  { id: "daysRemaining", label: "Days Remaining", defaultWidth: 105, min: 90, max: 110, align: "right" },
  { id: "currentCost", label: "Current Annual Cost", defaultWidth: 145, min: 125, max: 150, align: "right" },
  { id: "renewalAmount", label: "Renewal Amount", defaultWidth: 145, min: 125, max: 150, align: "right" },
  { id: "change", label: "Increase / Decrease", defaultWidth: 155, min: 135, max: 170, align: "right" },
  { id: "status", label: "Renewal Status", defaultWidth: 165, min: 140, max: 180 },
  { id: "owner", label: "Owner", defaultWidth: 155, min: 130, max: 180 },
  { id: "comments", label: "Comments", defaultWidth: 280, min: 220, max: 340 },
  { id: "lastUpdated", label: "Last Updated", defaultWidth: 150, min: 130, max: 165 },
];

const presetColumns: Record<Preset, ColumnId[]> = {
  standard: columns.map((column) => column.id),
  financial: [
    "vendor",
    "product",
    "renewalDate",
    "currentCost",
    "renewalAmount",
    "change",
    "status",
    "owner",
  ],
  tracking: [
    "vendor",
    "product",
    "coOpAgreement",
    "coOpContractNumber",
    "coOpExpiration",
    "renewalDate",
    "daysRemaining",
    "status",
    "owner",
    "comments",
  ],
};

const preferenceKey = "finsec-ops:maintenance-renewals:columns:v2";
const anchoredColumnIds: ColumnId[] = ["vendor", "product"];

export function normalizeMaintenanceRenewalColumnOrder(candidate: readonly ColumnId[]) {
  const knownColumnIds = new Set(columns.map((column) => column.id));
  const movableColumns = candidate.filter(
    (id, index) => knownColumnIds.has(id) && !anchoredColumnIds.includes(id) && candidate.indexOf(id) === index
  );
  for (const column of columns) {
    if (!anchoredColumnIds.includes(column.id) && !movableColumns.includes(column.id)) movableColumns.push(column.id);
  }
  return [...anchoredColumnIds, ...movableColumns];
}

export function moveMaintenanceRenewalColumn(candidate: readonly ColumnId[], id: ColumnId, direction: -1 | 1) {
  const order = normalizeMaintenanceRenewalColumnOrder(candidate);
  if (anchoredColumnIds.includes(id)) return order;
  const index = order.indexOf(id);
  const target = index + direction;
  if (index < anchoredColumnIds.length || target < anchoredColumnIds.length || target >= order.length) return order;
  [order[index], order[target]] = [order[target], order[index]];
  return order;
}

function money(value: number | string | null | undefined) {
  if (value == null || value === "") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function shortDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function dateInput(value?: string | null) {
  return value?.slice(0, 10) ?? "";
}

function dateTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function daysRemaining(value?: string | null) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function coOpValues(renewal: Renewal) {
  return {
    agreement:
      renewal.coOpAgreement ??
      renewal.purchasingAgreement?.purchasingVehicle?.name ??
      renewal.purchasingVehicle?.name ??
      "",
    contractNumber:
      renewal.coOpContractNumber ??
      renewal.purchasingAgreement?.sellerAwardNumber ??
      renewal.purchasingVehicle?.contractNumber ??
      "",
    expiration:
      renewal.coOpAgreementExpirationDate ??
      renewal.purchasingAgreement?.endsOn ??
      renewal.purchasingVehicle?.endsOn ??
      "",
  };
}

function statusTone(status: string) {
  if (["COMPLETE", "RENEWED"].includes(status)) return "border-emerald-400/35 bg-emerald-400/10 text-emerald-200";
  if (status === "REPLACE") return "border-violet-400/35 bg-violet-400/10 text-violet-200";
  if (["DECOMMISSION", "RETIRED", "NON_RENEWAL_PLANNED"].includes(status)) return "border-slate-400/35 bg-slate-400/10 text-slate-300";
  if (["QUOTE_REQUESTED", "NEGOTIATING", "PURCHASE_REQUEST_SUBMITTED"].includes(status)) return "border-amber-400/35 bg-amber-400/10 text-amber-200";
  if (["PLANNING", "QUOTE_RECEIVED", "BUDGET_CONFIRMED", "APPROVED", "ORDERED"].includes(status)) return "border-cyan-400/35 bg-cyan-400/10 text-cyan-100";
  return "border-slate-500/40 bg-slate-500/10 text-slate-300";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`${statusTone(status)} rounded-md px-2 py-0.5 text-xs font-medium`}>
      {titleCaseEnum(status)}
    </Badge>
  );
}

export function MaintenanceRenewalsWorkspace({ data }: { data: PageData }) {
  const [selectedId, setSelectedId] = useState(data.renewals[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [resellerFilter, setResellerFilter] = useState("all");
  const [coOpFilter, setCoOpFilter] = useState("all");
  const [windowFilter, setWindowFilter] = useState("all");
  const [preset, setPreset] = useState<Preset>("standard");
  const [density, setDensity] = useState<Density>("dense");
  const [visible, setVisible] = useState<ColumnId[]>(presetColumns.standard);
  const [order, setOrder] = useState<ColumnId[]>(columns.map((column) => column.id));
  const [widths, setWidths] = useState<Record<ColumnId, number>>(
    Object.fromEntries(columns.map((column) => [column.id, column.defaultWidth])) as Record<ColumnId, number>
  );
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [columnPreferencesLoaded, setColumnPreferencesLoaded] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const workspaceRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  useEffect(() => {
    const saved = window.localStorage.getItem(preferenceKey);
    if (!saved) {
      const timer = window.setTimeout(() => setColumnPreferencesLoaded(true), 0);
      return () => window.clearTimeout(timer);
    }
    try {
      const preferences = JSON.parse(saved) as {
        visible?: ColumnId[];
        order?: ColumnId[];
        widths?: Record<ColumnId, number>;
        density?: Density;
      };
      const timer = window.setTimeout(() => {
        if (preferences.visible) setVisible(preferences.visible);
        if (preferences.order) setOrder(normalizeMaintenanceRenewalColumnOrder(preferences.order));
        if (preferences.widths) setWidths(preferences.widths);
        if (preferences.density) setDensity(preferences.density);
        setColumnPreferencesLoaded(true);
      }, 0);
      return () => window.clearTimeout(timer);
    } catch {
      window.localStorage.removeItem(preferenceKey);
      const timer = window.setTimeout(() => setColumnPreferencesLoaded(true), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!columnPreferencesLoaded) return;
    window.localStorage.setItem(preferenceKey, JSON.stringify({ visible, order, widths, density }));
  }, [columnPreferencesLoaded, density, order, visible, widths]);

  const vendors = useMemo(
    () => data.companies.filter((company) => company.roles.some((role) => role.role === "VENDOR")),
    [data.companies]
  );
  const resellers = useMemo(
    () => data.companies.filter((company) => company.roles.some((role) => role.role === "RESELLER")),
    [data.companies]
  );
  const owners = data.teamMembers.filter((owner) => owner.active);
  const coOps = Array.from(
    new Set([
      ...data.purchasingVehicles.map((vehicle) => vehicle.name),
      ...data.renewals.map((renewal) => coOpValues(renewal).agreement).filter(Boolean),
    ])
  ).sort();

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.renewals.filter((renewal) => {
      const coop = coOpValues(renewal);
      const latestComment = renewal.notes[0]?.body ?? "";
      const haystack = [
        renewal.vendorCompany?.name,
        renewal.product?.name ?? renewal.productOrService,
        renewal.sellerCompany?.name,
        coop.agreement,
        coop.contractNumber,
        renewal.ownerTeamMember?.fullName ?? renewal.renewalOwner,
        latestComment,
      ].filter(Boolean).join(" ").toLowerCase();
      const days = daysRemaining(renewal.renewalDate);
      return (
        (!normalized || haystack.includes(normalized)) &&
        (statusFilter === "all" || renewal.renewalStatus === statusFilter) &&
        (ownerFilter === "all" || renewal.ownerTeamMemberId === ownerFilter || renewal.renewalOwner === ownerFilter) &&
        (vendorFilter === "all" || renewal.vendorCompanyId === vendorFilter) &&
        (resellerFilter === "all" || renewal.sellerCompanyId === resellerFilter) &&
        (coOpFilter === "all" || coop.agreement === coOpFilter) &&
        (windowFilter === "all" || (days !== null && days >= 0 && days <= Number(windowFilter)))
      );
    });
  }, [coOpFilter, data.renewals, ownerFilter, query, resellerFilter, statusFilter, vendorFilter, windowFilter]);

  const selected = data.renewals.find((renewal) => renewal.id === selectedId) ?? null;
  const activeColumns = order
    .filter((id) => visible.includes(id))
    .map((id) => columns.find((column) => column.id === id)!)
    .filter(Boolean);
  const activeFilterCount = [statusFilter, ownerFilter, vendorFilter, resellerFilter, coOpFilter, windowFilter]
    .filter((value) => value !== "all").length;

  function applyPreset(next: Preset) {
    setPreset(next);
    setVisible(presetColumns[next]);
  }

  function resetColumns() {
    setPreset("standard");
    setVisible(presetColumns.standard);
    setOrder(columns.map((column) => column.id));
    setWidths(Object.fromEntries(columns.map((column) => [column.id, column.defaultWidth])) as Record<ColumnId, number>);
    setDensity("dense");
  }

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
    setOwnerFilter("all");
    setVendorFilter("all");
    setResellerFilter("all");
    setCoOpFilter("all");
    setWindowFilter("all");
  }

  function selectRenewal(id: string, tab?: Tab) {
    setSelectedId(id);
    if (tab) setActiveTab(tab);
    if (tab === "comments") {
      requestAnimationFrame(() => workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  return (
    <WorkspaceShell
      title="Maintenance Renewals"
      description="Departmental renewal register for products, services, costs, co-op agreements, owners, and current status."
      actionLabel="Operational register"
    >
      <div className="space-y-4 font-sans">
        <SummaryMetrics renewals={data.renewals} />

        <section className="overflow-visible rounded-xl border border-border/80 bg-card/95 shadow-[0_18px_55px_rgba(0,0,0,0.18)]">
          <div className="border-b border-border/70 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-64 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  aria-label="Search maintenance renewals"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search vendor, product, reseller, agreement, owner, or comments"
                  className="h-9 bg-secondary/35 pl-9"
                />
              </div>
              <select aria-label="Table view preset" value={preset} onChange={(event) => applyPreset(event.target.value as Preset)} className="h-9 rounded-md border bg-secondary/35 px-3 text-sm">
                <option value="standard">Standard</option>
                <option value="financial">Financial</option>
                <option value="tracking">Renewal Tracking</option>
              </select>
              <select aria-label="Renewal date window" value={windowFilter} onChange={(event) => setWindowFilter(event.target.value)} className="h-9 rounded-md border bg-secondary/35 px-3 text-sm">
                <option value="all">All renewal dates</option>
                <option value="30">Next 30 days</option>
                <option value="60">Next 60 days</option>
                <option value="90">Next 90 days</option>
              </select>
              <select aria-label="Renewal status filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-md border bg-secondary/35 px-3 text-sm">
                <option value="all">All statuses</option>
                {data.optionSets.registerStatuses.map((status) => <option key={status} value={status}>{titleCaseEnum(status)}</option>)}
              </select>

              <div className="relative">
                <Button type="button" variant="outline" size="sm" onClick={() => setFilterMenuOpen((open) => !open)} aria-expanded={filterMenuOpen}>
                  <SlidersHorizontal data-icon="inline-start" /> Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
                </Button>
                {filterMenuOpen ? (
                  <FilterMenu
                    ownerFilter={ownerFilter} setOwnerFilter={setOwnerFilter}
                    vendorFilter={vendorFilter} setVendorFilter={setVendorFilter}
                    resellerFilter={resellerFilter} setResellerFilter={setResellerFilter}
                    coOpFilter={coOpFilter} setCoOpFilter={setCoOpFilter}
                    owners={owners} vendors={vendors} resellers={resellers} coOps={coOps}
                    onReset={resetFilters}
                  />
                ) : null}
              </div>

              <select aria-label="Table density" value={density} onChange={(event) => setDensity(event.target.value as Density)} className="h-9 rounded-md border bg-secondary/35 px-3 text-sm">
                <option value="dense">Dense</option>
                <option value="comfortable">Comfortable</option>
              </select>

              <div className="relative">
                <Button type="button" variant="outline" size="sm" onClick={() => setColumnMenuOpen((open) => !open)} aria-expanded={columnMenuOpen}>
                  <Columns3 data-icon="inline-start" /> Columns
                </Button>
                {columnMenuOpen ? (
                  <ColumnMenu visible={visible} setVisible={setVisible} order={order} setOrder={setOrder} widths={widths} setWidths={setWidths} onReset={resetColumns} />
                ) : null}
              </div>
              <Button type="button" size="sm" onClick={() => setCreateOpen(true)}><Plus data-icon="inline-start" /> Add Renewal</Button>
            </div>

            {activeFilterCount || query ? (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{filtered.length} of {data.renewals.length} renewals shown</span>
                <button type="button" onClick={resetFilters} className="rounded px-1.5 py-1 text-cyan-200 hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Reset filters</button>
              </div>
            ) : null}
          </div>

          <div className="overflow-auto" tabIndex={0} aria-label="Maintenance renewals register">
            <table className="border-separate border-spacing-0 text-left text-sm" style={{ width: activeColumns.reduce((total, column) => total + widths[column.id], 0) }}>
              <colgroup>{activeColumns.map((column) => <col key={column.id} style={{ width: widths[column.id] }} />)}</colgroup>
              <thead className="sticky top-0 z-30">
                <tr>
                  {activeColumns.map((column) => (
                    <th key={column.id} scope="col" className={`${pinnedClass(column.id)} border-b border-r border-border/70 bg-[#0d1625] px-3 py-2.5 text-xs font-semibold tracking-wide text-slate-300 ${column.align === "right" ? "text-right" : ""}`} style={{ minWidth: widths[column.id], maxWidth: widths[column.id], left: column.id === "product" ? widths.vendor : undefined }}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((renewal) => (
                  <RenewalRow
                    key={renewal.id}
                    renewal={renewal}
                    columns={activeColumns}
                    widths={widths}
                    density={density}
                    selected={renewal.id === selectedId}
                    onSelect={(tab) => selectRenewal(renewal.id, tab)}
                    rowRef={(node) => { rowRefs.current[renewal.id] = node; }}
                  />
                ))}
              </tbody>
            </table>
            {!filtered.length ? (
              <div className="grid min-h-48 place-items-center px-6 text-center">
                <div><Search className="mx-auto mb-3 size-6 text-muted-foreground" /><p className="font-medium">No renewals match this view</p><p className="mt-1 text-sm text-muted-foreground">Adjust the search or reset the active filters.</p></div>
              </div>
            ) : null}
          </div>
        </section>

        <div ref={workspaceRef} className="scroll-mt-4">
          <SelectedWorkspace
            key={selected?.id ?? "empty"}
            renewal={selected}
            data={data}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onReturnToRow={() => selected && rowRefs.current[selected.id]?.scrollIntoView({ behavior: "smooth", block: "center" })}
          />
        </div>
      </div>

      {createOpen ? <CreateRenewalDialog data={data} vendors={vendors.filter((vendor) => vendor.active)} resellers={resellers.filter((reseller) => reseller.active)} onClose={() => setCreateOpen(false)} /> : null}
    </WorkspaceShell>
  );
}

function SummaryMetrics({ renewals }: { renewals: Renewal[] }) {
  const next90 = renewals.filter((renewal) => { const days = daysRemaining(renewal.renewalDate); return days !== null && days >= 0 && days <= 90; }).length;
  const total = renewals.reduce((sum, renewal) => sum + Number(renewal.currentAnnualCost || 0), 0);
  const incomplete = renewals.filter((renewal) => !["COMPLETE", "RENEWED", "RETIRED"].includes(renewal.renewalStatus)).length;
  const expiringCoops = renewals.filter((renewal) => ["EXPIRED", "EXPIRING_SOON", "BEFORE_RENEWAL"].includes(coOpExpirationState({ expirationDate: coOpValues(renewal).expiration, renewalDate: renewal.renewalDate }))).length;
  const metrics = [
    ["Next 90 days", String(next90), "Renewals approaching"],
    ["Current annual cost", money(total), "Tracked portfolio"],
    ["Not yet complete", String(incomplete), "Open renewal records"],
    ["Co-op attention", String(expiringCoops), "Expired or timing conflict"],
  ];
  return <div className="grid gap-px overflow-hidden rounded-lg border border-border/75 bg-border/75 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, detail]) => <div key={label} className="bg-card px-4 py-3"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums text-slate-100">{value}</p><p className="mt-0.5 text-xs text-muted-foreground">{detail}</p></div>)}</div>;
}

function RenewalRow({ renewal, columns: activeColumns, widths, density, selected, onSelect, rowRef }: { renewal: Renewal; columns: ColumnDefinition[]; widths: Record<ColumnId, number>; density: Density; selected: boolean; onSelect: (tab?: Tab) => void; rowRef: (node: HTMLTableRowElement | null) => void }) {
  const coop = coOpValues(renewal);
  const coopState = coOpExpirationState({ expirationDate: coop.expiration, renewalDate: renewal.renewalDate });
  const days = daysRemaining(renewal.renewalDate);
  const change = renewalAmountChange(Number(renewal.currentAnnualCost), Number(renewal.approvedAmount));
  const latestComment = renewal.notes[0];
  return (
    <tr
      ref={rowRef}
      tabIndex={0}
      aria-selected={selected}
      onClick={() => onSelect()}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(); } }}
      className={`group cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${selected ? "bg-cyan-400/[0.09]" : "bg-card hover:bg-slate-800/45"}`}
    >
      {activeColumns.map((column) => (
        <td key={column.id} className={`${pinnedClass(column.id)} border-b border-r border-border/55 px-3 ${density === "dense" ? "py-2" : "py-3.5"} ${selected ? "bg-[#102131] group-hover:bg-[#10283a]" : column.id === "vendor" || column.id === "product" ? "bg-[#0b1422] group-hover:bg-[#111e2e]" : ""} ${column.align === "right" ? "text-right" : ""}`} style={{ minWidth: widths[column.id], maxWidth: widths[column.id], left: column.id === "product" ? widths.vendor : undefined }}>
          <Cell column={column.id} renewal={renewal} coop={coop} coopState={coopState} days={days} change={change} latestComment={latestComment} onComments={() => onSelect("comments")} />
        </td>
      ))}
    </tr>
  );
}

function productLabel(renewal: Renewal) {
  return (renewal.product?.name ?? renewal.productOrService) || renewal.renewalName || "—";
}

function Cell({ column, renewal, coop, coopState, days, change, latestComment, onComments }: { column: ColumnId; renewal: Renewal; coop: ReturnType<typeof coOpValues>; coopState: ReturnType<typeof coOpExpirationState>; days: number | null; change: ReturnType<typeof renewalAmountChange>; latestComment?: Note; onComments: () => void }) {
  if (column === "vendor") return <div className="font-medium text-slate-100">{renewal.vendorCompany?.name ?? "—"}{renewal.vendorCompany && !renewal.vendorCompany.active ? <span className="ml-1.5 rounded bg-amber-400/10 px-1.5 py-0.5 text-[11px] text-amber-200">Inactive</span> : null}</div>;
  if (column === "product") return <div className="font-medium text-slate-100">{productLabel(renewal)}</div>;
  if (column === "reseller") return <span>{renewal.sellerCompany?.name ?? "Direct"}</span>;
  if (column === "coOpAgreement") return <span>{coop.agreement || "None"}</span>;
  if (column === "coOpContractNumber") return <span className="tabular-nums">{coop.contractNumber || "—"}</span>;
  if (column === "coOpExpiration") return <CoOpWarning state={coopState} date={coop.expiration} />;
  if (column === "renewalDate") return <span className="tabular-nums">{shortDate(renewal.renewalDate)}</span>;
  if (column === "daysRemaining") return <span className={`tabular-nums ${days !== null && days < 0 ? "text-red-300" : days !== null && days <= 90 ? "text-amber-200" : ""}`}>{days == null ? "—" : days}</span>;
  if (column === "currentCost") return <span className="tabular-nums">{money(renewal.currentAnnualCost)}</span>;
  if (column === "renewalAmount") return <span className="tabular-nums">{money(renewal.approvedAmount)}</span>;
  if (column === "change") return <ChangeValue change={change} />;
  if (column === "status") return <StatusBadge status={renewal.renewalStatus} />;
  if (column === "owner") return <span>{renewal.ownerTeamMember?.fullName ?? renewal.renewalOwner ?? "Unassigned"}</span>;
  if (column === "comments") return <button type="button" onClick={(event) => { event.stopPropagation(); onComments(); }} className="block w-full rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" title={latestComment?.body ?? "No comments"}><span className="line-clamp-2 text-slate-300">{latestComment?.body ?? "No comments"}</span>{renewal.notes.length > 1 ? <span className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-200"><MessageSquare className="size-3" /> {renewal.notes.length} comments</span> : null}</button>;
  return <span className="tabular-nums text-muted-foreground">{dateTime(renewal.updatedAt)}</span>;
}

function ChangeValue({ change }: { change: ReturnType<typeof renewalAmountChange> }) {
  if (change.amount == null) return <span>—</span>;
  const positive = change.amount > 0;
  return <div className={`tabular-nums ${positive ? "text-amber-200" : change.amount < 0 ? "text-emerald-200" : "text-slate-300"}`}><div>{positive ? "+" : ""}{money(change.amount)}</div><div className="text-xs opacity-75">{change.percentage == null ? "—" : `${positive ? "+" : ""}${(change.percentage * 100).toFixed(1)}%`}</div></div>;
}

function CoOpWarning({ state, date }: { state: ReturnType<typeof coOpExpirationState>; date?: string | null }) {
  const labels = { EXPIRED: "Expired", EXPIRING_SOON: "Within 90 days", BEFORE_RENEWAL: "Before renewal" } as const;
  const attention = state in labels;
  return <div className="tabular-nums"><div>{shortDate(date)}</div>{attention ? <div className={`mt-0.5 text-[11px] ${state === "EXPIRED" ? "text-red-300" : "text-amber-200"}`}>{labels[state as keyof typeof labels]}</div> : null}</div>;
}

function pinnedClass(id: ColumnId) {
  if (id === "vendor") return "sticky left-0 z-20 shadow-[5px_0_9px_-8px_rgba(0,0,0,0.9)]";
  if (id === "product") return "sticky z-20 shadow-[7px_0_10px_-8px_rgba(0,0,0,0.95)]";
  return "";
}

function FilterMenu(props: { ownerFilter: string; setOwnerFilter: (value: string) => void; vendorFilter: string; setVendorFilter: (value: string) => void; resellerFilter: string; setResellerFilter: (value: string) => void; coOpFilter: string; setCoOpFilter: (value: string) => void; owners: TeamMember[]; vendors: Company[]; resellers: Company[]; coOps: string[]; onReset: () => void }) {
  return <div className="absolute right-0 top-11 z-50 grid w-80 gap-3 rounded-lg border bg-popover p-4 shadow-2xl"><p className="text-sm font-semibold">Additional filters</p><Select label="Owner" value={props.ownerFilter} onChange={props.setOwnerFilter} options={props.owners.map((owner) => [owner.id, owner.fullName])} /><Select label="Vendor" value={props.vendorFilter} onChange={props.setVendorFilter} options={props.vendors.map((company) => [company.id, company.name])} /><Select label="Reseller" value={props.resellerFilter} onChange={props.setResellerFilter} options={props.resellers.map((company) => [company.id, company.name])} /><Select label="Co-Op Agreement" value={props.coOpFilter} onChange={props.setCoOpFilter} options={props.coOps.map((name) => [name, name])} /><Button type="button" variant="outline" size="sm" onClick={props.onReset}><RotateCcw data-icon="inline-start" /> Reset filters</Button></div>;
}

function ColumnMenu({ visible, setVisible, order, setOrder, widths, setWidths, onReset }: { visible: ColumnId[]; setVisible: (value: ColumnId[]) => void; order: ColumnId[]; setOrder: (value: ColumnId[]) => void; widths: Record<ColumnId, number>; setWidths: (value: Record<ColumnId, number>) => void; onReset: () => void }) {
  const normalizedOrder = normalizeMaintenanceRenewalColumnOrder(order);
  function move(id: ColumnId, direction: -1 | 1) { setOrder(moveMaintenanceRenewalColumn(normalizedOrder, id, direction)); }
  return <div className="absolute right-0 top-11 z-50 max-h-[70vh] w-[420px] overflow-auto rounded-lg border bg-popover p-3 shadow-2xl"><div className="mb-2 flex items-center justify-between"><div><p className="text-sm font-semibold">Table columns</p><p className="text-xs text-muted-foreground">Vendor and Product stay pinned first. Move every other column left or right.</p></div><Button type="button" variant="ghost" size="sm" onClick={onReset}><RotateCcw data-icon="inline-start" /> Reset</Button></div><div className="space-y-1">{normalizedOrder.map((id, index) => { const column = columns.find((item) => item.id === id)!; const anchored = anchoredColumnIds.includes(id); return <div key={id} className="grid grid-cols-[24px_1fr_105px_58px] items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/45"><input type="checkbox" aria-label={`Show ${column.label}`} checked={visible.includes(id)} disabled={anchored} onChange={(event) => setVisible(event.target.checked ? [...visible, id] : visible.filter((value) => value !== id))} /><span className="text-xs">{column.label}{anchored ? <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground">Pinned</span> : null}</span><input type="range" aria-label={`${column.label} width`} min={column.min} max={column.max} value={widths[id]} onChange={(event) => setWidths({ ...widths, [id]: Number(event.target.value) })} /><span className="flex gap-0.5"><button type="button" aria-label={`Move ${column.label} left`} disabled={anchored || index === anchoredColumnIds.length} onClick={() => move(id, -1)} className="rounded p-1 hover:bg-secondary disabled:opacity-30"><ArrowUp className="size-3.5 -rotate-90" /></button><button type="button" aria-label={`Move ${column.label} right`} disabled={anchored || index === normalizedOrder.length - 1} onClick={() => move(id, 1)} className="rounded p-1 hover:bg-secondary disabled:opacity-30"><ArrowDown className="size-3.5 -rotate-90" /></button></span></div>; })}</div></div>;
}

function SelectedWorkspace({ renewal, data, activeTab, setActiveTab, onReturnToRow }: { renewal: Renewal | null; data: PageData; activeTab: Tab; setActiveTab: (tab: Tab) => void; onReturnToRow: () => void }) {
  const [editing, setEditing] = useState(false);
  const [result, formAction, pending] = useActionState(updateRenewalRegisterAction, emptyActionResult);
  useEffect(() => {
    if (!result.ok) return;
    const timer = window.setTimeout(() => setEditing(false), 0);
    return () => window.clearTimeout(timer);
  }, [result.ok]);
  if (!renewal) return <section className="grid min-h-72 place-items-center rounded-xl border border-dashed border-border bg-card/60 p-8 text-center"><div><Settings2 className="mx-auto mb-3 size-7 text-cyan-300" /><h2 className="text-lg font-semibold">Select a renewal</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">Choose a row in the register to review details, update financials and co-op information, or add a comment.</p></div></section>;
  const tabs: [Tab, string][] = [["overview", "Overview"], ["financial", "Financial"], ["coop", "Co-Op Agreement"], ["comments", `Comments${renewal.notes.length ? ` (${renewal.notes.length})` : ""}`], ["history", "History"]];
  const coop = coOpValues(renewal);
  return <section className="overflow-hidden rounded-xl border border-border/80 bg-card/95 shadow-[0_18px_55px_rgba(0,0,0,0.16)]"><header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 px-5 py-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold text-slate-100">{productLabel(renewal)}</h2><StatusBadge status={renewal.renewalStatus} /></div><p className="mt-1 text-sm text-muted-foreground">{renewal.vendorCompany?.name ?? "Vendor not assigned"} · Renewal {shortDate(renewal.renewalDate)}</p></div><div className="flex gap-2"><Button type="button" variant="ghost" size="sm" onClick={onReturnToRow}>Return to row</Button>{!editing && activeTab !== "comments" && activeTab !== "history" ? <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil data-icon="inline-start" /> Edit</Button> : null}</div></header><div role="tablist" aria-label="Selected renewal sections" className="flex overflow-x-auto border-b border-border/70 px-3">{tabs.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={activeTab === id} onClick={() => { setActiveTab(id); setEditing(false); }} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${activeTab === id ? "border-cyan-300 text-cyan-100" : "border-transparent text-muted-foreground hover:text-slate-200"}`}>{label}</button>)}</div><div className="p-5">{editing ? <EditRenewalForm renewal={renewal} data={data} coop={coop} formAction={formAction} result={result} pending={pending} onCancel={() => setEditing(false)} /> : activeTab === "overview" ? <Overview renewal={renewal} /> : activeTab === "financial" ? <Financial renewal={renewal} /> : activeTab === "coop" ? <CoOp renewal={renewal} coop={coop} /> : activeTab === "comments" ? <Comments renewal={renewal} /> : <History renewal={renewal} activities={data.activityLogs.filter((activity) => activity.entityId === renewal.id)} data={data} />}</div></section>;
}

function Overview({ renewal }: { renewal: Renewal }) { const facts = [["Vendor", renewal.vendorCompany?.name ?? "—"], ["Product", productLabel(renewal)], ["Reseller", renewal.sellerCompany?.name ?? "Direct"], ["Renewal date", shortDate(renewal.renewalDate)], ["Days remaining", String(daysRemaining(renewal.renewalDate) ?? "—")], ["Renewal status", titleCaseEnum(renewal.renewalStatus)], ["Owner", renewal.ownerTeamMember?.fullName ?? renewal.renewalOwner ?? "Unassigned"], ["Last updated", dateTime(renewal.updatedAt)]]; return <FactGrid facts={facts} />; }
function Financial({ renewal }: { renewal: Renewal }) { const change = renewalAmountChange(Number(renewal.currentAnnualCost), Number(renewal.approvedAmount)); return <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3"><FinancialCard label="Current Annual Cost" value={money(renewal.currentAnnualCost)} /><FinancialCard label="Renewal Amount" value={money(renewal.approvedAmount)} /><FinancialCard label="Increase / Decrease" value={change.amount == null ? "—" : `${change.amount > 0 ? "+" : ""}${money(change.amount)}`} detail={change.percentage == null ? "Percentage unavailable" : `${change.percentage > 0 ? "+" : ""}${(change.percentage * 100).toFixed(1)}%`} /></div>; }
function FinancialCard({ label, value, detail }: { label: string; value: string; detail?: string }) { return <div className="bg-card p-5"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>{detail ? <p className="mt-1 text-sm tabular-nums text-muted-foreground">{detail}</p> : null}</div>; }
function CoOp({ renewal, coop }: { renewal: Renewal; coop: ReturnType<typeof coOpValues> }) { const state = coOpExpirationState({ expirationDate: coop.expiration, renewalDate: renewal.renewalDate }); const warning = state === "EXPIRED" ? "This co-op agreement has expired." : state === "BEFORE_RENEWAL" ? "This agreement expires before the renewal date." : state === "EXPIRING_SOON" ? "This agreement expires within 90 days." : "No expiration warning."; return <div className="space-y-4"><FactGrid facts={[["Co-Op Agreement", coop.agreement || "None"], ["Co-Op Contract Number", coop.contractNumber || "—"], ["Agreement expiration", shortDate(coop.expiration)], ["Renewal date", shortDate(renewal.renewalDate)]]} />{state !== "NONE" && state !== "CURRENT" ? <div className={`rounded-lg border px-4 py-3 text-sm ${state === "EXPIRED" ? "border-red-400/25 bg-red-400/[0.06] text-red-200" : "border-amber-400/25 bg-amber-400/[0.06] text-amber-100"}`}>{warning}</div> : null}</div>; }
function FactGrid({ facts }: { facts: string[][] }) { return <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">{facts.map(([label, value]) => <div key={label}><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1.5 text-sm font-medium tabular-nums text-slate-100">{value}</dd></div>)}</dl>; }

function Comments({ renewal }: { renewal: Renewal }) { const [result, formAction, pending] = useActionState(addCommentAction, emptyActionResult); return <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]"><form action={formAction} className="space-y-3"><input type="hidden" name="maintenanceRenewalId" value={renewal.id} /><label className="block text-sm font-medium" htmlFor="renewal-comment">Add Comment</label><textarea id="renewal-comment" name="body" required rows={5} placeholder="Add a concise update for this renewal…" className="w-full resize-y rounded-lg border bg-secondary/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" /><ActionMessage result={result} /><Button type="submit" disabled={pending}><MessageSquare data-icon="inline-start" /> {pending ? "Adding…" : "Add Comment"}</Button></form><div><h3 className="text-sm font-semibold">Comment history</h3>{renewal.notes.length ? <ol className="mt-3 space-y-3">{renewal.notes.map((note) => <li key={note.id} className="rounded-lg border border-border/70 bg-secondary/20 p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{note.body}</p><p className="mt-3 text-xs text-muted-foreground">{note.author?.name ?? "System user"} · {dateTime(note.createdAt)}</p></li>)}</ol> : <div className="mt-3 rounded-lg border border-dashed p-8 text-center"><MessageSquare className="mx-auto mb-2 size-5 text-muted-foreground" /><p className="text-sm font-medium">No comments yet</p><p className="mt-1 text-xs text-muted-foreground">Add the first update for this renewal.</p></div>}</div></div>; }

function History({ renewal, activities, data }: { renewal: Renewal; activities: Activity[]; data: PageData }) { const history = [...activities.map((activity) => ({ id: activity.id, at: activity.occurredAt, by: activity.actor?.name ?? "System user", text: historyText(activity, data) })), ...renewal.decisionHistory.map((item) => ({ id: item.id, at: item.changedAt, by: item.changedBy ?? "System user", text: `Renewal decision updated to ${titleCaseEnum(item.decisionStatus)}` }))].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()); return history.length ? <ol className="relative space-y-0 before:absolute before:bottom-3 before:left-[5px] before:top-3 before:w-px before:bg-border">{history.map((item) => <li key={item.id} className="relative grid grid-cols-[12px_1fr] gap-3 pb-5"><span className="mt-1.5 size-3 rounded-full border-2 border-card bg-cyan-300 ring-1 ring-border" /><div><p className="text-sm text-slate-200">{item.text}</p><p className="mt-1 text-xs text-muted-foreground">{item.by} · {dateTime(item.at)}</p></div></li>)}</ol> : <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No recorded changes yet.</div>; }

function historyText(activity: Activity, data: PageData) { const label = titleCaseEnum((activity.fieldName ?? "record").replace(/([a-z])([A-Z])/g, "$1_$2")); const resolve = (value?: string | null) => data.companies.find((item) => item.id === value)?.name ?? data.products.find((item) => item.id === value)?.name ?? data.teamMembers.find((item) => item.id === value)?.fullName ?? (value ? titleCaseEnum(value) : "None"); if (activity.fieldName === "comment") return "Comment added"; return `${label} changed from ${resolve(activity.previousValue)} to ${resolve(activity.newValue)}`; }

function EditRenewalForm({ renewal, data, coop, formAction, result, pending, onCancel }: { renewal: Renewal; data: PageData; coop: ReturnType<typeof coOpValues>; formAction: (formData: FormData) => void; result: ActionResult; pending: boolean; onCancel: () => void }) {
  const [vendorId, setVendorId] = useState(renewal.vendorCompanyId ?? "");
  const activeVendors = data.companies.filter((company) => company.active && company.roles.some((role) => role.role === "VENDOR"));
  const activeResellers = data.companies.filter((company) => company.active && company.roles.some((role) => role.role === "RESELLER"));
  const products = data.products.filter((product) => product.active && product.vendorCompanyId === vendorId);
  return <form action={formAction} className="space-y-5"><input type="hidden" name="id" value={renewal.id} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><FormSelect label="Vendor" name="vendorCompanyId" value={vendorId} onChange={(value) => setVendorId(value)} required options={[...(renewal.vendorCompany && !renewal.vendorCompany.active ? [[renewal.vendorCompany.id, `${renewal.vendorCompany.name} (Inactive — replace)`] as [string, string]] : []), ...activeVendors.map((vendor) => [vendor.id, vendor.name] as [string, string])]} error={result.fields?.vendorCompanyId?.[0]} /><FormSelect label="Product" name="productId" defaultValue={products.some((product) => product.id === renewal.productId) ? renewal.productId ?? "" : ""} required options={products.map((product) => [product.id, product.name])} error={result.fields?.productId?.[0]} /><FormSelect label="Reseller" name="sellerCompanyId" defaultValue={renewal.sellerCompanyId ?? "none"} options={[["none", "Direct / None"], ...activeResellers.map((company) => [company.id, company.name] as [string, string])]} error={result.fields?.sellerCompanyId?.[0]} /><FormInput label="Renewal Date" name="renewalDate" type="date" defaultValue={dateInput(renewal.renewalDate)} required error={result.fields?.renewalDate?.[0]} /><FormInput label="Current Annual Cost" name="currentAnnualCost" type="number" step="0.01" min="0" defaultValue={String(renewal.currentAnnualCost)} error={result.fields?.currentAnnualCost?.[0]} /><FormInput label="Renewal Amount" name="renewalAmount" type="number" step="0.01" min="0" defaultValue={String(renewal.approvedAmount)} error={result.fields?.renewalAmount?.[0]} /><FormSelect label="Renewal Status" name="renewalStatus" defaultValue={renewal.renewalStatus} options={data.optionSets.registerStatuses.map((status) => [status, titleCaseEnum(status)])} /><FormSelect label="Owner" name="ownerTeamMemberId" defaultValue={renewal.ownerTeamMemberId ?? "none"} options={[["none", "Unassigned"], ...data.teamMembers.filter((owner) => owner.active).map((owner) => [owner.id, owner.fullName] as [string, string])]} /><FormInput label="Legacy Owner Label" name="renewalOwner" defaultValue={renewal.renewalOwner ?? ""} /><FormSelect label="Co-Op Agreement" name="coOpAgreement" defaultValue={coop.agreement || "none"} options={[["none", "None"], ...data.purchasingVehicles.map((vehicle) => [vehicle.name, vehicle.name] as [string, string]), ["Other", "Other"]]} /><FormInput label="Co-Op Contract Number" name="coOpContractNumber" defaultValue={coop.contractNumber} placeholder="DIR-CPO-5237" /><FormInput label="Co-Op Agreement Exp. Date" name="coOpAgreementExpirationDate" type="date" defaultValue={dateInput(coop.expiration)} /></div><ActionMessage result={result} /><div className="flex justify-end gap-2 border-t border-border/70 pt-4"><Button type="button" variant="ghost" onClick={onCancel} disabled={pending}><X data-icon="inline-start" /> Cancel</Button><Button type="submit" disabled={pending}><Check data-icon="inline-start" /> {pending ? "Saving…" : "Save Changes"}</Button></div></form>;
}

function CreateRenewalDialog({ data, vendors, resellers, onClose }: { data: PageData; vendors: Company[]; resellers: Company[]; onClose: () => void }) {
  const [result, formAction, pending] = useActionState(createRenewalAction, emptyActionResult);
  const [vendorId, setVendorId] = useState(vendors[0]?.id ?? "");
  useEffect(() => { if (result.ok) onClose(); }, [onClose, result.ok]);
  const products = data.products.filter((product) => product.active && product.vendorCompanyId === vendorId);
  const fiscalYear = data.fiscalYears[0];
  const budgetPlan = data.budgetPlans.find((plan) => plan.fiscalYearId === fiscalYear?.id) ?? data.budgetPlans[0];
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="create-renewal-title" className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl border border-border bg-popover shadow-2xl"><header className="flex items-start justify-between border-b px-5 py-4"><div><h2 id="create-renewal-title" className="text-lg font-semibold">Add Maintenance Renewal</h2><p className="mt-1 text-sm text-muted-foreground">Create a focused tracking record. Additional context can be added after saving.</p></div><button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-2 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="size-4" /></button></header><form action={formAction} className="space-y-5 p-5"><input type="hidden" name="fiscalYearId" value={fiscalYear?.id ?? ""} /><input type="hidden" name="budgetPlanId" value={budgetPlan?.id ?? ""} /><input type="hidden" name="fundingAccountId" value={data.budgetAccounts[0]?.id ?? ""} /><input type="hidden" name="recommendedDisposition" value="DECISION_PENDING" /><div className="grid gap-4 md:grid-cols-2"><FormSelect label="Vendor" name="vendorCompanyId" value={vendorId} onChange={setVendorId} required options={vendors.map((vendor) => [vendor.id, vendor.name])} error={result.fields?.vendorCompanyId?.[0]} /><FormSelect label="Product" name="productId" required options={products.map((product) => [product.id, product.name])} error={result.fields?.productId?.[0]} /><FormSelect label="Reseller" name="sellerCompanyId" defaultValue="none" options={[["none", "Direct / None"], ...resellers.map((company) => [company.id, company.name] as [string, string])]} /><FormInput label="Renewal Date" name="renewalDate" type="date" required error={result.fields?.renewalDate?.[0]} /><FormInput label="Current Annual Cost" name="currentAnnualCost" type="number" min="0" step="0.01" defaultValue="0" /><FormInput label="Renewal Amount" name="approvedAmount" type="number" min="0" step="0.01" defaultValue="0" /><input type="hidden" name="forecastedRenewalCost" value="0" /><FormSelect label="Renewal Status" name="renewalStatus" defaultValue="NOT_STARTED" options={data.optionSets.registerStatuses.map((status) => [status, titleCaseEnum(status)])} /><FormInput label="Owner" name="renewalOwner" /><FormSelect label="Co-Op Agreement" name="coOpAgreement" defaultValue="none" options={[["none", "None"], ...data.purchasingVehicles.map((vehicle) => [vehicle.name, vehicle.name] as [string, string]), ["Other", "Other"]]} /><FormInput label="Co-Op Contract Number" name="coOpContractNumber" placeholder="DIR-CPO-5237" /><FormInput label="Co-Op Agreement Exp. Date" name="coOpAgreementExpirationDate" type="date" /></div><ActionMessage result={result} /><div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="ghost" onClick={onClose} disabled={pending}>Cancel</Button><Button type="submit" disabled={pending}><Plus data-icon="inline-start" /> {pending ? "Adding…" : "Add Renewal"}</Button></div></form></section></div>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <label className="grid gap-1 text-xs text-muted-foreground">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 rounded-md border bg-secondary/35 px-2 text-sm text-slate-100"><option value="all">All</option>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>; }
function FormSelect({ label, name, options, value, defaultValue, onChange, required, error }: { label: string; name: string; options: [string, string][]; value?: string; defaultValue?: string; onChange?: (value: string) => void; required?: boolean; error?: string }) { return <label className="grid gap-1.5 text-sm font-medium">{label}<select name={name} value={value} defaultValue={value === undefined ? defaultValue : undefined} onChange={onChange ? (event) => onChange(event.target.value) : undefined} required={required} aria-invalid={Boolean(error)} className="h-10 rounded-md border bg-secondary/35 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"><option value="">Select</option>{options.map(([id, name]) => <option key={`${name}-${id}`} value={id}>{name}</option>)}</select>{error ? <span className="text-xs font-normal text-red-300">{error}</span> : null}</label>; }
function FormInput({ label, name, type = "text", defaultValue, placeholder, required, error, ...inputProps }: { label: string; name: string; type?: string; defaultValue?: string; placeholder?: string; required?: boolean; error?: string; step?: string; min?: string }) { return <label className="grid gap-1.5 text-sm font-medium">{label}<input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} required={required} aria-invalid={Boolean(error)} {...inputProps} className="h-10 rounded-md border bg-secondary/35 px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />{error ? <span className="text-xs font-normal text-red-300">{error}</span> : null}</label>; }
function ActionMessage({ result }: { result: ActionResult }) { if (!result.message) return null; return <div role="status" className={`rounded-md border px-3 py-2 text-sm ${result.ok ? "border-emerald-400/25 bg-emerald-400/[0.06] text-emerald-200" : "border-red-400/25 bg-red-400/[0.06] text-red-200"}`}>{result.message}</div>; }
