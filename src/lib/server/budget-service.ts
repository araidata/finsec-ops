import {
  BudgetFundingStatus as PrismaBudgetFundingStatus,
  BudgetWorksheetType as PrismaBudgetWorksheetType,
  Prisma,
  RecurringClassification as PrismaRecurringClassification,
  RowReviewState as PrismaRowReviewState,
} from "@prisma/client";

import type {
  BudgetAccount,
  BudgetAnnualFinancial,
  BudgetItem,
  BudgetWorkspaceData,
  BudgetWorksheetType,
  ConferenceBudgetDetail,
  MembershipBudgetDetail,
  ProfessionalServicesBudgetDetail,
  SoftwareBudgetDetail,
  TrainingBudgetDetail,
  TravelBudgetDetail,
} from "@/types/budget";

import { FieldValidationError } from "@/lib/server/action-result";
import { getPrisma } from "@/lib/server/prisma";

const worksheetToDatabase: Record<string, PrismaBudgetWorksheetType> = {
  "Software and SaaS": PrismaBudgetWorksheetType.SOFTWARE_SAAS,
  Conferences: PrismaBudgetWorksheetType.TRAVEL_CONFERENCES,
  Travel: PrismaBudgetWorksheetType.TRAVEL_CONFERENCES,
  Training: PrismaBudgetWorksheetType.TRAINING,
  "Organizational Dues": PrismaBudgetWorksheetType.ORGANIZATIONAL_DUES,
  "Professional Services": PrismaBudgetWorksheetType.PROFESSIONAL_SERVICES,
  Hardware: PrismaBudgetWorksheetType.HARDWARE,
  Personnel: PrismaBudgetWorksheetType.PERSONNEL,
};

const defaultAccountCodes: Record<string, string> = {
  "Software and SaaS": "62094",
  Conferences: "62050",
  Travel: "62026",
  Training: "62460",
  "Organizational Dues": "62081",
  "Professional Services": "62225",
};

type JsonRecord = Record<string, unknown>;
type NamedRelation = { name: string } | null;
type BudgetItemRecord = {
  id: string;
  name: string;
  description: string | null;
  vendorId: string | null;
  resellerId: string | null;
  contractId: string | null;
  productId: string | null;
  productModuleId: string | null;
  owner: string | null;
  strategicProgramArea: string | null;
  active: boolean;
  vendor?: NamedRelation;
  reseller?: NamedRelation;
  vendorCompany?: NamedRelation;
  sellerCompany?: NamedRelation;
};
type BudgetAnnualRecord = {
  id: string;
  budgetPlanId: string;
  scenarioId: string;
  fiscalYear: { label: string };
  budgetItemId: string;
  accountId: string;
  sortOrder: number;
  priorApprovedAmount: unknown;
  currentApprovedAmount: unknown;
  baseAmount: unknown;
  requestedAmount: unknown;
  proposedAmount: unknown;
  approvedAmount: unknown;
  revisedApprovedAmount: unknown;
  forecastAmount: unknown;
  encumberedAmount: unknown;
  actualAmount: unknown;
  unitCost: unknown;
  quantity: unknown;
  oneTimeAmount: unknown;
  recurringAmount: unknown;
  savingsAmount: unknown;
  costAvoidanceAmount: unknown;
  fundingStatus: unknown;
  recurrence: unknown;
  reviewState: unknown;
  isNewRequest: boolean;
  isRecurring: boolean;
  isOneTime: boolean;
  isRetired: boolean;
  comments: string | null;
  businessJustification: string | null;
  riskIfNotFunded: string | null;
  complianceRequirement: string | null;
  owner: string | null;
  linkedMaintenanceRenewalId?: string | null;
};
type BudgetAccountRecord = {
  id: string;
  code: string;
  name: string;
  defaultWorksheet: unknown;
  active: boolean;
  sortOrder: number;
};

export type BudgetRowSaveInput = {
  line: BudgetAnnualFinancial;
  item: BudgetItem;
  detail?:
    | SoftwareBudgetDetail
    | TrainingBudgetDetail
    | ConferenceBudgetDetail
    | TravelBudgetDetail
    | MembershipBudgetDetail
    | ProfessionalServicesBudgetDetail;
};

