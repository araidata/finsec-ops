"use client";

import { Activity, Pencil, Plus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useState, useTransition } from "react";

import {
  addUsageMeasurementAction,
  saveDeploymentAction,
} from "@/app/deployment/actions";
import { WorkspaceShell } from "@/components/app/workspace-shell";
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
import { emptyActionResult } from "@/lib/server/action-result";
import type {
  DeploymentDetailDto,
  DeploymentListRowDto,
  DeploymentPageDataDto,
  DeploymentUsageDto,
} from "@/types/deployment";

type Money = string | number | null;

type ContractLineItem = NonNullable<DeploymentDetailDto["contractLineItem"]>;
type RenewalLineItem = NonNullable<
  DeploymentDetailDto["maintenanceRenewalLineItem"]
>;
type DeploymentRecord = DeploymentListRowDto &
  Partial<Pick<DeploymentDetailDto, "adoptionLevel" | "valueNarrative">>;
type DeploymentPageData = DeploymentPageDataDto;

function titleCase(value?: string | null) {
  if (!value) return "None";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function dateOnly(value?: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function numberValue(value: Money | undefined) {
  return Number(value ?? 0);
}

function percent(value: Money | undefined) {
  return `${numberValue(value).toFixed(0)}%`;
}

function deploymentProduct(deployment: DeploymentRecord) {
  return (
    deployment.maintenanceRenewalLineItem?.product ??
    deployment.contractLineItem?.product ??
    deployment.purchaseItem?.product ??
    null
  );
}

function deploymentModule(deployment: DeploymentRecord) {
  return (
    deployment.maintenanceRenewalLineItem?.productModule ??
    deployment.contractLineItem?.productModule ??
    deployment.purchaseItem?.productModule ??
    null
  );
}

function deploymentVendor(deployment: DeploymentRecord) {
  return (
    deployment.maintenanceRenewal?.vendorCompany ??
    deployment.maintenanceRenewalLineItem?.maintenanceRenewal.vendorCompany ??
    deployment.contractLineItem?.contract.vendorCompany ??
    deployment.purchaseItem?.product?.vendorCompany ??
    null
  );
}

function lineLabel(line: ContractLineItem) {
  const product = line.product?.name ?? line.description;
  const component = line.productModule?.name
    ? ` / ${line.productModule.name}`
    : "";
  return `${line.contract.title} - ${product}${component}`;
}

function renewalLineLabel(line: RenewalLineItem) {
  const product = line.product?.name ?? line.description;
  const component = line.productModule?.name ? ` / ${line.productModule.name}` : "";
  const vendor = line.maintenanceRenewal.vendorCompany?.name ?? "Vendor";
  return `${vendor} · ${product}${component} · ${new Date(line.maintenanceRenewal.renewalDate).toLocaleDateString()}`;
}

export function DeploymentWorkspace({ data }: { data: DeploymentPageData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startNavigation] = useTransition();
  const [search, setSearch] = useState(data.filters.search ?? "");
  const [creating, setCreating] = useState(false);
  const selected = creating
    ? undefined
    : (data.selectedDeployment ?? undefined);
  const navigate = (
    changes: Record<string, string | undefined>,
    clearCursor = true
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    }
    if (clearCursor) {
      params.delete("cursor");
      params.delete("usageCursor");
      params.delete("selected");
    }
    startNavigation(() => {
      router.push(`/deployment${params.size ? `?${params.toString()}` : ""}`);
    });
  };

  return (
    <WorkspaceShell
      title="Deployment"
      description="Product ownership, implementation progress, adoption, and usage tied to Contract line items."
    >
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <Summary
            label="Tracked Products"
            value={String(data.metrics.tracked)}
          />
          <Summary
            label="Fully Deployed"
            value={String(data.metrics.fullyDeployed)}
          />
          <Summary
            label="Partially Deployed"
            value={String(data.metrics.partiallyDeployed)}
          />
          <Summary
            label="Not Started / Blocked"
            value={String(data.metrics.notStartedOrBlocked)}
          />
          <Summary
            label="Average Utilization"
            value={`${Number(data.metrics.averageUtilization).toFixed(0)}%`}
          />
        </div>

        <section className="rounded-lg border border-border/80 bg-card/95">
          <div className="flex flex-wrap items-end gap-2 border-b border-border/80 p-3">
            <form
              className="relative min-w-64 flex-1"
              onSubmit={(event) => {
                event.preventDefault();
                navigate({ q: search });
              }}
            >
              <span className="sr-only">Search deployments</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search deployments"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9 border-border/80 bg-secondary/45 pl-8 text-sm"
                placeholder="Search deployments, products, owners..."
              />
            </form>
            <Filter
              label="Department"
              value={data.filters.departmentId ?? "all"}
              options={data.filterOptions.departments.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              onChange={(value) => navigate({ deploymentDepartment: value })}
            />
            <Filter
              label="Owner"
              value={data.filters.ownerTeamMemberId ?? "all"}
              options={data.filterOptions.owners.map((item) => ({
                value: item.id,
                label: item.fullName,
              }))}
              onChange={(value) => navigate({ owner: value })}
            />
            <Filter
              label="Vendor"
              value={data.filters.vendorCompanyId ?? "all"}
              options={data.filterOptions.vendors.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              onChange={(value) => navigate({ vendor: value })}
            />
            <Filter
              label="Product"
              value={data.filters.productId ?? "all"}
              options={data.filterOptions.products.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              onChange={(value) => navigate({ product: value })}
            />
            <Filter
              label="Status"
              value={data.filters.status ?? "all"}
              options={data.optionSets.deploymentStatuses.map((item) => ({
                value: item,
                label: titleCase(item),
              }))}
              onChange={(value) => navigate({ status: value })}
            />
            <Filter
              label="Sort"
              value={data.filters.sortBy}
              options={[
                { value: "updatedAt", label: "Recently updated" },
                { value: "scopeName", label: "Scope" },
                { value: "owner", label: "Owner" },
                { value: "status", label: "Status" },
                { value: "deploymentPercent", label: "Deployment %" },
                { value: "utilizationPercent", label: "Utilization %" },
              ]}
              onChange={(value) => navigate({ sort: value })}
            />
            <Filter
              label="Direction"
              value={data.filters.sortDirection}
              options={[
                { value: "asc", label: "Ascending" },
                { value: "desc", label: "Descending" },
              ]}
              onChange={(value) => navigate({ direction: value })}
            />
          </div>
          <DeploymentRegister
            deployments={data.deployments}
            selectedId={selected?.id ?? ""}
            onSelect={(id) => {
              setCreating(false);
              navigate({ selected: id, usageCursor: undefined }, false);
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
        </section>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_420px]">
          <DeploymentForm
            key={selected?.id ?? "new"}
            deployment={selected}
            renewalLineItems={data.editorOptions.renewalLineItems}
            statuses={data.optionSets.deploymentStatuses}
            adoptionLevels={data.optionSets.adoptionLevels}
            departments={data.editorOptions.departments}
            teamMembers={data.editorOptions.teamMembers}
            environments={data.editorOptions.deploymentEnvironments}
            onNew={() => setCreating(true)}
          />
          <UsagePanel
            deployment={selected}
            measurements={creating ? [] : data.usageMeasurements}
            nextCursor={creating ? null : data.nextUsageCursor}
            hasCursor={Boolean(searchParams.get("usageCursor"))}
            onFirstPage={() => navigate({ usageCursor: undefined }, false)}
            onNextPage={(cursor) => navigate({ usageCursor: cursor }, false)}
          />
        </div>
      </div>
    </WorkspaceShell>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/80 bg-card/90 p-3">
      <p className="text-[0.64rem] uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}

function Filter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-36 flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border border-border/80 bg-background px-2 text-xs text-slate-100"
      >
        <option value="all">All</option>
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DeploymentRegister({
  deployments,
  selectedId,
  onSelect,
}: {
  deployments: DeploymentRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-auto">
      <Table className="min-w-[1180px] text-xs">
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Component</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead className="text-right">Licensed</TableHead>
            <TableHead className="text-right">Deployed</TableHead>
            <TableHead className="text-right">Active Usage</TableHead>
            <TableHead className="text-right">Deployment %</TableHead>
            <TableHead className="text-right">Utilization %</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Blockers</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {deployments.map((deployment) => (
            <TableRow
              key={deployment.id}
              className={`cursor-pointer border-border/60 ${
                selectedId === deployment.id
                  ? "bg-cyan-400/12"
                  : "hover:bg-secondary/35"
              }`}
              onClick={() => onSelect(deployment.id)}
            >
              <TableCell className="font-medium text-slate-100">
                {deploymentProduct(deployment)?.name ?? "Legacy purchase item"}
              </TableCell>
              <TableCell>
                {deploymentModule(deployment)?.name ?? "None"}
              </TableCell>
              <TableCell>
                {deploymentVendor(deployment)?.name ?? "Unassigned"}
              </TableCell>
              <TableCell>{deployment.department ?? "Unassigned"}</TableCell>
              <TableCell>{deployment.owner ?? "Unassigned"}</TableCell>
              <TableCell className="text-right font-mono">
                {deployment.licensedQuantity ??
                  deployment.targetPopulation ??
                  0}
              </TableCell>
              <TableCell className="text-right font-mono">
                {deployment.deployedPopulation ?? 0}
              </TableCell>
              <TableCell className="text-right font-mono">
                {deployment.activeUsageQuantity ?? 0}
              </TableCell>
              <TableCell className="text-right font-mono">
                {percent(deployment.deploymentPercent)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {percent(deployment.utilizationPercent)}
              </TableCell>
              <TableCell>
                <StatusBadge value={deployment.status} />
              </TableCell>
              <TableCell className="max-w-44 truncate">
                {deployment.blockers ?? "None"}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Edit ${deployment.scopeName}`}
                >
                  <Pencil />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {deployments.length ? null : (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No deployment records match the current filters.
        </div>
      )}
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const warning = ["ON_HOLD", "NOT_STARTED", "PLANNED", "PLANNING"].includes(
    value
  );
  const success = ["DEPLOYED", "ACTIVE"].includes(value);
  return (
    <Badge
      variant="outline"
      className={`rounded px-1.5 py-0 font-mono text-[0.65rem] ${
        success
          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
          : warning
            ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
            : "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
      }`}
    >
      {titleCase(value)}
    </Badge>
  );
}

function DeploymentForm({
  deployment,
  renewalLineItems,
  statuses,
  adoptionLevels,
  departments,
  teamMembers,
  environments,
  onNew,
}: {
  deployment?: DeploymentRecord;
  renewalLineItems: RenewalLineItem[];
  statuses: readonly string[];
  adoptionLevels: readonly string[];
  departments: Array<{ id: string; name: string; active: boolean }>;
  teamMembers: Array<{ id: string; fullName: string; active: boolean }>;
  environments: Array<{ id: string; name: string; active: boolean }>;
  onNew: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    saveDeploymentAction,
    emptyActionResult
  );
  const [departmentId, setDepartmentId] = useState(
    deployment?.departmentId ?? renewalLineItems[0]?.maintenanceRenewal.departmentId ?? departments.find((item) => item.active)?.id ?? ""
  );
  const selectedLine =
    deployment?.maintenanceRenewalLineItem ?? renewalLineItems[0];
  const fallbackLicensed = Math.floor(numberValue(selectedLine?.currentQuantity));

  return (
    <section className="rounded-lg border border-border/80 bg-card/95">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 p-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            {deployment ? "Edit Deployment" : "New Deployment"}
          </h2>
          <p className="text-xs text-muted-foreground">
            Select a department renewal product, then track one or more deployment scopes.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onNew}>
          <Plus data-icon="inline-start" />
          New
        </Button>
      </div>
      <form action={formAction} className="grid gap-3 p-3">
        <input type="hidden" name="id" value={deployment?.id ?? ""} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {deployment?.maintenanceRenewalLineItem ? (
            <>
              <input type="hidden" name="maintenanceRenewalId" value={deployment.maintenanceRenewalId ?? ""} />
              <input type="hidden" name="maintenanceRenewalLineItemId" value={deployment.maintenanceRenewalLineItemId ?? ""} />
              <SelectField label="Vendor" name="vendorDisplay" defaultValue={deployment.maintenanceRenewal?.vendorCompany?.id ?? ""} options={[{ value: deployment.maintenanceRenewal?.vendorCompany?.id ?? "", label: deployment.maintenanceRenewal?.vendorCompany?.name ?? "Unknown vendor" }]} disabled />
              <SelectField label="Renewal product" name="renewalProductDisplay" defaultValue={deployment.maintenanceRenewalLineItem.id} options={[{ value: deployment.maintenanceRenewalLineItem.id, label: renewalLineLabel(deployment.maintenanceRenewalLineItem) }]} disabled />
            </>
          ) : deployment?.contractLineItem ? (
            <>
              <input type="hidden" name="contractLineItemId" value={deployment.contractLineItemId ?? ""} />
              <SelectField label="Legacy source" name="legacySource" defaultValue="legacy" options={[{ value: "legacy", label: lineLabel(deployment.contractLineItem) }]} disabled />
            </>
          ) : (
            <RenewalSelectors renewalLineItems={renewalLineItems} departmentId={departmentId} />
          )}
          <Field
            label="Scope"
            name="scopeName"
            defaultValue={
              deployment?.scopeName ?? selectedLine?.product?.name ?? ""
            }
          />
          <SelectField
            label="Environment"
            name="environment"
            defaultValue={
              deployment?.environment ?? environments[0]?.name ?? ""
            }
            options={environments.map((item) => ({
              value: item.name,
              label: item.name,
            }))}
          />
          <SelectField
            includeNone
            label="Department"
            name="departmentId"
            value={departmentId || "none"}
            onChange={setDepartmentId}
            options={departments.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
          <SelectField
            includeNone
            label="Owner"
            name="ownerTeamMemberId"
            defaultValue={deployment?.ownerTeamMemberId ?? "none"}
            options={teamMembers.map((item) => ({
              value: item.id,
              label: item.fullName,
            }))}
          />
          <SelectField
            label="Status"
            name="status"
            defaultValue={deployment?.status ?? "PLANNING"}
            options={statuses.map((item) => ({
              value: item,
              label: titleCase(item),
            }))}
          />
          <Field
            label="Licensed"
            name="licensedQuantity"
            type="number"
            defaultValue={String(
              deployment?.licensedQuantity ??
                deployment?.targetPopulation ??
                fallbackLicensed
            )}
          />
          <Field
            label="Deployed"
            name="deployedPopulation"
            type="number"
            defaultValue={String(deployment?.deployedPopulation ?? 0)}
          />
          <Field
            label="Active Usage"
            name="activeUsageQuantity"
            type="number"
            defaultValue={String(deployment?.activeUsageQuantity ?? 0)}
          />
          <Field
            label="Deployment %"
            name="deploymentPercent"
            type="number"
            defaultValue={String(numberValue(deployment?.deploymentPercent))}
          />
          <Field
            label="Utilization %"
            name="utilizationPercent"
            type="number"
            defaultValue={String(numberValue(deployment?.utilizationPercent))}
          />
          <SelectField
            label="Adoption"
            name="adoptionLevel"
            defaultValue={deployment?.adoptionLevel ?? "MEDIUM"}
            options={adoptionLevels.map((item) => ({
              value: item,
              label: titleCase(item),
            }))}
          />
          <Field
            label="Target Date"
            name="targetDate"
            type="date"
            defaultValue={dateOnly(deployment?.targetDate)}
          />
          <Field
            label="Completed Date"
            name="completedDate"
            type="date"
            defaultValue={dateOnly(deployment?.completedDate)}
          />
        </div>
        <TextareaField
          label="Blockers"
          name="blockers"
          defaultValue={deployment?.blockers ?? ""}
        />
        <TextareaField
          label="Notes"
          name="notesText"
          defaultValue={deployment?.valueNarrative ?? ""}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Deployment"}
          </Button>
          {state.message ? (
            <p
              className={`text-xs ${state.ok ? "text-emerald-300" : "text-red-300"}`}
            >
              {state.message}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function RenewalSelectors({
  renewalLineItems,
  departmentId,
}: {
  renewalLineItems: RenewalLineItem[];
  departmentId: string;
}) {
  const scoped = renewalLineItems.filter(
    (line) => !departmentId || line.maintenanceRenewal.departmentId === departmentId
  );
  const vendors = Array.from(
    new Map(
      scoped
        .filter((line) => line.maintenanceRenewal.vendorCompany)
        .map((line) => [line.maintenanceRenewal.vendorCompany!.id, line.maintenanceRenewal.vendorCompany!.name])
    ).entries()
  );
  const [vendorId, setVendorId] = useState(vendors[0]?.[0] ?? "");
  const activeVendorId = vendors.some(([id]) => id === vendorId) ? vendorId : vendors[0]?.[0] ?? "";
  const vendorLines = scoped.filter(
    (line) => line.maintenanceRenewal.vendorCompany?.id === activeVendorId
  );
  const renewals = Array.from(
    new Map(vendorLines.map((line) => [line.maintenanceRenewal.id, line.maintenanceRenewal])).values()
  );
  const [renewalId, setRenewalId] = useState(renewals[0]?.id ?? "");
  const activeRenewalId = renewals.some((renewal) => renewal.id === renewalId) ? renewalId : renewals[0]?.id ?? "";
  const products = vendorLines.filter((line) => line.maintenanceRenewal.id === activeRenewalId);
  const [lineId, setLineId] = useState(products[0]?.id ?? "");
  const activeLineId = products.some((line) => line.id === lineId) ? lineId : products[0]?.id ?? "";
  return (
    <>
      <SelectField
        label="Vendor"
        name="vendorDisplay"
        value={activeVendorId}
        onChange={(value) => { setVendorId(value); setRenewalId(""); setLineId(""); }}
        options={vendors.map(([value, label]) => ({ value, label }))}
      />
      <SelectField
        label="Maintenance Renewal"
        name="maintenanceRenewalId"
        value={activeRenewalId}
        onChange={(value) => { setRenewalId(value); setLineId(""); }}
        options={renewals.map((renewal) => ({ value: renewal.id, label: `${renewal.vendorCompany?.name ?? "Vendor"} · ${new Date(renewal.renewalDate).toLocaleDateString()}` }))}
      />
      <SelectField
        label="Renewal product"
        name="maintenanceRenewalLineItemId"
        value={activeLineId}
        onChange={setLineId}
        options={products.map((line) => ({ value: line.id, label: renewalLineLabel(line) }))}
      />
      {!products.length ? (
        <p className="md:col-span-2 xl:col-span-3 rounded-md border border-dashed border-amber-400/30 bg-amber-400/[0.05] p-3 text-xs text-amber-100">
          No renewal products are available for this department and vendor. Add a product under Maintenance Renewals first.
        </p>
      ) : null}
    </>
  );
}

function UsagePanel({
  deployment,
  measurements,
  nextCursor,
  hasCursor,
  onFirstPage,
  onNextPage,
}: {
  deployment?: DeploymentRecord;
  measurements: DeploymentUsageDto[];
  nextCursor: string | null;
  hasCursor: boolean;
  onFirstPage: () => void;
  onNextPage: (cursor: string) => void;
}) {
  const [state, formAction, pending] = useActionState(
    addUsageMeasurementAction,
    emptyActionResult
  );
  return (
    <section className="rounded-lg border border-border/80 bg-card/95">
      <div className="border-b border-border/80 p-3">
        <h2 className="text-sm font-semibold text-slate-100">Usage History</h2>
        <p className="text-xs text-muted-foreground">
          Latest valid measurement updates the register figures.
        </p>
      </div>
      {deployment ? (
        <div className="grid gap-3 p-3">
          <form action={formAction} className="grid gap-2">
            <input type="hidden" name="deploymentId" value={deployment.id} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Field
                label="Measurement Date"
                name="measuredAt"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
              <Field
                label="Licensed"
                name="licensedCount"
                type="number"
                defaultValue={String(
                  deployment.licensedQuantity ??
                    deployment.targetPopulation ??
                    0
                )}
              />
              <Field
                label="Deployed"
                name="deployedCount"
                type="number"
                defaultValue={String(deployment.deployedPopulation ?? 0)}
              />
              <Field
                label="Active Usage"
                name="activeUsageCount"
                type="number"
                defaultValue={String(deployment.activeUsageQuantity ?? 0)}
              />
              <Field
                label="Utilization %"
                name="utilizationPercent"
                type="number"
                defaultValue={String(
                  numberValue(deployment.utilizationPercent)
                )}
              />
              <Field label="Source" name="source" defaultValue="" />
            </div>
            <TextareaField label="Notes" name="notesText" defaultValue="" />
            <Button type="submit" disabled={pending} size="sm">
              <Activity data-icon="inline-start" />
              {pending ? "Adding..." : "Add Usage"}
            </Button>
            {state.message ? (
              <p
                className={`text-xs ${state.ok ? "text-emerald-300" : "text-red-300"}`}
              >
                {state.message}
              </p>
            ) : null}
          </form>

          <div className="grid gap-2">
            {measurements.map((measurement) => (
              <div
                key={measurement.id}
                className="rounded-lg border border-border/70 bg-secondary/25 p-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-slate-100">
                    {dateOnly(measurement.measuredAt)}
                  </span>
                  <span>{percent(measurement.utilizationPercent)}</span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  Licensed {measurement.licensedCount ?? 0} / Deployed{" "}
                  {measurement.deployedCount ?? 0} / Active{" "}
                  {measurement.activeUsageCount ?? 0}
                </p>
                {measurement.source ? (
                  <p className="mt-1 text-muted-foreground">
                    Source: {measurement.source}
                  </p>
                ) : null}
                {measurement.notesText ? (
                  <p className="mt-1 text-slate-200">{measurement.notesText}</p>
                ) : null}
              </div>
            ))}
            {measurements.length ? null : (
              <p className="text-sm text-muted-foreground">
                No usage measurements have been recorded yet.
              </p>
            )}
            {hasCursor || nextCursor ? (
              <div className="flex justify-end gap-2">
                {hasCursor ? (
                  <Button variant="outline" size="sm" onClick={onFirstPage}>
                    First page
                  </Button>
                ) : null}
                {nextCursor ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNextPage(nextCursor)}
                  >
                    Next 50
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="p-3 text-sm text-muted-foreground">
          Select a deployment before adding usage measurements.
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-300">
      {label}
      <Input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="h-9 border-border/80 bg-background text-xs"
      />
    </label>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-300">
      {label}
      <Textarea
        name={name}
        defaultValue={defaultValue}
        className="min-h-20 border-border/80 bg-background text-xs"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  value,
  onChange,
  options,
  includeNone = false,
  disabled = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  includeNone?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-300">
      {label}
      <select
        name={name}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value === "none" ? "" : event.target.value) : undefined}
        disabled={disabled}
        className="h-9 rounded-md border border-border/80 bg-background px-2 text-xs text-slate-100"
      >
        {includeNone ? <option value="none">None</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
