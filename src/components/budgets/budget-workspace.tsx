"use client";

import { Copy, FileDown, PanelRightOpen, Plus, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

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
  calculateConferenceLineTotal,
  calculateMembershipLineTotal,
  calculateNoticeDate,
  calculateProfessionalServicesLineTotal,
  calculateRenewalExposureByWindow,
  calculateRenewalIncrease,
  calculateRenewalPercentageIncrease,
  calculateRenewalSavings,
  calculateTrainingLineTotal,
  calculateTravelLineTotal,
  dollarChange,
  effectiveAccountId,
  formatCurrencyFromCents,
  formatPercent,
  percentageChange,
} from "@/lib/budgets/budget-calculations";
import { budgetWorkspaceData } from "@/lib/budgets/budget-data";
import { filterAnnualsByWorksheet } from "@/lib/budgets/budget-grouping";
import { rollForwardBudget } from "@/lib/budgets/budget-roll-forward";
import { cn } from "@/lib/utils";
import type {
  BudgetAccount,
  BudgetAnnualFinancial,
  BudgetItem,
  BudgetPlan,
  BudgetScenario,
  BudgetWorksheetType,
  ConferenceBudgetDetail,
  MaintenanceRenewal,
  MembershipBudgetDetail,
  ProfessionalServicesBudgetDetail,
  SoftwareBudgetDetail,
  TrainingBudgetDetail,
  TravelBudgetDetail,
} from "@/types/budget";

const visibleWorksheets: BudgetWorksheetType[] = [
  "Summary",
  "Software and SaaS",
  "Maintenance Renewals",
  "Training",
  "Conferences",
  "Travel",
  "Organizational Dues",
  "Professional Services",
  "Submission and Export",
];

const worksheetEntryTabs: BudgetWorksheetType[] = [
  "Software and SaaS",
  "Training",
  "Conferences",
  "Travel",
  "Organizational Dues",
  "Professional Services",
];