export type BudgetRowCreateInput = {
  budgetPlanId: string;
  worksheet: BudgetWorksheetType;
};

export async function getBudgetWorkspaceData(): Promise<BudgetWorkspaceData> {
  const prisma = getPrisma();
  const [
    fiscalYears,
    accounts,
    plans,
    annuals,
    maintenanceRenewals,
    savingsRecords,
  ] = await Promise.all([
    prisma.fiscalYear.findMany({ orderBy: { startsOn: "desc" } }),
    prisma.budgetAccount.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    }),
    prisma.budgetPlan.findMany({
      orderBy: [{ fiscalYear: { startsOn: "desc" } }, { version: "asc" }],
      include: { fiscalYear: true },
    }),
    prisma.budgetAnnualFinancial.findMany({
      orderBy: [
        { budgetPlan: { fiscalYear: { startsOn: "desc" } } },
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
      include: {
        account: true,
        budgetItem: {
          include: {
            vendor: true,
            reseller: true,
            vendorCompany: true,
            sellerCompany: true,
          },
        },
        fiscalYear: true,
      },
    }),
    prisma.maintenanceRenewal.findMany({
      orderBy: [{ renewalDate: "asc" }, { createdAt: "asc" }],
      include: { vendorCompany: true, sellerCompany: true },
    }),
    prisma.savingsRecord.findMany({
      orderBy: [{ createdAt: "desc" }],
    }),
  ]);

  const itemsById = new Map<string, BudgetItem>();
  const softwareDetails: SoftwareBudgetDetail[] = [];
  const trainingDetails: TrainingBudgetDetail[] = [];
  const conferenceDetails: ConferenceBudgetDetail[] = [];
  const travelDetails: TravelBudgetDetail[] = [];
  const membershipDetails: MembershipBudgetDetail[] = [];
  const professionalServicesDetails: ProfessionalServicesBudgetDetail[] = [];

  const annualFinancials = annuals.map((annual) => {
    const item = mapBudgetItem(annual.budgetItem);
    itemsById.set(item.id, item);

    const worksheet = databaseWorksheetToUi(
      String(annual.worksheet),
      annual.account.code
    );
    const details = jsonRecord(annual.worksheetDetails);
    const mappedAnnual = mapAnnualFinancial(annual, worksheet);

    if (worksheet === "Software and SaaS") {
      softwareDetails.push(softwareDetail(mappedAnnual, item, details));
    }
    if (worksheet === "Training") {
      trainingDetails.push(trainingDetail(mappedAnnual, item, details));
    }
    if (worksheet === "Conferences") {
      conferenceDetails.push(conferenceDetail(mappedAnnual, item, details));
    }
    if (worksheet === "Travel") {
      travelDetails.push(travelDetail(mappedAnnual, item, details));
    }
    if (worksheet === "Organizational Dues") {
      membershipDetails.push(membershipDetail(mappedAnnual, item, details));
    }
    if (worksheet === "Professional Services") {
      professionalServicesDetails.push(
        professionalDetail(mappedAnnual, item, details)
      );
    }

    return mappedAnnual;
  });

  return {
    fiscalYears: fiscalYears.map((year) => ({
      id: year.id,
      label: year.label,
      startsOn: dateOnly(year.startsOn),
      endsOn: dateOnly(year.endsOn),
    })),
    accounts: accounts.map(mapAccount),
    plans: plans.map((plan) => ({
      id: plan.id,
      fiscalYearId: plan.fiscalYearId,
      fiscalYear: plan.fiscalYear.label,
      name: plan.name,
      status: titleCaseEnum(String(plan.status)) as BudgetWorkspaceData["plans"][number]["status"],
      version: plan.version,
      priorFiscalYear: plan.priorFiscalYear ?? undefined,
      planningOwner: plan.planningOwner,
      submissionDueDate: plan.submissionDueDate
        ? dateOnly(plan.submissionDueDate)
        : "",
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      assumptions: plan.assumptions ?? "",
      executiveNarrative: plan.executiveNarrative ?? "",
    })),
    items: Array.from(itemsById.values()),
    annualFinancials,
    softwareDetails,
    trainingDetails,
    conferenceDetails,
    travelDetails,
    professionalServicesDetails,
    hardwareDetails: [],
    membershipDetails,
    personnelDetails: [],
    maintenanceRenewals: maintenanceRenewals.map((renewal) => ({
      id: renewal.id,
      budgetPlanId: renewal.budgetPlanId,
      linkedAnnualFinancialId: renewal.linkedAnnualFinancialId ?? undefined,
      vendorId: renewal.vendorId ?? renewal.vendorCompanyId ?? undefined,
      resellerId: renewal.resellerId ?? renewal.sellerCompanyId ?? undefined,
      contractId: renewal.contractId ?? undefined,
      productId: renewal.productId ?? undefined,
      vendor: renewal.vendorCompany?.name ?? "",
      productOrService: renewal.productOrService,
      reseller: renewal.sellerCompany?.name ?? undefined,
      currentCostCents: cents(renewal.currentAnnualCost),
      renewalQuoteCents: cents(renewal.renewalQuote),
      negotiatedCostCents: cents(renewal.negotiatedCost),
      renewalDate: dateOnly(renewal.renewalDate),
      contractStart: renewal.contractStart ? dateOnly(renewal.contractStart) : "",
      contractEnd: renewal.contractEnd ? dateOnly(renewal.contractEnd) : "",
      noticePeriodDays: renewal.noticePeriodDays,
      autoRenewal: renewal.autoRenewal,
      paymentFrequency: titleCaseEnum(String(renewal.paymentFrequency)),
      fundingAccountId: renewal.fundingAccountId,
      renewalStatus: titleCaseEnum(String(renewal.renewalStatus)) as BudgetWorkspaceData["maintenanceRenewals"][number]["renewalStatus"],
      procurementStatus: titleCaseEnum(String(renewal.procurementStatus)) as BudgetWorkspaceData["maintenanceRenewals"][number]["procurementStatus"],
      quoteReceivedDate: renewal.quoteReceivedDate
        ? dateOnly(renewal.quoteReceivedDate)
        : undefined,
      purchaseRequestNumber: renewal.purchaseRequestNumber ?? undefined,
      purchaseOrderNumber: renewal.purchaseOrderNumber ?? undefined,
      expectedPaymentDate: renewal.expectedPaymentDate
        ? dateOnly(renewal.expectedPaymentDate)
        : undefined,
      renewalOwner: renewal.renewalOwner ?? "",
      procurementOwner: renewal.procurementOwner ?? "",
      renewalStrategy: renewal.renewalStrategy ?? "",
      renewalRisk: titleCaseEnum(String(renewal.renewalRisk)) as BudgetWorkspaceData["maintenanceRenewals"][number]["renewalRisk"],
      notes: renewal.notesText ?? "",
    })),
    savingsRecords: savingsRecords.map((record) => ({
      id: record.id,
      budgetPlanId: record.budgetPlanId,
      annualFinancialId: record.annualFinancialId ?? undefined,
      renewalId: record.maintenanceRenewalId ?? undefined,
      type: titleCaseEnum(String(record.type)) as BudgetWorkspaceData["savingsRecords"][number]["type"],
      description: record.description,
      amountCents: cents(record.amount),
      costAvoidanceCents: cents(record.costAvoidanceAmount),
      isBudgetReduction: record.isBudgetReduction,
      owner: record.owner ?? "",
    })),
  };
}

