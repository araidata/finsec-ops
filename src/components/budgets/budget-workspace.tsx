"use client";

import {
  Copy,
  ExternalLink,
  FileDown,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { type ReactNode, useMemo, useRef, useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  calculateAccountRollups,
  calculateBudgetTotals,
  calculateConferenceLineTotal,
  calculateMembershipLineTotal,
  calculateProfessionalServicesLineTotal,
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
import { cn } from "@/lib/utils";
import type {
  BudgetAccount,
  BudgetAnnualFinancial,
  BudgetItem,
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
  "Training",
  "Conferences",
  "Travel",
  "Organizational Dues",
  "Professional Services",
];

const worksheetEntryTabs: BudgetWorksheetType[] = [
  "Software and SaaS",
  "Training",
  "Conferences",
  "Travel",
  "Organizational Dues",
  "Professional Services",
];

type BudgetResellerOption = {
  id: string;
  name: string;
};

type PendingMaintenanceTransfer = {
  line: BudgetAnnualFinancial;
  item: BudgetItem;
  account: BudgetAccount | null;
};

export function BudgetWorkspace({
  resellerOptions = [],
}: {
  resellerOptions?: BudgetResellerOption[];
}) {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState("FY2027");
  const [activeWorksheet, setActiveWorksheet] =
    useState<BudgetWorksheetType>("Summary");
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
  const [maintenanceRenewals, setMaintenanceRenewals] = useState(
    budgetWorkspaceData.maintenanceRenewals
  );
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [pendingTransfer, setPendingTransfer] =
    useState<PendingMaintenanceTransfer | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const idSequenceRef = useRef(0);

  const currentPlan = useMemo(
    () =>
      budgetWorkspaceData.plans.find(
        (plan) => plan.fiscalYear === selectedFiscalYear
      ) ?? budgetWorkspaceData.plans[0],
    [selectedFiscalYear]
  );
  const priorPlan = useMemo(
    () =>
      budgetWorkspaceData.plans.find(
        (plan) => plan.fiscalYear === currentPlan.priorFiscalYear
      ) ?? null,
    [currentPlan.priorFiscalYear]
  );

  const currentAnnuals = annuals
    .filter((line) => line.budgetPlanId === currentPlan.id)
    .toSorted((a, b) => a.sortOrder - b.sortOrder);
  const priorAnnuals = priorPlan
    ? annuals
        .filter((line) => line.budgetPlanId === priorPlan.id)
        .toSorted((a, b) => a.sortOrder - b.sortOrder)
    : [];
  const worksheetAnnuals = filterAnnualsByWorksheet(
    currentAnnuals,
    activeWorksheet
  );
  const selectedLine =
    currentAnnuals.find((line) => line.id === selectedLineId) ?? null;
  const selectedItem = selectedLine ? findItem(selectedLine, items) : null;
  const selectedLineDefaultAccount = selectedLine
    ? (budgetWorkspaceData.accounts.find(
        (account) => account.id === selectedLine.accountId
      ) ?? null)
    : null;

  const totals = calculateBudgetTotals(
    currentAnnuals,
    budgetWorkspaceData.savingsRecords.filter(
      (record) => record.budgetPlanId === currentPlan.id
    )
  );
  const priorTotals = calculateBudgetTotals(priorAnnuals);
  const rollups = calculateAccountRollups(
    budgetWorkspaceData.accounts,
    currentAnnuals
  );
  const comparisonRows = worksheetEntryTabs.map((worksheet) => {
    const currentTotal = sumWorksheet(currentAnnuals, worksheet);
    const priorTotal = sumWorksheet(priorAnnuals, worksheet);
    return {
      worksheet,
      currentTotal,
      priorTotal,
      change: dollarChange(priorTotal, currentTotal),
      percentChange: percentageChange(priorTotal, currentTotal),
      lineCount: filterAnnualsByWorksheet(currentAnnuals, worksheet).filter(
        (line) => !line.isRetired
      ).length,
    };
  });
  const activeComparison =
    comparisonRows.find((row) => row.worksheet === activeWorksheet) ?? null;

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
  const maintenanceByAnnualId = useMemo(
    () =>
      new Map(
        maintenanceRenewals
          .filter((renewal) => renewal.linkedAnnualFinancialId)
          .map((renewal) => [renewal.linkedAnnualFinancialId, renewal])
      ),
    [maintenanceRenewals]
  );
  const softwareResellerOptions = useMemo(() => {
    const staticNames = budgetWorkspaceData.softwareDetails
      .map((detail) => detail.reseller)
      .filter((value): value is string => Boolean(value));
    const databaseNames = resellerOptions.map((option) => option.name);
    const names = ["Direct", ...databaseNames, ...staticNames];

    return Array.from(new Set(names)).sort((a, b) => {
      if (a === "Direct") return -1;
      if (b === "Direct") return 1;
      return a.localeCompare(b);
    });
  }, [resellerOptions]);

  function markDirty() {
    setHasUnsavedChanges(true);
  }

  function warnBeforeContextChange() {
    return (
      !hasUnsavedChanges ||
      window.confirm("You have unsaved local budget edits. Continue?")
    );
  }

  function selectFiscalYear(fiscalYear: string) {
    if (!warnBeforeContextChange()) return;
    setSelectedFiscalYear(fiscalYear);
    setSelectedLineId(null);
    setEditingLineId(null);
  }

  function selectWorksheet(worksheet: BudgetWorksheetType) {
    if (!warnBeforeContextChange()) return;
    setActiveWorksheet(worksheet);
    setSelectedLineId(null);
    setEditingLineId(null);
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
        if (detail.annualFinancialId !== lineId) return detail;
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
        if (detail.annualFinancialId !== lineId) return detail;
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
        if (detail.annualFinancialId !== lineId) return detail;
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
        if (detail.annualFinancialId !== lineId) return detail;
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
        if (detail.annualFinancialId !== lineId) return detail;
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

  function addRow() {
    const worksheet = activeWorksheet;
    if (!worksheetEntryTabs.includes(worksheet)) return;

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
        strategicProgramArea: "Budget Tracking",
        active: true,
      },
    ]);

    setAnnuals((current) => [
      ...current,
      {
        id: lineId,
        budgetPlanId: currentPlan.id,
        scenarioId: `${currentPlan.id}-tracked`,
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
        isNewRequest: false,
        isRecurring: true,
        isOneTime: false,
        isRetired: false,
        comments: "",
        businessJustification: "",
        riskIfNotFunded: "",
        owner: "",
      },
    ]);

    if (worksheet === "Software and SaaS") {
      setSoftwareDetails((current) => [
        ...current,
        { annualFinancialId: lineId, reseller: "Direct", notes: "" },
      ]);
    }
    if (worksheet === "Training") {
      setTrainingDetails((current) => [
        ...current,
        { annualFinancialId: lineId, training: "", quantity: 1, costCents: 0 },
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

    setEditingLineId(lineId);
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
      linkedMaintenanceRenewalId: undefined,
      sortOrder:
        Math.max(0, ...currentAnnuals.map((candidate) => candidate.sortOrder)) +
        1,
      reviewState: "Updated",
    };

    setItems((current) => [...current, clonedItem]);
    setAnnuals((current) => [...current, clonedLine]);
    cloneDetail(line, nextLineId);
    setEditingLineId(nextLineId);
    markDirty();
  }

  function cloneDetail(line: BudgetAnnualFinancial, nextLineId: string) {
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
  }

  function deleteRow(lineId: string) {
    const line = annuals.find((candidate) => candidate.id === lineId);
    if (!line) return;
    const item = findItem(line, items);
    if (!window.confirm(`Delete ${item.name} from the budget?`)) return;

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
    setSelectedLineId((current) => (current === lineId ? null : current));
    setEditingLineId((current) => (current === lineId ? null : current));
    markDirty();
  }

  function requestMaintenanceTransfer(line: BudgetAnnualFinancial) {
    const item = findItem(line, items);
    if (!isMaintenanceEligible(line, item)) return;
    const existing = maintenanceByAnnualId.get(line.id);
    if (existing) {
      window.location.assign(`/renewals?renewal=${existing.id}`);
      return;
    }
    setPendingTransfer({
      line,
      item,
      account:
        budgetWorkspaceData.accounts.find(
          (account) => account.id === effectiveAccountId(line)
        ) ?? null,
    });
  }

  function confirmMaintenanceTransfer() {
    if (!pendingTransfer) return;
    const { line, item, account } = pendingTransfer;
    const existing = maintenanceByAnnualId.get(line.id);
    if (existing) {
      setPendingTransfer(null);
      return;
    }
    const detail = softwareDetailsByLine.get(line.id);
    const seed = nextSeed(idSequenceRef);
    const renewalId = `renewal-from-budget-${seed}`;

    setMaintenanceRenewals((current) => [
      ...current,
      {
        id: renewalId,
        budgetPlanId: line.budgetPlanId,
        linkedAnnualFinancialId: line.id,
        vendorId: item.vendorId,
        resellerId: item.resellerId,
        contractId: item.contractId,
        productId: item.productId,
        vendor: displayVendor(item),
        productOrService: item.name,
        reseller: detail?.reseller,
        currentCostCents: line.currentApprovedAmountCents,
        renewalQuoteCents: line.proposedAmountCents,
        negotiatedCostCents: line.proposedAmountCents,
        renewalDate: `${line.fiscalYear.slice(2)}-06-30`,
        contractStart: "",
        contractEnd: "",
        noticePeriodDays: 60,
        autoRenewal: false,
        paymentFrequency: "Annual",
        fundingAccountId: account?.id ?? line.accountId,
        renewalStatus: "Planning",
        procurementStatus: "Not Started",
        renewalOwner: item.owner || line.owner,
        procurementOwner: "",
        renewalStrategy: "",
        renewalRisk: "Low",
        notes: `Created from ${line.fiscalYear} Budget row ${line.id}.`,
      },
    ]);
    setAnnuals((current) =>
      current.map((candidate) =>
        candidate.id === line.id
          ? {
              ...candidate,
              linkedMaintenanceRenewalId: renewalId,
              reviewState: "Updated",
            }
          : candidate
      )
    );
    setPendingTransfer(null);
    markDirty();
  }

  return (
    <WorkspaceShell
      title={`${selectedFiscalYear} Cybersecurity Budget`}
      titleActions={
        <BudgetHeaderControls
          selectedFiscalYear={selectedFiscalYear}
          hasUnsavedChanges={hasUnsavedChanges}
          activeWorksheet={activeWorksheet}
          onFiscalYearChange={selectFiscalYear}
          onAddRow={addRow}
        />
      }
    >
      <div className="flex flex-col gap-3">
        <WorksheetTabs
          activeWorksheet={activeWorksheet}
          onChange={selectWorksheet}
        />

        {activeWorksheet === "Summary" ? (
          <SummaryWorksheet
            totals={totals}
            priorTotals={priorTotals}
            comparisonRows={comparisonRows}
            rollups={rollups}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {activeComparison ? (
              <FinancialSummaryStrip
                currentBudget={activeComparison.currentTotal}
                priorYear={activeComparison.priorTotal}
                lineItems={activeComparison.lineCount}
              />
            ) : null}

            <EntryWorksheetGrid
              worksheet={activeWorksheet}
              lines={worksheetAnnuals}
              items={items}
              editingLineId={editingLineId}
              maintenanceByAnnualId={maintenanceByAnnualId}
              softwareDetailsByLine={softwareDetailsByLine}
              resellerOptions={softwareResellerOptions}
              trainingDetailsByLine={trainingDetailsByLine}
              conferenceDetailsByLine={conferenceDetailsByLine}
              travelDetailsByLine={travelDetailsByLine}
              membershipDetailsByLine={membershipDetailsByLine}
              professionalDetailsByLine={professionalDetailsByLine}
              onEditToggle={(lineId) =>
                setEditingLineId((current) =>
                  current === lineId ? null : lineId
                )
              }
              onItemChange={updateItem}
              onSoftwareDetailChange={updateSoftwareDetail}
              onTrainingDetailChange={updateTrainingDetail}
              onConferenceDetailChange={updateConferenceDetail}
              onTravelDetailChange={updateTravelDetail}
              onMembershipDetailChange={updateMembershipDetail}
              onProfessionalDetailChange={updateProfessionalDetail}
              onAnnualAmountChange={updateAnnualAmount}
              onLineNotesChange={(lineId, value) =>
                updateAnnualText(lineId, "comments", value)
              }
              onOpenDetail={setSelectedLineId}
              onDuplicate={duplicateRow}
              onDelete={deleteRow}
              onMaintenanceTransfer={requestMaintenanceTransfer}
            />
          </div>
        )}
      </div>

      <MaintenanceTransferSheet
        transfer={pendingTransfer}
        onOpenChange={(open) => {
          if (!open) setPendingTransfer(null);
        }}
        onConfirm={confirmMaintenanceTransfer}
      />

      <BudgetRowDetail
        line={selectedLine}
        item={selectedItem}
        defaultAccount={selectedLineDefaultAccount}
        accounts={budgetWorkspaceData.accounts}
        onOpenChange={(open) => {
          if (!open) setSelectedLineId(null);
        }}
        onOverrideChange={updateAnnualOverride}
        onTextChange={updateAnnualText}
      />
    </WorkspaceShell>
  );
}

function BudgetHeaderControls({
  selectedFiscalYear,
  hasUnsavedChanges,
  activeWorksheet,
  onFiscalYearChange,
  onAddRow,
}: {
  selectedFiscalYear: string;
  hasUnsavedChanges: boolean;
  activeWorksheet: BudgetWorksheetType;
  onFiscalYearChange: (value: string) => void;
  onAddRow: () => void;
}) {
  const canAddRow = worksheetEntryTabs.includes(activeWorksheet);

  return (
    <div className="flex items-end gap-2 whitespace-nowrap">
      <ControlSelect
        label="Fiscal Year"
        value={selectedFiscalYear}
        options={budgetWorkspaceData.fiscalYears.map((year) => year.label)}
        onChange={onFiscalYearChange}
      />
      {hasUnsavedChanges ? (
        <Badge
          variant="outline"
          className="h-9 border-amber-400/30 bg-amber-400/10 px-3 text-amber-300"
        >
          Unsaved local changes
        </Badge>
      ) : null}
      {canAddRow ? (
        <Button variant="secondary" onClick={onAddRow}>
          <Plus data-icon="inline-start" />
          Add Row
        </Button>
      ) : null}
      <Button variant="outline" className="border-border/80">
        <FileDown data-icon="inline-start" />
        Export
      </Button>
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
            "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            activeWorksheet === worksheet &&
              "bg-secondary/80 text-slate-100 shadow-[0_0_0_1px_rgba(34,199,217,0.12)]"
          )}
          onClick={() => onChange(worksheet)}
        >
          {worksheetTabLabel(worksheet)}
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
}: {
  totals: ReturnType<typeof calculateBudgetTotals>;
  priorTotals: ReturnType<typeof calculateBudgetTotals>;
  comparisonRows: Array<{
    worksheet: BudgetWorksheetType;
    currentTotal: number;
    priorTotal: number;
    change: number;
    percentChange: number | null;
    lineCount: number;
  }>;
  rollups: ReturnType<typeof calculateAccountRollups>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <FinancialSummaryStrip
        currentBudget={totals.totalProposedCents}
        priorYear={priorTotals.totalProposedCents}
        lineItems={comparisonRows.reduce((total, row) => total + row.lineCount, 0)}
      />

      <div className="overflow-hidden rounded-lg border border-border/80 bg-card/95">
        <div className="border-b border-border/80 px-4 py-3">
          <h2 className="font-semibold text-slate-100">Category Summary</h2>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="sticky top-0 bg-[#07111d] text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2 text-right">Budget</th>
                <th className="px-3 py-2 text-right">Prior Year</th>
                <th className="px-3 py-2 text-right">Dollar Change</th>
                <th className="px-3 py-2 text-right">Percent Change</th>
                <th className="px-3 py-2 text-right">Line Items</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.worksheet} className="border-b border-border/60">
                  <td className="px-3 py-2 font-medium text-slate-100">
                    {worksheetHeading(row.worksheet)}
                  </td>
                  <CurrencyCell value={row.currentTotal} />
                  <CurrencyCell value={row.priorTotal} />
                  <CurrencyCell value={row.change} />
                  <td className="px-3 py-2 text-right font-mono text-slate-100">
                    {formatPercent(row.percentChange)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-slate-100">
                    {row.lineCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/80 bg-card/95">
        <div className="border-b border-border/80 px-4 py-3">
          <h2 className="font-semibold text-slate-100">Account Rollup</h2>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="sticky top-0 bg-[#07111d] text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Account</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2 text-right">Budget Amount</th>
              </tr>
            </thead>
            <tbody>
              {rollups.map((rollup) => (
                <tr
                  key={rollup.accountId}
                  className="border-b border-border/60"
                >
                  <td className="px-3 py-2 font-mono text-cyan-200">
                    {rollup.accountCode}
                  </td>
                  <td className="px-3 py-2 text-slate-100">
                    {rollup.accountName}
                  </td>
                  <CurrencyCell value={rollup.proposedCents} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FinancialSummaryStrip({
  currentBudget,
  priorYear,
  lineItems,
}: {
  currentBudget: number;
  priorYear: number;
  lineItems: number;
}) {
  const change = dollarChange(priorYear, currentBudget);
  return (
    <div className="grid gap-2 rounded-lg border border-border/80 bg-card/95 px-3 py-2 sm:grid-cols-2 xl:grid-cols-5">
      <StripValue label="Current Budget" value={formatCurrencyFromCents(currentBudget)} />
      <StripValue label="Prior Year" value={formatCurrencyFromCents(priorYear)} />
      <StripValue label="Dollar Change" value={formatCurrencyFromCents(change)} />
      <StripValue label="Percent Change" value={formatPercent(percentageChange(priorYear, currentBudget))} />
      <StripValue label="Line Items" value={String(lineItems)} />
    </div>
  );
}

function StripValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-2 py-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-mono text-sm font-semibold text-slate-100">
        {value}
      </p>
    </div>
  );
}

function EntryWorksheetGrid({
  worksheet,
  lines,
  items,
  editingLineId,
  maintenanceByAnnualId,
  softwareDetailsByLine,
  resellerOptions,
  trainingDetailsByLine,
  conferenceDetailsByLine,
  travelDetailsByLine,
  membershipDetailsByLine,
  professionalDetailsByLine,
  onEditToggle,
  onItemChange,
  onSoftwareDetailChange,
  onTrainingDetailChange,
  onConferenceDetailChange,
  onTravelDetailChange,
  onMembershipDetailChange,
  onProfessionalDetailChange,
  onAnnualAmountChange,
  onLineNotesChange,
  onOpenDetail,
  onDuplicate,
  onDelete,
  onMaintenanceTransfer,
}: {
  worksheet: BudgetWorksheetType;
  lines: BudgetAnnualFinancial[];
  items: BudgetItem[];
  editingLineId: string | null;
  maintenanceByAnnualId: Map<string | undefined, MaintenanceRenewal>;
  softwareDetailsByLine: Map<string, SoftwareBudgetDetail>;
  resellerOptions: string[];
  trainingDetailsByLine: Map<string, TrainingBudgetDetail>;
  conferenceDetailsByLine: Map<string, ConferenceBudgetDetail>;
  travelDetailsByLine: Map<string, TravelBudgetDetail>;
  membershipDetailsByLine: Map<string, MembershipBudgetDetail>;
  professionalDetailsByLine: Map<string, ProfessionalServicesBudgetDetail>;
  onEditToggle: (lineId: string) => void;
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
  onLineNotesChange: (lineId: string, value: string) => void;
  onOpenDetail: (lineId: string) => void;
  onDuplicate: (line: BudgetAnnualFinancial) => void;
  onDelete: (lineId: string) => void;
  onMaintenanceTransfer: (line: BudgetAnnualFinancial) => void;
}) {
  const totals = calculateBudgetTotals(lines);

  return (
    <div className="overflow-hidden rounded-lg border border-border/80 bg-card/95">
      <div className="border-b border-border/80 px-4 py-3">
        <h2 className="font-semibold text-slate-100">
          {worksheetHeading(worksheet)}
        </h2>
      </div>
      <div className="overflow-auto">
        <table
          className={cn(
            "w-full text-left text-sm",
            worksheet === "Travel" ? "min-w-[1180px]" : "min-w-[900px]"
          )}
        >
          <thead className="sticky top-0 z-10 bg-[#07111d] text-xs text-muted-foreground">
            <WorksheetHeader worksheet={worksheet} />
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td
                  colSpan={columnCountForWorksheet(worksheet)}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  No budget lines match this view.
                </td>
              </tr>
            ) : null}
            {lines.map((line) => {
              const item = findItem(line, items);
              const softwareDetail = softwareDetailsByLine.get(line.id);
              const linkedRenewal = maintenanceByAnnualId.get(line.id);
              const isEditing = editingLineId === line.id;

              return (
                <tr
                  key={line.id}
                  className="border-b border-border/60 align-top hover:bg-secondary/30"
                >
                  <WorksheetRowCells
                    worksheet={worksheet}
                    line={line}
                    item={item}
                    isEditing={isEditing}
                    softwareDetail={softwareDetail}
                    resellerOptions={resellerOptions}
                    trainingDetail={trainingDetailsByLine.get(line.id)}
                    conferenceDetail={conferenceDetailsByLine.get(line.id)}
                    travelDetail={travelDetailsByLine.get(line.id)}
                    membershipDetail={membershipDetailsByLine.get(line.id)}
                    professionalDetail={professionalDetailsByLine.get(line.id)}
                    linkedRenewal={linkedRenewal}
                    onEditToggle={onEditToggle}
                    onItemChange={onItemChange}
                    onSoftwareDetailChange={onSoftwareDetailChange}
                    onTrainingDetailChange={onTrainingDetailChange}
                    onConferenceDetailChange={onConferenceDetailChange}
                    onTravelDetailChange={onTravelDetailChange}
                    onMembershipDetailChange={onMembershipDetailChange}
                    onProfessionalDetailChange={onProfessionalDetailChange}
                    onAnnualAmountChange={onAnnualAmountChange}
                    onLineNotesChange={onLineNotesChange}
                    onOpenDetail={onOpenDetail}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                    onMaintenanceTransfer={onMaintenanceTransfer}
                  />
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 bg-[#082634] text-sm font-semibold text-slate-50">
            <tr>
              <td
                className="px-3 py-2"
                colSpan={Math.max(1, columnCountForWorksheet(worksheet) - 3)}
              >
                Total ({lines.length})
              </td>
              <td
                data-testid="worksheet-total"
                className="px-3 py-2 text-right font-mono"
              >
                {formatCurrencyFromCents(totals.totalProposedCents)}
              </td>
              <td className="px-3 py-2" colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function WorksheetHeader({ worksheet }: { worksheet: BudgetWorksheetType }) {
  if (worksheet === "Software and SaaS") {
    return (
      <tr>
        <th className="px-3 py-2">Item</th>
        <th className="px-3 py-2">Vendor / Reseller</th>
        <th className="px-3 py-2">Replacement?</th>
        <th className="px-3 py-2">Replacing</th>
        <th className="px-3 py-2 text-right">Budget Amount</th>
        <th className="px-3 py-2">Notes</th>
        <th className="px-3 py-2 text-right">Actions</th>
      </tr>
    );
  }

  if (worksheet === "Training") {
    return (
      <tr>
        <th className="px-3 py-2">Training</th>
        <th className="px-3 py-2 text-right">Quantity</th>
        <th className="px-3 py-2 text-right">Unit Cost</th>
        <th className="px-3 py-2 text-right">Budget Amount</th>
        <th className="px-3 py-2">Notes</th>
        <th className="px-3 py-2 text-right">Actions</th>
      </tr>
    );
  }

  if (worksheet === "Conferences") {
    return (
      <tr>
        <th className="px-3 py-2">Conference</th>
        <th className="px-3 py-2 text-right">Attendees</th>
        <th className="px-3 py-2 text-right">Registration Fee</th>
        <th className="px-3 py-2 text-right">Budget Amount</th>
        <th className="px-3 py-2">Notes</th>
        <th className="px-3 py-2 text-right">Actions</th>
      </tr>
    );
  }

  if (worksheet === "Travel") {
    return (
      <tr>
        <th className="px-3 py-2">Trip</th>
        <th className="px-3 py-2 text-right">Attendees</th>
        <th className="px-3 py-2 text-right">Air</th>
        <th className="px-3 py-2 text-right">Hotel</th>
        <th className="px-3 py-2 text-right">Per Diem</th>
        <th className="px-3 py-2 text-right">Luggage</th>
        <th className="px-3 py-2 text-right">Parking</th>
        <th className="px-3 py-2 text-right">Taxi / Uber</th>
        <th className="px-3 py-2 text-right">Budget Amount</th>
        <th className="px-3 py-2">Notes</th>
        <th className="px-3 py-2 text-right">Actions</th>
      </tr>
    );
  }

  if (worksheet === "Organizational Dues") {
    return (
      <tr>
        <th className="px-3 py-2">Employee</th>
        <th className="px-3 py-2">Organization</th>
        <th className="px-3 py-2">Certification</th>
        <th className="px-3 py-2 text-right">Annual Fee</th>
        <th className="px-3 py-2">Notes</th>
        <th className="px-3 py-2 text-right">Actions</th>
      </tr>
    );
  }

  return (
    <tr>
      <th className="px-3 py-2">Vendor</th>
      <th className="px-3 py-2">Product / Employee</th>
      <th className="px-3 py-2 text-right">Amount</th>
      <th className="px-3 py-2 text-right">Rate</th>
      <th className="px-3 py-2 text-right">Budget Amount</th>
      <th className="px-3 py-2">Notes</th>
      <th className="px-3 py-2 text-right">Actions</th>
    </tr>
  );
}

function WorksheetRowCells({
  worksheet,
  line,
  item,
  isEditing,
  softwareDetail,
  resellerOptions,
  trainingDetail,
  conferenceDetail,
  travelDetail,
  membershipDetail,
  professionalDetail,
  linkedRenewal,
  onEditToggle,
  onItemChange,
  onSoftwareDetailChange,
  onTrainingDetailChange,
  onConferenceDetailChange,
  onTravelDetailChange,
  onMembershipDetailChange,
  onProfessionalDetailChange,
  onAnnualAmountChange,
  onLineNotesChange,
  onOpenDetail,
  onDuplicate,
  onDelete,
  onMaintenanceTransfer,
}: {
  worksheet: BudgetWorksheetType;
  line: BudgetAnnualFinancial;
  item: BudgetItem;
  isEditing: boolean;
  softwareDetail?: SoftwareBudgetDetail;
  resellerOptions: string[];
  trainingDetail?: TrainingBudgetDetail;
  conferenceDetail?: ConferenceBudgetDetail;
  travelDetail?: TravelBudgetDetail;
  membershipDetail?: MembershipBudgetDetail;
  professionalDetail?: ProfessionalServicesBudgetDetail;
  linkedRenewal?: MaintenanceRenewal;
  onEditToggle: (lineId: string) => void;
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
  onLineNotesChange: (lineId: string, value: string) => void;
  onOpenDetail: (lineId: string) => void;
  onDuplicate: (line: BudgetAnnualFinancial) => void;
  onDelete: (lineId: string) => void;
  onMaintenanceTransfer: (line: BudgetAnnualFinancial) => void;
}) {
  if (worksheet === "Software and SaaS" && softwareDetail) {
    return (
      <>
        <TextCell>
          <EditableItemName
            item={item}
            lineId={line.id}
            isEditing={isEditing}
            onItemChange={onItemChange}
            onEditToggle={onEditToggle}
          />
        </TextCell>
        <TextCell>
          {isEditing ? (
            <select
              aria-label={`Reseller for ${item.name}`}
              value={softwareDetail.reseller ?? "Direct"}
              className="h-8 w-full rounded-lg border border-border/80 bg-secondary/45 px-3 text-sm text-slate-100 outline-none"
              onChange={(event) =>
                onSoftwareDetailChange(line.id, "reseller", event.target.value)
              }
            >
              {resellerOptions.map((reseller) => (
                <option key={reseller} value={reseller}>
                  {reseller}
                </option>
              ))}
            </select>
          ) : (
            <div>
              <p className="text-slate-100">{displayVendor(item)}</p>
              <p className="text-xs text-muted-foreground">
                {softwareDetail.reseller || "Direct"}
              </p>
            </div>
          )}
        </TextCell>
        <TextCell>
          {isEditing ? (
            <select
              aria-label={`Replacement status for ${item.name}`}
              value={softwareDetail.requestType ?? "New"}
              className="h-8 w-full rounded-lg border border-border/80 bg-secondary/45 px-3 text-sm text-slate-100 outline-none"
              onChange={(event) =>
                onSoftwareDetailChange(
                  line.id,
                  "requestType",
                  event.target.value
                )
              }
            >
              <option value="New">No</option>
              <option value="Replacement">Yes</option>
            </select>
          ) : (
            <span className="text-slate-100">
              {softwareDetail.requestType === "Replacement" ? "Yes" : "No"}
            </span>
          )}
        </TextCell>
        <TextCell>
          {softwareDetail.requestType === "Replacement" ? (
            isEditing ? (
              <Input
                aria-label={`Replacing for ${item.name}`}
                value={softwareDetail.replaces ?? ""}
                className="h-8 border-border/80 bg-secondary/45 text-sm"
                onChange={(event) =>
                  onSoftwareDetailChange(line.id, "replaces", event.target.value)
                }
              />
            ) : (
              <span className="text-slate-100">{softwareDetail.replaces}</span>
            )
          ) : null}
        </TextCell>
        <BudgetAmountCell
          line={line}
          item={item}
          isEditing={isEditing}
          onAnnualAmountChange={onAnnualAmountChange}
        />
        <NotesCell
          line={line}
          item={item}
          value={softwareDetail.notes}
          isEditing={isEditing}
          onChange={(value) => onSoftwareDetailChange(line.id, "notes", value)}
        />
        <ActionsCell
          line={line}
          item={item}
          isEditing={isEditing}
          linkedRenewal={linkedRenewal}
          onEditToggle={onEditToggle}
          onOpenDetail={onOpenDetail}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onMaintenanceTransfer={onMaintenanceTransfer}
        />
      </>
    );
  }

  if (worksheet === "Training" && trainingDetail) {
    return (
      <>
        <TextCell>
          {isEditing ? (
            <Input
              value={trainingDetail.training}
              className="h-8 border-border/80 bg-secondary/45 text-sm"
              onChange={(event) =>
                onTrainingDetailChange(line.id, "training", event.target.value)
              }
            />
          ) : (
            <span className="text-slate-100">{trainingDetail.training}</span>
          )}
        </TextCell>
        <NumberCell>
          {isEditing ? (
            <SmallNumberInput
              ariaLabel="Count amount"
              value={trainingDetail.quantity}
              onChange={(value) =>
                onTrainingDetailChange(line.id, "quantity", value)
              }
            />
          ) : (
            trainingDetail.quantity
          )}
        </NumberCell>
        <NumberCell>
          {isEditing ? (
            <MoneyInput
              ariaLabel="Training cost"
              value={trainingDetail.costCents}
              onChange={(value) =>
                onTrainingDetailChange(line.id, "costCents", value)
              }
            />
          ) : (
            formatCurrencyFromCents(trainingDetail.costCents)
          )}
        </NumberCell>
        <CurrencyCell value={line.proposedAmountCents} />
        <NotesCell
          line={line}
          item={item}
          value={line.comments}
          isEditing={isEditing}
          onChange={(value) => onLineNotesChange(line.id, value)}
        />
        <ActionsCell
          line={line}
          item={item}
          isEditing={isEditing}
          onEditToggle={onEditToggle}
          onOpenDetail={onOpenDetail}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onMaintenanceTransfer={onMaintenanceTransfer}
        />
      </>
    );
  }

  if (worksheet === "Conferences" && conferenceDetail) {
    return (
      <>
        <TextCell>
          {isEditing ? (
            <Input
              value={conferenceDetail.conference}
              className="h-8 border-border/80 bg-secondary/45 text-sm"
              onChange={(event) =>
                onConferenceDetailChange(
                  line.id,
                  "conference",
                  event.target.value
                )
              }
            />
          ) : (
            <span className="text-slate-100">{conferenceDetail.conference}</span>
          )}
        </TextCell>
        <NumberCell>
          {isEditing ? (
            <SmallNumberInput
              ariaLabel={`Attendees for ${conferenceDetail.conference}`}
              value={conferenceDetail.attendees}
              onChange={(value) =>
                onConferenceDetailChange(line.id, "attendees", value)
              }
            />
          ) : (
            conferenceDetail.attendees
          )}
        </NumberCell>
        <NumberCell>
          {isEditing ? (
            <MoneyInput
              ariaLabel={`Registration fee for ${conferenceDetail.conference}`}
              value={conferenceDetail.registrationFeeCents}
              onChange={(value) =>
                onConferenceDetailChange(
                  line.id,
                  "registrationFeeCents",
                  value
                )
              }
            />
          ) : (
            formatCurrencyFromCents(conferenceDetail.registrationFeeCents)
          )}
        </NumberCell>
        <CurrencyCell value={line.proposedAmountCents} />
        <NotesCell
          line={line}
          item={item}
          value={line.comments}
          isEditing={isEditing}
          onChange={(value) => onLineNotesChange(line.id, value)}
        />
        <ActionsCell
          line={line}
          item={item}
          isEditing={isEditing}
          onEditToggle={onEditToggle}
          onOpenDetail={onOpenDetail}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onMaintenanceTransfer={onMaintenanceTransfer}
        />
      </>
    );
  }

  if (worksheet === "Travel" && travelDetail) {
    return (
      <>
        <TextCell>
          {isEditing ? (
            <Input
              value={travelDetail.conferenceOrTrip}
              className="h-8 border-border/80 bg-secondary/45 text-sm"
              onChange={(event) =>
                onTravelDetailChange(
                  line.id,
                  "conferenceOrTrip",
                  event.target.value
                )
              }
            />
          ) : (
            <span className="text-slate-100">
              {travelDetail.conferenceOrTrip}
            </span>
          )}
        </TextCell>
        <EditableNumberCell
          value={travelDetail.attendees}
          ariaLabel={`Attendees for ${travelDetail.conferenceOrTrip}`}
          isEditing={isEditing}
          onChange={(value) => onTravelDetailChange(line.id, "attendees", value)}
        />
        {(
          [
            ["airfareCents", travelDetail.airfareCents, "Air"],
            ["hotelCents", travelDetail.hotelCents, "Hotel"],
            ["perDiemCents", travelDetail.perDiemCents, "Per diem"],
            ["luggageCents", travelDetail.luggageCents, "Luggage"],
            ["parkingCents", travelDetail.parkingCents, "Parking"],
            ["taxiUberCents", travelDetail.taxiUberCents, "Taxi / Uber"],
          ] as const
        ).map(([field, value, label]) => (
          <EditableMoneyCell
            key={field}
            value={value}
            ariaLabel={`${label} for ${travelDetail.conferenceOrTrip}`}
            isEditing={isEditing}
            onChange={(nextValue) =>
              onTravelDetailChange(line.id, field, nextValue)
            }
          />
        ))}
        <CurrencyCell value={line.proposedAmountCents} />
        <NotesCell
          line={line}
          item={item}
          value={line.comments}
          isEditing={isEditing}
          onChange={(value) => onLineNotesChange(line.id, value)}
        />
        <ActionsCell
          line={line}
          item={item}
          isEditing={isEditing}
          onEditToggle={onEditToggle}
          onOpenDetail={onOpenDetail}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onMaintenanceTransfer={onMaintenanceTransfer}
        />
      </>
    );
  }

  if (worksheet === "Organizational Dues" && membershipDetail) {
    return (
      <>
        <EditableTextCell
          value={membershipDetail.employee}
          isEditing={isEditing}
          onChange={(value) => onMembershipDetailChange(line.id, "employee", value)}
        />
        <EditableTextCell
          value={membershipDetail.organization}
          isEditing={isEditing}
          onChange={(value) =>
            onMembershipDetailChange(line.id, "organization", value)
          }
        />
        <EditableTextCell
          value={membershipDetail.certification}
          isEditing={isEditing}
          onChange={(value) =>
            onMembershipDetailChange(line.id, "certification", value)
          }
        />
        <EditableMoneyCell
          value={membershipDetail.annualFeeCents}
          ariaLabel={`Annual fee for ${membershipDetail.organization}`}
          isEditing={isEditing}
          onChange={(value) =>
            onMembershipDetailChange(line.id, "annualFeeCents", value)
          }
        />
        <NotesCell
          line={line}
          item={item}
          value={line.comments}
          isEditing={isEditing}
          onChange={(value) => onLineNotesChange(line.id, value)}
        />
        <ActionsCell
          line={line}
          item={item}
          isEditing={isEditing}
          onEditToggle={onEditToggle}
          onOpenDetail={onOpenDetail}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onMaintenanceTransfer={onMaintenanceTransfer}
        />
      </>
    );
  }

  if (worksheet === "Professional Services" && professionalDetail) {
    return (
      <>
        <EditableTextCell
          value={professionalDetail.vendor}
          isEditing={isEditing}
          onChange={(value) =>
            onProfessionalDetailChange(line.id, "vendor", value)
          }
        />
        <EditableTextCell
          value={professionalDetail.productOrEmployee}
          isEditing={isEditing}
          onChange={(value) =>
            onProfessionalDetailChange(line.id, "productOrEmployee", value)
          }
        />
        <EditableNumberCell
          value={professionalDetail.amount}
          ariaLabel={`Amount for ${professionalDetail.productOrEmployee}`}
          isEditing={isEditing}
          onChange={(value) => onProfessionalDetailChange(line.id, "amount", value)}
        />
        <EditableMoneyCell
          value={professionalDetail.rateCents}
          ariaLabel={`Rate for ${professionalDetail.productOrEmployee}`}
          isEditing={isEditing}
          onChange={(value) =>
            onProfessionalDetailChange(line.id, "rateCents", value)
          }
        />
        <CurrencyCell value={line.proposedAmountCents} />
        <NotesCell
          line={line}
          item={item}
          value={line.comments}
          isEditing={isEditing}
          onChange={(value) => onLineNotesChange(line.id, value)}
        />
        <ActionsCell
          line={line}
          item={item}
          isEditing={isEditing}
          onEditToggle={onEditToggle}
          onOpenDetail={onOpenDetail}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onMaintenanceTransfer={onMaintenanceTransfer}
        />
      </>
    );
  }

  return null;
}

function EditableItemName({
  item,
  lineId,
  isEditing,
  onItemChange,
  onEditToggle,
}: {
  item: BudgetItem;
  lineId: string;
  isEditing: boolean;
  onItemChange: (
    itemId: string,
    field: "name" | "owner",
    value: string
  ) => void;
  onEditToggle: (lineId: string) => void;
}) {
  return isEditing ? (
    <Input
      aria-label={`Item for ${lineId}`}
      value={item.name}
      className="h-8 border-border/80 bg-secondary/45 text-sm"
      onChange={(event) => onItemChange(item.id, "name", event.target.value)}
    />
  ) : (
    <button
      className="text-left font-medium text-slate-100 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => onEditToggle(lineId)}
    >
      {item.name}
    </button>
  );
}

function EditableTextCell({
  value,
  isEditing,
  onChange,
}: {
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <TextCell>
      {isEditing ? (
        <Input
          value={value}
          className="h-8 border-border/80 bg-secondary/45 text-sm"
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <span className="text-slate-100">{value}</span>
      )}
    </TextCell>
  );
}

function EditableNumberCell({
  value,
  isEditing,
  ariaLabel,
  onChange,
}: {
  value: number;
  isEditing: boolean;
  ariaLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <NumberCell>
      {isEditing ? (
        <SmallNumberInput
          ariaLabel={ariaLabel}
          value={value}
          onChange={onChange}
        />
      ) : (
        value
      )}
    </NumberCell>
  );
}

function EditableMoneyCell({
  value,
  isEditing,
  ariaLabel,
  onChange,
}: {
  value: number;
  isEditing: boolean;
  ariaLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <NumberCell>
      {isEditing ? (
        <MoneyInput ariaLabel={ariaLabel} value={value} onChange={onChange} />
      ) : (
        formatCurrencyFromCents(value)
      )}
    </NumberCell>
  );
}

function BudgetAmountCell({
  line,
  item,
  isEditing,
  onAnnualAmountChange,
}: {
  line: BudgetAnnualFinancial;
  item: BudgetItem;
  isEditing: boolean;
  onAnnualAmountChange: (lineId: string, amountCents: number) => void;
}) {
  return (
    <td className="px-3 py-2 text-right">
      {isEditing ? (
        <MoneyInput
          testId={
            line.id === "fy27-onetrust"
              ? "software-budget-fy27-onetrust"
              : undefined
          }
          ariaLabel={`Budget amount for ${item.name}`}
          value={line.proposedAmountCents}
          onChange={(value) =>
            onAnnualAmountChange(line.id, parseDollarsToCents(value))
          }
        />
      ) : (
        <span className="font-mono text-slate-100">
          {formatCurrencyFromCents(line.proposedAmountCents)}
        </span>
      )}
    </td>
  );
}

function NotesCell({
  item,
  value,
  isEditing,
  onChange,
}: {
  line: BudgetAnnualFinancial;
  item: BudgetItem;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <td className="px-3 py-2">
      {isEditing ? (
        <Input
          aria-label={`Notes for ${item.name}`}
          value={value}
          className="h-8 border-border/80 bg-secondary/45 text-sm"
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <span className="line-clamp-2 text-muted-foreground">{value}</span>
      )}
    </td>
  );
}

function ActionsCell({
  line,
  item,
  isEditing,
  linkedRenewal,
  onEditToggle,
  onOpenDetail,
  onDuplicate,
  onDelete,
  onMaintenanceTransfer,
}: {
  line: BudgetAnnualFinancial;
  item: BudgetItem;
  isEditing: boolean;
  linkedRenewal?: MaintenanceRenewal;
  onEditToggle: (lineId: string) => void;
  onOpenDetail: (lineId: string) => void;
  onDuplicate: (line: BudgetAnnualFinancial) => void;
  onDelete: (lineId: string) => void;
  onMaintenanceTransfer: (line: BudgetAnnualFinancial) => void;
}) {
  return (
    <td className="px-3 py-2">
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size={isEditing ? "xs" : "icon-xs"}
          title={isEditing ? "Done" : "Edit"}
          aria-label={`${isEditing ? "Done editing" : "Edit"} ${item.name}`}
          onClick={() => onEditToggle(line.id)}
        >
          {isEditing ? "Done" : <Pencil />}
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          title="Details"
          aria-label={`Open details for ${item.name}`}
          onClick={() => onOpenDetail(line.id)}
        >
          <ExternalLink />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          title="Duplicate"
          aria-label={`Duplicate ${item.name}`}
          onClick={() => onDuplicate(line)}
        >
          <Copy />
        </Button>
        {isMaintenanceEligible(line, item) ? (
          <Button
            variant="ghost"
            size="icon-xs"
            title={linkedRenewal ? "View Maintenance" : "Send to Maintenance"}
            aria-label={
              linkedRenewal
                ? `View Maintenance for ${item.name}`
                : `Send ${item.name} to Maintenance`
            }
            onClick={() => onMaintenanceTransfer(line)}
          >
            {linkedRenewal ? <ExternalLink /> : <Send />}
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="icon-xs"
          title="Delete"
          aria-label={`Delete ${item.name}`}
          className="text-red-300 hover:text-red-200"
          onClick={() => onDelete(line.id)}
        >
          <Trash2 />
        </Button>
      </div>
    </td>
  );
}

function TextCell({ children }: { children: ReactNode }) {
  return <td className="px-3 py-2">{children}</td>;
}

function NumberCell({ children }: { children: ReactNode }) {
  return <td className="px-3 py-2 text-right font-mono">{children}</td>;
}

function MaintenanceTransferSheet({
  transfer,
  onOpenChange,
  onConfirm,
}: {
  transfer: PendingMaintenanceTransfer | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Sheet open={Boolean(transfer)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-border bg-popover/98 sm:max-w-lg">
        <SheetHeader className="border-b border-border/80">
          <SheetTitle>Send to Maintenance</SheetTitle>
          <SheetDescription>
            Confirm the shared budget information before creating a linked
            Maintenance Renewal record.
          </SheetDescription>
        </SheetHeader>
        {transfer ? (
          <div className="flex flex-col gap-4 overflow-auto px-4 pb-6">
            <div className="rounded-lg border border-border/70 bg-secondary/35 p-3">
              <dl className="grid gap-3 text-sm">
                <Detail label="Product or service" value={transfer.item.name} />
                <Detail label="Vendor" value={displayVendor(transfer.item)} />
                <Detail label="Fiscal year" value={transfer.line.fiscalYear} />
                <Detail
                  label="Budget amount"
                  value={formatCurrencyFromCents(
                    transfer.line.proposedAmountCents
                  )}
                />
                <Detail
                  label="Department or cost center"
                  value={transfer.item.strategicProgramArea}
                />
                <Detail
                  label="Contract reference"
                  value={transfer.item.contractId ?? "None"}
                />
              </dl>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                onClick={onConfirm}
              >
                Create Link
              </Button>
            </div>
          </div>
        ) : null}
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
            Maintain Finance-facing notes and account exceptions for this row.
          </SheetDescription>
        </SheetHeader>
        {line ? (
          <div className="flex flex-col gap-4 overflow-auto px-4 pb-6">
            <div className="rounded-lg border border-border/70 bg-secondary/35 p-3">
              <p className="text-xs text-muted-foreground">Default account</p>
              <p className="mt-1 font-mono text-cyan-200">
                {defaultAccount ? accountLabel(defaultAccount) : "Unassigned"}
              </p>
            </div>
            <AccountSelect
              line={line}
              accounts={accounts}
              onChange={onOverrideChange}
              label="Row-level account override"
            />
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Business justification
              <Textarea
                className="min-h-24 border-border/80 bg-secondary/45 text-sm text-slate-100"
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
              <Textarea
                className="min-h-20 border-border/80 bg-secondary/45 text-sm text-slate-100"
                value={line.riskIfNotFunded}
                onChange={(event) =>
                  onTextChange(line.id, "riskIfNotFunded", event.target.value)
                }
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Notes
              <Textarea
                className="min-h-20 border-border/80 bg-secondary/45 text-sm text-slate-100"
                value={line.comments}
                onChange={(event) =>
                  onTextChange(line.id, "comments", event.target.value)
                }
              />
            </label>
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
    <label className="flex min-w-36 flex-col gap-1 text-xs text-muted-foreground">
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

function AccountSelect({
  line,
  accounts,
  onChange,
  label,
}: {
  line: BudgetAnnualFinancial;
  accounts: BudgetAccount[];
  onChange: (lineId: string, accountId: string) => void;
  label?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label ? <span>{label}</span> : null}
      <select
        aria-label={label ?? `Account for ${line.id}`}
        value={line.accountOverrideId ?? "default"}
        className="h-8 rounded-lg border border-border/80 bg-secondary/45 px-3 text-sm text-slate-100 outline-none"
        onChange={(event) => onChange(line.id, event.target.value)}
      >
        <option value="default">
          Default:{" "}
          {accountLabel(
            accounts.find((account) => account.id === line.accountId) ??
              defaultAccountForWorksheet(line.worksheet)
          )}
        </option>
        {accounts
          .filter((account) => account.active)
          .map((account) => (
            <option key={account.id} value={account.id}>
              {accountLabel(account)}
            </option>
          ))}
      </select>
    </label>
  );
}

function MoneyInput({
  value,
  onChange,
  ariaLabel,
  testId,
}: {
  value: number;
  onChange: (value: string) => void;
  ariaLabel: string;
  testId?: string;
}) {
  return (
    <Input
      data-testid={testId}
      aria-label={ariaLabel}
      value={String(value / 100)}
      inputMode="decimal"
      className="ml-auto h-8 w-28 border-border/80 bg-secondary/45 text-right font-mono text-sm"
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function SmallNumberInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: number;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <Input
      aria-label={ariaLabel}
      value={String(value)}
      inputMode="numeric"
      className="h-8 border-border/80 bg-secondary/45 text-right font-mono text-sm"
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function CurrencyCell({
  value,
  warn = false,
}: {
  value: number;
  warn?: boolean;
}) {
  return (
    <td
      className={cn(
        "px-3 py-2 text-right font-mono text-slate-100",
        warn && "text-red-300"
      )}
    >
      {formatCurrencyFromCents(value)}
    </td>
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
      strategicProgramArea: "Budget Tracking",
      active: true,
    }
  );
}

function parseDollarsToCents(value: string): number {
  const numeric = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(numeric) ? Math.round(numeric * 100) : 0;
}

function parseDollarsOrCount(isCount: boolean, value: string): number {
  const numeric = Number(value.replace(/[$,]/g, ""));
  if (!Number.isFinite(numeric)) return 0;
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

function worksheetLabel(worksheet: BudgetWorksheetType): string {
  return worksheet === "Summary" ? "summary" : worksheet;
}

function worksheetTabLabel(worksheet: BudgetWorksheetType): string {
  return worksheet === "Software and SaaS" ? "Software" : worksheet;
}

function worksheetHeading(worksheet: BudgetWorksheetType): string {
  return worksheet === "Software and SaaS" ? "Software" : worksheet;
}

function columnCountForWorksheet(worksheet: BudgetWorksheetType): number {
  switch (worksheet) {
    case "Software and SaaS":
    case "Professional Services":
      return 7;
    case "Travel":
      return 11;
    case "Training":
    case "Conferences":
    case "Organizational Dues":
      return 6;
    default:
      return 1;
  }
}

function accountLabel(account: BudgetAccount): string {
  if (account.code || account.name) {
    return `${account.code} - ${account.name}`;
  }
  return `${account.code} — ${account.name}`;
}

function displayVendor(item: BudgetItem): string {
  return item.vendorId
    ? item.vendorId
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "Unassigned";
}

function isMaintenanceEligible(
  line: BudgetAnnualFinancial,
  item: BudgetItem
): boolean {
  return (
    line.worksheet === "Software and SaaS" ||
    line.accountId === "acct-63256" ||
    Boolean(item.contractId)
  );
}

function nextSeed(sequenceRef: { current: number }): number {
  sequenceRef.current += 1;
  return sequenceRef.current;
}
