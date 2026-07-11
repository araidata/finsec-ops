"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo, useState } from "react";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { titleCaseEnum } from "@/lib/maintenance-renewal-rules";

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

function variance(renewal: any) {
  return (
    Number(renewal.finalPurchaseAmount || renewal.forecastedRenewalCost) -
    Number(renewal.currentAnnualCost || 0)
  );
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
    <Badge variant="outline" className={badgeTone(value)}>
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
  const [query, setQuery] = useState("");
  const [view, setView] =
    useState<(typeof defaultViews)[number]>("All Renewals");
  const [selectedId, setSelectedId] = useState(data.renewals[0]?.id ?? "");
  const [productId, setProductId] = useState(data.products[0]?.id ?? "");

  const renewals = data.renewals as any[];
  const selected =
    renewals.find((renewal) => renewal.id === selectedId) ?? renewals[0];

  const productOptions = optionRows(
    data.products,
    (product) => `${product.vendorCompany?.name ?? "Vendor"} / ${product.name}`
  );
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
  const budgetItemOptions = optionRows(
    data.budgetAnnualFinancials,
    (row) => row.budgetItem.name
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
      description="Year-round renewal case management for disposition decisions, workflow stages, quotes, tasks, funding, replacement, decommissioning, purchasing links, comments, and history."
      actionLabel="New Renewal"
    >
      <section className="grid gap-2 md:grid-cols-4 xl:grid-cols-8">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-border/80 bg-card/85 p-3"
          >
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-50">
              {metric.value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-[0.8fr_1.2fr]">
        <FormShell title="Create Renewal Case" action={createRenewalAction}>
          {(_state, pending) => (
            <>
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
                options={dedupeOptions(budgetItemOptions)}
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
              <p className="text-xs leading-5 text-muted-foreground">
                Disposition describes what the organization plans to do. It is
                separate from workflow stage, decision status, funding, quote,
                and overall case status.
              </p>
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
              <TextBlock label="Notes" name="notesText" />
              <SubmitButton pending={pending}>Create Renewal</SubmitButton>
            </>
          )}
        </FormShell>

        <RenewalQueue
          renewals={filtered}
          query={query}
          setQuery={setQuery}
          view={view}
          setView={setView}
          selectedId={selected?.id}
          setSelectedId={setSelectedId}
        />
      </section>

      {selected ? (
        <RenewalDetail
          data={data}
          renewal={selected}
          renewalOptions={renewalOptions}
          fiscalOptions={fiscalOptions}
          budgetPlanOptions={budgetPlanOptions}
          productOptions={productOptions}
        />
      ) : (
        <EmptyState>
          No renewal cases exist yet. Create the first case from the live
          Product Catalog and budget reference data.
        </EmptyState>
      )}

      <DispositionReference data={data} />
    </WorkspaceShell>
  );
}

function RenewalQueue({
  renewals,
  query,
  setQuery,
  view,
  setView,
  selectedId,
  setSelectedId,
}: {
  renewals: any[];
  query: string;
  setQuery: (value: string) => void;
  view: (typeof defaultViews)[number];
  setView: (value: (typeof defaultViews)[number]) => void;
  selectedId?: string;
  setSelectedId: (value: string) => void;
}) {
  return (
    <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
      <CardHeader className="gap-3">
        <CardTitle>Operational Work Queue</CardTitle>
        <div className="grid gap-2 md:grid-cols-[0.75fr_1.25fr]">
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
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search renewal, product, vendor, owner, or next action"
            className="border-border/80 bg-secondary/45"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[720px] overflow-auto rounded-lg border border-border/80">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>Renewal</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Reseller</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Recommended</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Overall</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Forecast</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>Quote</TableHead>
                <TableHead>Funding</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Next Action</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renewals.map((renewal) => {
                const dueDays = daysUntil(
                  renewal.renewalExpirationDate ?? renewal.renewalDate
                );
                return (
                  <TableRow
                    key={renewal.id}
                    className={
                      renewal.id === selectedId
                        ? "bg-cyan-400/10"
                        : "cursor-pointer"
                    }
                    onClick={() => setSelectedId(renewal.id)}
                  >
                    <TableCell className="min-w-56">
                      <button
                        type="button"
                        className="text-left font-medium text-slate-100"
                        onClick={() => setSelectedId(renewal.id)}
                      >
                        {renewal.renewalName}
                      </button>
                      <div className="text-xs text-muted-foreground">
                        {renewal.productOrService}
                      </div>
                    </TableCell>
                    <TableCell>
                      {renewal.vendorCompany?.name ?? "None"}
                    </TableCell>
                    <TableCell>
                      {renewal.sellerCompany?.name ?? "Direct"}
                    </TableCell>
                    <TableCell>{renewal.department ?? "None"}</TableCell>
                    <TableCell>
                      {renewal.renewalOwner ?? "Unassigned"}
                    </TableCell>
                    <TableCell>
                      {dateOnly(
                        renewal.renewalExpirationDate ?? renewal.renewalDate
                      )}
                    </TableCell>
                    <TableCell>{dueDays ?? "n/a"}</TableCell>
                    <TableCell>
                      <StatusBadge value={renewal.recommendedDisposition} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={renewal.approvedDisposition} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={renewal.decisionStatus} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={renewal.workflowStage} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={renewal.overallStatus} />
                    </TableCell>
                    <TableCell>{money(renewal.currentAnnualCost)}</TableCell>
                    <TableCell>
                      {money(renewal.forecastedRenewalCost)}
                    </TableCell>
                    <TableCell>{money(variance(renewal))}</TableCell>
                    <TableCell>
                      <StatusBadge value={renewal.quoteStatus} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={renewal.fundingStatus} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={renewal.riskStatus} />
                    </TableCell>
                    <TableCell>
                      {renewal.nextAction ?? "None"}
                      <div className="text-xs text-muted-foreground">
                        {renewal.nextActionOwner ?? "No owner"}{" "}
                        {dateOnly(renewal.nextActionDueDate)}
                      </div>
                    </TableCell>
                    <TableCell>{dateOnly(renewal.updatedAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function RenewalDetail({
  data,
  renewal,
  renewalOptions,
  fiscalOptions,
  budgetPlanOptions,
  productOptions,
}: {
  data: RenewalData;
  renewal: any;
  renewalOptions: Option[];
  fiscalOptions: Option[];
  budgetPlanOptions: Option[];
  productOptions: Option[];
}) {
  const stageOptions = enumOptions(data.optionSets.workflowStages);
  const dispositionOptionsList = dispositionOptions(data);

  return (
    <section className="grid gap-3">
      <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
        <CardHeader>
          <CardTitle>{renewal.renewalName}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2 md:grid-cols-6">
            <SummaryChip label="Workflow Stage" value={renewal.workflowStage} />
            <SummaryChip
              label="Recommended"
              value={renewal.recommendedDisposition}
            />
            <SummaryChip label="Approved" value={renewal.approvedDisposition} />
            <SummaryChip label="Decision" value={renewal.decisionStatus} />
            <SummaryChip label="Overall" value={renewal.overallStatus} />
            <SummaryChip label="Risk" value={renewal.riskStatus} />
          </div>
          {renewal.approvedDisposition &&
          renewal.approvedDisposition !== renewal.recommendedDisposition ? (
            <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-100">
              Approved disposition differs from the recommendation. The
              recommendation remains preserved in decision history.
            </div>
          ) : null}
          <div className="grid gap-3 md:grid-cols-3">
            <Fact label="Product" value={renewal.productOrService} />
            <Fact
              label="Vendor"
              value={renewal.vendorCompany?.name ?? "None"}
            />
            <Fact
              label="Reseller"
              value={renewal.sellerCompany?.name ?? "Direct"}
            />
            <Fact
              label="Contract"
              value={
                renewal.contract?.contractNumber ??
                renewal.contract?.title ??
                "None"
              }
            />
            <Fact
              label="Expiration"
              value={dateOnly(
                renewal.renewalExpirationDate ?? renewal.renewalDate
              )}
            />
            <Fact
              label="Notice deadline"
              value={dateOnly(renewal.cancellationNoticeDeadline)}
            />
            <Fact
              label="Current cost"
              value={money(renewal.currentAnnualCost)}
            />
            <Fact
              label="Forecast"
              value={money(renewal.forecastedRenewalCost)}
            />
            <Fact
              label="Final purchase"
              value={money(renewal.finalPurchaseAmount)}
            />
            <Fact
              label="Decision owner"
              value={renewal.decisionOwner ?? "Unassigned"}
            />
            <Fact label="Next action" value={renewal.nextAction ?? "None"} />
            <Fact
              label="Next action due"
              value={dateOnly(renewal.nextActionDueDate)}
            />
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-3 xl:grid-cols-3">
        <FormShell title="Update Case Summary" action={updateRenewalCaseAction}>
          {(_state, pending) => (
            <>
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
                options={stageOptions}
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
              <TextBlock
                label="Notes"
                name="notesText"
                defaultValue={renewal.notesText ?? ""}
              />
              <SubmitButton pending={pending}>Save Case</SubmitButton>
            </>
          )}
        </FormShell>

        <FormShell
          title="Submit Recommendation"
          action={submitRecommendationAction}
        >
          {(_state, pending) => (
            <>
              <input type="hidden" name="id" value={renewal.id} />
              <SelectBox
                label="Recommended disposition"
                name="recommendedDisposition"
                options={dispositionOptionsList}
                defaultValue={renewal.recommendedDisposition}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                Review Required means a formal review must still occur. Decision
                Pending means review is underway and the decision outcome is not
                finalized.
              </p>
              <Field
                label="Submitted by"
                name="recommendationSubmittedBy"
                defaultValue={renewal.recommendationSubmittedBy ?? ""}
              />
              <TextBlock
                label="Recommendation rationale"
                name="recommendationRationale"
                defaultValue={renewal.recommendationRationale ?? ""}
              />
              <Field
                label="Decision due"
                name="decisionDueDate"
                type="date"
                defaultValue={dateOnly(renewal.decisionDueDate)}
              />
              <ToggleField
                name="replacementRequired"
                label="Replacement required"
                defaultChecked={renewal.replacementRequired}
              />
              <SelectBox
                label="Replacement product"
                name="replacementProductId"
                options={productOptions}
                includeNone
                defaultValue={renewal.replacementProductId ?? "none"}
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
              <TextBlock
                label="Temporary extension reason"
                name="temporaryExtensionReason"
                defaultValue={renewal.temporaryExtensionReason ?? ""}
              />
              <Field
                label="Next review date"
                name="nextReviewDate"
                type="date"
                defaultValue={dateOnly(renewal.nextReviewDate)}
              />
              <SubmitButton pending={pending}>
                Submit Recommendation
              </SubmitButton>
            </>
          )}
        </FormShell>

        <FormShell
          title="Approve, Reject, Or Defer"
          action={decideDispositionAction}
        >
          {(_state, pending) => (
            <>
              <input type="hidden" name="id" value={renewal.id} />
              <SelectBox
                label="Approved disposition"
                name="approvedDisposition"
                options={dispositionOptionsList}
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
              <TextBlock
                label="Approval rationale"
                name="approvalRationale"
                defaultValue={renewal.approvalRationale ?? ""}
              />
              <TextBlock
                label="Conditions of approval"
                name="conditionsOfApproval"
                defaultValue={renewal.conditionsOfApproval ?? ""}
              />
              <SubmitButton pending={pending}>Record Decision</SubmitButton>
            </>
          )}
        </FormShell>
      </section>

      <section className="grid gap-3 xl:grid-cols-4">
        <OperationalLists renewal={renewal} />
        <ActionForms
          data={data}
          renewal={renewal}
          renewalOptions={renewalOptions}
          fiscalOptions={fiscalOptions}
          budgetPlanOptions={budgetPlanOptions}
          productOptions={productOptions}
        />
      </section>
    </section>
  );
}

function OperationalLists({ renewal }: { renewal: any }) {
  return (
    <Card className="rounded-lg border-border/80 bg-card/95 shadow-none xl:col-span-2">
      <CardHeader>
        <CardTitle>Operational Record</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <MiniTable
          title="Quotes"
          rows={renewal.quotes}
          columns={["Quote", "Status", "Amount", "Expires"]}
          render={(quote) => [
            quote.quoteNumber ?? quote.versionLabel ?? quote.id.slice(0, 8),
            titleCaseEnum(quote.status),
            money(quote.amount),
            dateOnly(quote.expiresOn),
          ]}
        />
        <MiniTable
          title="Workflow"
          rows={renewal.workflowStages}
          columns={["Stage", "Status", "Owner", "Due"]}
          render={(stage) => [
            titleCaseEnum(stage.stage),
            titleCaseEnum(stage.status),
            stage.owner ?? "Unassigned",
            dateOnly(stage.dueOn),
          ]}
        />
        <MiniTable
          title="Tasks"
          rows={renewal.tasks}
          columns={["Task", "Status", "Owner", "Due"]}
          render={(task) => [
            task.title,
            titleCaseEnum(task.status),
            task.owner ?? "Unassigned",
            dateOnly(task.dueOn),
          ]}
        />
        <MiniTable
          title="Decision History"
          rows={renewal.decisionHistory}
          columns={["Decision", "Recommended", "Approved", "Changed"]}
          render={(item) => [
            titleCaseEnum(item.decisionStatus),
            item.recommendedDisposition
              ? titleCaseEnum(item.recommendedDisposition)
              : "None",
            item.approvedDisposition
              ? titleCaseEnum(item.approvedDisposition)
              : "None",
            dateOnly(item.changedAt),
          ]}
        />
      </CardContent>
    </Card>
  );
}

function ActionForms({
  data,
  renewal,
  renewalOptions,
  fiscalOptions,
  budgetPlanOptions,
  productOptions,
}: {
  data: RenewalData;
  renewal: any;
  renewalOptions: Option[];
  fiscalOptions: Option[];
  budgetPlanOptions: Option[];
  productOptions: Option[];
}) {
  return (
    <div className="grid gap-3 xl:col-span-2">
      <section className="grid gap-3 md:grid-cols-2">
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
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <FormShell title="Replacement Plan" action={saveReplacementPlanAction}>
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
                defaultValue={renewal.replacementPlan?.replacementOwner ?? ""}
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
                defaultValue={Number(renewal.replacementPlan?.overlapCost ?? 0)}
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
                  renewal.replacementPlan?.integrationMigrationRequired ?? false
                }
              />
              <TextBlock
                label="Notes"
                name="notesText"
                defaultValue={renewal.replacementPlan?.notesText ?? ""}
              />
              <SubmitButton pending={pending}>Save Replacement</SubmitButton>
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
                defaultValue={renewal.decommissioningPlan?.technicalOwner ?? ""}
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
              {renewal.decommissioningPlan?.tasks?.length ? (
                <div className="grid gap-2 text-xs text-muted-foreground">
                  <p className="font-medium text-slate-300">
                    Checklist: {decommissionProgress(renewal)}% complete
                  </p>
                  {renewal.decommissioningPlan.tasks.map((task: any) => (
                    <div key={task.id} className="flex justify-between gap-2">
                      <span>{task.title}</span>
                      <span>{titleCaseEnum(task.status)}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </FormShell>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
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
              {renewal.notes?.length ? (
                <div className="grid gap-2 text-xs text-muted-foreground">
                  {renewal.notes.slice(0, 5).map((note: any) => (
                    <p key={note.id}>{note.body}</p>
                  ))}
                </div>
              ) : null}
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
              <Field label="Next renewal date" name="renewalDate" type="date" />
              <Field
                label="Next expiration"
                name="renewalExpirationDate"
                type="date"
              />
              <SubmitButton pending={pending}>Create Cycle</SubmitButton>
            </>
          )}
        </FormShell>
      </section>
    </div>
  );
}

function DispositionReference({ data }: { data: RenewalData }) {
  return (
    <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
      <CardHeader>
        <CardTitle>
          Maintenance Renewal Settings: Disposition Reference
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {data.optionSets.dispositionDefinitions.map((definition: any) => (
          <div
            key={definition.value}
            className="rounded-lg border border-border/70 bg-secondary/30 p-3"
            title={definition.guidance}
          >
            <p className="text-sm font-semibold text-slate-100">
              {definition.label}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {definition.shortDescription}
            </p>
            <p className="mt-2 text-xs text-cyan-100">{definition.guidance}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MiniTable({
  title,
  rows,
  columns,
  render,
}: {
  title: string;
  rows: any[];
  columns: string[];
  render: (row: any) => string[];
}) {
  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      {rows?.length ? (
        <div className="overflow-x-auto rounded-lg border border-border/80">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  {render(row).map((value, index) => (
                    <TableCell key={`${row.id}-${columns[index]}`}>
                      {value || "None"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState>No {title.toLowerCase()} yet.</EmptyState>
      )}
    </div>
  );
}

function SummaryChip({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-secondary/30 p-3">
      <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2">
        <StatusBadge value={value} />
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-secondary/30 p-3">
      <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-100">{value || "None"}</p>
    </div>
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

function decommissionProgress(renewal: any) {
  const tasks = renewal.decommissioningPlan?.tasks ?? [];
  if (!tasks.length) return 0;
  const complete = tasks.filter(
    (task: any) =>
      task.status === "COMPLETED" || task.status === "NOT_APPLICABLE"
  ).length;
  return Math.round((complete / tasks.length) * 100);
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
