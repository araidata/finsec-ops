"use client";

import {
  ArrowDown,
  ArrowUp,
  Copy,
  FileDown,
  Filter,
  PanelRightOpen,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { WorkspaceShell } from "@/components/app/workspace-shell";
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
  calculateAccountRollups,
  calculateBudgetTotals,
  calculateNetRenewalChange,
  calculateNoticeDate,
  calculateRenewalExposureByWindow,
  calculateRenewalIncrease,
  calculateRenewalPercentageIncrease,
  calculateRenewalSavings,
  dollarChange,
  formatCurrencyFromCents,
  formatPercent,
  percentageChange,
} from "@/lib/budgets/budget-calculations";
import { budgetWorkspaceData } from "@/lib/budgets/budget-data";
import { filterAnnualsByWorksheet } from "@/lib/budgets/budget-grouping";
import { rollForwardBudget } from "@/lib/budgets/budget-roll-forward";
import { validateBudgetLine } from "@/lib/budgets/budget-validation";
import { cn } from "@/lib/utils";
import type {
  BudgetAccount,
  BudgetAnnualFinancial,
  BudgetItem,
  BudgetPlan,
  BudgetScenario,
  BudgetWorksheetType,
  MaintenanceRenewal,
  SavingsRecord,
} from "@/types/budget";
import { budgetWorksheetTypes } from "@/types/budget";

const visibleWorksheets: BudgetWorksheetType[] = [
  "Summary",
  "Operating Expenses",
  "Software and SaaS",
  "Maintenance Renewals",
  "Training",
  "Travel and Conferences",
  "Savings and Reductions",
  "Submission and Export",
];

type SortKey =
  | "name"
  | "account"
  | "prior"
  | "current"
  | "proposed"
  | "change"
  | "owner";

