"use client";

import { Pencil, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useActionState, useState } from "react";

import {
  saveBudgetAccountAction,
  saveBudgetCategoryAction,
  saveDepartmentAction,
  saveDeploymentEnvironmentAction,
  saveExpenseTypeOptionAction,
  saveFiscalYearAction,
  saveLicenseMetricOptionAction,
  saveOrganizationAction,
  savePaymentFrequencyOptionAction,
  savePurchasingVehicleAction,
  saveRenewalDecisionReasonAction,
  saveRenewalPriorityOptionAction,
  saveTeamMemberAction,
  setReferenceActiveAction,
} from "@/app/settings/actions";
import { WorkspaceShell } from "@/components/app/workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  emptyActionResult,
  type ActionResult,
} from "@/lib/server/action-result";

type RecordBase = { id: string; active?: boolean };
type FiscalYear = RecordBase & {
  label: string;
  startsOn: string;
  endsOn: string;
  status: string;
  isCurrent: boolean;
  planningEnabled: boolean;
};
type Department = RecordBase & { name: string };
type TeamMember = RecordBase & {
  fullName: string;
  jobTitle?: string | null;
  email: string;
  departmentId?: string | null;
  department?: Department | null;
};
type BudgetAccount = RecordBase & {
  code: string;
  name: string;
  defaultWorksheet: string;
  sortOrder: number;
};
type BudgetCategory = RecordBase & {
  name: string;
  description?: string | null;
  displayOrder: number;
  fiscalYearId: string;
  fiscalYear?: FiscalYear;
};
type KeyOption = RecordBase & {
  key: string;
  name: string;
  displayOrder: number;
};
type PurchasingVehicle = RecordBase & {
  name: string;
  description?: string | null;
};
type DeploymentEnvironment = RecordBase & {
  name: string;
  displayOrder: number;
};
type DecisionReason = RecordBase & {
  name: string;
  description?: string | null;
  applicableDisposition?: string | null;
};

type SettingsData = {
  organization?: {
    id: string;
    name: string;
    shortName?: string | null;
    defaultCurrency: string;
    currentFiscalYearId?: string | null;
    fiscalYearStartMonth: number;
    defaultTimezone: string;
  } | null;
  fiscalYears: FiscalYear[];
  departments: Department[];
  teamMembers: TeamMember[];
  budgetAccounts: BudgetAccount[];
  budgetCategories: BudgetCategory[];
  expenseTypeOptions: KeyOption[];
  purchasingVehicles: PurchasingVehicle[];
  paymentFrequencyOptions: KeyOption[];
  licenseMetricOptions: KeyOption[];
  deploymentEnvironments: DeploymentEnvironment[];
  renewalPriorityOptions: KeyOption[];
  renewalDecisionReasons: DecisionReason[];
  optionSets: {
    fiscalYearStatuses: readonly string[];
    budgetWorksheets: readonly string[];
    expenseTypes: readonly string[];
    paymentFrequencies: readonly string[];
    licenseMetrics: readonly string[];
    renewalPriorities: readonly string[];
    renewalDispositions: readonly string[];
  };
};

type Section =
  | "Organization"
  | "Fiscal Years"
  | "Departments"
  | "Team Members"
  | "Finance"
  | "Contract Options"
  | "Deployment Options"
  | "Renewal Options";

const sections: Section[] = [
  "Organization",
  "Fiscal Years",
  "Departments",
  "Team Members",
  "Finance",
  "Contract Options",
  "Deployment Options",
  "Renewal Options",
];