export function BudgetWorkspace() {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState("FY2027");
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    "scenario-fy-2027-initial"
  );
  const [activeWorksheet, setActiveWorksheet] =
    useState<BudgetWorksheetType>("Summary");
  const [searchTerm, setSearchTerm] = useState("");
  const [annuals, setAnnuals] = useState(budgetWorkspaceData.annualFinancials);
  const [items, setItems] = useState(budgetWorkspaceData.items);
  const [softwareDetails, setSoftwareDetails] = useState(
    budgetWorkspaceData.softwareDetails
  );
  const [trainingDetails, setTrainingDetails] = useState(
    budgetWorkspaceData.trainingDetails
  );
  const [conferenceDetails, setConferenceDetails] = useState(
    budgetWorkspaceData.conferenceDetails
  );
  const [travelDetails, setTravelDetails] = useState(
    budgetWorkspaceData.travelDetails
  );
  const [membershipDetails, setMembershipDetails] = useState(
    budgetWorkspaceData.membershipDetails
  );
  const [professionalServicesDetails, setProfessionalServicesDetails] =
    useState(budgetWorkspaceData.professionalServicesDetails);
  const [renewals, setRenewals] = useState(
    budgetWorkspaceData.maintenanceRenewals
  );
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const idSequenceRef = useRef(0);

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
  const priorPlan = useMemo(
    () =>
      budgetWorkspaceData.plans.find(
        (plan) => plan.fiscalYear === currentPlan.priorFiscalYear
      ) ?? null,
    [currentPlan.priorFiscalYear]
  );
  const priorScenario = useMemo(
    () =>
      priorPlan
        ? (budgetWorkspaceData.scenarios.find(
            (scenario) =>
              scenario.budgetPlanId === priorPlan.id && scenario.isActive
          ) ?? null)
        : null,
    [priorPlan]
  );

  const currentAnnuals = annuals
    .filter(
      (line) =>
        line.budgetPlanId === currentPlan.id &&
        (!activeScenario || line.scenarioId === activeScenario.id)
    )
    .toSorted((a, b) => a.sortOrder - b.sortOrder);
  const priorAnnuals =
    priorPlan && priorScenario
      ? annuals
          .filter(
            (line) =>
              line.budgetPlanId === priorPlan.id &&
              line.scenarioId === priorScenario.id
          )
          .toSorted((a, b) => a.sortOrder - b.sortOrder)
      : [];
  const currentRenewals = renewals
    .filter((renewal) => renewal.budgetPlanId === currentPlan.id)
    .toSorted((a, b) => a.renewalDate.localeCompare(b.renewalDate));
  const worksheetAnnuals = filterAnnualsByWorksheet(
    currentAnnuals,
    activeWorksheet
  ).filter((line) => matchesSearch(line, items, searchTerm));
  const selectedLine =
    currentAnnuals.find((line) => line.id === selectedLineId) ?? null;
  const selectedItem =
    selectedLine && items.find((item) => item.id === selectedLine.budgetItemId)
      ? (items.find((item) => item.id === selectedLine.budgetItemId) ?? null)
      : null;
  const totals = calculateBudgetTotals(
    currentAnnuals,
    budgetWorkspaceData.savingsRecords.filter(
      (record) => record.budgetPlanId === currentPlan.id
    )
  );
  const rollups = calculateAccountRollups(
    budgetWorkspaceData.accounts,
    currentAnnuals
  );
  const exposureWindows = calculateRenewalExposureByWindow(
    currentRenewals,
    new Date("2026-07-10T00:00:00.000Z")
  );
  const worksheetComparisonRows = worksheetEntryTabs
    .concat("Maintenance Renewals")
    .map((worksheet) => {
      const currentTotal = sumWorksheet(currentAnnuals, worksheet);
      const priorTotal = sumWorksheet(priorAnnuals, worksheet);
      return {
        worksheet,
        currentTotal,
        priorTotal,
        change: dollarChange(priorTotal, currentTotal),
        percentChange: percentageChange(priorTotal, currentTotal),
      };
    });
  const activeComparison =
    worksheetComparisonRows.find((row) => row.worksheet === activeWorksheet) ??
    null;
  const activeDefaultAccount =
    budgetWorkspaceData.accounts.find(
      (account) => account.defaultWorksheet === activeWorksheet
    ) ?? null;
  const selectedLineDefaultAccount =
    selectedLine &&
    budgetWorkspaceData.accounts.find(
      (account) => account.id === selectedLine.accountId
    )
      ? (budgetWorkspaceData.accounts.find(
          (account) => account.id === selectedLine.accountId
        ) ?? null)
      : null;

  const softwareDetailsByLine = useMemo(
    () =>
      new Map(
        softwareDetails.map((detail) => [detail.annualFinancialId, detail])
      ),
    [softwareDetails]
  );
  const trainingDetailsByLine = useMemo(
    () =>
      new Map(
        trainingDetails.map((detail) => [detail.annualFinancialId, detail])
      ),
    [trainingDetails]
  );
  const conferenceDetailsByLine = useMemo(
    () =>
      new Map(
        conferenceDetails.map((detail) => [detail.annualFinancialId, detail])
      ),
    [conferenceDetails]
  );
  const travelDetailsByLine = useMemo(
    () =>
      new Map(
        travelDetails.map((detail) => [detail.annualFinancialId, detail])
      ),
    [travelDetails]
  );
  const membershipDetailsByLine = useMemo(
    () =>
      new Map(
        membershipDetails.map((detail) => [detail.annualFinancialId, detail])
      ),
    [membershipDetails]
  );
  const professionalDetailsByLine = useMemo(
    () =>
      new Map(
        professionalServicesDetails.map((detail) => [
          detail.annualFinancialId,
          detail,
        ])
      ),
    [professionalServicesDetails]
  );

  function markDirty() {
    setHasUnsavedChanges(true);
  }

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

  function updateAnnualAmount(lineId: string, amountCents: number) {
    setAnnuals((current) =>
      current.map((line) =>
        line.id === lineId
          ? {
              ...line,
              proposedAmountCents: amountCents,
              requestedAmountCents: amountCents,
              forecastAmountCents: amountCents,
              reviewState: "Updated",
            }
          : line
      )
    );
    markDirty();
  }

  function updateAnnualText(
    lineId: string,
    field: "businessJustification" | "riskIfNotFunded" | "comments",
    value: string
  ) {
    setAnnuals((current) =>
      current.map((line) =>
        line.id === lineId
          ? { ...line, [field]: value, reviewState: "Updated" }
          : line
      )
    );
    markDirty();
  }

  function updateAnnualOverride(lineId: string, accountOverrideId: string) {
    setAnnuals((current) =>
      current.map((line) =>
        line.id === lineId
          ? {
              ...line,
              accountOverrideId:
                accountOverrideId === "default" ? undefined : accountOverrideId,
              reviewState: "Updated",
            }
          : line
      )
    );
    markDirty();
  }

  function updateItem(itemId: string, field: "name" | "owner", value: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
    markDirty();
  }

  function updateSoftwareDetail(
    lineId: string,
    field: keyof SoftwareBudgetDetail,
    value: string
  ) {
    setSoftwareDetails((current) =>
      current.map((detail) =>
        detail.annualFinancialId === lineId
          ? { ...detail, [field]: value }
          : detail
      )
    );
    if (field === "notes") {
      updateAnnualText(lineId, "comments", value);
      return;
    }
    markDirty();
  }

  function updateTrainingDetail(
    lineId: string,
    field: keyof TrainingBudgetDetail,
    value: string
  ) {
    setTrainingDetails((current) =>
      current.map((detail) => {
        if (detail.annualFinancialId !== lineId) {
          return detail;
        }
        const nextDetail: TrainingBudgetDetail = {
          ...detail,
          [field]:
            field === "quantity" || field === "costCents"
              ? parseDollarsOrCount(field === "quantity", value)
              : value,
        } as TrainingBudgetDetail;
        updateAnnualAmount(lineId, calculateTrainingLineTotal(nextDetail));
        return nextDetail;
      })
    );
    markDirty();
  }

  function updateConferenceDetail(
    lineId: string,
    field: keyof ConferenceBudgetDetail,
    value: string
  ) {
    setConferenceDetails((current) =>
      current.map((detail) => {
        if (detail.annualFinancialId !== lineId) {
          return detail;
        }
        const nextDetail: ConferenceBudgetDetail = {
          ...detail,
          [field]:
            field === "conference"
              ? value
              : parseDollarsOrCount(field === "attendees", value),
        } as ConferenceBudgetDetail;
        updateAnnualAmount(lineId, calculateConferenceLineTotal(nextDetail));
        return nextDetail;
      })
    );
    markDirty();
  }

  function updateTravelDetail(
    lineId: string,
    field: keyof TravelBudgetDetail,
    value: string
  ) {
    setTravelDetails((current) =>
      current.map((detail) => {
        if (detail.annualFinancialId !== lineId) {
          return detail;
        }
        const nextDetail: TravelBudgetDetail = {
          ...detail,
          [field]:
            field === "conferenceOrTrip"
              ? value
              : parseDollarsOrCount(field === "attendees", value),
        } as TravelBudgetDetail;
        updateAnnualAmount(lineId, calculateTravelLineTotal(nextDetail));
        return nextDetail;
      })
    );
    markDirty();
  }

  function updateMembershipDetail(
    lineId: string,
    field: keyof MembershipBudgetDetail,
    value: string
  ) {
    setMembershipDetails((current) =>
      current.map((detail) => {
        if (detail.annualFinancialId !== lineId) {
          return detail;
        }
        const nextDetail: MembershipBudgetDetail = {
          ...detail,
          [field]:
            field === "annualFeeCents" ? parseDollarsToCents(value) : value,
        } as MembershipBudgetDetail;
        updateAnnualAmount(lineId, calculateMembershipLineTotal(nextDetail));
        return nextDetail;
      })
    );
    markDirty();
  }

  function updateProfessionalDetail(
    lineId: string,
    field: keyof ProfessionalServicesBudgetDetail,
    value: string
  ) {
    setProfessionalServicesDetails((current) =>
      current.map((detail) => {
        if (detail.annualFinancialId !== lineId) {
          return detail;
        }
        const nextDetail: ProfessionalServicesBudgetDetail = {
          ...detail,
          [field]:
            field === "vendor" || field === "productOrEmployee"
              ? value
              : parseDollarsOrCount(field === "amount", value),
        } as ProfessionalServicesBudgetDetail;
        updateAnnualAmount(
          lineId,
          calculateProfessionalServicesLineTotal(nextDetail)
        );
        return nextDetail;
      })
    );
    markDirty();
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
      updateAnnualAmount(linkedAnnualId, amount);
    }
    markDirty();
  }

  function addRow() {
    const worksheet = activeWorksheet;
    if (!worksheetEntryTabs.includes(worksheet)) {
      return;
    }

    const seed = nextSeed(idSequenceRef);
    const itemId = `item-new-${seed}`;
    const lineId = `line-new-${seed}`;
    const defaultAccount = defaultAccountForWorksheet(worksheet);
    const nextSortOrder =
      Math.max(0, ...currentAnnuals.map((line) => line.sortOrder)) + 1;

    setItems((current) => [
      ...current,
      {
        id: itemId,
        name: `New ${worksheetLabel(worksheet)} line`,
        description: "",
        owner: "",
        strategicProgramArea: "Budget Planning",
        active: true,
      },
    ]);

    setAnnuals((current) => [
      ...current,
      {
        id: lineId,
        budgetPlanId: currentPlan.id,
        scenarioId: activeScenario?.id ?? selectedScenarioId,
        fiscalYear: currentPlan.fiscalYear,
        budgetItemId: itemId,
        accountId: defaultAccount.id,
        worksheet,
        sortOrder: nextSortOrder,
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
        fundingStatus: "Requested",
        recurrence: "Recurring",
        reviewState: "Needs Review",
        isNewRequest: true,
        isRecurring: true,
        isOneTime: false,
        isRetired: false,
        comments: "",
        businessJustification:
          "Supports cybersecurity risk reduction and Finance planning visibility.",
        riskIfNotFunded:
          "Service disruption, control degradation, or delayed security roadmap execution.",
        owner: "",
      },
    ]);

    if (worksheet === "Software and SaaS") {
      setSoftwareDetails((current) => [
        ...current,
        {
          annualFinancialId: lineId,
          reseller: "",
          requestType: "New",
          notes: "",
        },
      ]);
    }
    if (worksheet === "Training") {
      setTrainingDetails((current) => [
        ...current,
        {
          annualFinancialId: lineId,
          training: "",
          quantity: 1,
          costCents: 0,
        },
      ]);
    }
    if (worksheet === "Conferences") {
      setConferenceDetails((current) => [
        ...current,
        {
          annualFinancialId: lineId,
          conference: "",
          attendees: 1,
          registrationFeeCents: 0,
        },
      ]);
    }
    if (worksheet === "Travel") {
      setTravelDetails((current) => [
        ...current,
        {
          annualFinancialId: lineId,
          conferenceOrTrip: "",
          attendees: 1,
          airfareCents: 0,
          hotelCents: 0,
          perDiemCents: 0,
          luggageCents: 0,
          parkingCents: 0,
          taxiUberCents: 0,
        },
      ]);
    }
    if (worksheet === "Organizational Dues") {
      setMembershipDetails((current) => [
        ...current,
        {
          annualFinancialId: lineId,
          employee: "",
          organization: "",
          certification: "",
          annualFeeCents: 0,
        },
      ]);
    }
    if (worksheet === "Professional Services") {
      setProfessionalServicesDetails((current) => [
        ...current,
        {
          annualFinancialId: lineId,
          vendor: "",
          productOrEmployee: "",
          amount: 1,
          rateCents: 0,
        },
      ]);
    }

    setSelectedLineId(lineId);
    markDirty();
  }

  function duplicateRow(line: BudgetAnnualFinancial) {
    const seed = nextSeed(idSequenceRef);
    const nextItemId = `item-dup-${seed}`;
    const nextLineId = `line-dup-${seed}`;
    const item = findItem(line, items);
    const clonedItem: BudgetItem = {
      ...item,
      id: nextItemId,
      name: `${item.name} Copy`,
    };
    const clonedLine: BudgetAnnualFinancial = {
      ...line,
      id: nextLineId,
      budgetItemId: nextItemId,
      sortOrder:
        Math.max(0, ...currentAnnuals.map((candidate) => candidate.sortOrder)) +
        1,
      reviewState: "Updated",
    };

    setItems((current) => [...current, clonedItem]);
    setAnnuals((current) => [...current, clonedLine]);

    if (line.worksheet === "Software and SaaS") {
      const detail = softwareDetailsByLine.get(line.id);
      if (detail) {
        setSoftwareDetails((current) => [
          ...current,
          { ...detail, annualFinancialId: nextLineId },
        ]);
      }
    }
    if (line.worksheet === "Training") {
      const detail = trainingDetailsByLine.get(line.id);
      if (detail) {
        setTrainingDetails((current) => [
          ...current,
          { ...detail, annualFinancialId: nextLineId },
        ]);
      }
    }
    if (line.worksheet === "Conferences") {
      const detail = conferenceDetailsByLine.get(line.id);
      if (detail) {
        setConferenceDetails((current) => [
          ...current,
          { ...detail, annualFinancialId: nextLineId },
        ]);
      }
    }
    if (line.worksheet === "Travel") {
      const detail = travelDetailsByLine.get(line.id);
      if (detail) {
        setTravelDetails((current) => [
          ...current,
          { ...detail, annualFinancialId: nextLineId },
        ]);
      }
    }
    if (line.worksheet === "Organizational Dues") {
      const detail = membershipDetailsByLine.get(line.id);
      if (detail) {
        setMembershipDetails((current) => [
          ...current,
          { ...detail, annualFinancialId: nextLineId },
        ]);
      }
    }
    if (line.worksheet === "Professional Services") {
      const detail = professionalDetailsByLine.get(line.id);
      if (detail) {
        setProfessionalServicesDetails((current) => [
          ...current,
          { ...detail, annualFinancialId: nextLineId },
        ]);
      }
    }

    setSelectedLineId(nextLineId);
    markDirty();
  }

  function deleteRow(lineId: string) {
    const line = annuals.find((candidate) => candidate.id === lineId);
    if (!line) {
      return;
    }
    setAnnuals((current) =>
      current.filter((candidate) => candidate.id !== lineId)
    );
    setSoftwareDetails((current) =>
      current.filter((detail) => detail.annualFinancialId !== lineId)
    );
    setTrainingDetails((current) =>
      current.filter((detail) => detail.annualFinancialId !== lineId)
    );
    setConferenceDetails((current) =>
      current.filter((detail) => detail.annualFinancialId !== lineId)
    );
    setTravelDetails((current) =>
      current.filter((detail) => detail.annualFinancialId !== lineId)
    );
    setMembershipDetails((current) =>
      current.filter((detail) => detail.annualFinancialId !== lineId)
    );
    setProfessionalServicesDetails((current) =>
      current.filter((detail) => detail.annualFinancialId !== lineId)
    );

    const stillReferenced = annuals.some(
      (candidate) =>
        candidate.id !== lineId && candidate.budgetItemId === line.budgetItemId
    );
    if (!stillReferenced) {
      setItems((current) =>
        current.filter((item) => item.id !== line.budgetItemId)
      );
    }
    setSelectedLineId((current) => (current === lineId ? null : current));
    markDirty();
  }

  function runRollForward() {
    const result = rollForwardBudget(annuals, renewals, {
      sourceFiscalYear: currentPlan.priorFiscalYear ?? "FY2026",
      targetPlan: currentPlan,
      targetScenario: activeScenario,
      defaultInflationPercent: 4,
      excludeRetired: true,
      carryForwardRenewalQuotes: true,
    });

    setAnnuals(result.annualFinancials);
    setHasUnsavedChanges(true);
  }

  return (
    <WorkspaceShell
      title={`${selectedFiscalYear} Cybersecurity Budget`}
      description="Finance-balanced planning workspace for category-specific budget entry, prior-year comparison, and configured account rollups."
      actionLabel="Roll Forward"
    >
      <div className="flex flex-col gap-4">
        <WorkspaceHeader
          currentPlan={currentPlan}
          scenarios={scenarios}
          selectedScenarioId={selectedScenarioId}
          selectedFiscalYear={selectedFiscalYear}
          hasUnsavedChanges={hasUnsavedChanges}
          activeWorksheet={activeWorksheet}
          searchTerm={searchTerm}
          onScenarioChange={setSelectedScenarioId}
          onFiscalYearChange={selectFiscalYear}
          onSearchChange={setSearchTerm}
          onRollForward={runRollForward}
          onAddRow={addRow}
          onShowContext={() => setContextOpen(true)}
        />

        <WorksheetTabs
          activeWorksheet={activeWorksheet}
          onChange={setActiveWorksheet}
        />

        {activeWorksheet === "Summary" ? (
          <SummaryWorksheet
            totals={totals}
            priorTotals={calculateBudgetTotals(priorAnnuals)}
            comparisonRows={worksheetComparisonRows}
            rollups={rollups}
            accounts={budgetWorkspaceData.accounts}
            renewals={currentRenewals}
          />
        ) : activeWorksheet === "Maintenance Renewals" ? (
          <div className="flex flex-col gap-4">
            <WorksheetMetrics
              label="Maintenance Renewals"
              currentTotal={sumWorksheet(
                currentAnnuals,
                "Maintenance Renewals"
              )}
              priorTotal={sumWorksheet(priorAnnuals, "Maintenance Renewals")}
              exposureTotal={currentRenewals.reduce(
                (total, renewal) => total + renewal.negotiatedCostCents,
                0
              )}
            />
            <MaintenanceRenewalGrid
              renewals={currentRenewals}
              onAmountChange={updateRenewalAmount}
            />
          </div>
        ) : activeWorksheet === "Submission and Export" ? (
          <SubmissionWorksheet currentPlan={currentPlan} totals={totals} />
        ) : (
          <div className="flex flex-col gap-4">
            {activeComparison ? (
              <WorksheetMetrics
                label={activeWorksheet}
                currentTotal={activeComparison.currentTotal}
                priorTotal={activeComparison.priorTotal}
                exposureTotal={
                  activeWorksheet === "Software and SaaS"
                    ? currentRenewals
                        .filter(
                          (renewal) => renewal.fundingAccountId === "acct-62094"
                        )
                        .reduce(
                          (total, renewal) =>
                            total + renewal.negotiatedCostCents,
                          0
                        )
                    : activeComparison.currentTotal
                }
              />
            ) : null}

            <EntryWorksheetGrid
              worksheet={activeWorksheet}
              lines={worksheetAnnuals}
              items={items}
              softwareDetailsByLine={softwareDetailsByLine}
              trainingDetailsByLine={trainingDetailsByLine}
              conferenceDetailsByLine={conferenceDetailsByLine}
              travelDetailsByLine={travelDetailsByLine}
              membershipDetailsByLine={membershipDetailsByLine}
              professionalDetailsByLine={professionalDetailsByLine}
              onItemChange={updateItem}
              onSoftwareDetailChange={updateSoftwareDetail}
              onTrainingDetailChange={updateTrainingDetail}
              onConferenceDetailChange={updateConferenceDetail}
              onTravelDetailChange={updateTravelDetail}
              onMembershipDetailChange={updateMembershipDetail}
              onProfessionalDetailChange={updateProfessionalDetail}
              onAnnualAmountChange={updateAnnualAmount}
              onOpenDetail={setSelectedLineId}
              onDuplicate={duplicateRow}
              onDelete={deleteRow}
            />

            {activeComparison ? (
              <WorksheetComparisonPanel
                comparison={activeComparison}
                defaultAccount={activeDefaultAccount}
                priorPlan={priorPlan}
              />
            ) : null}
          </div>
        )}
      </div>

      <BudgetContextSheet
        open={contextOpen}
        onOpenChange={setContextOpen}
        currentPlan={currentPlan}
        totals={totals}
        exposureWindows={exposureWindows}
        rollups={rollups}
      />

      <BudgetRowDetail
        line={selectedLine}
        item={selectedItem}
        defaultAccount={selectedLineDefaultAccount}
        accounts={budgetWorkspaceData.accounts}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLineId(null);
          }
        }}
        onOverrideChange={updateAnnualOverride}
        onTextChange={updateAnnualText}
      />
    </WorkspaceShell>
  );
}