export async function createBudgetRow(input: BudgetRowCreateInput) {
  const prisma = getPrisma();
  const plan = await prisma.budgetPlan.findUnique({
    where: { id: input.budgetPlanId },
    include: { fiscalYear: true, scenarios: { orderBy: { createdAt: "asc" } } },
  });
  if (!plan) {
    throw new FieldValidationError("Budget plan was not found.", {
      budgetPlanId: ["Select an existing budget plan."],
    });
  }
  const scenario = activeScenario(plan.scenarios);
  const account = await defaultAccountForWorksheet(input.worksheet);
  const sortOrder = await prisma.budgetAnnualFinancial.count({
    where: { budgetPlanId: plan.id, scenarioId: scenario.id },
  });
  const itemName = `New ${input.worksheet === "Software and SaaS" ? "Software" : input.worksheet} line`;
  const details = defaultWorksheetDetails(input.worksheet, itemName);

  await prisma.$transaction(async (tx) => {
    const item = await tx.budgetItem.create({
      data: {
        name: itemName,
        description: "",
        owner: "",
        strategicProgramArea: "Budget Tracking",
      },
    });
    await tx.budgetAnnualFinancial.create({
      data: {
        budgetPlanId: plan.id,
        scenarioId: scenario.id,
        fiscalYearId: plan.fiscalYearId,
        budgetItemId: item.id,
        accountId: account.id,
        worksheet: uiWorksheetToDatabase(input.worksheet),
        sortOrder,
        requestedAmount: "0.00",
        proposedAmount: "0.00",
        forecastAmount: "0.00",
        unitCost: "0.00",
        quantity: "1.00",
        recurringAmount: "0.00",
        fundingStatus: "REQUESTED",
        reviewState: "NEEDS_REVIEW",
        comments: details.notes ?? "",
        worksheetDetails: details as Prisma.InputJsonObject,
      },
    });
  });
}

