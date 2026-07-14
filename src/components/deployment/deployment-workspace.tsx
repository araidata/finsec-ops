"use client";

import { Activity, Pencil, Plus, Search } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

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

type Money = string | number | null;

type Company = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  vendorCompany?: Company | null;
};

type ProductModule = {
  id: string;
  name: string;
};

type Contract = {
  id: string;
  title: string;
  vendorCompany?: Company | null;
  sellerCompany?: Company | null;
};

type ContractLineItem = {
  id: string;
  contractId: string;
  description: string;
  quantity: Money;
  licenseMetric?: string | null;
  annualAmount: Money;
  product?: Product | null;
  productModule?: ProductModule | null;
  contract: Contract;
};

type UsageMeasurement = {
  id: string;
  measuredAt: string;
  licensedCount?: number | null;
  deployedCount?: number | null;
  activeUsageCount?: number | null;
  utilizationPercent?: Money;
  source?: string | null;
  notesText?: string | null;
};

type PurchaseItem = {
  id: string;
  quantity?: Money;
  product?: Product | null;
  productModule?: ProductModule | null;
  purchase?: {
    title: string;
    contract?: { title: string } | null;
    sellerCompany?: Company | null;
  } | null;
};

type DeploymentRecord = {
  id: string;
  departmentId?: string | null;
  ownerTeamMemberId?: string | null;
  contractLineItemId?: string | null;
  purchaseItemId?: string | null;
  scopeName: string;
  environment?: string | null;
  department?: string | null;
  owner?: string | null;
  status: string;
  deploymentPercent: Money;
  utilizationPercent?: Money;
  licensedQuantity?: number | null;
  activeUsageQuantity?: number | null;
  targetPopulation?: number | null;
  deployedPopulation?: number | null;
  adoptionLevel?: string | null;
  targetDate?: string | null;
  completedDate?: string | null;
  blockers?: string | null;
  valueNarrative?: string | null;
  contractLineItem?: ContractLineItem | null;
  purchaseItem?: PurchaseItem | null;
  usageMeasurements?: UsageMeasurement[];
};

type DeploymentPageData = {
  deployments: DeploymentRecord[];
  contracts: Contract[];
  lineItems: ContractLineItem[];
  departments: Array<{ id: string; name: string; active: boolean }>;
  teamMembers: Array<{
    id: string;
    fullName: string;
    active: boolean;
    departmentId?: string | null;
  }>;
  deploymentEnvironments: Array<{ id: string; name: string; active: boolean }>;
  optionSets: {
    deploymentStatuses: readonly string[];
    adoptionLevels: readonly string[];
  };
};

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

function deploymentLine(deployment: DeploymentRecord) {
  return deployment.contractLineItem ?? null;
}

function deploymentProduct(deployment: DeploymentRecord) {
  return (
    deployment.contractLineItem?.product ??
    deployment.purchaseItem?.product ??
    null
  );
}

function deploymentModule(deployment: DeploymentRecord) {
  return (
    deployment.contractLineItem?.productModule ??
    deployment.purchaseItem?.productModule ??
    null
  );
}

function deploymentVendor(deployment: DeploymentRecord) {
  return (
    deployment.contractLineItem?.contract.vendorCompany ??
    deployment.purchaseItem?.product?.vendorCompany ??
    null
  );
}

function latestUsage(deployment: DeploymentRecord) {
  return deployment.usageMeasurements?.[0];
}

function lineLabel(line: ContractLineItem) {
  const product = line.product?.name ?? line.description;
  const component = line.productModule?.name
    ? ` / ${line.productModule.name}`
    : "";
  return `${line.contract.title} - ${product}${component}`;
}

function uniq(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(Boolean) as string[])].sort((a, b) =>
    a.localeCompare(b)
  );
}