function WorkspaceHeader({
  currentPlan,
  scenarios,
  selectedScenarioId,
  selectedFiscalYear,
  hasUnsavedChanges,
  activeWorksheet,
  searchTerm,
  onScenarioChange,
  onFiscalYearChange,
  onSearchChange,
  onRollForward,
  onAddRow,
  onShowContext,
}: {
  currentPlan: BudgetPlan;
  scenarios: BudgetScenario[];
  selectedScenarioId: string;
  selectedFiscalYear: string;
  hasUnsavedChanges: boolean;
  activeWorksheet: BudgetWorksheetType;
  searchTerm: string;
  onScenarioChange: (value: string) => void;
  onFiscalYearChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onRollForward: () => void;
  onAddRow: () => void;
  onShowContext: () => void;
}) {
  const canAddRow = worksheetEntryTabs.includes(activeWorksheet);

  return (
    <div className="rounded-lg border border-border/80 bg-card/95 p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
          <ControlSelect
            label="Fiscal Year"
            value={selectedFiscalYear}
            options={budgetWorkspaceData.fiscalYears.map((year) => year.label)}
            onChange={onFiscalYearChange}
          />
          <ControlSelect
            label="Scenario"
            value={selectedScenarioId}
            options={scenarios.map((scenario) => ({
              value: scenario.id,
              label: scenario.label,
            }))}
            onChange={onScenarioChange}
          />
          <label className="flex min-w-56 flex-col gap-1 text-xs text-muted-foreground">
            Search
            <Input
              aria-label="Search budget rows"
              value={searchTerm}
              placeholder={`Search ${worksheetLabel(activeWorksheet).toLowerCase()} rows`}
              className="h-9 border-border/80 bg-secondary/45 text-sm"
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasUnsavedChanges ? (
            <Badge
              variant="outline"
              className="border-amber-400/30 bg-amber-400/10 text-amber-300"
            >
              Unsaved local changes
            </Badge>
          ) : (
            <Badge variant="outline" className="border-border bg-secondary/60">
              {currentPlan.status}
            </Badge>
          )}
          <Button
            variant="outline"
            className="border-border/80"
            onClick={onShowContext}
          >
            Show Context
          </Button>
          {canAddRow ? (
            <Button variant="secondary" onClick={onAddRow}>
              <Plus data-icon="inline-start" />
              Add Row
            </Button>
          ) : null}
          <Button
            className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            onClick={onRollForward}
          >
            <FileDown data-icon="inline-start" />
            Roll Forward
          </Button>
        </div>
      </div>
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
    <nav
      className="flex overflow-x-auto rounded-lg border border-border/80 bg-card/95 p-1"
      aria-label="Budget worksheets"
    >
      {visibleWorksheets.map((worksheet) => (
        <button
          key={worksheet}
          className={cn(
            "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-slate-100",
            activeWorksheet === worksheet &&
              "bg-secondary/80 text-slate-100 shadow-[0_0_0_1px_rgba(34,199,217,0.12)]"
          )}
          onClick={() => onChange(worksheet)}
        >
          {worksheet}
        </button>
      ))}
    </nav>
  );
}