export async function saveBudgetRow(input: BudgetRowSaveInput) {
  const prisma = getPrisma();
  const line = input.line;
  const detail = input.detail;
  const annualData = annualPersistenceData(line, detail);

  await prisma.$transaction(async (tx) => {
    await tx.budgetItem.update({
      where: { id: input.item.id },
      data: {
        name: input.item.name,
        description: input.item.description,
        owner: input.item.owner,
        strategicProgramArea: input.item.strategicProgramArea,
      },
    });
    await tx.budgetAnnualFinancial.update({
      where: { id: line.id },
      data: annualData,
    });
  });
}

export async function duplicateBudgetRow(lineId: string) {
  const prisma = getPrisma();
  const source = await prisma.budgetAnnualFinancial.findUnique({
    where: { id: lineId },
    include: { budgetItem: true },
  });
  if (!source) {
    throw new FieldValidationError("Budget row was not found.", {
      lineId: ["Select an existing budget row."],
    });
  }
  const sortOrder = await prisma.budgetAnnualFinancial.count({
    where: { budgetPlanId: source.budgetPlanId, scenarioId: source.scenarioId },
  });

  await prisma.$transaction(async (tx) => {
    const item = await tx.budgetItem.create({
      data: {
        departmentId: source.budgetItem.departmentId,
        ownerTeamMemberId: source.budgetItem.ownerTeamMemberId,
        vendorId: source.budgetItem.vendorId,
        resellerId: source.budgetItem.resellerId,
        vendorCompanyId: source.budgetItem.vendorCompanyId,
        sellerCompanyId: source.budgetItem.sellerCompanyId,
        contractId: source.budgetItem.contractId,
        productId: source.budgetItem.productId,
        productModuleId: source.budgetItem.productModuleId,
        name: `${source.budgetItem.name} Copy`,
        description: source.budgetItem.description,
        owner: source.budgetItem.owner,
        strategicProgramArea: source.budgetItem.strategicProgramArea,
      },
    });
    await tx.budgetAnnualFinancial.create({
      data: {
        budgetPlanId: source.budgetPlanId,
        scenarioId: source.scenarioId,
        fiscalYearId: source.fiscalYearId,
        budgetItemId: item.id,
        accountId: source.accountId,
        worksheet: source.worksheet,
        sortOrder,
        currencyCode: source.currencyCode,
        priorApprovedAmount: source.priorApprovedAmount,
        currentApprovedAmount: source.currentApprovedAmount,
        baseAmount: source.baseAmount,
        requestedAmount: source.requestedAmount,
        proposedAmount: source.proposedAmount,
        approvedAmount: source.approvedAmount,
        revisedApprovedAmount: source.revisedApprovedAmount,
        forecastAmount: source.forecastAmount,
        encumberedAmount: source.encumberedAmount,
        actualAmount: source.actualAmount,
        unitCost: source.unitCost,
        quantity: source.quantity,
        oneTimeAmount: source.oneTimeAmount,
        recurringAmount: source.recurringAmount,
        savingsAmount: source.savingsAmount,
        costAvoidanceAmount: source.costAvoidanceAmount,
        fundingStatus: source.fundingStatus,
        recurrence: source.recurrence,
        reviewState: "UPDATED",
        isNewRequest: source.isNewRequest,
        isRecurring: source.isRecurring,
        isOneTime: source.isOneTime,
        isRetired: source.isRetired,
        comments: source.comments,
        businessJustification: source.businessJustification,
        riskIfNotFunded: source.riskIfNotFunded,
        complianceRequirement: source.complianceRequirement,
        owner: source.owner,
        worksheetDetails: source.worksheetDetails as Prisma.InputJsonValue,
      },
    });
  });
}