export function BudgetWorkspace() {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState("FY2027");
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    "scenario-fy-2027-initial"
  );
  const [activeWorksheet, setActiveWorksheet] =
    useState<BudgetWorksheetType>("Maintenance Renewals");
  const [searchTerm, setSearchTerm] = useState("");
  const [accountFilter, setAccountFilter] = useState<string>("All");
  const [sortKey, setSortKey] = useState<SortKey>("proposed");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [annuals, setAnnuals] = useState(
    budgetWorkspaceData.annualFinancials
  );
  const [items, setItems] = useState(budgetWorkspaceData.items);
  const [renewals, setRenewals] = useState(
    budgetWorkspaceData.maintenanceRenewals
  );
  const [savingsRecords] = useState(
    budgetWorkspaceData.savingsRecords
  );
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const currentPlan = useMemo(
    () =>
      budgetWorkspaceData.plans.find(
        (plan) => plan.fiscalYear === selectedFiscalYear
      ) ?? budgetWorkspaceData.plans[0],
    [selectedFiscalYear]
  );
  const scenarios = useMemo(
    () =>
      budgetWorkspaceData.scenarios.filter(
        (scenario) => scenario.budgetPlanId === currentPlan.id
      ),
    [currentPlan.id]
  );
  const activeScenario =
    scenarios.find((scenario) => scenario.id === selectedScenarioId) ??
    scenarios[0];
  const currentAnnuals = annuals.filter(
    (line) =>
      line.budgetPlanId === currentPlan.id &&
      (!activeScenario || line.scenarioId === activeScenario.id)
  );
  const worksheetAnnuals = filterAnnualsByWorksheet(
    currentAnnuals,
    activeWorksheet
  );
  const filteredAnnuals = worksheetAnnuals
    .filter((line) => accountFilter === "All" || line.accountId === accountFilter)
    .filter((line) => matchesSearch(line, items, searchTerm))
    .toSorted(
      (a, b) =>
        (sortDirection === "asc" ? 1 : -1) *
        compareAnnuals(a, b, sortKey, items, budgetWorkspaceData.accounts)
    );
  const currentRenewals = renewals.filter(
    (renewal) => renewal.budgetPlanId === currentPlan.id
  );
  const filteredRenewals = currentRenewals.filter((renewal) => {
    const text = `${renewal.vendor} ${renewal.productOrService} ${
      renewal.reseller ?? ""
    } ${renewal.renewalOwner}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });
  const currentSavings = savingsRecords.filter(
    (record) => record.budgetPlanId === currentPlan.id
  );
  const totals = calculateBudgetTotals(currentAnnuals, currentSavings);
  const rollups = calculateAccountRollups(
    budgetWorkspaceData.accounts,
    currentAnnuals
  );
  const exposureWindows = calculateRenewalExposureByWindow(
    currentRenewals,
    new Date("2026-07-10T00:00:00.000Z")
  );
  const selectedLine =
    currentAnnuals.find((line) => line.id === selectedLineId) ?? null;
  const highRiskRenewals = currentRenewals.filter(
    (renewal) => renewal.renewalRisk === "High" || renewal.renewalRisk === "Critical"
  ).length;

  function selectFiscalYear(fiscalYear: string) {
    const plan = budgetWorkspaceData.plans.find(
      (candidate) => candidate.fiscalYear === fiscalYear
    );
    const scenario = budgetWorkspaceData.scenarios.find(
      (candidate) => candidate.budgetPlanId === plan?.id && candidate.isActive
    );
    setSelectedFiscalYear(fiscalYear);
    if (scenario) {
      setSelectedScenarioId(scenario.id);
    }
  }

  function toggleSort(nextSortKey: SortKey) {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextSortKey);
    setSortDirection("asc");
  }

  function updateLineAmount(lineId: string, field: AmountField, value: string) {
    const amount = parseDollarsToCents(value);
    setAnnuals((current) =>
      current.map((line) =>
        line.id === lineId ? { ...line, [field]: amount, reviewState: "Updated" } : line
      )
    );
    setHasUnsavedChanges(true);
  }

  function updateRenewalAmount(
    renewalId: string,
    field: "renewalQuoteCents" | "negotiatedCostCents",
    value: string
  ) {
    const amount = parseDollarsToCents(value);
    let linkedAnnualId: string | undefined;

    setRenewals((current) =>
      current.map((renewal) => {
        if (renewal.id !== renewalId) {
          return renewal;
        }
        linkedAnnualId = renewal.linkedAnnualFinancialId;
        return { ...renewal, [field]: amount };
      })
    );

    if (field === "negotiatedCostCents" && linkedAnnualId) {
      setAnnuals((current) =>
        current.map((line) =>
          line.id === linkedAnnualId
            ? {
                ...line,
                proposedAmountCents: amount,
                forecastAmountCents: amount,
                reviewState: "Updated",
              }
            : line
        )
      );
    }
    setHasUnsavedChanges(true);
  }

  function addBudgetRow() {
    const account =
      budgetWorkspaceData.accounts.find(
        (candidate) => candidate.defaultWorksheet === activeWorksheet
      ) ?? budgetWorkspaceData.accounts[3];
    const newItemId = `item-new-${Date.now()}`;
    const newLine: BudgetAnnualFinancial = {
      id: `line-new-${Date.now()}`,
      budgetPlanId: currentPlan.id,
      scenarioId: activeScenario?.id ?? selectedScenarioId,
      fiscalYear: currentPlan.fiscalYear,
      budgetItemId: newItemId,
      accountId: account.id,
      worksheet:
        activeWorksheet === "Summary" || activeWorksheet === "Submission and Export"
          ? account.defaultWorksheet
          : activeWorksheet,
      sortOrder: currentAnnuals.length + 1,
      priorApprovedAmountCents: 0,
      currentApprovedAmountCents: 0,
      baseAmountCents: 0,
      requestedAmountCents: 0,
      proposedAmountCents: 0,
      approvedAmountCents: 0,
      revisedApprovedAmountCents: 0,
      forecastAmountCents: 0,
      encumberedAmountCents: 0,
      actualAmountCents: 0,
      unitCostCents: 0,
      quantity: 1,
      oneTimeAmountCents: 0,
      recurringAmountCents: 0,
      savingsAmountCents: 0,
      costAvoidanceAmountCents: 0,
      fundingStatus: "Draft",
      recurrence: "Recurring",
      reviewState: "Needs Review",
      isNewRequest: true,
      isRecurring: true,
      isOneTime: false,
      isRetired: false,
      comments: "New budget row.",
      businessJustification: "",
      riskIfNotFunded: "",
      owner: "Unassigned",
    };
    setItems((current) => [
      ...current,
      {
        id: newItemId,
        name: "New budget request",
        description: "Draft row added in local planning state.",
        owner: "Unassigned",
        strategicProgramArea: "Other",
        active: true,
      },
    ]);
    setAnnuals((current) => [...current, newLine]);
    setSelectedLineId(newLine.id);
    setHasUnsavedChanges(true);
  }

  function duplicateBudgetRow(line: BudgetAnnualFinancial) {
    const duplicate = {
      ...line,
      id: `${line.id}-copy-${Date.now()}`,
      sortOrder: line.sortOrder + 1,
      reviewState: "Needs Review" as const,
      comments: "Duplicated for planning review.",
    };
    setAnnuals((current) => [...current, duplicate]);
    setSelectedLineId(duplicate.id);
    setHasUnsavedChanges(true);
  }

  function deleteBudgetRow(lineId: string) {
    setAnnuals((current) => current.filter((line) => line.id !== lineId));
    if (selectedLineId === lineId) {
      setSelectedLineId(null);
    }
    setHasUnsavedChanges(true);
  }

  function moveBudgetRow(lineId: string, direction: "up" | "down") {
    setAnnuals((current) =>
      current.map((line) =>
        line.id === lineId
          ? {
              ...line,
              sortOrder: line.sortOrder + (direction === "up" ? -1.5 : 1.5),
              reviewState: "Updated",
            }
          : line
      )
    );
    setHasUnsavedChanges(true);
  }

  function runRollForward() {
    const scenario =
      activeScenario ??
      budgetWorkspaceData.scenarios.find(
        (candidate) => candidate.budgetPlanId === currentPlan.id
      );
    if (!scenario || !currentPlan.priorFiscalYear) {
      return;
    }
    const result = rollForwardBudget(annuals, renewals, {
      sourceFiscalYear: currentPlan.priorFiscalYear,
      targetPlan: currentPlan,
      targetScenario: scenario,
      defaultInflationPercent: 4,
      itemInflationOverrides: {
        "item-rapid7": 5.6,
        "item-onetrust": 0,
      },
      excludeRetired: true,
      carryForwardRenewalQuotes: true,
    });
    setAnnuals((current) => [
      ...current.filter(
        (line) =>
          !(
            line.budgetPlanId === currentPlan.id &&
            line.comments === "Rolled forward for review."
          )
      ),
      ...result.annualFinancials,
    ]);
    setHasUnsavedChanges(true);
  }

  return (
    <WorkspaceShell
      title={`${selectedFiscalYear} Cybersecurity Budget`}
      description="Finance-oriented planning workspace for supporting schedules, account rollups, maintenance renewals, and submission review."
      actionLabel="Roll Forward"
    >
      <div className="flex flex-col gap-4">
        <WorkspaceHeader
          currentPlan={currentPlan}
          scenarios={scenarios}
          selectedScenarioId={selectedScenarioId}
          selectedFiscalYear={selectedFiscalYear}
          hasUnsavedChanges={hasUnsavedChanges}
          onScenarioChange={setSelectedScenarioId}
          onFiscalYearChange={selectFiscalYear}
          onRollForward={runRollForward}
        />

        <MetricStrip
          totals={totals}
          maintenanceRenewalCents={currentRenewals.reduce(
            (total, renewal) => total + renewal.negotiatedCostCents,
            0
          )}
          highRiskRenewals={highRiskRenewals}
          submissionStatus={currentPlan.status}
        />

        <WorksheetTabs
          activeWorksheet={activeWorksheet}
          onChange={setActiveWorksheet}
        />

        <div className="grid gap-4 min-[1900px]:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex min-w-0 flex-col gap-4">
            <Toolbar
              activeWorksheet={activeWorksheet}
              searchTerm={searchTerm}
              accountFilter={accountFilter}
              accounts={budgetWorkspaceData.accounts}
              onSearchChange={setSearchTerm}
              onAccountFilterChange={setAccountFilter}
              onAddRow={addBudgetRow}
            />
            {activeWorksheet === "Maintenance Renewals" ? (
              <MaintenanceRenewalGrid
                renewals={filteredRenewals}
                accounts={budgetWorkspaceData.accounts}
                onAmountChange={updateRenewalAmount}
              />
            ) : activeWorksheet === "Savings and Reductions" ? (
              <SavingsSummary
                totals={totals}
                savingsRecords={currentSavings}
                annuals={currentAnnuals}
                items={items}
              />
            ) : (
              <EditableBudgetGrid
                lines={filteredAnnuals}
                accounts={budgetWorkspaceData.accounts}
                items={items}
                onSort={toggleSort}
                onAmountChange={updateLineAmount}
                onOpenDetail={setSelectedLineId}
                onDuplicate={duplicateBudgetRow}
                onDelete={deleteBudgetRow}
                onMove={moveBudgetRow}
              />
            )}
            <FinanceSummaryGrid rollups={rollups} />
          </div>

          <PlanningRail
            exposureWindows={exposureWindows}
            currentPlan={currentPlan}
            totals={totals}
            rollups={rollups}
          />
        </div>
      </div>

      <BudgetRowDetail
        line={selectedLine}
        item={
          selectedLine
          ? items.find(
                (item) => item.id === selectedLine.budgetItemId
              ) ?? null
            : null
        }
        account={
          selectedLine
            ? budgetWorkspaceData.accounts.find(
                (account) => account.id === selectedLine.accountId
              ) ?? null
            : null
        }
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLineId(null);
          }
        }}
      />
    </WorkspaceShell>
  );
}

type AmountField =
  | "priorApprovedAmountCents"
  | "currentApprovedAmountCents"
  | "proposedAmountCents"
  | "approvedAmountCents"
  | "forecastAmountCents"
  | "actualAmountCents";

function WorkspaceHeader({
  currentPlan,
  scenarios,
  selectedScenarioId,
  selectedFiscalYear,
  hasUnsavedChanges,
  onFiscalYearChange,
  onScenarioChange,
  onRollForward,
}: {
  currentPlan: BudgetPlan;
  scenarios: BudgetScenario[];
  selectedScenarioId: string;
  selectedFiscalYear: string;
  hasUnsavedChanges: boolean;
  onFiscalYearChange: (fiscalYear: string) => void;
  onScenarioChange: (scenarioId: string) => void;
  onRollForward: () => void;
}) {
  return (
    <section className="rounded-lg border border-border/80 bg-card/95 shadow-none">
      <div className="grid gap-2 p-2 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
              {currentPlan.status}
            </Badge>
            {hasUnsavedChanges ? (
              <Badge variant="outline" className="border-amber-400/30 bg-amber-400/10 text-amber-300">
                Unsaved local changes
              </Badge>
            ) : null}
            <span className="text-xs text-muted-foreground">
              Last saved Jul 10, 2026 by {currentPlan.planningOwner}
            </span>
          </div>
        </div>
        <ControlSelect
          label="Fiscal Year"
          value={selectedFiscalYear}
          options={budgetWorkspaceData.fiscalYears.map((year) => year.label)}
          onChange={onFiscalYearChange}
        />
        <ControlSelect
          label="Version"
          value={selectedScenarioId}
          options={scenarios.map((scenario) => ({
            value: scenario.id,
            label: scenario.label,
          }))}
          onChange={onScenarioChange}
        />
        <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={onRollForward}>
          <RotateCcw data-icon="inline-start" />
          Roll Forward
        </Button>
      </div>
    </section>
  );
}

function MetricStrip({
  totals,
  maintenanceRenewalCents,
  highRiskRenewals,
  submissionStatus,
}: {
  totals: ReturnType<typeof calculateBudgetTotals>;
  maintenanceRenewalCents: number;
  highRiskRenewals: number;
  submissionStatus: string;
}) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
      <MetricCard label="Total Proposed Budget" value={formatCurrencyFromCents(totals.totalProposedCents)} detail={`${formatCurrencyFromCents(totals.netChangeCents)} net`} tone={totals.netChangeCents > 0 ? "bad" : "good"} />
      <MetricCard label="Prior Approved Budget" value={formatCurrencyFromCents(totals.totalPriorApprovedCents)} />
      <MetricCard label="Total Dollar Change" value={formatCurrencyFromCents(totals.netChangeCents)} detail={formatPercent(percentageChange(totals.totalCurrentApprovedCents, totals.totalProposedCents))} tone={totals.netChangeCents > 0 ? "bad" : "good"} />
      <MetricCard label="Total Savings Identified" value={formatCurrencyFromCents(totals.grossSavingsCents)} detail="Budget reduction" tone="good" />
      <MetricCard label="Maintenance Renewals" value={formatCurrencyFromCents(maintenanceRenewalCents)} detail="Linked to proposed budget" tone="info" />
      <MetricCard label="High Risk Renewals" value={String(highRiskRenewals)} detail="Require attention" tone={highRiskRenewals > 0 ? "bad" : "good"} />
      <MetricCard label="Submission Status" value={submissionStatus} detail="Due Sep 15, 2026" />
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "neutral" | "good" | "bad" | "info";
}) {
  return (
        <div className="rounded-lg border border-border/80 bg-card/95 p-2.5 shadow-none">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-slate-50">{value}</p>
      {detail ? (
        <p
          className={cn(
            "mt-1 text-xs",
            tone === "good" && "text-emerald-300",
            tone === "bad" && "text-red-300",
            tone === "info" && "text-cyan-300",
            tone === "neutral" && "text-muted-foreground"
          )}
        >
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function WorksheetTabs({
  activeWorksheet,
  onChange,
}: {
  activeWorksheet: BudgetWorksheetType;
  onChange: (worksheet: BudgetWorksheetType) => void;
}) {
  return (
    <nav className="flex overflow-x-auto rounded-lg border border-border/80 bg-card/95 p-1" aria-label="Budget worksheets">
      {visibleWorksheets.map((worksheet) => (
        <button
          key={worksheet}
          className={cn(
            "flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-slate-100",
            activeWorksheet === worksheet &&
              "border border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
          )}
          onClick={() => onChange(worksheet)}
        >
          {worksheet}
        </button>
      ))}
    </nav>
  );
}

function Toolbar({
  activeWorksheet,
  searchTerm,
  accountFilter,
  accounts,
  onSearchChange,
  onAccountFilterChange,
  onAddRow,
}: {
  activeWorksheet: BudgetWorksheetType;
  searchTerm: string;
  accountFilter: string;
  accounts: BudgetAccount[];
  onSearchChange: (value: string) => void;
  onAccountFilterChange: (value: string) => void;
  onAddRow: () => void;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-card/95 p-2">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="mr-auto">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-100">{activeWorksheet}</h2>
            <Badge variant="outline" className="border-border bg-secondary/70">
              Operational worksheet
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Inline edit rows, then use the detail drawer for justification and risk.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative min-w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search in table"
              value={searchTerm}
              placeholder="Search in table..."
              className="border-border/80 bg-secondary/45 pl-8"
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter />
            <select
              value={accountFilter}
              aria-label="Filter by account"
              className="h-8 rounded-lg border border-border/80 bg-secondary/45 px-2 text-sm text-slate-100 outline-none"
              onChange={(event) => onAccountFilterChange(event.target.value)}
            >
              <option value="All">All accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} {account.name}
                </option>
              ))}
            </select>
          </label>
          <Button variant="outline">
            <FileDown data-icon="inline-start" />
            Export
          </Button>
          <Button onClick={onAddRow}>
            <Plus data-icon="inline-start" />
            Add Row
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditableBudgetGrid({
  lines,
  accounts,
  items,
  onSort,
  onAmountChange,
  onOpenDetail,
  onDuplicate,
  onDelete,
  onMove,
}: {
  lines: BudgetAnnualFinancial[];
  accounts: BudgetAccount[];
  items: BudgetItem[];
  onSort: (sortKey: SortKey) => void;
  onAmountChange: (lineId: string, field: AmountField, value: string) => void;
  onOpenDetail: (lineId: string) => void;
  onDuplicate: (line: BudgetAnnualFinancial) => void;
  onDelete: (lineId: string) => void;
  onMove: (lineId: string, direction: "up" | "down") => void;
}) {
  const totals = calculateBudgetTotals(lines);

  return (
    <div className="overflow-hidden rounded-lg border border-border/80 bg-card/95">
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-[#07111d] text-xs text-muted-foreground">
            <tr className="border-b border-border/80">
              <GridHead label="Item" onClick={() => onSort("name")} />
              <GridHead label="Account" onClick={() => onSort("account")} />
              <th className="px-3 py-2">Worksheet</th>
              <GridHead label="Prior Approved" align="right" onClick={() => onSort("prior")} />
              <GridHead label="Current Approved" align="right" onClick={() => onSort("current")} />
              <GridHead label="Proposed" align="right" onClick={() => onSort("proposed")} />
              <GridHead label="Change" align="right" onClick={() => onSort("change")} />
              <th className="px-3 py-2 text-right">Change %</th>
              <GridHead label="Owner" onClick={() => onSort("owner")} />
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const item = findItem(line, items);
              const account = findAccount(line, accounts);
              const change = dollarChange(
                line.currentApprovedAmountCents,
                line.proposedAmountCents
              );
              const percent = percentageChange(
                line.currentApprovedAmountCents,
                line.proposedAmountCents
              );
              const validation = validateBudgetLine(line);

              return (
                <tr key={line.id} className="border-b border-border/70 hover:bg-secondary/35">
                  <td className="min-w-64 px-3 py-2">
                    <button className="text-left font-medium text-cyan-100 hover:underline" onClick={() => onOpenDetail(line.id)}>
                      {item.name}
                    </button>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {item.strategicProgramArea}
                    </p>
                    {!validation.valid ? (
                      <p className="mt-1 text-xs text-amber-300">{validation.messages[0]}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-300">
                    {account.code} {account.name}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{line.worksheet}</td>
                  <MoneyCell value={line.priorApprovedAmountCents} onChange={(value) => onAmountChange(line.id, "priorApprovedAmountCents", value)} />
                  <MoneyCell value={line.currentApprovedAmountCents} onChange={(value) => onAmountChange(line.id, "currentApprovedAmountCents", value)} />
                  <MoneyCell testId={`proposed-${line.id}`} value={line.proposedAmountCents} onChange={(value) => onAmountChange(line.id, "proposedAmountCents", value)} />
                  <td className={cn("px-3 py-2 text-right font-mono", change > 0 ? "text-red-300" : "text-emerald-300")}>
                    {formatCurrencyFromCents(change)}
                  </td>
                  <td className={cn("px-3 py-2 text-right font-mono", change > 0 ? "text-red-300" : "text-emerald-300")}>
                    {formatPercent(percent)}
                  </td>
                  <td className="px-3 py-2 text-slate-200">{item.owner}</td>
                  <td className="px-3 py-2">
                    <StatusBadge value={line.reviewState} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-xs" aria-label={`Move ${item.name} up`} onClick={() => onMove(line.id, "up")}>
                        <ArrowUp />
                      </Button>
                      <Button variant="ghost" size="icon-xs" aria-label={`Move ${item.name} down`} onClick={() => onMove(line.id, "down")}>
                        <ArrowDown />
                      </Button>
                      <Button variant="ghost" size="icon-xs" aria-label={`Duplicate ${item.name}`} onClick={() => onDuplicate(line)}>
                        <Copy />
                      </Button>
                      <Button variant="ghost" size="icon-xs" aria-label={`Open details for ${item.name}`} onClick={() => onOpenDetail(line.id)}>
                        <PanelRightOpen />
                      </Button>
                      <Button variant="destructive" size="icon-xs" aria-label={`Delete ${item.name}`} onClick={() => onDelete(line.id)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 bg-[#082634] text-sm font-semibold text-slate-50">
            <tr>
              <td className="px-3 py-2" colSpan={3}>
                Total ({lines.length})
              </td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrencyFromCents(totals.totalPriorApprovedCents)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrencyFromCents(totals.totalCurrentApprovedCents)}</td>
              <td data-testid="worksheet-total" className="px-3 py-2 text-right font-mono">{formatCurrencyFromCents(totals.totalProposedCents)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrencyFromCents(totals.netChangeCents)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatPercent(percentageChange(totals.totalCurrentApprovedCents, totals.totalProposedCents))}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function MaintenanceRenewalGrid({
  renewals,
  accounts,
  onAmountChange,
}: {
  renewals: MaintenanceRenewal[];
  accounts: BudgetAccount[];
  onAmountChange: (
    renewalId: string,
    field: "renewalQuoteCents" | "negotiatedCostCents",
    value: string
  ) => void;
}) {
  const totalCurrent = renewals.reduce(
    (total, renewal) => total + renewal.currentCostCents,
    0
  );
  const totalQuote = renewals.reduce(
    (total, renewal) => total + renewal.renewalQuoteCents,
    0
  );
  const totalNegotiated = renewals.reduce(
    (total, renewal) => total + renewal.negotiatedCostCents,
    0
  );
  const totalSavings = renewals.reduce(
    (total, renewal) => total + calculateRenewalSavings(renewal),
    0
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border/80 bg-card/95">
      <div className="border-b border-border/80 px-3 py-2">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-slate-100">Maintenance Renewals</h2>
          <Badge variant="outline" className="border-red-400/30 bg-red-400/10 text-red-300">
            {renewals.filter((renewal) => renewal.renewalRisk === "High" || renewal.renewalRisk === "Critical").length} High Risk
          </Badge>
        </div>
      </div>
      <div className="max-h-[380px] overflow-auto">
        <table className="w-full min-w-[1540px] border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-[#07111d] text-xs text-muted-foreground">
            <tr className="border-b border-border/80">
              {[
                "Vendor",
                "Product or Service",
                "Reseller",
                "Current Cost",
                "Renewal Quote",
                "Increase",
                "Negotiated Cost",
                "Savings",
                "Renewal Date",
                "Notice Date",
                "Funding Account",
                "Status",
                "Owner",
                "Procurement",
              ].map((label) => (
                <th key={label} className="px-3 py-2">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renewals.map((renewal) => {
              const increase = calculateRenewalIncrease(renewal);
              const percent = calculateRenewalPercentageIncrease(renewal);
              const savings = calculateRenewalSavings(renewal);
              const noticeDate = calculateNoticeDate(
                renewal.renewalDate,
                renewal.noticePeriodDays
              );
              const netChange = calculateNetRenewalChange(renewal);
              const account = accounts.find(
                (candidate) => candidate.id === renewal.fundingAccountId
              );

              return (
                <tr key={renewal.id} className="border-b border-border/70 hover:bg-secondary/35">
                  <td className="px-3 py-1.5 font-medium text-slate-100">{renewal.vendor}</td>
                  <td className="px-3 py-1.5 text-slate-200">{renewal.productOrService}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{renewal.reseller ?? "Direct"}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{formatCurrencyFromCents(renewal.currentCostCents)}</td>
                  <MoneyCell testId={`renewal-quote-${renewal.id}`} value={renewal.renewalQuoteCents} onChange={(value) => onAmountChange(renewal.id, "renewalQuoteCents", value)} />
                  <td data-testid={`renewal-increase-${renewal.id}`} className={cn("px-3 py-1.5 text-right font-mono", increase > 0 ? "text-red-300" : "text-emerald-300")}>
                    {formatCurrencyFromCents(increase)}
                    <span className="block text-xs">{formatPercent(percent)}</span>
                  </td>
                  <MoneyCell value={renewal.negotiatedCostCents} onChange={(value) => onAmountChange(renewal.id, "negotiatedCostCents", value)} />
                  <td data-testid={`renewal-savings-${renewal.id}`} className="px-3 py-1.5 text-right font-mono text-emerald-300">
                    {formatCurrencyFromCents(savings)}
                    <span className="block text-xs">{formatCurrencyFromCents(netChange)} net</span>
                  </td>
                  <td className="px-3 py-1.5 font-mono">{renewal.renewalDate}</td>
                  <td className="px-3 py-1.5 font-mono">{noticeDate}</td>
                  <td className="px-3 py-1.5 text-xs text-slate-300">
                    {account ? `${account.code} ${account.name}` : renewal.fundingAccountId}
                  </td>
                  <td className="px-3 py-1.5">
                    <StatusBadge value={renewal.renewalStatus} />
                  </td>
                  <td className="px-3 py-1.5">{renewal.renewalOwner}</td>
                  <td className="px-3 py-1.5">
                    <StatusBadge value={renewal.procurementStatus} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 bg-[#082634] text-sm font-semibold text-slate-50">
            <tr>
              <td className="px-3 py-2" colSpan={3}>
                Total ({renewals.length})
              </td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrencyFromCents(totalCurrent)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrencyFromCents(totalQuote)}</td>
              <td className="px-3 py-2 text-right font-mono text-red-300">{formatCurrencyFromCents(totalQuote - totalCurrent)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrencyFromCents(totalNegotiated)}</td>
              <td className="px-3 py-2 text-right font-mono text-emerald-300">{formatCurrencyFromCents(totalSavings)}</td>
              <td colSpan={6} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function FinanceSummaryGrid({ rollups }: { rollups: ReturnType<typeof calculateAccountRollups> }) {
  const total = rollups.reduce(
    (summary, rollup) => ({
      priorApprovedCents: summary.priorApprovedCents + rollup.priorApprovedCents,
      currentApprovedCents:
        summary.currentApprovedCents + rollup.currentApprovedCents,
      proposedCents: summary.proposedCents + rollup.proposedCents,
      dollarChangeCents: summary.dollarChangeCents + rollup.dollarChangeCents,
    }),
    {
      priorApprovedCents: 0,
      currentApprovedCents: 0,
      proposedCents: 0,
      dollarChangeCents: 0,
    }
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border/80 bg-card/95">
      <div className="flex items-center justify-between border-b border-border/80 px-3 py-2">
        <h2 className="font-semibold text-slate-100">Finance Summary</h2>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>View by</span>
          <Badge variant="outline" className="border-border bg-secondary/70">Account Hierarchy</Badge>
        </div>
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-[#07111d] text-xs text-muted-foreground">
            <tr className="border-b border-border/80">
              <th className="px-3 py-2">Account Code</th>
              <th className="px-3 py-2">Account Name</th>
              <th className="px-3 py-2 text-right">Prior Approved</th>
              <th className="px-3 py-2 text-right">Current Approved</th>
              <th className="px-3 py-2 text-right">Proposed</th>
              <th className="px-3 py-2 text-right">Dollar Change</th>
              <th className="px-3 py-2 text-right">Percent Change</th>
              <th className="px-3 py-2">Comments</th>
            </tr>
          </thead>
          <tbody>
            {rollups.map((rollup) => (
              <tr key={rollup.accountId} className="border-b border-border/70">
                <td className="px-3 py-2 font-mono">{rollup.accountCode}</td>
                <td className="px-3 py-2">{rollup.accountName}</td>
                <td className="px-3 py-2 text-right font-mono">{formatCurrencyFromCents(rollup.priorApprovedCents)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatCurrencyFromCents(rollup.currentApprovedCents)}</td>
                <td data-testid={`finance-proposed-${rollup.accountCode}`} className="px-3 py-2 text-right font-mono">{formatCurrencyFromCents(rollup.proposedCents)}</td>
                <td className={cn("px-3 py-2 text-right font-mono", rollup.dollarChangeCents > 0 ? "text-red-300" : "text-emerald-300")}>{formatCurrencyFromCents(rollup.dollarChangeCents)}</td>
                <td className={cn("px-3 py-2 text-right font-mono", rollup.dollarChangeCents > 0 ? "text-red-300" : "text-emerald-300")}>{formatPercent(rollup.percentChange)}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{rollup.comments}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[#082634] font-semibold text-slate-50">
            <tr>
              <td className="px-3 py-2" colSpan={2}>Total</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrencyFromCents(total.priorApprovedCents)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrencyFromCents(total.currentApprovedCents)}</td>
              <td data-testid="finance-total-proposed" className="px-3 py-2 text-right font-mono">{formatCurrencyFromCents(total.proposedCents)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatCurrencyFromCents(total.dollarChangeCents)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatPercent(percentageChange(total.currentApprovedCents, total.proposedCents))}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function SavingsSummary({
  totals,
  savingsRecords,
  annuals,
  items,
}: {
  totals: ReturnType<typeof calculateBudgetTotals>;
  savingsRecords: SavingsRecord[];
  annuals: BudgetAnnualFinancial[];
  items: BudgetItem[];
}) {
  const retiredLines = annuals.filter((line) => line.isRetired || line.savingsAmountCents > 0);

  return (
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-lg border border-border/80 bg-card/95 p-4">
        <h2 className="font-semibold text-slate-100">Savings and Reductions</h2>
        <div className="mt-4 grid gap-3">
          <MetricCard label="Gross Increases" value={formatCurrencyFromCents(totals.totalIncreaseCents)} tone="bad" />
          <MetricCard label="Gross New Investments" value={formatCurrencyFromCents(totals.grossNewInvestmentCents)} tone="bad" />
          <MetricCard label="Gross Savings" value={formatCurrencyFromCents(totals.grossSavingsCents)} tone="good" />
          <MetricCard label="Cost Avoidance" value={formatCurrencyFromCents(totals.totalCostAvoidanceCents)} tone="info" />
          <MetricCard label="Net Budget Change" value={formatCurrencyFromCents(totals.netChangeCents)} tone={totals.netChangeCents > 0 ? "bad" : "good"} />
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-border/80 bg-card/95">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-[#07111d] text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-right">Budget Reduction</th>
              <th className="px-3 py-2 text-right">Cost Avoidance</th>
              <th className="px-3 py-2 text-left">Owner</th>
            </tr>
          </thead>
          <tbody>
            {savingsRecords.map((record) => (
              <tr key={record.id} className="border-b border-border/70">
                <td className="px-3 py-2">{record.type}</td>
                <td className="px-3 py-2 text-muted-foreground">{record.description}</td>
                <td className="px-3 py-2 text-right font-mono text-emerald-300">{formatCurrencyFromCents(record.amountCents)}</td>
                <td className="px-3 py-2 text-right font-mono text-cyan-300">{formatCurrencyFromCents(record.costAvoidanceCents)}</td>
                <td className="px-3 py-2">{record.owner}</td>
              </tr>
            ))}
            {retiredLines.map((line) => (
              <tr key={line.id} className="border-b border-border/70">
                <td className="px-3 py-2">Product retirement</td>
                <td className="px-3 py-2 text-muted-foreground">{findItem(line, items).name}</td>
                <td className="px-3 py-2 text-right font-mono text-emerald-300">{formatCurrencyFromCents(line.savingsAmountCents)}</td>
                <td className="px-3 py-2 text-right font-mono text-cyan-300">{formatCurrencyFromCents(line.costAvoidanceAmountCents)}</td>
                <td className="px-3 py-2">{findItem(line, items).owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlanningRail({
  exposureWindows,
  currentPlan,
  totals,
  rollups,
}: {
  exposureWindows: ReturnType<typeof calculateRenewalExposureByWindow>;
  currentPlan: BudgetPlan;
  totals: ReturnType<typeof calculateBudgetTotals>;
  rollups: ReturnType<typeof calculateAccountRollups>;
}) {
  return (
    <aside className="hidden flex-col gap-4 min-[1900px]:flex">
      <div className="rounded-lg border border-border/80 bg-card/95 p-4">
        <h2 className="font-semibold text-slate-100">Details</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <Detail label="Planning owner" value={currentPlan.planningOwner} />
          <Detail label="Submission due" value={currentPlan.submissionDueDate} />
          <Detail label="Version" value={currentPlan.version} />
          <Detail label="Net change" value={formatCurrencyFromCents(totals.netChangeCents)} />
        </dl>
      </div>
      <div className="rounded-lg border border-border/80 bg-card/95 p-4">
        <h2 className="font-semibold text-slate-100">Renewal Exposure</h2>
        <div className="mt-4 flex flex-col gap-2">
          {exposureWindows.map((window) => (
            <div key={window.label} className="grid grid-cols-[56px_1fr_auto] items-center gap-2 rounded-md border border-border/70 bg-secondary/35 px-2 py-2 text-sm">
              <span className="font-mono text-cyan-200">{window.label}d</span>
              <span className="text-muted-foreground">{window.count} renewals</span>
              <span className="font-mono">{formatCurrencyFromCents(window.exposureCents)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border/80 bg-card/95 p-4">
        <h2 className="font-semibold text-slate-100">Top Accounts</h2>
        <div className="mt-4 flex flex-col gap-2">
          {rollups
            .toSorted((a, b) => b.proposedCents - a.proposedCents)
            .slice(0, 4)
            .map((rollup) => (
              <div key={rollup.accountId} className="rounded-md border border-border/70 bg-secondary/35 px-2 py-2">
                <p className="text-xs text-muted-foreground">{rollup.accountCode}</p>
                <p className="truncate text-sm text-slate-100">{rollup.accountName}</p>
                <p className="mt-1 font-mono text-sm text-cyan-200">{formatCurrencyFromCents(rollup.proposedCents)}</p>
              </div>
            ))}
        </div>
      </div>
    </aside>
  );
}

function BudgetRowDetail({
  line,
  item,
  account,
  onOpenChange,
}: {
  line: BudgetAnnualFinancial | null;
  item: BudgetItem | null;
  account: BudgetAccount | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={Boolean(line)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-border bg-popover/98 sm:max-w-xl">
        <SheetHeader className="border-b border-border/80">
          <SheetTitle>{item?.name ?? "Budget row"}</SheetTitle>
          <SheetDescription>
            Finance details, justification, risk, and account mapping.
          </SheetDescription>
        </SheetHeader>
        {line && item && account ? (
          <div className="flex flex-col gap-4 overflow-auto px-4 pb-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Account" value={`${account.code} ${account.name}`} />
              <Detail label="Worksheet" value={line.worksheet} />
              <Detail label="Owner" value={item.owner} />
              <Detail label="Review state" value={line.reviewState} />
              <Detail label="Prior approved" value={formatCurrencyFromCents(line.priorApprovedAmountCents)} />
              <Detail label="Current approved" value={formatCurrencyFromCents(line.currentApprovedAmountCents)} />
              <Detail label="Proposed" value={formatCurrencyFromCents(line.proposedAmountCents)} />
              <Detail label="Actual" value={formatCurrencyFromCents(line.actualAmountCents)} />
            </div>
            <DetailBlock label="Description" value={item.description} />
            <DetailBlock label="Business justification" value={line.businessJustification} />
            <DetailBlock label="Risk if not funded" value={line.riskIfNotFunded} />
            <DetailBlock label="Comments" value={line.comments || "No comments recorded."} />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function GridHead({
  label,
  align = "left",
  onClick,
}: {
  label: string;
  align?: "left" | "right";
  onClick: () => void;
}) {
  return (
    <th className={cn("px-3 py-2", align === "right" && "text-right")}>
      <button className="inline-flex items-center gap-1 hover:text-slate-100" onClick={onClick}>
        {label}
      </button>
    </th>
  );
}

function MoneyCell({
  value,
  onChange,
  testId,
}: {
  value: number;
  onChange: (value: string) => void;
  testId?: string;
}) {
  return (
    <td className="px-3 py-2 text-right">
      <Input
        data-testid={testId}
        aria-label="Currency amount"
        value={String(Math.round(value / 100))}
        inputMode="decimal"
        className="ml-auto h-7 w-28 border-border/80 bg-secondary/45 text-right font-mono text-sm"
        onChange={(event) => onChange(event.target.value)}
      />
    </td>
  );
}

function StatusBadge({ value }: { value: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-border bg-secondary/70",
        (value.includes("High") || value === "Needs Review" || value === "Blocked") &&
          "border-red-400/30 bg-red-400/10 text-red-300",
        (value.includes("Approved") || value === "Reviewed" || value === "Renewed" || value === "Completed") &&
          "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
        (value.includes("Quote") || value === "Updated" || value === "Planning") &&
          "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
        (value.includes("Negotiating") || value === "Under Review") &&
          "border-amber-400/30 bg-amber-400/10 text-amber-300"
      )}
    >
      {value}
    </Badge>
  );
}

function ControlSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<string | { value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-48 flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <select
        value={value}
        className="h-9 rounded-lg border border-border/80 bg-secondary/45 px-3 text-sm text-slate-100 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-slate-100">{value}</dd>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-secondary/35 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-100">{value}</p>
    </div>
  );
}

function parseDollarsToCents(value: string): number {
  const numeric = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(numeric) ? Math.round(numeric * 100) : 0;
}

function findItem(line: BudgetAnnualFinancial, items: BudgetItem[]): BudgetItem {
  return (
    items.find((item) => item.id === line.budgetItemId) ?? {
      id: line.budgetItemId,
      name: line.budgetItemId,
      description: "",
      owner: line.owner || "Unassigned",
      strategicProgramArea: "Other",
      active: true,
    }
  );
}

function findAccount(
  line: BudgetAnnualFinancial,
  accounts: BudgetAccount[]
): BudgetAccount {
  return (
    accounts.find((account) => account.id === line.accountId) ?? {
      id: line.accountId,
      code: "00000",
      name: "Unassigned",
      defaultWorksheet: "Operating Expenses",
      active: true,
      sortOrder: 999,
    }
  );
}

function matchesSearch(
  line: BudgetAnnualFinancial,
  items: BudgetItem[],
  searchTerm: string
): boolean {
  if (!searchTerm.trim()) {
    return true;
  }
  const item = findItem(line, items);
  const haystack = `${item.name} ${item.description} ${item.owner} ${line.comments} ${line.worksheet}`.toLowerCase();
  return haystack.includes(searchTerm.toLowerCase());
}

function compareAnnuals(
  a: BudgetAnnualFinancial,
  b: BudgetAnnualFinancial,
  sortKey: SortKey,
  items: BudgetItem[] = budgetWorkspaceData.items,
  accounts: BudgetAccount[] = budgetWorkspaceData.accounts
): number {
  switch (sortKey) {
    case "name":
      return findItem(a, items).name.localeCompare(findItem(b, items).name);
    case "account":
      return findAccount(a, accounts).code.localeCompare(findAccount(b, accounts).code);
    case "prior":
      return a.priorApprovedAmountCents - b.priorApprovedAmountCents;
    case "current":
      return a.currentApprovedAmountCents - b.currentApprovedAmountCents;
    case "change":
      return (
        dollarChange(a.currentApprovedAmountCents, a.proposedAmountCents) -
        dollarChange(b.currentApprovedAmountCents, b.proposedAmountCents)
      );
    case "owner":
      return findItem(a, items).owner.localeCompare(findItem(b, items).owner);
    case "proposed":
    default:
      return a.proposedAmountCents - b.proposedAmountCents;
  }
}

export { budgetWorksheetTypes };