function titleCase(value: string) {
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

export function SettingsWorkspace({ data }: { data: SettingsData }) {
  const [section, setSection] = useState<Section>("Organization");
  return (
    <WorkspaceShell
      title="Settings"
      description="Shared organization, financial, contract, deployment, and renewal reference data."
      actionLabel="Add Setting"
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-2">
          {sections.map((item) => (
            <Button
              key={item}
              type="button"
              variant={section === item ? "default" : "outline"}
              size="sm"
              onClick={() => setSection(item)}
            >
              {item}
            </Button>
          ))}
        </div>
        {section === "Organization" ? (
          <OrganizationSection data={data} />
        ) : null}
        {section === "Fiscal Years" ? <FiscalYearsSection data={data} /> : null}
        {section === "Departments" ? <DepartmentsSection data={data} /> : null}
        {section === "Team Members" ? <TeamMembersSection data={data} /> : null}
        {section === "Finance" ? <FinanceSection data={data} /> : null}
        {section === "Contract Options" ? (
          <ContractOptionsSection data={data} />
        ) : null}
        {section === "Deployment Options" ? (
          <DeploymentOptionsSection data={data} />
        ) : null}
        {section === "Renewal Options" ? (
          <RenewalOptionsSection data={data} />
        ) : null}
      </div>
    </WorkspaceShell>
  );
}

function OrganizationSection({ data }: { data: SettingsData }) {
  const org = data.organization;
  const [state, formAction, pending] = useActionState(
    saveOrganizationAction,
    emptyActionResult
  );
  return (
    <Panel
      title="Organization"
      description="Single-organization application defaults."
    >
      <form action={formAction} className="grid gap-3 md:grid-cols-3">
        <input type="hidden" name="id" value={org?.id ?? ""} />
        <Field
          label="Organization name"
          name="name"
          defaultValue={
            org?.name ?? "Sample Cybersecurity Finance Organization"
          }
        />
        <Field
          label="Short name"
          name="shortName"
          defaultValue={org?.shortName ?? "finsec-ops"}
        />
        <Field
          label="Default currency"
          name="defaultCurrency"
          defaultValue={org?.defaultCurrency ?? "USD"}
        />
        <SelectField
          label="Current fiscal year"
          name="currentFiscalYearId"
          defaultValue={
            org?.currentFiscalYearId ??
            data.fiscalYears.find((fy) => fy.isCurrent)?.id ??
            ""
          }
          options={data.fiscalYears.map((fy) => ({
            value: fy.id,
            label: fy.label,
          }))}
        />
        <Field
          label="Fiscal year start month"
          name="fiscalYearStartMonth"
          type="number"
          defaultValue={String(org?.fiscalYearStartMonth ?? 7)}
        />
        <Field
          label="Default timezone"
          name="defaultTimezone"
          defaultValue={org?.defaultTimezone ?? "America/Chicago"}
        />
        <Submit pending={pending} state={state} label="Save Organization" />
      </form>
    </Panel>
  );
}

function FiscalYearsSection({ data }: { data: SettingsData }) {
  const [editing, setEditing] = useState<FiscalYear | null>(
    data.fiscalYears[0] ?? null
  );
  const [state, formAction, pending] = useActionState(
    saveFiscalYearAction,
    emptyActionResult
  );
  return (
    <Panel
      title="Fiscal Years"
      description="Planning calendars with one current fiscal year."
    >
      <RecordTable
        rows={data.fiscalYears}
        columns={[
          ["Label", (row) => row.label],
          ["Start", (row) => dateOnly(row.startsOn)],
          ["End", (row) => dateOnly(row.endsOn)],
          ["Status", (row) => titleCase(row.status)],
          ["Current", (row) => (row.isCurrent ? "Yes" : "No")],
        ]}
        onEdit={setEditing}
        model="fiscalYear"
      />
      <Editor title={editing ? "Edit Fiscal Year" : "Add Fiscal Year"}>
        <form action={formAction} className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <Field
            label="Label"
            name="label"
            defaultValue={editing?.label ?? ""}
          />
          <Field
            label="Start date"
            name="startsOn"
            type="date"
            defaultValue={dateOnly(editing?.startsOn)}
          />
          <Field
            label="End date"
            name="endsOn"
            type="date"
            defaultValue={dateOnly(editing?.endsOn)}
          />
          <SelectField
            label="Status"
            name="status"
            defaultValue={editing?.status ?? "PLANNING"}
            options={data.optionSets.fiscalYearStatuses.map(option)}
          />
          <Check
            label="Current fiscal year"
            name="isCurrent"
            defaultChecked={editing?.isCurrent ?? false}
          />
          <Check
            label="Planning enabled"
            name="planningEnabled"
            defaultChecked={editing?.planningEnabled ?? true}
          />
          <Check
            label="Active"
            name="active"
            defaultChecked={editing?.active ?? true}
          />
          <Submit pending={pending} state={state} label="Save Fiscal Year" />
        </form>
      </Editor>
    </Panel>
  );
}

function DepartmentsSection({ data }: { data: SettingsData }) {
  const [editing, setEditing] = useState<Department | null>(null);
  const [query, setQuery] = useState("");
  const [state, formAction, pending] = useActionState(
    saveDepartmentAction,
    emptyActionResult
  );
  const rows = filterRows(data.departments, query, (row) => row.name);
  return (
    <Panel
      title="Departments"
      description="Department is the organizational department that owns the item."
    >
      <SearchBox value={query} onChange={setQuery} label="Search departments" />
      <RecordTable
        rows={rows}
        columns={[["Department", (row) => row.name]]}
        onEdit={setEditing}
        model="department"
      />
      <Editor title={editing ? "Edit Department" : "Add Department"}>
        <form action={formAction} className="grid gap-3 md:grid-cols-3">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <Field
            label="Department name"
            name="name"
            defaultValue={editing?.name ?? ""}
          />
          <Check
            label="Active"
            name="active"
            defaultChecked={editing?.active ?? true}
          />
          <Submit pending={pending} state={state} label="Save Department" />
        </form>
      </Editor>
    </Panel>
  );
}

function TeamMembersSection({ data }: { data: SettingsData }) {
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [state, formAction, pending] = useActionState(
    saveTeamMemberAction,
    emptyActionResult
  );
  const rows = filterRows(
    data.teamMembers,
    query,
    (row) => `${row.fullName} ${row.email} ${row.department?.name ?? ""}`
  ).filter((row) => department === "all" || row.departmentId === department);
  return (
    <Panel
      title="Team Members"
      description="Owner is the Team Member assigned responsibility for the item."
    >
      <div className="flex flex-wrap gap-2">
        <SearchBox
          value={query}
          onChange={setQuery}
          label="Search team members"
        />
        <select
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          className="h-9 rounded-md border border-border/80 bg-background px-2 text-xs text-slate-100"
        >
          <option value="all">All Departments</option>
          {data.departments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <RecordTable
        rows={rows}
        columns={[
          ["Name", (row) => row.fullName],
          ["Title", (row) => row.jobTitle ?? ""],
          ["Department", (row) => row.department?.name ?? "Unassigned"],
          ["Email", (row) => row.email],
        ]}
        onEdit={setEditing}
        model="teamMember"
      />
      <Editor title={editing ? "Edit Team Member" : "Add Team Member"}>
        <form action={formAction} className="grid gap-3 md:grid-cols-5">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <Field
            label="Full name"
            name="fullName"
            defaultValue={editing?.fullName ?? ""}
          />
          <Field
            label="Job title"
            name="jobTitle"
            defaultValue={editing?.jobTitle ?? ""}
          />
          <SelectField
            includeNone
            label="Department"
            name="departmentId"
            defaultValue={editing?.departmentId ?? "none"}
            options={data.departments.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
          <Field
            label="Email"
            name="email"
            type="email"
            defaultValue={editing?.email ?? ""}
          />
          <Check
            label="Active"
            name="active"
            defaultChecked={editing?.active ?? true}
          />
          <Submit pending={pending} state={state} label="Save Team Member" />
        </form>
      </Editor>
    </Panel>
  );
}

function FinanceSection({ data }: { data: SettingsData }) {
  return (
    <div className="grid gap-3">
      <BudgetAccountsPanel data={data} />
      <BudgetCategoriesPanel data={data} />
      <KeyOptionPanel
        title="Expense Types"
        rows={data.expenseTypeOptions}
        keys={data.optionSets.expenseTypes}
        action={saveExpenseTypeOptionAction}
        model="expenseTypeOption"
      />
    </div>
  );
}

function BudgetAccountsPanel({ data }: { data: SettingsData }) {
  const [editing, setEditing] = useState<BudgetAccount | null>(null);
  const [state, formAction, pending] = useActionState(
    saveBudgetAccountAction,
    emptyActionResult
  );
  return (
    <Panel
      title="Financial Accounts"
      description="Account codes used by Budget and Renewal funding."
    >
      <RecordTable
        rows={data.budgetAccounts}
        columns={[
          ["Code", (row) => row.code],
          ["Name", (row) => row.name],
          ["Worksheet", (row) => titleCase(row.defaultWorksheet)],
        ]}
        onEdit={setEditing}
        model="budgetAccount"
      />
      <Editor
        title={editing ? "Edit Financial Account" : "Add Financial Account"}
      >
        <form action={formAction} className="grid gap-3 md:grid-cols-5">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <Field
            label="Account code"
            name="code"
            defaultValue={editing?.code ?? ""}
          />
          <Field
            label="Account name"
            name="name"
            defaultValue={editing?.name ?? ""}
          />
          <SelectField
            label="Default worksheet"
            name="defaultWorksheet"
            defaultValue={editing?.defaultWorksheet ?? "SOFTWARE_SAAS"}
            options={data.optionSets.budgetWorksheets.map(option)}
          />
          <Field
            label="Display order"
            name="sortOrder"
            type="number"
            defaultValue={String(editing?.sortOrder ?? 0)}
          />
          <Check
            label="Active"
            name="active"
            defaultChecked={editing?.active ?? true}
          />
          <Submit pending={pending} state={state} label="Save Account" />
        </form>
      </Editor>
    </Panel>
  );
}

function BudgetCategoriesPanel({ data }: { data: SettingsData }) {
  const [editing, setEditing] = useState<BudgetCategory | null>(null);
  const [state, formAction, pending] = useActionState(
    saveBudgetCategoryAction,
    emptyActionResult
  );
  return (
    <Panel
      title="Budget Categories"
      description="Business-managed budget categories by fiscal year."
    >
      <RecordTable
        rows={data.budgetCategories}
        columns={[
          ["Category", (row) => row.name],
          ["Fiscal Year", (row) => row.fiscalYear?.label ?? ""],
          ["Order", (row) => String(row.displayOrder)],
        ]}
        onEdit={setEditing}
        model="budgetCategory"
      />
      <Editor title={editing ? "Edit Budget Category" : "Add Budget Category"}>
        <form action={formAction} className="grid gap-3 md:grid-cols-5">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <SelectField
            label="Fiscal year"
            name="fiscalYearId"
            defaultValue={
              editing?.fiscalYearId ?? data.fiscalYears[0]?.id ?? ""
            }
            options={data.fiscalYears.map((fy) => ({
              value: fy.id,
              label: fy.label,
            }))}
          />
          <Field
            label="Category name"
            name="name"
            defaultValue={editing?.name ?? ""}
          />
          <Field
            label="Description"
            name="description"
            defaultValue={editing?.description ?? ""}
          />
          <Field
            label="Display order"
            name="displayOrder"
            type="number"
            defaultValue={String(editing?.displayOrder ?? 0)}
          />
          <Check
            label="Active"
            name="active"
            defaultChecked={editing?.active ?? true}
          />
          <Submit pending={pending} state={state} label="Save Category" />
        </form>
      </Editor>
    </Panel>
  );
}

function ContractOptionsSection({ data }: { data: SettingsData }) {
  return (
    <div className="grid gap-3">
      <PurchasingVehiclesPanel data={data} />
      <KeyOptionPanel
        title="Payment Frequencies"
        rows={data.paymentFrequencyOptions}
        keys={data.optionSets.paymentFrequencies}
        action={savePaymentFrequencyOptionAction}
        model="paymentFrequencyOption"
      />
      <KeyOptionPanel
        title="License Metrics"
        rows={data.licenseMetricOptions}
        keys={data.optionSets.licenseMetrics}
        action={saveLicenseMetricOptionAction}
        model="licenseMetricOption"
      />
    </div>
  );
}

function PurchasingVehiclesPanel({ data }: { data: SettingsData }) {
  const [editing, setEditing] = useState<PurchasingVehicle | null>(null);
  const [state, formAction, pending] = useActionState(
    savePurchasingVehicleAction,
    emptyActionResult
  );
  return (
    <Panel
      title="Purchasing Vehicles"
      description="Reusable purchasing vehicle options for Contracts."
    >
      <RecordTable
        rows={data.purchasingVehicles}
        columns={[
          ["Name", (row) => row.name],
          ["Description", (row) => row.description ?? ""],
        ]}
        onEdit={setEditing}
        model="purchasingVehicle"
      />
      <Editor
        title={editing ? "Edit Purchasing Vehicle" : "Add Purchasing Vehicle"}
      >
        <form action={formAction} className="grid gap-3 md:grid-cols-3">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <Field label="Name" name="name" defaultValue={editing?.name ?? ""} />
          <Field
            label="Description"
            name="description"
            defaultValue={editing?.description ?? ""}
          />
          <Check
            label="Active"
            name="active"
            defaultChecked={editing?.active ?? true}
          />
          <Submit pending={pending} state={state} label="Save Vehicle" />
        </form>
      </Editor>
    </Panel>
  );
}

function DeploymentOptionsSection({ data }: { data: SettingsData }) {
  return (
    <div className="grid gap-3">
      <NameOptionPanel
        title="Deployment Environments"
        rows={data.deploymentEnvironments}
        action={saveDeploymentEnvironmentAction}
        model="deploymentEnvironment"
      />
      <Panel
        title="System-Controlled Deployment Status"
        description="Deployment Status is intentionally not configurable because reporting and workflow logic depend on known values."
      >
        <div className="flex flex-wrap gap-2">
          {[
            "Not Started",
            "Planning",
            "In Progress",
            "Partially Deployed",
            "Deployed",
            "On Hold",
            "Retiring",
            "Retired",
          ].map((item) => (
            <Badge key={item} variant="outline">
              {item}
            </Badge>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function RenewalOptionsSection({ data }: { data: SettingsData }) {
  return (
    <div className="grid gap-3">
      <KeyOptionPanel
        title="Renewal Priorities"
        rows={data.renewalPriorityOptions}
        keys={data.optionSets.renewalPriorities}
        action={saveRenewalPriorityOptionAction}
        model="renewalPriorityOption"
      />
      <DecisionReasonsPanel data={data} />
    </div>
  );
}

function KeyOptionPanel({
  title,
  rows,
  keys,
  action,
  model,
}: {
  title: string;
  rows: KeyOption[];
  keys: readonly string[];
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  model: string;
}) {
  const [editing, setEditing] = useState<KeyOption | null>(null);
  const [state, formAction, pending] = useActionState(
    action,
    emptyActionResult
  );
  return (
    <Panel
      title={title}
      description="Stable internal keys with configurable labels and active visibility."
    >
      <RecordTable
        rows={rows}
        columns={[
          ["Key", (row) => row.key],
          ["Name", (row) => row.name],
          ["Order", (row) => String(row.displayOrder)],
        ]}
        onEdit={setEditing}
        model={model}
      />
      <Editor title={editing ? `Edit ${title}` : `Add ${title}`}>
        <form action={formAction} className="grid gap-3 md:grid-cols-5">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <SelectField
            label="Internal key"
            name="key"
            defaultValue={editing?.key ?? keys[0] ?? ""}
            options={keys.map(option)}
          />
          <Field
            label="Display name"
            name="name"
            defaultValue={editing?.name ?? ""}
          />
          <Field
            label="Display order"
            name="displayOrder"
            type="number"
            defaultValue={String(editing?.displayOrder ?? 0)}
          />
          <Check
            label="Active"
            name="active"
            defaultChecked={editing?.active ?? true}
          />
          <Submit pending={pending} state={state} label="Save Option" />
        </form>
      </Editor>
    </Panel>
  );
}

function NameOptionPanel({
  title,
  rows,
  action,
  model,
}: {
  title: string;
  rows: DeploymentEnvironment[];
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  model: string;
}) {
  const [editing, setEditing] = useState<DeploymentEnvironment | null>(null);
  const [state, formAction, pending] = useActionState(
    action,
    emptyActionResult
  );
  return (
    <Panel
      title={title}
      description="Business-managed options for operational dropdowns."
    >
      <RecordTable
        rows={rows}
        columns={[
          ["Name", (row) => row.name],
          ["Order", (row) => String(row.displayOrder)],
        ]}
        onEdit={setEditing}
        model={model}
      />
      <Editor title={editing ? `Edit ${title}` : `Add ${title}`}>
        <form action={formAction} className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <Field label="Name" name="name" defaultValue={editing?.name ?? ""} />
          <Field
            label="Display order"
            name="displayOrder"
            type="number"
            defaultValue={String(editing?.displayOrder ?? 0)}
          />
          <Check
            label="Active"
            name="active"
            defaultChecked={editing?.active ?? true}
          />
          <Submit pending={pending} state={state} label="Save Option" />
        </form>
      </Editor>
    </Panel>
  );
}

function DecisionReasonsPanel({ data }: { data: SettingsData }) {
  const [editing, setEditing] = useState<DecisionReason | null>(null);
  const [state, formAction, pending] = useActionState(
    saveRenewalDecisionReasonAction,
    emptyActionResult
  );
  return (
    <Panel
      title="Decision Reasons"
      description="Business-managed reasons for renewal decisions. Workflow values remain system-controlled."
    >
      <RecordTable
        rows={data.renewalDecisionReasons}
        columns={[
          ["Reason", (row) => row.name],
          ["Disposition", (row) => titleCase(row.applicableDisposition ?? "")],
          ["Description", (row) => row.description ?? ""],
        ]}
        onEdit={setEditing}
        model="renewalDecisionReason"
      />
      <Editor title={editing ? "Edit Decision Reason" : "Add Decision Reason"}>
        <form action={formAction} className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <Field label="Name" name="name" defaultValue={editing?.name ?? ""} />
          <SelectField
            includeNone
            label="Applicable disposition"
            name="applicableDisposition"
            defaultValue={editing?.applicableDisposition ?? "none"}
            options={data.optionSets.renewalDispositions.map(option)}
          />
          <Check
            label="Active"
            name="active"
            defaultChecked={editing?.active ?? true}
          />
          <div className="md:col-span-4">
            <TextareaField
              label="Description"
              name="description"
              defaultValue={editing?.description ?? ""}
            />
          </div>
          <Submit pending={pending} state={state} label="Save Reason" />
        </form>
      </Editor>
    </Panel>
  );
}

function RecordTable<T extends RecordBase>({
  rows,
  columns,
  onEdit,
  model,
}: {
  rows: T[];
  columns: Array<[string, (row: T) => string]>;
  onEdit: (row: T) => void;
  model: string;
}) {
  return (
    <div className="overflow-auto rounded-lg border border-border/80">
      <table className="w-full min-w-[720px] text-left text-xs">
        <thead className="bg-secondary/50 text-muted-foreground">
          <tr>
            {columns.map(([label]) => (
              <th key={label} className="px-3 py-2 font-medium">
                {label}
              </th>
            ))}
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border/70">
              {columns.map(([label, render]) => (
                <td
                  key={label}
                  className="max-w-72 truncate px-3 py-2 text-slate-100"
                >
                  {render(row)}
                </td>
              ))}
              <td className="px-3 py-2">
                <Badge
                  variant="outline"
                  className={
                    row.active === false
                      ? "border-slate-500/40 text-slate-400"
                      : "border-emerald-400/40 text-emerald-200"
                  }
                >
                  {row.active === false ? "Inactive" : "Active"}
                </Badge>
              </td>
              <td className="flex justify-end gap-1 px-3 py-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  type="button"
                  aria-label={`Edit ${columns[0]?.[1](row) ?? row.id}`}
                  onClick={() => onEdit(row)}
                >
                  <Pencil />
                </Button>
                {model === "fiscalYear" ? null : (
                  <ToggleActiveForm
                    id={row.id}
                    model={model}
                    active={row.active !== false}
                  />
                )}
              </td>
            </tr>
          ))}
          {rows.length ? null : (
            <tr>
              <td
                colSpan={columns.length + 2}
                className="px-3 py-8 text-center text-muted-foreground"
              >
                No records match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ToggleActiveForm({
  id,
  model,
  active,
}: {
  id: string;
  model: string;
  active: boolean;
}) {
  const [, formAction, pending] = useActionState(
    setReferenceActiveAction,
    emptyActionResult
  );
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="model" value={model} />
      <input type="hidden" name="active" value={String(!active)} />
      <Button variant="outline" size="sm" disabled={pending}>
        {active ? "Deactivate" : "Activate"}
      </Button>
    </form>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3 rounded-lg border border-border/80 bg-card/95 p-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Editor({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border/80 bg-secondary/20 p-3">
      <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <label className="relative min-w-64 flex-1">
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 border-border/80 bg-secondary/45 pl-8 text-sm"
      />
    </label>
  );
}

function filterRows<T>(rows: T[], query: string, getText: (row: T) => string) {
  const lowered = query.trim().toLowerCase();
  if (!lowered) return rows;
  return rows.filter((row) => getText(row).toLowerCase().includes(lowered));
}

function option(value: string) {
  return { value, label: titleCase(value) };
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
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Check({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-2 self-end text-xs font-medium text-slate-300">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="size-4 accent-cyan-400"
      />
      {label}
    </label>
  );
}

function Submit({
  pending,
  state,
  label,
}: {
  pending: boolean;
  state: ActionResult;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 self-end md:col-span-full">
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : label}
      </Button>
      {state.message ? (
        <p
          className={`text-xs ${state.ok ? "text-emerald-300" : "text-red-300"}`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