export async function deleteBudgetRow(lineId: string) {
  const prisma = getPrisma();
  const line = await prisma.budgetAnnualFinancial.findUnique({
    where: { id: lineId },
    select: { budgetItemId: true },
  });
  if (!line) return;

  await prisma.$transaction(async (tx) => {
    await tx.budgetAnnualFinancial.delete({ where: { id: lineId } });
    const remaining = await tx.budgetAnnualFinancial.count({
      where: { budgetItemId: line.budgetItemId },
    });
    if (remaining === 0) {
      await tx.budgetItem.update({
        where: { id: line.budgetItemId },
        data: { active: false },
      });
    }
  });
}

export function worksheetDetailsForContract({
  contractTitle,
  resellerLabel,
}: {
  contractTitle: string;
  resellerLabel?: string | null;
}) {
  return {
    resellerLabel: resellerLabel || "Direct",
    requestType: "New",
    replaces: "",
    notes: `Created from contract ${contractTitle}.`,
  };
}

export function budgetWorksheetForAccount(
  defaultWorksheet: string
): PrismaBudgetWorksheetType {
  return defaultWorksheet === "MAINTENANCE_RENEWALS"
    ? PrismaBudgetWorksheetType.SOFTWARE_SAAS
    : (defaultWorksheet as PrismaBudgetWorksheetType);
}

function mapBudgetItem(item: BudgetItemRecord): BudgetItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    vendorId:
      item.vendorCompany?.name ?? item.vendor?.name ?? item.vendorId ?? undefined,
    resellerId:
      item.sellerCompany?.name ?? item.reseller?.name ?? item.resellerId ?? undefined,
    contractId: item.contractId ?? undefined,
    productId: item.productId ?? undefined,
    productModuleId: item.productModuleId ?? undefined,
    owner: item.owner ?? "",
    strategicProgramArea: item.strategicProgramArea ?? "",
    active: item.active,
  };
}

function mapAnnualFinancial(
  annual: BudgetAnnualRecord,
  worksheet: BudgetWorksheetType
): BudgetAnnualFinancial {
  return {
    id: annual.id,
    budgetPlanId: annual.budgetPlanId,
    scenarioId: annual.scenarioId,
    fiscalYear: annual.fiscalYear.label,
    budgetItemId: annual.budgetItemId,
    accountId: annual.accountId,
    worksheet,
    sortOrder: annual.sortOrder,
    priorApprovedAmountCents: cents(annual.priorApprovedAmount),
    currentApprovedAmountCents: cents(annual.currentApprovedAmount),
    baseAmountCents: cents(annual.baseAmount),
    requestedAmountCents: cents(annual.requestedAmount),
    proposedAmountCents: cents(annual.proposedAmount),
    approvedAmountCents: cents(annual.approvedAmount),
    revisedApprovedAmountCents: cents(annual.revisedApprovedAmount),
    forecastAmountCents: cents(annual.forecastAmount),
    encumberedAmountCents: cents(annual.encumberedAmount),
    actualAmountCents: cents(annual.actualAmount),
    unitCostCents: cents(annual.unitCost),
    quantity: numberValue(annual.quantity),
    oneTimeAmountCents: cents(annual.oneTimeAmount),
    recurringAmountCents: cents(annual.recurringAmount),
    savingsAmountCents: cents(annual.savingsAmount),
    costAvoidanceAmountCents: cents(annual.costAvoidanceAmount),
    fundingStatus: titleCaseEnum(String(annual.fundingStatus)) as BudgetAnnualFinancial["fundingStatus"],
    recurrence: titleCaseEnum(String(annual.recurrence)) as BudgetAnnualFinancial["recurrence"],
    reviewState: titleCaseEnum(String(annual.reviewState)) as BudgetAnnualFinancial["reviewState"],
    isNewRequest: annual.isNewRequest,
    isRecurring: annual.isRecurring,
    isOneTime: annual.isOneTime,
    isRetired: annual.isRetired,
    comments: annual.comments ?? "",
    businessJustification: annual.businessJustification ?? "",
    riskIfNotFunded: annual.riskIfNotFunded ?? "",
    complianceRequirement: annual.complianceRequirement ?? undefined,
    owner: annual.owner ?? "",
    linkedMaintenanceRenewalId:
      annual.linkedMaintenanceRenewalId ?? undefined,
  };
}