export function DeploymentWorkspace({ data }: { data: DeploymentPageData }) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [owner, setOwner] = useState("all");
  const [vendor, setVendor] = useState("all");
  const [product, setProduct] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState(
    data.deployments[0]?.id ?? "new"
  );

  const selected = data.deployments.find((item) => item.id === selectedId);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.deployments.filter((deployment) => {
      const productName = deploymentProduct(deployment)?.name ?? "";
      const moduleName = deploymentModule(deployment)?.name ?? "";
      const vendorName = deploymentVendor(deployment)?.name ?? "";
      const haystack = [
        deployment.scopeName,
        productName,
        moduleName,
        vendorName,
        deployment.department,
        deployment.owner,
        deployment.status,
        deployment.blockers,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!query || haystack.includes(query)) &&
        (department === "all" || deployment.department === department) &&
        (owner === "all" || deployment.owner === owner) &&
        (vendor === "all" || vendorName === vendor) &&
        (product === "all" || productName === product) &&
        (status === "all" || deployment.status === status)
      );
    });
  }, [data.deployments, department, owner, product, search, status, vendor]);

  const fullyDeployed = data.deployments.filter(
    (deployment) =>
      deployment.status === "DEPLOYED" ||
      deployment.status === "ACTIVE" ||
      numberValue(deployment.deploymentPercent) >= 100
  ).length;
  const partial = data.deployments.filter(
    (deployment) =>
      deployment.status === "PARTIALLY_DEPLOYED" ||
      (numberValue(deployment.deploymentPercent) > 0 &&
        numberValue(deployment.deploymentPercent) < 100)
  ).length;
  const notStartedOrBlocked = data.deployments.filter(
    (deployment) =>
      ["NOT_STARTED", "PLANNING", "PLANNED", "ON_HOLD"].includes(
        deployment.status
      ) || Boolean(deployment.blockers)
  ).length;
  const averageUtilization = data.deployments.length
    ? data.deployments.reduce(
        (sum, deployment) => sum + numberValue(deployment.utilizationPercent),
        0
      ) / data.deployments.length
    : 0;

  return (
    <WorkspaceShell
      title="Deployment"
      description="Product ownership, implementation progress, adoption, and usage tied to Contract line items."
      actionLabel="New Deployment"
    >
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <Summary
            label="Tracked Products"
            value={String(data.deployments.length)}
          />
          <Summary label="Fully Deployed" value={String(fullyDeployed)} />
          <Summary label="Partially Deployed" value={String(partial)} />
          <Summary
            label="Not Started / Blocked"
            value={String(notStartedOrBlocked)}
          />
          <Summary
            label="Average Utilization"
            value={`${averageUtilization.toFixed(0)}%`}
          />
        </div>

        <section className="rounded-lg border border-border/80 bg-card/95">
          <div className="flex flex-wrap items-end gap-2 border-b border-border/80 p-3">
            <label className="relative min-w-64 flex-1">
              <span className="sr-only">Search deployments</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search deployments"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9 border-border/80 bg-secondary/45 pl-8 text-sm"
                placeholder="Search deployments, products, owners..."
              />
            </label>
            <Filter
              label="Department"
              value={department}
              values={uniq(data.deployments.map((item) => item.department))}
              onChange={setDepartment}
            />
            <Filter
              label="Owner"
              value={owner}
              values={uniq(data.deployments.map((item) => item.owner))}
              onChange={setOwner}
            />
            <Filter
              label="Vendor"
              value={vendor}
              values={uniq(
                data.deployments.map((item) => deploymentVendor(item)?.name)
              )}
              onChange={setVendor}
            />
            <Filter
              label="Product"
              value={product}
              values={uniq(
                data.deployments.map((item) => deploymentProduct(item)?.name)
              )}
              onChange={setProduct}
            />
            <Filter
              label="Status"
              value={status}
              values={[...data.optionSets.deploymentStatuses]}
              onChange={setStatus}
              formatter={titleCase}
            />
          </div>
          <DeploymentRegister
            deployments={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </section>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_420px]">
          <DeploymentForm
            key={selected?.id ?? "new"}
            deployment={selected}
            lineItems={data.lineItems}
            statuses={data.optionSets.deploymentStatuses}
            adoptionLevels={data.optionSets.adoptionLevels}
            departments={data.departments}
            teamMembers={data.teamMembers}
            environments={data.deploymentEnvironments}
            onNew={() => setSelectedId("new")}
          />
          <UsagePanel deployment={selected} />
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
  values,
  onChange,
  formatter = (item) => item,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
  formatter?: (value: string) => string;
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
        {values.map((item) => (
          <option key={item} value={item}>
            {formatter(item)}
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
                {deployment.activeUsageQuantity ??
                  latestUsage(deployment)?.activeUsageCount ??
                  0}
              </TableCell>
              <TableCell className="text-right font-mono">
                {percent(deployment.deploymentPercent)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {percent(
                  deployment.utilizationPercent ??
                    latestUsage(deployment)?.utilizationPercent
                )}
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
  lineItems,
  statuses,
  adoptionLevels,
  departments,
  teamMembers,
  environments,
  onNew,
}: {
  deployment?: DeploymentRecord;
  lineItems: ContractLineItem[];
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
  const line = deployment ? deploymentLine(deployment) : undefined;
  const selectedLine = line ?? lineItems[0];
  const fallbackLicensed = Math.floor(numberValue(selectedLine?.quantity));

  return (
    <section className="rounded-lg border border-border/80 bg-card/95">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 p-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            {deployment ? "Edit Deployment" : "New Deployment"}
          </h2>
          <p className="text-xs text-muted-foreground">
            Deployment inherits vendor, product, component, metric, and licensed
            quantity from the Contract line.
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
          <SelectField
            label="Contract line item"
            name="contractLineItemId"
            defaultValue={
              deployment?.contractLineItemId ?? selectedLine?.id ?? ""
            }
            options={lineItems.map((item) => ({
              value: item.id,
              label: lineLabel(item),
            }))}
          />
          <Field
            label="Scope"
            name="scopeName"
            defaultValue={
              deployment?.scopeName ?? selectedLine?.contract.title ?? ""
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
            defaultValue={deployment?.departmentId ?? "none"}
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
            defaultValue={String(
              deployment?.activeUsageQuantity ??
                latestUsage(deployment ?? ({} as DeploymentRecord))
                  ?.activeUsageCount ??
                0
            )}
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
            defaultValue={String(
              numberValue(
                deployment?.utilizationPercent ??
                  latestUsage(deployment ?? ({} as DeploymentRecord))
                    ?.utilizationPercent
              )
            )}
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

function UsagePanel({ deployment }: { deployment?: DeploymentRecord }) {
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
            {[...(deployment.usageMeasurements ?? [])]
              .sort((a, b) =>
                dateOnly(a.measuredAt).localeCompare(dateOnly(b.measuredAt))
              )
              .map((measurement) => (
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
                    <p className="mt-1 text-slate-200">
                      {measurement.notesText}
                    </p>
                  ) : null}
                </div>
              ))}
            {deployment.usageMeasurements?.length ? null : (
              <p className="text-sm text-muted-foreground">
                No usage measurements have been recorded yet.
              </p>
            )}
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
  defaultValue: string;
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
  defaultValue: string;
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
  options,
  includeNone = false,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
  includeNone?: boolean;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-xs font-medium text-slate-300">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
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