function SummaryWorksheet({
  totals,
  priorTotals,
  comparisonRows,
  rollups,
  accounts,
  renewals,
}: {
  totals: ReturnType<typeof calculateBudgetTotals>;
  priorTotals: ReturnType<typeof calculateBudgetTotals>;
  comparisonRows: Array<{
    worksheet: BudgetWorksheetType;
    currentTotal: number;
    priorTotal: number;
    change: number;
    percentChange: number | null;
  }>;
  rollups: ReturnType<typeof calculateAccountRollups>;
  accounts: BudgetAccount[];
  renewals: MaintenanceRenewal[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard
          label="Requested Total"
          value={formatCurrencyFromCents(totals.totalProposedCents)}
        />
        <StatCard
          label="Prior Year Total"
          value={formatCurrencyFromCents(priorTotals.totalProposedCents)}
        />
        <StatCard
          label="Net Change"
          value={formatCurrencyFromCents(totals.netChangeCents)}
          tone={totals.netChangeCents > 0 ? "bad" : "good"}
        />
        <StatCard
          label="Renewal Exposure"
          value={formatCurrencyFromCents(
            renewals.reduce(
              (total, renewal) => total + renewal.negotiatedCostCents,
              0
            )
          )}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border/80 bg-card/95">
        <div className="border-b border-border/80 px-4 py-3">
          <h2 className="font-semibold text-slate-100">Budget Comparison</h2>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#07111d] text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Worksheet</th>
                <th className="px-3 py-2 text-right">Current Total</th>
                <th className="px-3 py-2 text-right">Prior Year</th>
                <th className="px-3 py-2 text-right">Dollar Change</th>
                <th className="px-3 py-2 text-right">Percent Change</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.worksheet} className="border-b border-border/70">
                  <td className="px-3 py-2 text-slate-100">{row.worksheet}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatCurrencyFromCents(row.currentTotal)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatCurrencyFromCents(row.priorTotal)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-mono",
                      row.change > 0 ? "text-red-300" : "text-emerald-300"
                    )}
                  >
                    {formatCurrencyFromCents(row.change)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-mono",
                      row.change > 0 ? "text-red-300" : "text-emerald-300"
                    )}
                  >
                    {formatPercent(row.percentChange)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-lg border border-border/80 bg-card/95">
          <div className="border-b border-border/80 px-4 py-3">
            <h2 className="font-semibold text-slate-100">Account Rollup</h2>
          </div>
          <div className="overflow-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-[#07111d] text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Account</th>
                  <th className="px-3 py-2 text-right">Prior Year</th>
                  <th className="px-3 py-2 text-right">Requested</th>
                  <th className="px-3 py-2 text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {rollups.map((rollup) => (
                  <tr
                    key={rollup.accountId}
                    className="border-b border-border/70"
                  >
                    <td className="px-3 py-2">
                      <div className="font-mono text-xs text-cyan-200">
                        {rollup.accountCode}
                      </div>
                      <div className="text-slate-100">{rollup.accountName}</div>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatCurrencyFromCents(rollup.currentApprovedCents)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatCurrencyFromCents(rollup.proposedCents)}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right font-mono",
                        rollup.dollarChangeCents > 0
                          ? "text-red-300"
                          : "text-emerald-300"
                      )}
                    >
                      {formatCurrencyFromCents(rollup.dollarChangeCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border/80 bg-card/95">
          <div className="border-b border-border/80 px-4 py-3">
            <h2 className="font-semibold text-slate-100">
              Default Account Mapping
            </h2>
          </div>
          <div className="divide-y divide-border/70">
            {worksheetEntryTabs
              .concat("Maintenance Renewals")
              .map((worksheet) => {
                const account = accounts.find(
                  (candidate) => candidate.defaultWorksheet === worksheet
                );
                return (
                  <div
                    key={worksheet}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-slate-100">{worksheet}</p>
                      <p className="text-xs text-muted-foreground">
                        Hidden in entry grids. Override from row details when
                        needed.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs text-cyan-200">
                        {account?.code ?? "n/a"}
                      </p>
                      <p className="text-sm text-slate-100">
                        {account?.name ?? "No default account"}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

function WorksheetMetrics({
  label,
  currentTotal,
  priorTotal,
  exposureTotal,
}: {
  label: string;
  currentTotal: number;
  priorTotal: number;
  exposureTotal: number;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      <StatCard
        label={`${label} Total`}
        value={formatCurrencyFromCents(currentTotal)}
      />
      <StatCard
        label="Prior Year"
        value={formatCurrencyFromCents(priorTotal)}
      />
      <StatCard
        label="Dollar Change"
        value={formatCurrencyFromCents(dollarChange(priorTotal, currentTotal))}
        tone={currentTotal > priorTotal ? "bad" : "good"}
      />
      <StatCard
        label="Context Total"
        value={formatCurrencyFromCents(exposureTotal)}
      />
    </div>
  );
}

function EntryWorksheetGrid({
  worksheet,
  lines,
  items,
  softwareDetailsByLine,
  trainingDetailsByLine,
  conferenceDetailsByLine,
  travelDetailsByLine,
  membershipDetailsByLine,
  professionalDetailsByLine,
  onItemChange,
  onSoftwareDetailChange,
  onTrainingDetailChange,
  onConferenceDetailChange,
  onTravelDetailChange,
  onMembershipDetailChange,
  onProfessionalDetailChange,
  onAnnualAmountChange,
  onOpenDetail,
  onDuplicate,
  onDelete,
}: {
  worksheet: BudgetWorksheetType;
  lines: BudgetAnnualFinancial[];
  items: BudgetItem[];
  softwareDetailsByLine: Map<string, SoftwareBudgetDetail>;
  trainingDetailsByLine: Map<string, TrainingBudgetDetail>;
  conferenceDetailsByLine: Map<string, ConferenceBudgetDetail>;
  travelDetailsByLine: Map<string, TravelBudgetDetail>;
  membershipDetailsByLine: Map<string, MembershipBudgetDetail>;
  professionalDetailsByLine: Map<string, ProfessionalServicesBudgetDetail>;
  onItemChange: (
    itemId: string,
    field: "name" | "owner",
    value: string
  ) => void;
  onSoftwareDetailChange: (
    lineId: string,
    field: keyof SoftwareBudgetDetail,
    value: string
  ) => void;
  onTrainingDetailChange: (
    lineId: string,
    field: keyof TrainingBudgetDetail,
    value: string
  ) => void;
  onConferenceDetailChange: (
    lineId: string,
    field: keyof ConferenceBudgetDetail,
    value: string
  ) => void;
  onTravelDetailChange: (
    lineId: string,
    field: keyof TravelBudgetDetail,
    value: string
  ) => void;
  onMembershipDetailChange: (
    lineId: string,
    field: keyof MembershipBudgetDetail,
    value: string
  ) => void;
  onProfessionalDetailChange: (
    lineId: string,
    field: keyof ProfessionalServicesBudgetDetail,
    value: string
  ) => void;
  onAnnualAmountChange: (lineId: string, amountCents: number) => void;
  onOpenDetail: (lineId: string) => void;
  onDuplicate: (line: BudgetAnnualFinancial) => void;
  onDelete: (lineId: string) => void;
}) {
  const totals = calculateBudgetTotals(lines);

  return (
    <div className="overflow-hidden rounded-lg border border-border/80 bg-card/95">
      <div className="overflow-auto">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="bg-[#07111d] text-xs text-muted-foreground">
            <tr>
              {worksheet === "Software and SaaS" ? (
                <>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Reseller</th>
                  <th className="px-3 py-2">N/R</th>
                  <th className="px-3 py-2">Replaced Software</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2 text-right">Budget Amount</th>
                  <th className="px-3 py-2">Notes</th>
                </>
              ) : null}
              {worksheet === "Training" ? (
                <>
                  <th className="px-3 py-2">Training</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Cost</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </>
              ) : null}
              {worksheet === "Conferences" ? (
                <>
                  <th className="px-3 py-2">Conference</th>
                  <th className="px-3 py-2 text-right">Attendees</th>
                  <th className="px-3 py-2 text-right">Registration Fee</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </>
              ) : null}
              {worksheet === "Travel" ? (
                <>
                  <th className="px-3 py-2">Conference/Trip</th>
                  <th className="px-3 py-2 text-right">Number of Attendees</th>
                  <th className="px-3 py-2 text-right">Air</th>
                  <th className="px-3 py-2 text-right">Hotel</th>
                  <th className="px-3 py-2 text-right">Per Diem</th>
                  <th className="px-3 py-2 text-right">Luggage</th>
                  <th className="px-3 py-2 text-right">Parking</th>
                  <th className="px-3 py-2 text-right">Taxi/Uber</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </>
              ) : null}
              {worksheet === "Organizational Dues" ? (
                <>
                  <th className="px-3 py-2">Employee</th>
                  <th className="px-3 py-2">Organization</th>
                  <th className="px-3 py-2">Certification</th>
                  <th className="px-3 py-2 text-right">Annual Fee</th>
                </>
              ) : null}
              {worksheet === "Professional Services" ? (
                <>
                  <th className="px-3 py-2">Vendor</th>
                  <th className="px-3 py-2">Product/Employee</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-right">Rate</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </>
              ) : null}
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const item = findItem(line, items);
              const softwareDetail = softwareDetailsByLine.get(line.id);
              const trainingDetail = trainingDetailsByLine.get(line.id);
              const conferenceDetail = conferenceDetailsByLine.get(line.id);
              const travelDetail = travelDetailsByLine.get(line.id);
              const membershipDetail = membershipDetailsByLine.get(line.id);
              const professionalDetail = professionalDetailsByLine.get(line.id);

              return (
                <tr
                  key={line.id}
                  className="border-b border-border/70 align-top hover:bg-secondary/35"
                >
                  {worksheet === "Software and SaaS" && softwareDetail ? (
                    <>
                      <td className="px-3 py-2">
                        <Input
                          aria-label={`Item for ${line.id}`}
                          value={item.name}
                          className="h-9 border-border/80 bg-secondary/45 text-sm"
                          onChange={(event) =>
                            onItemChange(item.id, "name", event.target.value)
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={softwareDetail.reseller ?? ""}
                          className="h-9 border-border/80 bg-secondary/45 text-sm"
                          onChange={(event) =>
                            onSoftwareDetailChange(
                              line.id,
                              "reseller",
                              event.target.value
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          aria-label={`Request type for ${item.name}`}
                          value={softwareDetail.requestType}
                          className="h-9 rounded-lg border border-border/80 bg-secondary/45 px-3 text-sm text-slate-100 outline-none"
                          onChange={(event) =>
                            onSoftwareDetailChange(
                              line.id,
                              "requestType",
                              event.target.value
                            )
                          }
                        >
                          <option value="New">N</option>
                          <option value="Replacement">R</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={softwareDetail.replaces ?? ""}
                          placeholder={
                            softwareDetail.requestType === "Replacement"
                              ? "System being replaced"
                              : "Only required for replacements"
                          }
                          className="h-9 border-border/80 bg-secondary/45 text-sm"
                          onChange={(event) =>
                            onSoftwareDetailChange(
                              line.id,
                              "replaces",
                              event.target.value
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={item.owner}
                          className="h-9 border-border/80 bg-secondary/45 text-sm"
                          onChange={(event) =>
                            onItemChange(item.id, "owner", event.target.value)
                          }
                        />
                      </td>
                      <MoneyInputCell
                        testId={`software-budget-${line.id}`}
                        value={line.proposedAmountCents}
                        onChange={(value) =>
                          onAnnualAmountChange(
                            line.id,
                            parseDollarsToCents(value)
                          )
                        }
                      />
                      <td className="px-3 py-2">
                        <Input
                          value={softwareDetail.notes}
                          className="h-9 border-border/80 bg-secondary/45 text-sm"
                          onChange={(event) =>
                            onSoftwareDetailChange(
                              line.id,
                              "notes",
                              event.target.value
                            )
                          }
                        />
                      </td>
                    </>
                  ) : null}

                  {worksheet === "Training" && trainingDetail ? (
                    <>
                      <td className="px-3 py-2">
                        <Input
                          value={trainingDetail.training}
                          className="h-9 border-border/80 bg-secondary/45 text-sm"
                          onChange={(event) =>
                            onTrainingDetailChange(
                              line.id,
                              "training",
                              event.target.value
                            )
                          }
                        />
                      </td>
                      <NumberInputCell
                        value={trainingDetail.quantity}
                        onChange={(value) =>
                          onTrainingDetailChange(line.id, "quantity", value)
                        }
                      />
                      <MoneyInputCell
                        value={trainingDetail.costCents}
                        onChange={(value) =>
                          onTrainingDetailChange(line.id, "costCents", value)
                        }
                      />
                      <td className="px-3 py-2 text-right font-mono text-slate-100">
                        {formatCurrencyFromCents(line.proposedAmountCents)}
                      </td>
                    </>
                  ) : null}

                  {worksheet === "Conferences" && conferenceDetail ? (
                    <>
                      <td className="px-3 py-2">
                        <Input
                          value={conferenceDetail.conference}
                          className="h-9 border-border/80 bg-secondary/45 text-sm"
                          onChange={(event) =>
                            onConferenceDetailChange(
                              line.id,
                              "conference",
                              event.target.value
                            )
                          }
                        />
                      </td>
                      <NumberInputCell
                        value={conferenceDetail.attendees}
                        onChange={(value) =>
                          onConferenceDetailChange(line.id, "attendees", value)
                        }
                      />
                      <MoneyInputCell
                        value={conferenceDetail.registrationFeeCents}
                        onChange={(value) =>
                          onConferenceDetailChange(
                            line.id,
                            "registrationFeeCents",
                            value
                          )
                        }
                      />
                      <td className="px-3 py-2 text-right font-mono text-slate-100">
                        {formatCurrencyFromCents(line.proposedAmountCents)}
                      </td>
                    </>
                  ) : null}

                  {worksheet === "Travel" && travelDetail ? (
                    <>
                      <td className="px-3 py-2">
                        <Input
                          value={travelDetail.conferenceOrTrip}
                          className="h-9 border-border/80 bg-secondary/45 text-sm"
                          onChange={(event) =>
                            onTravelDetailChange(
                              line.id,
                              "conferenceOrTrip",
                              event.target.value
                            )
                          }
                        />
                      </td>
                      <NumberInputCell
                        value={travelDetail.attendees}
                        onChange={(value) =>
                          onTravelDetailChange(line.id, "attendees", value)
                        }
                      />
                      <MoneyInputCell
                        value={travelDetail.airfareCents}
                        onChange={(value) =>
                          onTravelDetailChange(line.id, "airfareCents", value)
                        }
                      />
                      <MoneyInputCell
                        value={travelDetail.hotelCents}
                        onChange={(value) =>
                          onTravelDetailChange(line.id, "hotelCents", value)
                        }
                      />
                      <MoneyInputCell
                        value={travelDetail.perDiemCents}
                        onChange={(value) =>
                          onTravelDetailChange(line.id, "perDiemCents", value)
                        }
                      />
                      <MoneyInputCell
                        value={travelDetail.luggageCents}
                        onChange={(value) =>
                          onTravelDetailChange(line.id, "luggageCents", value)
                        }
                      />
                      <MoneyInputCell
                        value={travelDetail.parkingCents}
                        onChange={(value) =>
                          onTravelDetailChange(line.id, "parkingCents", value)
                        }
                      />
                      <MoneyInputCell
                        value={travelDetail.taxiUberCents}
                        onChange={(value) =>
                          onTravelDetailChange(line.id, "taxiUberCents", value)
                        }
                      />
                      <td className="px-3 py-2 text-right font-mono text-slate-100">
                        {formatCurrencyFromCents(line.proposedAmountCents)}
                      </td>
                    </>
                  ) : null}

                  {worksheet === "Organizational Dues" && membershipDetail ? (
                    <>
                      <td className="px-3 py-2">
                        <Input
                          value={membershipDetail.employee}
                          className="h-9 border-border/80 bg-secondary/45 text-sm"
                          onChange={(event) =>
                            onMembershipDetailChange(
                              line.id,
                              "employee",
                              event.target.value
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={membershipDetail.organization}
                          className="h-9 border-border/80 bg-secondary/45 text-sm"
                          onChange={(event) =>
                            onMembershipDetailChange(
                              line.id,
                              "organization",
                              event.target.value
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={membershipDetail.certification}
                          className="h-9 border-border/80 bg-secondary/45 text-sm"
                          onChange={(event) =>
                            onMembershipDetailChange(
                              line.id,
                              "certification",
                              event.target.value
                            )
                          }
                        />
                      </td>
                      <MoneyInputCell
                        value={membershipDetail.annualFeeCents}
                        onChange={(value) =>
                          onMembershipDetailChange(
                            line.id,
                            "annualFeeCents",
                            value
                          )
                        }
                      />
                    </>
                  ) : null}

                  {worksheet === "Professional Services" &&
                  professionalDetail ? (
                    <>
                      <td className="px-3 py-2">
                        <Input
                          value={professionalDetail.vendor}
                          className="h-9 border-border/80 bg-secondary/45 text-sm"
                          onChange={(event) =>
                            onProfessionalDetailChange(
                              line.id,
                              "vendor",
                              event.target.value
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={professionalDetail.productOrEmployee}
                          className="h-9 border-border/80 bg-secondary/45 text-sm"
                          onChange={(event) =>
                            onProfessionalDetailChange(
                              line.id,
                              "productOrEmployee",
                              event.target.value
                            )
                          }
                        />
                      </td>
                      <NumberInputCell
                        value={professionalDetail.amount}
                        onChange={(value) =>
                          onProfessionalDetailChange(line.id, "amount", value)
                        }
                      />
                      <MoneyInputCell
                        value={professionalDetail.rateCents}
                        onChange={(value) =>
                          onProfessionalDetailChange(
                            line.id,
                            "rateCents",
                            value
                          )
                        }
                      />
                      <td className="px-3 py-2 text-right font-mono text-slate-100">
                        {formatCurrencyFromCents(line.proposedAmountCents)}
                      </td>
                    </>
                  ) : null}

                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Open details for ${item.name}`}
                        onClick={() => onOpenDetail(line.id)}
                      >
                        <PanelRightOpen />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Duplicate ${item.name}`}
                        onClick={() => onDuplicate(line)}
                      >
                        <Copy />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-xs"
                        aria-label={`Delete ${item.name}`}
                        onClick={() => onDelete(line.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-[#082634] text-sm font-semibold text-slate-50">
            <tr>
              <td
                className="px-3 py-2"
                colSpan={columnCountForWorksheet(worksheet)}
              >
                Total ({lines.length})
              </td>
              <td
                data-testid="worksheet-total"
                className="px-3 py-2 text-right font-mono"
              >
                {formatCurrencyFromCents(totals.totalProposedCents)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function MaintenanceRenewalGrid({
  renewals,
  onAmountChange,
}: {
  renewals: MaintenanceRenewal[];
  onAmountChange: (
    renewalId: string,
    field: "renewalQuoteCents" | "negotiatedCostCents",
    value: string
  ) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/80 bg-card/95">
      <div className="overflow-auto">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="bg-[#07111d] text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Vendor</th>
              <th className="px-3 py-2">Product or Service</th>
              <th className="px-3 py-2">Reseller</th>
              <th className="px-3 py-2 text-right">Current Cost</th>
              <th className="px-3 py-2 text-right">Renewal Quote</th>
              <th className="px-3 py-2 text-right">Increase</th>
              <th className="px-3 py-2 text-right">Negotiated Cost</th>
              <th className="px-3 py-2 text-right">Savings</th>
              <th className="px-3 py-2">Renewal Date</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {renewals.map((renewal) => {
              const increase = calculateRenewalIncrease(renewal);
              const percent = calculateRenewalPercentageIncrease(renewal);
              const savings = calculateRenewalSavings(renewal);

              return (
                <tr
                  key={renewal.id}
                  className="border-b border-border/70 hover:bg-secondary/35"
                >
                  <td className="px-3 py-2 font-medium text-slate-100">
                    {renewal.vendor}
                  </td>
                  <td className="px-3 py-2">{renewal.productOrService}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {renewal.reseller ?? "Direct"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatCurrencyFromCents(renewal.currentCostCents)}
                  </td>
                  <MoneyInputCell
                    testId={`renewal-quote-${renewal.id}`}
                    value={renewal.renewalQuoteCents}
                    onChange={(value) =>
                      onAmountChange(renewal.id, "renewalQuoteCents", value)
                    }
                  />
                  <td
                    data-testid={`renewal-increase-${renewal.id}`}
                    className={cn(
                      "px-3 py-2 text-right font-mono",
                      increase > 0 ? "text-red-300" : "text-emerald-300"
                    )}
                  >
                    {formatCurrencyFromCents(increase)}
                    <span className="block text-xs">
                      {formatPercent(percent)}
                    </span>
                  </td>
                  <MoneyInputCell
                    value={renewal.negotiatedCostCents}
                    onChange={(value) =>
                      onAmountChange(renewal.id, "negotiatedCostCents", value)
                    }
                  />
                  <td
                    data-testid={`renewal-savings-${renewal.id}`}
                    className="px-3 py-2 text-right font-mono text-emerald-300"
                  >
                    {formatCurrencyFromCents(savings)}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {renewal.renewalDate}
                    <span className="mt-1 block">
                      Notice{" "}
                      {calculateNoticeDate(
                        renewal.renewalDate,
                        renewal.noticePeriodDays
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2">{renewal.renewalOwner}</td>
                  <td className="px-3 py-2">
                    <StatusBadge value={renewal.renewalStatus} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorksheetComparisonPanel({
  comparison,
  defaultAccount,
  priorPlan,
}: {
  comparison: {
    worksheet: BudgetWorksheetType;
    currentTotal: number;
    priorTotal: number;
    change: number;
    percentChange: number | null;
  };
  defaultAccount: BudgetAccount | null;
  priorPlan: BudgetPlan | null;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-border/80 bg-card/95 p-4">
        <h2 className="font-semibold text-slate-100">Finance Comparison</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <Detail
            label="Current Total"
            value={formatCurrencyFromCents(comparison.currentTotal)}
          />
          <Detail
            label={priorPlan ? `${priorPlan.fiscalYear} Total` : "Prior Year"}
            value={formatCurrencyFromCents(comparison.priorTotal)}
          />
          <Detail
            label="Dollar Change"
            value={formatCurrencyFromCents(comparison.change)}
          />
          <Detail
            label="Percent Change"
            value={formatPercent(comparison.percentChange)}
          />
        </dl>
      </div>
      <div className="rounded-lg border border-border/80 bg-card/95 p-4">
        <h2 className="font-semibold text-slate-100">Account Handling</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The worksheet uses its configured default account during entry.
          Row-level overrides are available from the detail drawer when Finance
          needs an exception.
        </p>
        <div className="mt-4 rounded-lg border border-border/70 bg-secondary/35 p-3">
          <p className="text-xs text-muted-foreground">Default account</p>
          <p className="mt-1 font-mono text-cyan-200">
            {defaultAccount?.code ?? "n/a"}
          </p>
          <p className="text-sm text-slate-100">
            {defaultAccount?.name ?? "No mapping configured"}
          </p>
        </div>
      </div>
    </div>
  );
}

function SubmissionWorksheet({
  currentPlan,
  totals,
}: {
  currentPlan: BudgetPlan;
  totals: ReturnType<typeof calculateBudgetTotals>;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-lg border border-border/80 bg-card/95 p-4">
        <h2 className="font-semibold text-slate-100">Submission Narrative</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {currentPlan.executiveNarrative}
        </p>
        <div className="mt-4 rounded-lg border border-border/70 bg-secondary/35 p-3">
          <p className="text-xs text-muted-foreground">Planning assumptions</p>
          <p className="mt-2 text-sm leading-6 text-slate-100">
            {currentPlan.assumptions}
          </p>
        </div>
      </div>
      <div className="rounded-lg border border-border/80 bg-card/95 p-4">
        <h2 className="font-semibold text-slate-100">Submission Snapshot</h2>
        <div className="mt-4 grid gap-3">
          <StatCard
            label="Requested Total"
            value={formatCurrencyFromCents(totals.totalProposedCents)}
          />
          <StatCard
            label="Net Change"
            value={formatCurrencyFromCents(totals.netChangeCents)}
            tone={totals.netChangeCents > 0 ? "bad" : "good"}
          />
          <StatCard
            label="Gross Savings"
            value={formatCurrencyFromCents(totals.grossSavingsCents)}
            tone="good"
          />
        </div>
      </div>
    </div>
  );
}

function BudgetContextSheet({
  open,
  onOpenChange,
  currentPlan,
  totals,
  exposureWindows,
  rollups,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: BudgetPlan;
  totals: ReturnType<typeof calculateBudgetTotals>;
  exposureWindows: ReturnType<typeof calculateRenewalExposureByWindow>;
  rollups: ReturnType<typeof calculateAccountRollups>;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-border bg-popover/98 sm:max-w-lg">
        <SheetHeader className="border-b border-border/80">
          <SheetTitle>Budget Context</SheetTitle>
          <SheetDescription>
            Optional planning details, renewal exposure, and account
            concentration.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-auto px-4 pb-6">
          <div className="rounded-lg border border-border/80 bg-card/95 p-4">
            <h2 className="font-semibold text-slate-100">Details</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <Detail
                label="Planning owner"
                value={currentPlan.planningOwner}
              />
              <Detail
                label="Submission due"
                value={currentPlan.submissionDueDate}
              />
              <Detail label="Version" value={currentPlan.version} />
              <Detail
                label="Net change"
                value={formatCurrencyFromCents(totals.netChangeCents)}
              />
            </dl>
          </div>
          <div className="rounded-lg border border-border/80 bg-card/95 p-4">
            <h2 className="font-semibold text-slate-100">Renewal Exposure</h2>
            <div className="mt-4 flex flex-col gap-2">
              {exposureWindows.map((window) => (
                <div
                  key={window.label}
                  className="grid grid-cols-[56px_1fr_auto] items-center gap-2 rounded-md border border-border/70 bg-secondary/35 px-2 py-2 text-sm"
                >
                  <span className="font-mono text-cyan-200">
                    {window.label}d
                  </span>
                  <span className="text-muted-foreground">
                    {window.count} renewals
                  </span>
                  <span className="font-mono">
                    {formatCurrencyFromCents(window.exposureCents)}
                  </span>
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
                  <div
                    key={rollup.accountId}
                    className="rounded-md border border-border/70 bg-secondary/35 px-2 py-2"
                  >
                    <p className="text-xs text-muted-foreground">
                      {rollup.accountCode}
                    </p>
                    <p className="truncate text-sm text-slate-100">
                      {rollup.accountName}
                    </p>
                    <p className="mt-1 font-mono text-sm text-cyan-200">
                      {formatCurrencyFromCents(rollup.proposedCents)}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function BudgetRowDetail({
  line,
  item,
  defaultAccount,
  accounts,
  onOpenChange,
  onOverrideChange,
  onTextChange,
}: {
  line: BudgetAnnualFinancial | null;
  item: BudgetItem | null;
  defaultAccount: BudgetAccount | null;
  accounts: BudgetAccount[];
  onOpenChange: (open: boolean) => void;
  onOverrideChange: (lineId: string, accountId: string) => void;
  onTextChange: (
    lineId: string,
    field: "businessJustification" | "riskIfNotFunded" | "comments",
    value: string
  ) => void;
}) {
  return (
    <Sheet open={Boolean(line)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-border bg-popover/98 sm:max-w-xl">
        <SheetHeader className="border-b border-border/80">
          <SheetTitle>{item?.name ?? "Budget row"}</SheetTitle>
          <SheetDescription>
            Override account handling and maintain Finance-facing narrative
            details.
          </SheetDescription>
        </SheetHeader>
        {line ? (
          <div className="flex flex-col gap-4 overflow-auto px-4 pb-6">
            <div className="rounded-lg border border-border/70 bg-secondary/35 p-3">
              <p className="text-xs text-muted-foreground">Default account</p>
              <p className="mt-1 font-mono text-cyan-200">
                {defaultAccount?.code ?? "n/a"}
              </p>
              <p className="text-sm text-slate-100">
                {defaultAccount?.name ?? "No default account"}
              </p>
            </div>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Row-level account override
              <select
                aria-label="Account override"
                value={line.accountOverrideId ?? "default"}
                className="h-10 rounded-lg border border-border/80 bg-secondary/45 px-3 text-sm text-slate-100 outline-none"
                onChange={(event) =>
                  onOverrideChange(line.id, event.target.value)
                }
              >
                <option value="default">Use default account</option>
                {accounts
                  .filter((account) => account.active)
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} {account.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Business justification
              <textarea
                className="min-h-28 rounded-lg border border-border/80 bg-secondary/45 px-3 py-2 text-sm text-slate-100 outline-none"
                value={line.businessJustification}
                onChange={(event) =>
                  onTextChange(
                    line.id,
                    "businessJustification",
                    event.target.value
                  )
                }
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Risk if not funded
              <textarea
                className="min-h-24 rounded-lg border border-border/80 bg-secondary/45 px-3 py-2 text-sm text-slate-100 outline-none"
                value={line.riskIfNotFunded}
                onChange={(event) =>
                  onTextChange(line.id, "riskIfNotFunded", event.target.value)
                }
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Finance comments
              <textarea
                className="min-h-24 rounded-lg border border-border/80 bg-secondary/45 px-3 py-2 text-sm text-slate-100 outline-none"
                value={line.comments}
                onChange={(event) =>
                  onTextChange(line.id, "comments", event.target.value)
                }
              />
            </label>
            <div className="rounded-lg border border-border/70 bg-secondary/35 p-3">
              <p className="text-xs text-muted-foreground">Effective account</p>
              <p className="mt-2 font-mono text-cyan-200">
                {
                  accounts.find(
                    (account) => account.id === effectiveAccountId(line)
                  )?.code
                }{" "}
                {
                  accounts.find(
                    (account) => account.id === effectiveAccountId(line)
                  )?.name
                }
              </p>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
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
    <label className="flex min-w-44 flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <select
        aria-label={label}
        value={value}
        className="h-9 rounded-lg border border-border/80 bg-secondary/45 px-3 text-sm text-slate-100 outline-none"
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => {
          const optionValue =
            typeof option === "string" ? option : option.value;
          const optionLabel =
            typeof option === "string" ? option : option.label;
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

function MoneyInputCell({
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
        className="ml-auto h-9 w-28 border-border/80 bg-secondary/45 text-right font-mono text-sm"
        onChange={(event) => onChange(event.target.value)}
      />
    </td>
  );
}

function NumberInputCell({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <td className="px-3 py-2 text-right">
      <Input
        aria-label="Count amount"
        value={String(value)}
        inputMode="numeric"
        className="ml-auto h-9 w-24 border-border/80 bg-secondary/45 text-right font-mono text-sm"
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
        (value.includes("High") ||
          value === "Needs Review" ||
          value === "Blocked") &&
          "border-red-400/30 bg-red-400/10 text-red-300",
        (value.includes("Approved") ||
          value === "Reviewed" ||
          value === "Renewed" ||
          value === "Completed") &&
          "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
        (value.includes("Quote") ||
          value === "Updated" ||
          value === "Planning") &&
          "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
        (value.includes("Negotiating") || value === "Under Review") &&
          "border-amber-400/30 bg-amber-400/10 text-amber-300"
      )}
    >
      {value}
    </Badge>
  );
}

function StatCard({
  label,
  value,
  tone = "info",
}: {
  label: string;
  value: string;
  tone?: "info" | "good" | "bad";
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-card/95 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-3 font-mono text-2xl font-semibold text-slate-50",
          tone === "good" && "text-emerald-300",
          tone === "bad" && "text-red-300"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function defaultAccountForWorksheet(
  worksheet: BudgetWorksheetType
): BudgetAccount {
  return (
    budgetWorkspaceData.accounts.find(
      (account) => account.defaultWorksheet === worksheet
    ) ?? budgetWorkspaceData.accounts[0]
  );
}

function findItem(
  line: BudgetAnnualFinancial,
  items: BudgetItem[]
): BudgetItem {
  return (
    items.find((item) => item.id === line.budgetItemId) ?? {
      id: line.budgetItemId,
      name: line.budgetItemId,
      description: "",
      owner: "",
      strategicProgramArea: "Budget Planning",
      active: true,
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
  const haystack =
    `${item.name} ${item.owner} ${line.comments} ${line.worksheet}`.toLowerCase();
  return haystack.includes(searchTerm.toLowerCase());
}

function parseDollarsToCents(value: string): number {
  const numeric = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(numeric) ? Math.round(numeric * 100) : 0;
}

function parseDollarsOrCount(isCount: boolean, value: string): number {
  const numeric = Number(value.replace(/[$,]/g, ""));
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return isCount
    ? Math.max(0, Math.round(numeric))
    : Math.max(0, Math.round(numeric * 100));
}

function sumWorksheet(
  annuals: readonly BudgetAnnualFinancial[],
  worksheet: BudgetWorksheetType
): number {
  return filterAnnualsByWorksheet(annuals, worksheet).reduce(
    (total, line) => total + line.proposedAmountCents,
    0
  );
}

function columnCountForWorksheet(worksheet: BudgetWorksheetType): number {
  switch (worksheet) {
    case "Software and SaaS":
      return 7;
    case "Training":
      return 4;
    case "Conferences":
      return 4;
    case "Travel":
      return 9;
    case "Organizational Dues":
      return 4;
    case "Professional Services":
      return 5;
    default:
      return 1;
  }
}

function worksheetLabel(worksheet: BudgetWorksheetType): string {
  if (worksheet === "Summary") {
    return "summary";
  }
  return worksheet;
}

function nextSeed(sequenceRef: { current: number }): number {
  sequenceRef.current += 1;
  return sequenceRef.current;
}