function mapAccount(account: BudgetAccountRecord): BudgetAccount {
  return {
    id: account.id,
    code: account.code,
    name: account.name,
    defaultWorksheet: accountWorksheetToUi(
      String(account.defaultWorksheet),
      account.code
    ),
    active: account.active,
    sortOrder: account.sortOrder,
  };
}

function softwareDetail(
  line: BudgetAnnualFinancial,
  item: BudgetItem,
  details: JsonRecord
): SoftwareBudgetDetail {
  const requestType =
    details.requestType === "Replacement" ? "Replacement" : "New";
  return {
    annualFinancialId: line.id,
    reseller: stringValue(details.resellerLabel) ?? item.resellerId ?? "Direct",
    requestType,
    replaces: stringValue(details.replaces) ?? "",
    notes: stringValue(details.notes) ?? line.comments,
  };
}

function trainingDetail(
  line: BudgetAnnualFinancial,
  item: BudgetItem,
  details: JsonRecord
): TrainingBudgetDetail {
  return {
    annualFinancialId: line.id,
    training: stringValue(details.training) ?? item.description ?? item.name,
    quantity: numberDetail(details.quantity) ?? line.quantity,
    costCents: numberDetail(details.costCents) ?? line.unitCostCents,
  };
}

function conferenceDetail(
  line: BudgetAnnualFinancial,
  item: BudgetItem,
  details: JsonRecord
): ConferenceBudgetDetail {
  return {
    annualFinancialId: line.id,
    conference: stringValue(details.conference) ?? item.name,
    attendees: numberDetail(details.attendees) ?? line.quantity,
    registrationFeeCents:
      numberDetail(details.registrationFeeCents) ?? line.unitCostCents,
  };
}

function travelDetail(
  line: BudgetAnnualFinancial,
  item: BudgetItem,
  details: JsonRecord
): TravelBudgetDetail {
  return {
    annualFinancialId: line.id,
    conferenceOrTrip: stringValue(details.conferenceOrTrip) ?? item.name,
    attendees: numberDetail(details.attendees) ?? line.quantity,
    airfareCents: numberDetail(details.airfareCents) ?? 0,
    hotelCents: numberDetail(details.hotelCents) ?? 0,
    perDiemCents: numberDetail(details.perDiemCents) ?? 0,
    luggageCents: numberDetail(details.luggageCents) ?? 0,
    parkingCents: numberDetail(details.parkingCents) ?? 0,
    taxiUberCents: numberDetail(details.taxiUberCents) ?? 0,
  };
}

function membershipDetail(
  line: BudgetAnnualFinancial,
  item: BudgetItem,
  details: JsonRecord
): MembershipBudgetDetail {
  return {
    annualFinancialId: line.id,
    employee: stringValue(details.employee) ?? item.owner,
    organization: stringValue(details.organization) ?? item.name,
    certification: stringValue(details.certification) ?? "",
    annualFeeCents: numberDetail(details.annualFeeCents) ?? line.proposedAmountCents,
  };
}

