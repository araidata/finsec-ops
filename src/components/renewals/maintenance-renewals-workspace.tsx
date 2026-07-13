"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  ClipboardCheck,
  FileText,
  PanelRightOpen,
  Plus,
  Search,
} from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import {
  addCommentAction,
  addFundingAllocationAction,
  addQuoteAction,
  addTaskAction,
  advanceStageAction,
  createNextCycleAction,
  createRenewalAction,
  decideDispositionAction,
  saveDecommissionPlanAction,
  saveReplacementPlanAction,
  submitRecommendationAction,
  updateRenewalCaseAction,
  updateRenewalTableFieldAction,
} from "@/app/renewals/actions";
import { WorkspaceShell } from "@/components/app/workspace-shell";
import {
  EmptyState,
  Field,
  FormShell,
  MultiSelect,
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
import { titleCaseEnum } from "@/lib/maintenance-renewal-rules";
import { emptyActionResult } from "@/lib/server/action-result";

type RenewalData = Record<string, any>;

const defaultViews = [
  "All Renewals",
  "Due in 30 Days",
  "Due in 60 Days",
  "Due in 90 Days",
  "Decision Pending",
  "Review Required",
  "Renewing",
  "Renew with Changes",
  "Renegotiation",
  "Replacements Planned",
  "Consolidations",
  "Temporary Extensions",
  "Decommissioning",
  "Do Not Renew",
  "At Risk",
  "Waiting on Quotes",
  "Waiting on Purchasing",
  "Waiting on Legal",
  "Unfunded",
  "Completed",
  "Cancelled",
] as const;

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

function daysUntil(value?: string | null) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${dateOnly(value)}T00:00:00.000`);
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
}

function badgeTone(value: string) {
  if (["CRITICAL", "AT_RISK", "BLOCKED", "REJECTED"].includes(value)) {
    return "border-red-400/40 bg-red-400/10 text-red-200";
  }
  if (
    [
      "ATTENTION_REQUIRED",
      "UNDER_REVIEW",
      "RECOMMENDATION_SUBMITTED",
      "DEFERRED",
      "REQUESTED",
      "IN_NEGOTIATION",
    ].includes(value)
  ) {
    return "border-amber-400/40 bg-amber-400/10 text-amber-200";
  }
  if (["APPROVED", "COMPLETED", "ON_TRACK", "FINAL_SELECTED"].includes(value)) {
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
      {titleCaseEnum(value)}
    </Badge>
  );
}

function optionRows(rows: any[], label: (row: any) => string): Option[] {
  return rows.map((row) => ({
    id: row.id,
    label: label(row),
    active: row.active,
  }));
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

export function MaintenanceRenewalsWorkspace({ data }: { data: RenewalData }) {
  const renewals = data.renewals as any[];
  const [query, setQuery] = useState("");
  const [view, setView] =
    useState<(typeof defaultViews)[number]>("All Renewals");
  const [selectedId, setSelectedId] = useState(renewals[0]?.id ?? "");
  const [productId, setProductId] = useState(data.products[0]?.id ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [caseOpen, setCaseOpen] = useState(false);
  const [workOpen, setWorkOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const selected =
    renewals.find((renewal) => renewal.id === selectedId) ?? renewals[0];

  const productOptions = data.products.map((product: any) => ({
    id: product.id,
    label: product.name,
    active: product.active,
    parentId: product.vendorCompanyId,
    hint: product.vendorCompany?.name,
  }));
  const selectedProductId = productId || productOptions[0]?.id || "";
  const moduleOptions = optionRows(
    data.modules.filter(
      (module: any) => module.productId === selectedProductId
    ),
    (module) => module.name
  );
  const featureOptions = optionRows(
    data.features.filter(
      (feature: any) => feature.productId === selectedProductId
    ),
    (feature) => feature.name
  );
  const vendorOptions = roleOptions(data.companies, "VENDOR");
  const resellerOptions = roleOptions(data.companies, "RESELLER");
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
    data.budgetAnnualFinancials,
    (row) =>
      `${row.budgetPlan.name} / ${titleCaseEnum(row.scenario.label)} / ${row.account.code} / ${row.budgetItem.name}`
  );
  const budgetItemOptions = dedupeOptions(
    optionRows(data.budgetAnnualFinancials, (row) => row.budgetItem.name)
  );
  const budgetLineOptions = optionRows(
    data.budgetLineItems,
    (row) =>
      `${row.fiscalYear.label} / ${row.budgetCategory.name} / ${row.description ?? row.id}`
  );
  const contractOptions = optionRows(
    data.contracts,
    (contract) => contract.title
  );
  const capabilityOptions = optionRows(
    data.capabilities,
    (capability) => capability.name
  );
  const vehicleOptions = optionRows(
    data.purchasingVehicles,
    (vehicle) => vehicle.name
  );
  const agreementOptions = optionRows(
    data.purchasingAgreements,
    (agreement) =>
      `${agreement.seller.name} / ${agreement.title ?? agreement.sellerAwardNumber ?? agreement.purchasingVehicle.name}`
  );
  const renewalOptions = optionRows(renewals, (renewal) => renewal.renewalName);

  const filtered = useMemo(() => {
    const lowerQuery = query.toLowerCase();
    return renewals.filter((renewal) => {
      const days = daysUntil(
        renewal.renewalExpirationDate ?? renewal.renewalDate
      );
      const matchesQuery =
        !lowerQuery ||
        [
          renewal.renewalName,
          renewal.productOrService,
          renewal.vendorCompany?.name,
          renewal.sellerCompany?.name,
          renewal.department,
          renewal.renewalOwner,
          renewal.nextAction,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(lowerQuery);

      const matchesView =
        view === "All Renewals" ||
        (view === "Due in 30 Days" && days !== null && days <= 30) ||
        (view === "Due in 60 Days" && days !== null && days <= 60) ||
        (view === "Due in 90 Days" && days !== null && days <= 90) ||
        (view === "Decision Pending" &&
          renewal.decisionStatus !== "APPROVED") ||
        (view === "Review Required" &&
          renewal.recommendedDisposition === "REVIEW_REQUIRED") ||
        (view === "Renewing" &&
          ["RENEW_AS_IS", "RENEW_WITH_CHANGES"].includes(
            renewal.approvedDisposition ?? renewal.recommendedDisposition
          )) ||
        (view === "Renew with Changes" &&
          renewal.recommendedDisposition === "RENEW_WITH_CHANGES") ||
        (view === "Renegotiation" &&
          renewal.recommendedDisposition === "RENEGOTIATE") ||
        (view === "Replacements Planned" && renewal.replacementRequired) ||
        (view === "Consolidations" &&
          renewal.recommendedDisposition === "CONSOLIDATE") ||
        (view === "Temporary Extensions" &&
          renewal.recommendedDisposition === "EXTEND_TEMPORARILY") ||
        (view === "Decommissioning" && renewal.decommissioningRequired) ||
        (view === "Do Not Renew" &&
          renewal.recommendedDisposition === "DO_NOT_RENEW") ||
        (view === "At Risk" &&
          ["AT_RISK", "CRITICAL"].includes(renewal.riskStatus)) ||
        (view === "Waiting on Quotes" &&
          ["NOT_REQUESTED", "REQUESTED"].includes(renewal.quoteStatus)) ||
        (view === "Waiting on Purchasing" &&
          ["PURCHASING_REVIEW", "PURCHASE_ORDER_PENDING"].includes(
            renewal.workflowStage
          )) ||
        (view === "Waiting on Legal" &&
          renewal.workflowStage === "LEGAL_REVIEW") ||
        (view === "Unfunded" &&
          ["UNFUNDED", "BLOCKED"].includes(renewal.fundingStatus)) ||
        (view === "Completed" && renewal.overallStatus === "COMPLETED") ||
        (view === "Cancelled" && renewal.overallStatus === "CANCELLED");

      return matchesQuery && matchesView;
    });
  }, [query, renewals, view]);

  const metrics = buildMetrics(renewals);

  return (
    <WorkspaceShell
      title="Maintenance Renewals"
      description="Operational renewal queue with spreadsheet-style review, disposition, workflow, quote, funding, replacement, and decommissioning controls."
      actionLabel="New Renewal"
    >
      <div className="grid min-w-0 gap-3">
        <MetricRail metrics={metrics} />

        <div className="min-w-0 overflow-hidden rounded-lg border border-border/80 bg-card/95">
          <div className="flex flex-wrap items-end gap-2 border-b border-border/80 p-3">
            <label className="flex min-w-52 flex-col gap-1 text-xs text-muted-foreground">
              View
              <select
                aria-label="Default view"
                value={view}
                onChange={(event) =>
                  setView(event.target.value as (typeof defaultViews)[number])
                }
                className="h-9 rounded-lg border border-border/80 bg-secondary/45 px-3 text-sm text-slate-100"
              >
                {defaultViews.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <div className="relative min-w-72 flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                aria-label="Search renewals"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search renewal, product, vendor, owner, department, or next action"
                className="h-9 border-border/80 bg-secondary/45 pl-8"
              />
            </div>
            <Button
              variant="outline"
              className="border-border/80 bg-secondary/50"
              onClick={() => setGuideOpen(true)}
            >
              <FileText data-icon="inline-start" />
              Disposition Guide
            </Button>
            <Button
              variant="outline"
              className="border-border/80 bg-secondary/50"
              disabled={!selected}
              onClick={() => setCaseOpen(true)}
            >
              <PanelRightOpen data-icon="inline-start" />
              Case Panel
            </Button>
            <Button
              variant="outline"
              className="border-border/80 bg-secondary/50"
              disabled={!selected}
              onClick={() => setWorkOpen(true)}
            >
              <ClipboardCheck data-icon="inline-start" />
              Actions
            </Button>
            <Button
              className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              onClick={() => setCreateOpen(true)}
            >
              <Plus data-icon="inline-start" />
              New Renewal
            </Button>
          </div>

          <RenewalSpreadsheet
            renewals={filtered}
            selectedId={selected?.id}
            setSelectedId={setSelectedId}
            optionSets={data.optionSets}
            productOptions={productOptions}
            vendorOptions={vendorOptions}
            resellerOptions={resellerOptions}
          />
        </div>

        {selected ? (
          <SelectedRenewalPanel renewal={selected} />
        ) : (
          <EmptyState>
            No renewal cases match the current view. Adjust the filters or add a
            renewal case from the toolbar.
          </EmptyState>
        )}
      </div>

      <CreateRenewalSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        productOptions={productOptions}
        selectedProductId={selectedProductId}
        setProductId={setProductId}
        moduleOptions={moduleOptions}
        featureOptions={featureOptions}
        vendorOptions={vendorOptions}
        resellerOptions={resellerOptions}
        contractOptions={contractOptions}
        vehicleOptions={vehicleOptions}
        agreementOptions={agreementOptions}
        fiscalOptions={fiscalOptions}
        budgetPlanOptions={budgetPlanOptions}
        annualOptions={annualOptions}
        budgetItemOptions={budgetItemOptions}
        budgetLineOptions={budgetLineOptions}
        accountOptions={accountOptions}
        capabilityOptions={capabilityOptions}
        data={data}
      />
      <CaseSheet
        open={caseOpen}
        onOpenChange={setCaseOpen}
        renewal={selected}
        data={data}
        productOptions={productOptions}
      />
      <WorkSheet
        open={workOpen}
        onOpenChange={setWorkOpen}
        renewal={selected}
        data={data}
        renewalOptions={renewalOptions}
        fiscalOptions={fiscalOptions}
        budgetPlanOptions={budgetPlanOptions}
        productOptions={productOptions}
      />
      <DispositionGuideSheet
        open={guideOpen}
        onOpenChange={setGuideOpen}
        data={data}
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
      <div className="grid min-w-[1280px] grid-cols-16 divide-x divide-border/70">
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

function RenewalSpreadsheet({
  renewals,
  selectedId,
  setSelectedId,
  optionSets,
  productOptions,
  vendorOptions,
  resellerOptions,
}: {
  renewals: any[];
  selectedId?: string;
  setSelectedId: (value: string) => void;
  optionSets: RenewalData["optionSets"];
  productOptions: Option[];
  vendorOptions: Option[];
  resellerOptions: Option[];
}) {
  return (
    <div className="w-full max-w-full overflow-auto">
      <div className="max-h-[620px] min-w-[1580px]">
        <Table className="min-w-[1580px] text-xs">
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="border-border/80">
              <TableHead className="w-64">Product / Service</TableHead>
              <TableHead>Reseller</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead className="text-right">Days</TableHead>
              <TableHead>Recommended</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="text-right">Current</TableHead>
              <TableHead>Quote</TableHead>
              <TableHead>Next Due</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Vendor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renewals.map((renewal) => {
              const dueDays = daysUntil(
                renewal.renewalExpirationDate ?? renewal.renewalDate
              );
              const selected = renewal.id === selectedId;
              const rowProductOptions = productOptionsForRenewal(
                productOptions,
                renewal
              );
              const selectedProductId = rowProductOptions.some(
                (option) => option.id === renewal.productId
              )
                ? (renewal.productId ?? "")
                : "";

              return (
                <TableRow
                  key={renewal.id}
                  className={`cursor-pointer border-border/60 ${selected ? "bg-cyan-400/12" : "hover:bg-secondary/35"}`}
                  onClick={() => setSelectedId(renewal.id)}
                >
                  <TableCell className="sticky left-0 z-[1] min-w-64 bg-card font-medium text-slate-100">
                    <EditableTableSelect
                      renewal={renewal}
                      field="productId"
                      value={selectedProductId}
                      options={rowProductOptions}
                      includeNone={false}
                      width="wide"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableTableSelect
                      renewal={renewal}
                      field="sellerCompanyId"
                      value={renewal.sellerCompanyId ?? "none"}
                      options={resellerOptions}
                      includeNone
                      noneLabel="Direct"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCaseInput
                      renewal={renewal}
                      field="renewalOwner"
                      placeholder="Unassigned"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCaseInput
                      renewal={renewal}
                      field="renewalExpirationDate"
                      type="date"
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {dueDays ?? "n/a"}
                  </TableCell>
                  <TableCell>
                    <EditableTableSelect
                      renewal={renewal}
                      field="recommendedDisposition"
                      value={renewal.recommendedDisposition}
                      options={optionSets.dispositions.map(
                        (disposition: string) => ({
                          id: disposition,
                          label: titleCaseEnum(disposition),
                        })
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCaseSelect
                      renewal={renewal}
                      field="workflowStage"
                      options={optionSets.workflowStages}
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <EditableCaseInput
                      renewal={renewal}
                      field="currentAnnualCost"
                      type="number"
                      align="right"
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCaseSelect
                      renewal={renewal}
                      field="quoteStatus"
                      options={optionSets.quoteStatuses}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableCaseInput
                      renewal={renewal}
                      field="nextActionDueDate"
                      type="date"
                    />
                  </TableCell>
                  <TableCell>{dateOnly(renewal.updatedAt)}</TableCell>
                  <TableCell>
                    <EditableTableSelect
                      renewal={renewal}
                      field="vendorCompanyId"
                      value={renewal.vendorCompanyId ?? ""}
                      options={vendorOptions}
                      includeNone={false}
                    />
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

function productOptionsForRenewal(options: Option[], renewal: any) {
  if (!renewal.vendorCompanyId) {
    return options;
  }
  return options.filter(
    (option) => option.parentId === renewal.vendorCompanyId
  );
}

const inlineSelectClassName =
  "h-7 min-w-40 rounded border border-border/50 bg-popover px-2 py-0 font-mono text-[0.68rem] text-popover-foreground [color-scheme:dark] hover:border-cyan-400/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/40";
const inlineOptionStyle = {
  backgroundColor: "var(--popover)",
  color: "var(--popover-foreground)",
};

type TableField =
  | "productId"
  | "vendorCompanyId"
  | "sellerCompanyId"
  | "recommendedDisposition";

function EditableTableSelect({
  renewal,
  field,
  value,
  options,
  includeNone = false,
  noneLabel = "None",
  width = "default",
}: {
  renewal: any;
  field: TableField;
  value: string;
  options: Option[];
  includeNone?: boolean;
  noneLabel?: string;
  width?: "default" | "wide";
}) {
  const [state, formAction, pending] = useActionState(
    updateRenewalTableFieldAction,
    emptyActionResult
  );

  return (
    <form
      action={formAction}
      className="relative"
      onClick={(event) => event.stopPropagation()}
    >
      <input type="hidden" name="id" value={renewal.id} />
      <input type="hidden" name="field" value={field} />
      <select
        name="value"
        defaultValue={value || (includeNone ? "none" : "")}
        disabled={pending}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className={`${inlineSelectClassName} ${width === "wide" ? "w-60" : "w-40"}`}
      >
        {includeNone ? (
          <option value="none" style={inlineOptionStyle}>
            {noneLabel}
          </option>
        ) : null}
        {!includeNone && !value ? (
          <option value="" disabled style={inlineOptionStyle}>
            Select
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.id} value={option.id} style={inlineOptionStyle}>
            {option.label}
            {option.active === false ? " (inactive)" : ""}
          </option>
        ))}
      </select>
      <InlineMutationState ok={state.ok} message={state.message} />
    </form>
  );
}

const caseUpdateFields = [
  "id",
  "overallStatus",
  "workflowStage",
  "riskStatus",
  "fundingStatus",
  "quoteStatus",
  "renewalOwner",
  "decisionOwner",
  "currentAnnualCost",
  "forecastedRenewalCost",
  "approvedAmount",
  "purchaseOrderAmount",
  "finalPurchaseAmount",
  "renewalExpirationDate",
  "cancellationNoticeDeadline",
  "nextAction",
  "nextActionOwner",
  "nextActionDueDate",
  "notesText",
] as const;

type CaseUpdateField = (typeof caseUpdateFields)[number];

function caseFieldValue(renewal: any, field: CaseUpdateField) {
  if (field === "renewalExpirationDate") {
    return dateOnly(renewal.renewalExpirationDate ?? renewal.renewalDate);
  }
  if (field === "cancellationNoticeDeadline") {
    return dateOnly(renewal.cancellationNoticeDeadline);
  }
  if (field === "nextActionDueDate") {
    return dateOnly(renewal.nextActionDueDate);
  }
  return String(renewal[field] ?? "");
}

function CaseUpdateHiddenFields({
  renewal,
  exclude,
}: {
  renewal: any;
  exclude: CaseUpdateField;
}) {
  return (
    <>
      {caseUpdateFields
        .filter((field) => field !== exclude)
        .map((field) => (
          <input
            key={field}
            type="hidden"
            name={field}
            value={caseFieldValue(renewal, field)}
          />
        ))}
    </>
  );
}

function EditableCaseInput({
  renewal,
  field,
  type = "text",
  placeholder = "",
  align = "left",
}: {
  renewal: any;
  field: CaseUpdateField;
  type?: string;
  placeholder?: string;
  align?: "left" | "right";
}) {
  const [state, formAction, pending] = useActionState(
    updateRenewalCaseAction,
    emptyActionResult
  );
  const defaultValue = caseFieldValue(renewal, field);

  return (
    <form
      action={formAction}
      className="relative"
      onClick={(event) => event.stopPropagation()}
    >
      <CaseUpdateHiddenFields renewal={renewal} exclude={field} />
      <Input
        name={field}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={pending}
        onBlur={(event) => {
          if (event.currentTarget.value !== defaultValue) {
            event.currentTarget.form?.requestSubmit();
          }
        }}
        className={`h-7 min-w-24 rounded border-border/50 bg-secondary/25 px-2 py-0 font-mono text-xs text-slate-100 hover:border-cyan-400/40 focus-visible:ring-1 ${align === "right" ? "text-right" : ""}`}
      />
      <InlineMutationState ok={state.ok} message={state.message} />
    </form>
  );
}

function EditableCaseSelect({
  renewal,
  field,
  options,
}: {
  renewal: any;
  field: CaseUpdateField;
  options: string[];
}) {
  const [state, formAction, pending] = useActionState(
    updateRenewalCaseAction,
    emptyActionResult
  );

  return (
    <form
      action={formAction}
      className="relative"
      onClick={(event) => event.stopPropagation()}
    >
      <CaseUpdateHiddenFields renewal={renewal} exclude={field} />
      <select
        name={field}
        defaultValue={caseFieldValue(renewal, field)}
        disabled={pending}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className={inlineSelectClassName}
      >
        {options.map((option) => (
          <option key={option} value={option} style={inlineOptionStyle}>
            {titleCaseEnum(option)}
          </option>
        ))}
      </select>
      <InlineMutationState ok={state.ok} message={state.message} />
    </form>
  );
}

function InlineMutationState({
  ok,
  message,
}: {
  ok?: boolean;
  message?: string;
}) {
  if (!message || ok) return null;
  return (
    <span
      title={message}
      className="absolute -right-1 -top-1 grid size-3 place-items-center rounded-full bg-red-400 text-[0.55rem] font-bold text-slate-950"
    >
      !
    </span>
  );
}

function SelectedRenewalPanel({ renewal }: { renewal: any }) {
  return (
    <section className="grid min-w-0 gap-3 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="min-w-0 rounded-lg border border-border/80 bg-card/95">
        <div className="grid gap-2 border-b border-border/80 p-3 md:grid-cols-6">
          <SummaryCell label="Workflow" value={renewal.workflowStage} />
          <SummaryCell
            label="Recommended"
            value={renewal.recommendedDisposition}
          />
          <SummaryCell label="Approved" value={renewal.approvedDisposition} />
          <SummaryCell label="Decision" value={renewal.decisionStatus} />
          <SummaryCell label="Overall" value={renewal.overallStatus} />
          <SummaryCell label="Risk" value={renewal.riskStatus} />
        </div>
        <div className="grid gap-3 p-3 md:grid-cols-4">
          <Fact label="Product" value={renewal.productOrService} />
          <Fact label="Vendor" value={renewal.vendorCompany?.name ?? "None"} />
          <Fact
            label="Contract"
            value={
              renewal.contract?.contractNumber ??
              renewal.contract?.title ??
              "None"
            }
          />
          <Fact
            label="Notice deadline"
            value={dateOnly(renewal.cancellationNoticeDeadline)}
          />
          <Fact label="Current cost" value={money(renewal.currentAnnualCost)} />
          <Fact label="Forecast" value={money(renewal.forecastedRenewalCost)} />
          <Fact label="PO amount" value={money(renewal.purchaseOrderAmount)} />
          <Fact
            label="Actual amount"
            value={money(renewal.finalPurchaseAmount)}
          />
          <Fact
            label="Decision owner"
            value={renewal.decisionOwner ?? "Unassigned"}
          />
          <Fact label="Next action" value={renewal.nextAction ?? "None"} />
          <Fact
            label="Next action owner"
            value={renewal.nextActionOwner ?? "None"}
          />
          <Fact
            label="Next action due"
            value={dateOnly(renewal.nextActionDueDate)}
          />
        </div>
      </div>

      <div className="min-w-0 rounded-lg border border-border/80 bg-card/95 p-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
          <CompactList
            title="Open Tasks"
            rows={renewal.tasks?.slice(0, 5) ?? []}
            empty="No tasks"
            render={(task) => (
              <>
                <span className="truncate">{task.title}</span>
                <StatusBadge value={task.status} />
              </>
            )}
          />
          <CompactList
            title="Latest Quotes"
            rows={renewal.quotes?.slice(0, 5) ?? []}
            empty="No quotes"
            render={(quote) => (
              <>
                <span className="truncate">
                  {quote.quoteNumber ??
                    quote.versionLabel ??
                    quote.id.slice(0, 8)}
                </span>
                <span className="font-mono">{money(quote.amount)}</span>
              </>
            )}
          />
          <CompactList
            title="Decision History"
            rows={renewal.decisionHistory?.slice(0, 5) ?? []}
            empty="No history"
            render={(item) => (
              <>
                <span>{titleCaseEnum(item.decisionStatus)}</span>
                <span className="text-muted-foreground">
                  {dateOnly(item.changedAt)}
                </span>
              </>
            )}
          />
        </div>
      </div>
    </section>
  );
}

function SummaryCell({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1">
        <StatusBadge value={value} />
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm text-slate-100">{value || "None"}</p>
    </div>
  );
}

function CompactList({
  title,
  rows,
  empty,
  render,
}: {
  title: string;
  rows: any[];
  empty: string;
  render: (row: any) => React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      <div className="mt-2 grid gap-1">
        {rows.length ? (
          rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-border/50 py-1.5 text-xs"
            >
              {render(row)}
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">{empty}</p>
        )}
      </div>
    </div>
  );
}

function CreateRenewalSheet({
  open,
  onOpenChange,
  productOptions,
  selectedProductId,
  setProductId,
  moduleOptions,
  featureOptions,
  vendorOptions,
  resellerOptions,
  contractOptions,
  vehicleOptions,
  agreementOptions,
  fiscalOptions,
  budgetPlanOptions,
  annualOptions,
  budgetItemOptions,
  budgetLineOptions,
  accountOptions,
  capabilityOptions,
  data,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productOptions: Option[];
  selectedProductId: string;
  setProductId: (value: string) => void;
  moduleOptions: Option[];
  featureOptions: Option[];
  vendorOptions: Option[];
  resellerOptions: Option[];
  contractOptions: Option[];
  vehicleOptions: Option[];
  agreementOptions: Option[];
  fiscalOptions: Option[];
  budgetPlanOptions: Option[];
  annualOptions: Option[];
  budgetItemOptions: Option[];
  budgetLineOptions: Option[];
  accountOptions: Option[];
  capabilityOptions: Option[];
  data: RenewalData;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-border bg-popover/98 sm:max-w-2xl">
        <SheetHeader className="border-b border-border/80">
          <SheetTitle>Create Renewal Case</SheetTitle>
          <SheetDescription>
            Creates a persisted operational renewal cycle from live catalog,
            budget, contract, and purchasing records.
          </SheetDescription>
        </SheetHeader>
        <div className="overflow-auto px-4 pb-6">
          <FormShell title="Core Details" action={createRenewalAction}>
            {(_state, pending) => (
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Renewal name" name="renewalName" />
                <SelectBox
                  label="Product"
                  name="productId"
                  options={productOptions}
                  defaultValue={selectedProductId}
                  onChange={setProductId}
                />
                <MultiSelect
                  label="Product Components"
                  name="productModuleIds"
                  options={moduleOptions}
                />
                <MultiSelect
                  label="Functions"
                  name="productFeatureIds"
                  options={featureOptions}
                />
                <SelectBox
                  label="Vendor"
                  name="vendorCompanyId"
                  options={vendorOptions}
                  includeNone
                />
                <SelectBox
                  label="Reseller"
                  name="sellerCompanyId"
                  options={resellerOptions}
                  includeNone
                />
                <SelectBox
                  label="Contract"
                  name="contractId"
                  options={contractOptions}
                  includeNone
                />
                <SelectBox
                  label="Purchasing vehicle"
                  name="purchasingVehicleId"
                  options={vehicleOptions}
                  includeNone
                />
                <SelectBox
                  label="Purchasing agreement"
                  name="purchasingAgreementId"
                  options={agreementOptions}
                  includeNone
                />
                <SelectBox
                  label="Fiscal year"
                  name="fiscalYearId"
                  options={fiscalOptions}
                  defaultValue={fiscalOptions[0]?.id}
                />
                <SelectBox
                  label="Budget plan"
                  name="budgetPlanId"
                  options={budgetPlanOptions}
                  defaultValue={budgetPlanOptions[0]?.id}
                />
                <SelectBox
                  label="Budget annual financial"
                  name="linkedAnnualFinancialId"
                  options={annualOptions}
                  includeNone
                />
                <SelectBox
                  label="Budget item"
                  name="budgetItemId"
                  options={budgetItemOptions}
                  includeNone
                />
                <SelectBox
                  label="Legacy budget line"
                  name="budgetLineItemId"
                  options={budgetLineOptions}
                  includeNone
                />
                <SelectBox
                  label="Funding account"
                  name="fundingAccountId"
                  options={accountOptions}
                  defaultValue={accountOptions[0]?.id}
                />
                <SelectBox
                  label="Security capability"
                  name="securityCapabilityId"
                  options={capabilityOptions}
                  includeNone
                />
                <Field label="Department" name="department" />
                <Field label="Cost center" name="costCenter" />
                <Field label="Funding source" name="fundingSource" />
                <Field
                  label="Current cost"
                  name="currentAnnualCost"
                  type="number"
                  defaultValue="0"
                />
                <Field
                  label="Forecasted renewal cost"
                  name="forecastedRenewalCost"
                  type="number"
                  defaultValue="0"
                />
                <Field
                  label="Approved amount"
                  name="approvedAmount"
                  type="number"
                  defaultValue="0"
                />
                <Field label="Renewal date" name="renewalDate" type="date" />
                <Field
                  label="Current contract start"
                  name="currentContractStart"
                  type="date"
                />
                <Field
                  label="Current contract end"
                  name="currentContractEnd"
                  type="date"
                />
                <Field
                  label="Renewal effective date"
                  name="renewalEffectiveDate"
                  type="date"
                />
                <Field
                  label="Renewal expiration date"
                  name="renewalExpirationDate"
                  type="date"
                />
                <Field
                  label="Cancellation notice deadline"
                  name="cancellationNoticeDeadline"
                  type="date"
                />
                <ToggleField name="autoRenewal" label="Auto-renewal" />
                <Field label="Renewal owner" name="renewalOwner" />
                <Field label="Product owner" name="productOwner" />
                <Field label="Business owner" name="businessOwner" />
                <Field label="Contract owner" name="contractOwner" />
                <Field label="Capability owner" name="capabilityOwner" />
                <Field label="Decision owner" name="decisionOwner" />
                <SelectBox
                  label="Recommended disposition"
                  name="recommendedDisposition"
                  options={dispositionOptions(data)}
                  defaultValue="DECISION_PENDING"
                />
                <Field
                  label="Decision due date"
                  name="decisionDueDate"
                  type="date"
                />
                <Field label="Next action" name="nextAction" />
                <Field label="Next action owner" name="nextActionOwner" />
                <Field
                  label="Next action due date"
                  name="nextActionDueDate"
                  type="date"
                />
                <div className="md:col-span-2">
                  <TextBlock label="Notes" name="notesText" />
                </div>
                <div className="md:col-span-2">
                  <SubmitButton pending={pending}>Create Renewal</SubmitButton>
                </div>
              </div>
            )}
          </FormShell>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CaseSheet({
  open,
  onOpenChange,
  renewal,
  data,
  productOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renewal?: any;
  data: RenewalData;
  productOptions: Option[];
}) {
  if (!renewal) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-border bg-popover/98 sm:max-w-2xl">
        <SheetHeader className="border-b border-border/80">
          <SheetTitle>{renewal.renewalName}</SheetTitle>
          <SheetDescription>
            Update case status, disposition recommendation, and approval outcome
            for the selected spreadsheet row.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 overflow-auto px-4 pb-6">
          <FormShell title="Case Summary" action={updateRenewalCaseAction}>
            {(_state, pending) => (
              <div className="grid gap-3 md:grid-cols-2">
                <input type="hidden" name="id" value={renewal.id} />
                <SelectBox
                  label="Overall status"
                  name="overallStatus"
                  options={enumOptions(data.optionSets.overallStatuses)}
                  defaultValue={renewal.overallStatus}
                />
                <SelectBox
                  label="Workflow stage"
                  name="workflowStage"
                  options={enumOptions(data.optionSets.workflowStages)}
                  defaultValue={renewal.workflowStage}
                />
                <SelectBox
                  label="Risk status"
                  name="riskStatus"
                  options={enumOptions(data.optionSets.riskStatuses)}
                  defaultValue={renewal.riskStatus}
                />
                <SelectBox
                  label="Funding status"
                  name="fundingStatus"
                  options={enumOptions(data.optionSets.fundingStatuses)}
                  defaultValue={renewal.fundingStatus}
                />
                <SelectBox
                  label="Quote status"
                  name="quoteStatus"
                  options={enumOptions(data.optionSets.quoteStatuses)}
                  defaultValue={renewal.quoteStatus}
                />
                <Field
                  label="Renewal owner"
                  name="renewalOwner"
                  defaultValue={renewal.renewalOwner ?? ""}
                />
                <Field
                  label="Decision owner"
                  name="decisionOwner"
                  defaultValue={renewal.decisionOwner ?? ""}
                />
                <Field
                  label="Current cost"
                  name="currentAnnualCost"
                  type="number"
                  defaultValue={Number(renewal.currentAnnualCost)}
                />
                <Field
                  label="Forecast"
                  name="forecastedRenewalCost"
                  type="number"
                  defaultValue={Number(renewal.forecastedRenewalCost)}
                />
                <Field
                  label="Approved amount"
                  name="approvedAmount"
                  type="number"
                  defaultValue={Number(renewal.approvedAmount)}
                />
                <Field
                  label="PO amount"
                  name="purchaseOrderAmount"
                  type="number"
                  defaultValue={Number(renewal.purchaseOrderAmount)}
                />
                <Field
                  label="Actual/final amount"
                  name="finalPurchaseAmount"
                  type="number"
                  defaultValue={Number(renewal.finalPurchaseAmount)}
                />
                <Field
                  label="Renewal expiration"
                  name="renewalExpirationDate"
                  type="date"
                  defaultValue={dateOnly(renewal.renewalExpirationDate)}
                />
                <Field
                  label="Notice deadline"
                  name="cancellationNoticeDeadline"
                  type="date"
                  defaultValue={dateOnly(renewal.cancellationNoticeDeadline)}
                />
                <Field
                  label="Next action"
                  name="nextAction"
                  defaultValue={renewal.nextAction ?? ""}
                />
                <Field
                  label="Next action owner"
                  name="nextActionOwner"
                  defaultValue={renewal.nextActionOwner ?? ""}
                />
                <Field
                  label="Next action due"
                  name="nextActionDueDate"
                  type="date"
                  defaultValue={dateOnly(renewal.nextActionDueDate)}
                />
                <div className="md:col-span-2">
                  <TextBlock
                    label="Notes"
                    name="notesText"
                    defaultValue={renewal.notesText ?? ""}
                  />
                </div>
                <div className="md:col-span-2">
                  <SubmitButton pending={pending}>Save Case</SubmitButton>
                </div>
              </div>
            )}
          </FormShell>

          <FormShell
            title="Submit Recommendation"
            action={submitRecommendationAction}
          >
            {(_state, pending) => (
              <div className="grid gap-3 md:grid-cols-2">
                <input type="hidden" name="id" value={renewal.id} />
                <SelectBox
                  label="Recommended disposition"
                  name="recommendedDisposition"
                  options={dispositionOptions(data)}
                  defaultValue={renewal.recommendedDisposition}
                />
                <Field
                  label="Submitted by"
                  name="recommendationSubmittedBy"
                  defaultValue={renewal.recommendationSubmittedBy ?? ""}
                />
                <div className="md:col-span-2">
                  <TextBlock
                    label="Recommendation rationale"
                    name="recommendationRationale"
                    defaultValue={renewal.recommendationRationale ?? ""}
                  />
                </div>
                <Field
                  label="Decision due"
                  name="decisionDueDate"
                  type="date"
                  defaultValue={dateOnly(renewal.decisionDueDate)}
                />
                <SelectBox
                  label="Replacement product"
                  name="replacementProductId"
                  options={productOptions}
                  includeNone
                  defaultValue={renewal.replacementProductId ?? "none"}
                />
                <ToggleField
                  name="replacementRequired"
                  label="Replacement required"
                  defaultChecked={renewal.replacementRequired}
                />
                <Field
                  label="Replacement project"
                  name="replacementProject"
                  defaultValue={renewal.replacementProject ?? ""}
                />
                <Field
                  label="Target replacement date"
                  name="targetReplacementDate"
                  type="date"
                  defaultValue={dateOnly(renewal.targetReplacementDate)}
                />
                <ToggleField
                  name="decommissioningRequired"
                  label="Decommissioning required"
                  defaultChecked={renewal.decommissioningRequired}
                />
                <Field
                  label="Target decommission date"
                  name="targetDecommissionDate"
                  type="date"
                  defaultValue={dateOnly(renewal.targetDecommissionDate)}
                />
                <Field
                  label="Temporary extension term"
                  name="temporaryExtensionTerm"
                  defaultValue={renewal.temporaryExtensionTerm ?? ""}
                />
                <Field
                  label="Next review date"
                  name="nextReviewDate"
                  type="date"
                  defaultValue={dateOnly(renewal.nextReviewDate)}
                />
                <div className="md:col-span-2">
                  <TextBlock
                    label="Temporary extension reason"
                    name="temporaryExtensionReason"
                    defaultValue={renewal.temporaryExtensionReason ?? ""}
                  />
                </div>
                <div className="md:col-span-2">
                  <SubmitButton pending={pending}>
                    Submit Recommendation
                  </SubmitButton>
                </div>
              </div>
            )}
          </FormShell>

          <FormShell title="Decision" action={decideDispositionAction}>
            {(_state, pending) => (
              <div className="grid gap-3 md:grid-cols-2">
                <input type="hidden" name="id" value={renewal.id} />
                <SelectBox
                  label="Approved disposition"
                  name="approvedDisposition"
                  options={dispositionOptions(data)}
                  includeNone
                  defaultValue={renewal.approvedDisposition ?? "none"}
                />
                <SelectBox
                  label="Decision status"
                  name="decisionStatus"
                  options={enumOptions(data.optionSets.decisionStatuses)}
                  defaultValue={renewal.decisionStatus}
                />
                <Field
                  label="Approved by"
                  name="approvedBy"
                  defaultValue={renewal.approvedBy ?? ""}
                />
                <div className="md:col-span-2">
                  <TextBlock
                    label="Approval rationale"
                    name="approvalRationale"
                    defaultValue={renewal.approvalRationale ?? ""}
                  />
                </div>
                <div className="md:col-span-2">
                  <TextBlock
                    label="Conditions of approval"
                    name="conditionsOfApproval"
                    defaultValue={renewal.conditionsOfApproval ?? ""}
                  />
                </div>
                <div className="md:col-span-2">
                  <SubmitButton pending={pending}>Record Decision</SubmitButton>
                </div>
              </div>
            )}
          </FormShell>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function WorkSheet({
  open,
  onOpenChange,
  renewal,
  data,
  renewalOptions,
  fiscalOptions,
  budgetPlanOptions,
  productOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renewal?: any;
  data: RenewalData;
  renewalOptions: Option[];
  fiscalOptions: Option[];
  budgetPlanOptions: Option[];
  productOptions: Option[];
}) {
  if (!renewal) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-border bg-popover/98 sm:max-w-2xl">
        <SheetHeader className="border-b border-border/80">
          <SheetTitle>Operational Actions</SheetTitle>
          <SheetDescription>
            Add quotes, tasks, workflow movement, funding, replacement,
            decommissioning, comments, or the next renewal cycle.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 overflow-auto px-4 pb-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormShell title="Add Quote" action={addQuoteAction}>
              {(_state, pending) => (
                <>
                  <input
                    type="hidden"
                    name="maintenanceRenewalId"
                    value={renewal.id}
                  />
                  <Field label="Quote number" name="quoteNumber" />
                  <Field label="Version" name="versionLabel" />
                  <SelectBox
                    label="Status"
                    name="status"
                    options={enumOptions(data.optionSets.quoteStatuses)}
                    defaultValue="RECEIVED"
                  />
                  <Field
                    label="Amount"
                    name="amount"
                    type="number"
                    defaultValue="0"
                  />
                  <Field label="Received" name="receivedOn" type="date" />
                  <Field label="Expires" name="expiresOn" type="date" />
                  <ToggleField
                    name="selectedFinal"
                    label="Select as final quote"
                    defaultChecked={false}
                  />
                  <Field label="Source" name="source" />
                  <TextBlock label="Notes" name="notesText" />
                  <SubmitButton pending={pending}>Add Quote</SubmitButton>
                </>
              )}
            </FormShell>

            <FormShell title="Advance Workflow" action={advanceStageAction}>
              {(_state, pending) => (
                <>
                  <input
                    type="hidden"
                    name="maintenanceRenewalId"
                    value={renewal.id}
                  />
                  <SelectBox
                    label="Stage"
                    name="stage"
                    options={enumOptions(data.optionSets.workflowStages)}
                    defaultValue={renewal.workflowStage}
                  />
                  <Field label="Stage owner" name="owner" />
                  <Field label="Due date" name="dueOn" type="date" />
                  <TextBlock label="Stage notes" name="notesText" />
                  <SubmitButton pending={pending}>Advance Stage</SubmitButton>
                </>
              )}
            </FormShell>

            <FormShell title="Add Task" action={addTaskAction}>
              {(_state, pending) => (
                <>
                  <input
                    type="hidden"
                    name="maintenanceRenewalId"
                    value={renewal.id}
                  />
                  <Field label="Task title" name="title" />
                  <TextBlock label="Description" name="description" />
                  <Field label="Owner" name="owner" />
                  <SelectBox
                    label="Stage"
                    name="stage"
                    options={enumOptions(data.optionSets.workflowStages)}
                    includeNone
                  />
                  <SelectBox
                    label="Status"
                    name="status"
                    options={enumOptions(data.optionSets.taskStatuses)}
                    defaultValue="OPEN"
                  />
                  <Field label="Due date" name="dueOn" type="date" />
                  <SubmitButton pending={pending}>Add Task</SubmitButton>
                </>
              )}
            </FormShell>

            <FormShell
              title="Add Funding Allocation"
              action={addFundingAllocationAction}
            >
              {(_state, pending) => (
                <>
                  <input
                    type="hidden"
                    name="maintenanceRenewalId"
                    value={renewal.id}
                  />
                  <Field
                    label="Department"
                    name="department"
                    defaultValue={renewal.department ?? ""}
                  />
                  <Field
                    label="Cost center"
                    name="costCenter"
                    defaultValue={renewal.costCenter ?? ""}
                  />
                  <Field
                    label="Funding source"
                    name="fundingSource"
                    defaultValue={renewal.fundingSource ?? ""}
                  />
                  <Field
                    label="Amount"
                    name="amount"
                    type="number"
                    defaultValue="0"
                  />
                  <ToggleField
                    name="approved"
                    label="Funding approved"
                    defaultChecked={false}
                  />
                  <TextBlock label="Notes" name="notesText" />
                  <SubmitButton pending={pending}>Add Allocation</SubmitButton>
                </>
              )}
            </FormShell>

            <FormShell
              title="Replacement Plan"
              action={saveReplacementPlanAction}
            >
              {(_state, pending) => (
                <>
                  <input
                    type="hidden"
                    name="maintenanceRenewalId"
                    value={renewal.id}
                  />
                  <SelectBox
                    label="Replacement product"
                    name="replacementProductId"
                    options={productOptions}
                    includeNone
                    defaultValue={
                      renewal.replacementPlan?.replacementProductId ??
                      renewal.replacementProductId ??
                      "none"
                    }
                  />
                  <Field
                    label="Replacement project"
                    name="replacementProject"
                    defaultValue={
                      renewal.replacementPlan?.replacementProject ??
                      renewal.replacementProject ??
                      ""
                    }
                  />
                  <Field
                    label="Replacement owner"
                    name="replacementOwner"
                    defaultValue={
                      renewal.replacementPlan?.replacementOwner ?? ""
                    }
                  />
                  <Field
                    label="Migration owner"
                    name="migrationOwner"
                    defaultValue={renewal.replacementPlan?.migrationOwner ?? ""}
                  />
                  <Field
                    label="Target replacement date"
                    name="targetReplacementDate"
                    type="date"
                    defaultValue={dateOnly(
                      renewal.replacementPlan?.targetReplacementDate ??
                        renewal.targetReplacementDate
                    )}
                  />
                  <TextBlock
                    label="Transition plan"
                    name="transitionPlan"
                    defaultValue={renewal.replacementPlan?.transitionPlan ?? ""}
                  />
                  <TextBlock
                    label="Transition risk"
                    name="transitionRisk"
                    defaultValue={renewal.replacementPlan?.transitionRisk ?? ""}
                  />
                  <ToggleField
                    name="contractOverlapRequired"
                    label="Contract overlap required"
                    defaultChecked={
                      renewal.replacementPlan?.contractOverlapRequired ?? false
                    }
                  />
                  <Field
                    label="Overlap cost"
                    name="overlapCost"
                    type="number"
                    defaultValue={Number(
                      renewal.replacementPlan?.overlapCost ?? 0
                    )}
                  />
                  <ToggleField
                    name="dataMigrationRequired"
                    label="Data migration required"
                    defaultChecked={
                      renewal.replacementPlan?.dataMigrationRequired ?? false
                    }
                  />
                  <ToggleField
                    name="integrationMigrationRequired"
                    label="Integration migration required"
                    defaultChecked={
                      renewal.replacementPlan?.integrationMigrationRequired ??
                      false
                    }
                  />
                  <TextBlock
                    label="Notes"
                    name="notesText"
                    defaultValue={renewal.replacementPlan?.notesText ?? ""}
                  />
                  <SubmitButton pending={pending}>
                    Save Replacement
                  </SubmitButton>
                </>
              )}
            </FormShell>

            <FormShell
              title="Decommissioning Plan"
              action={saveDecommissionPlanAction}
            >
              {(_state, pending) => (
                <>
                  <input
                    type="hidden"
                    name="maintenanceRenewalId"
                    value={renewal.id}
                  />
                  <Field
                    label="Decommission owner"
                    name="decommissionOwner"
                    defaultValue={
                      renewal.decommissioningPlan?.decommissionOwner ?? ""
                    }
                  />
                  <Field
                    label="Business owner"
                    name="businessOwner"
                    defaultValue={
                      renewal.decommissioningPlan?.businessOwner ??
                      renewal.businessOwner ??
                      ""
                    }
                  />
                  <Field
                    label="Technical owner"
                    name="technicalOwner"
                    defaultValue={
                      renewal.decommissioningPlan?.technicalOwner ?? ""
                    }
                  />
                  <Field
                    label="Target decommission date"
                    name="targetDecommissionDate"
                    type="date"
                    defaultValue={dateOnly(
                      renewal.decommissioningPlan?.targetDecommissionDate ??
                        renewal.targetDecommissionDate
                    )}
                  />
                  <TextBlock
                    label="Notes"
                    name="notesText"
                    defaultValue={renewal.decommissioningPlan?.notesText ?? ""}
                  />
                  <SubmitButton pending={pending}>
                    Save Decommissioning
                  </SubmitButton>
                </>
              )}
            </FormShell>

            <FormShell title="Add Comment" action={addCommentAction}>
              {(_state, pending) => (
                <>
                  <input
                    type="hidden"
                    name="maintenanceRenewalId"
                    value={renewal.id}
                  />
                  <TextBlock label="Comment" name="body" />
                  <SubmitButton pending={pending}>Add Comment</SubmitButton>
                </>
              )}
            </FormShell>

            <FormShell title="Create Next Cycle" action={createNextCycleAction}>
              {(_state, pending) => (
                <>
                  <SelectBox
                    label="Source renewal"
                    name="sourceRenewalId"
                    options={renewalOptions}
                    defaultValue={renewal.id}
                  />
                  <SelectBox
                    label="Fiscal year"
                    name="fiscalYearId"
                    options={fiscalOptions}
                    defaultValue={fiscalOptions[0]?.id}
                  />
                  <SelectBox
                    label="Budget plan"
                    name="budgetPlanId"
                    options={budgetPlanOptions}
                    defaultValue={budgetPlanOptions[0]?.id}
                  />
                  <Field
                    label="Next renewal date"
                    name="renewalDate"
                    type="date"
                  />
                  <Field
                    label="Next expiration"
                    name="renewalExpirationDate"
                    type="date"
                  />
                  <SubmitButton pending={pending}>Create Cycle</SubmitButton>
                </>
              )}
            </FormShell>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DispositionGuideSheet({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: RenewalData;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-border bg-popover/98 sm:max-w-2xl">
        <SheetHeader className="border-b border-border/80">
          <SheetTitle>Disposition Guide</SheetTitle>
          <SheetDescription>
            These definitions explain the decision field. They are not workflow
            status values.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-3 overflow-auto px-4 pb-6">
          {data.optionSets.dispositionDefinitions.map((definition: any) => (
            <div
              key={definition.value}
              className="rounded-lg border border-border/70 bg-secondary/30 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-100">
                  {definition.label}
                </h3>
                <StatusBadge value={definition.value} />
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {definition.shortDescription}
              </p>
              <p className="mt-2 text-xs leading-5 text-cyan-100">
                {definition.guidance}
              </p>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function enumOptions(values: readonly string[]): Option[] {
  return values.map((value) => ({ id: value, label: titleCaseEnum(value) }));
}

function dispositionOptions(data: RenewalData): Option[] {
  return data.optionSets.dispositionDefinitions.map((definition: any) => ({
    id: definition.value,
    label: definition.label,
    hint: definition.shortDescription,
  }));
}

function dedupeOptions(options: Option[]) {
  const byLabel = new Map<string, Option>();
  options.forEach((option) => byLabel.set(option.label, option));
  return Array.from(byLabel.values());
}

function buildMetrics(renewals: any[]) {
  const due = (days: number) =>
    renewals.filter((renewal) => {
      const remaining = daysUntil(
        renewal.renewalExpirationDate ?? renewal.renewalDate
      );
      return remaining !== null && remaining >= 0 && remaining <= days;
    }).length;
  const sum = (selector: (renewal: any) => number) =>
    renewals.reduce((total, renewal) => total + selector(renewal), 0);

  return [
    { label: "Due 30", value: due(30) },
    { label: "Due 60", value: due(60) },
    { label: "Due 90", value: due(90) },
    {
      label: "At Risk",
      value: renewals.filter((renewal) =>
        ["AT_RISK", "CRITICAL"].includes(renewal.riskStatus)
      ).length,
    },
    {
      label: "Decision Pending",
      value: renewals.filter((renewal) => renewal.decisionStatus !== "APPROVED")
        .length,
    },
    {
      label: "Review Required",
      value: renewals.filter(
        (renewal) => renewal.recommendedDisposition === "REVIEW_REQUIRED"
      ).length,
    },
    {
      label: "Replacing",
      value: renewals.filter((renewal) => renewal.replacementRequired).length,
    },
    {
      label: "Decom",
      value: renewals.filter((renewal) => renewal.decommissioningRequired)
        .length,
    },
    {
      label: "Awaiting Quote",
      value: renewals.filter((renewal) =>
        ["NOT_REQUESTED", "REQUESTED"].includes(renewal.quoteStatus)
      ).length,
    },
    {
      label: "Internal Action",
      value: renewals.filter((renewal) => renewal.nextAction).length,
    },
    {
      label: "Purchasing",
      value: renewals.filter((renewal) =>
        ["PURCHASING_REVIEW", "PURCHASE_ORDER_PENDING"].includes(
          renewal.workflowStage
        )
      ).length,
    },
    {
      label: "Legal",
      value: renewals.filter(
        (renewal) => renewal.workflowStage === "LEGAL_REVIEW"
      ).length,
    },
    {
      label: "Completed FY",
      value: renewals.filter((renewal) => renewal.overallStatus === "COMPLETED")
        .length,
    },
    {
      label: "Upcoming Value",
      value: money(
        sum((renewal) => Number(renewal.forecastedRenewalCost ?? 0))
      ),
    },
    {
      label: "Increase",
      value: money(
        sum((renewal) =>
          Math.max(
            Number(renewal.forecastedRenewalCost ?? 0) -
              Number(renewal.currentAnnualCost ?? 0),
            0
          )
        )
      ),
    },
    {
      label: "Savings",
      value: money(
        sum((renewal) =>
          Math.max(
            Number(renewal.currentAnnualCost ?? 0) -
              Number(renewal.forecastedRenewalCost ?? 0),
            0
          )
        )
      ),
    },
  ];
}