function professionalDetail(
  line: BudgetAnnualFinancial,
  item: BudgetItem,
  details: JsonRecord
): ProfessionalServicesBudgetDetail {
  return {
    annualFinancialId: line.id,
    vendor: stringValue(details.vendor) ?? displayVendor(item),
    productOrEmployee: stringValue(details.productOrEmployee) ?? item.name,
    amount: numberDetail(details.amount) ?? 1,
    rateCents: numberDetail(details.rateCents) ?? line.proposedAmountCents,
  };
}

function annualPersistenceData(
  line: BudgetAnnualFinancial,
  detail: BudgetRowSaveInput["detail"]
) {
  const worksheetDetails = detailToJson(line, detail) as Prisma.InputJsonObject;
  const quantity = quantityForPersistence(line, detail);
  const unitCostCents = unitCostForPersistence(line, detail);

  return {
    accountId: line.accountOverrideId ?? line.accountId,
    sortOrder: line.sortOrder,
    worksheet: uiWorksheetToDatabase(line.worksheet),
    priorApprovedAmount: dollars(line.priorApprovedAmountCents),
    currentApprovedAmount: dollars(line.currentApprovedAmountCents),
    baseAmount: dollars(line.baseAmountCents),
    requestedAmount: dollars(line.requestedAmountCents),
    proposedAmount: dollars(line.proposedAmountCents),
    approvedAmount: dollars(line.approvedAmountCents),
    revisedApprovedAmount: dollars(line.revisedApprovedAmountCents),
    forecastAmount: dollars(line.forecastAmountCents),
    encumberedAmount: dollars(line.encumberedAmountCents),
    actualAmount: dollars(line.actualAmountCents),
    unitCost: dollars(unitCostCents),
    quantity: quantity.toFixed(2),
    oneTimeAmount: dollars(line.oneTimeAmountCents),
    recurringAmount: dollars(line.recurringAmountCents),
    savingsAmount: dollars(line.savingsAmountCents),
    costAvoidanceAmount: dollars(line.costAvoidanceAmountCents),
    fundingStatus: uiEnumToDatabase(
      line.fundingStatus
    ) as PrismaBudgetFundingStatus,
    recurrence: uiEnumToDatabase(
      line.recurrence
    ) as PrismaRecurringClassification,
    reviewState: uiEnumToDatabase(line.reviewState) as PrismaRowReviewState,
    isNewRequest: line.isNewRequest,
    isRecurring: line.isRecurring,
    isOneTime: line.isOneTime,
    isRetired: line.isRetired,
    comments: commentsForPersistence(line, detail),
    businessJustification: line.businessJustification,
    riskIfNotFunded: line.riskIfNotFunded,
    complianceRequirement: line.complianceRequirement,
    owner: line.owner,
    worksheetDetails,
  };
}

function detailToJson(
  line: BudgetAnnualFinancial,
  detail: BudgetRowSaveInput["detail"]
) {
  if (!detail) return {};
  if (line.worksheet === "Software and SaaS") {
    const software = detail as SoftwareBudgetDetail;
    return {
      resellerLabel: software.reseller ?? "Direct",
      requestType: software.requestType ?? "New",
      replaces: software.replaces ?? "",
      notes: software.notes ?? line.comments,
    };
  }
  const worksheetDetails = { ...detail } as Record<string, unknown>;
  delete worksheetDetails.annualFinancialId;
  return worksheetDetails;
}

function defaultWorksheetDetails(worksheet: BudgetWorksheetType, name: string) {
  if (worksheet === "Software and SaaS") {
    return { resellerLabel: "Direct", requestType: "New", replaces: "", notes: "" };
  }
  if (worksheet === "Training") return { training: "", quantity: 1, costCents: 0 };
  if (worksheet === "Conferences") {
    return { conference: "", attendees: 1, registrationFeeCents: 0 };
  }
  if (worksheet === "Travel") {
    return {
      conferenceOrTrip: "",
      attendees: 1,
      airfareCents: 0,
      hotelCents: 0,
      perDiemCents: 0,
      luggageCents: 0,
      parkingCents: 0,
      taxiUberCents: 0,
    };
  }
  if (worksheet === "Organizational Dues") {
    return { employee: "", organization: "", certification: "", annualFeeCents: 0 };
  }
  if (worksheet === "Professional Services") {
    return { vendor: "", productOrEmployee: name, amount: 1, rateCents: 0 };
  }
  return {};
}

async function defaultAccountForWorksheet(worksheet: BudgetWorksheetType) {
  const prisma = getPrisma();
  const code = defaultAccountCodes[worksheet];
  const account = await prisma.budgetAccount.findFirst({
    where: code
      ? { code, active: true }
      : { defaultWorksheet: uiWorksheetToDatabase(worksheet), active: true },
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
  });
  if (!account) {
    throw new FieldValidationError("Budget account was not found.", {
      accountId: ["Create an active default account for this worksheet."],
    });
  }
  return account;
}

function activeScenario(scenarios: Array<{ id: string; isActive: boolean }>) {
  const scenario = scenarios.find((candidate) => candidate.isActive) ?? scenarios[0];
  if (!scenario) {
    throw new FieldValidationError("Budget plan has no scenario.", {
      budgetPlanId: ["Create a budget scenario before adding rows."],
    });
  }
  return scenario;
}

function databaseWorksheetToUi(value: string, accountCode?: string): BudgetWorksheetType {
  if (value === "SOFTWARE_SAAS" || value === "MAINTENANCE_RENEWALS") {
    return "Software and SaaS";
  }
  if (value === "TRAINING") return "Training";
  if (value === "ORGANIZATIONAL_DUES") return "Organizational Dues";
  if (value === "PROFESSIONAL_SERVICES") return "Professional Services";
  if (value === "TRAVEL_CONFERENCES") {
    return accountCode === "62026" ? "Travel" : "Conferences";
  }
  if (value === "HARDWARE") return "Hardware";
  if (value === "PERSONNEL") return "Personnel";
  return "Software and SaaS";
}

function accountWorksheetToUi(value: string, accountCode?: string): BudgetWorksheetType {
  return databaseWorksheetToUi(value, accountCode);
}

function uiWorksheetToDatabase(worksheet: BudgetWorksheetType) {
  return worksheetToDatabase[worksheet] ?? PrismaBudgetWorksheetType.SOFTWARE_SAAS;
}

function uiEnumToDatabase(value: string) {
  return value.replace(/-/g, " ").replace(/\s+/g, "_").toUpperCase();
}

function titleCaseEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .replace("Saas", "SaaS");
}

function jsonRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function numberDetail(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function numberValue(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function cents(value: unknown) {
  return Math.round(numberValue(value) * 100);
}

function dollars(centsValue: number) {
  return (centsValue / 100).toFixed(2);
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function displayVendor(item: BudgetItem) {
  return item.vendorId
    ? item.vendorId
    : "Unassigned";
}

function quantityForPersistence(
  line: BudgetAnnualFinancial,
  detail: BudgetRowSaveInput["detail"]
) {
  if (!detail) return line.quantity;
  if ("quantity" in detail && typeof detail.quantity === "number") {
    return detail.quantity;
  }
  if ("attendees" in detail && typeof detail.attendees === "number") {
    return detail.attendees;
  }
  if ("amount" in detail && typeof detail.amount === "number") {
    return detail.amount;
  }
  return line.quantity;
}

function unitCostForPersistence(
  line: BudgetAnnualFinancial,
  detail: BudgetRowSaveInput["detail"]
) {
  if (!detail) return line.unitCostCents;
  if ("costCents" in detail && typeof detail.costCents === "number") {
    return detail.costCents;
  }
  if (
    "registrationFeeCents" in detail &&
    typeof detail.registrationFeeCents === "number"
  ) {
    return detail.registrationFeeCents;
  }
  if ("annualFeeCents" in detail && typeof detail.annualFeeCents === "number") {
    return detail.annualFeeCents;
  }
  if ("rateCents" in detail && typeof detail.rateCents === "number") {
    return detail.rateCents;
  }
  return line.unitCostCents;
}

function commentsForPersistence(
  line: BudgetAnnualFinancial,
  detail: BudgetRowSaveInput["detail"]
) {
  if (detail && "notes" in detail && typeof detail.notes === "string") {
    return detail.notes;
  }
  return line.comments;
}
