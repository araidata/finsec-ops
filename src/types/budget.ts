export const budgetPlanStatuses = [
  "Draft",
  "In Review",
  "Submitted",
  "Approved",
  "Partially Approved",
  "Revised",
  "Closed",
] as const;

export const budgetWorksheetTypes = [
  "Summary",
  "Operating Expenses",
  "Software and SaaS",
  "Conferences",
  "Travel",
  "Hardware",
  "Professional Services",
  "Training",
  "Travel and Conferences",
  "Organizational Dues",
  "Personnel",
  "New Requests",
  "Savings and Reductions",
] as const;

export const budgetFundingStatuses = [
  "Draft",
  "Requested",
  "Approved",
  "Partially Approved",
  "Deferred",
  "Rejected",
  "Unfunded",
] as const;

export const rowReviewStates = [
  "Needs Review",
  "Reviewed",
  "Updated",
  "Retired",
] as const;

export const recurringClassifications = [
  "Recurring",
  "One-Time",
  "Mixed",
] as const;

export const renewalStatuses = [
  "Not Started",
  "Planning",
  "Quote Requested",
  "Quote Received",
  "Negotiating",
  "Budget Confirmed",
  "Purchase Request Submitted",
  "Approved",
  "Ordered",
  "Renewed",
  "Non-Renewal Planned",
  "Retired",
] as const;

export const procurementStatuses = [
  "Not Required",
  "Not Started",
  "In Preparation",
  "Submitted",
  "Under Review",
  "Approved",
  "Purchase Order Issued",
  "Completed",
  "Blocked",
] as const;

export const savingsTypes = [
  "Contract negotiation",
  "Product retirement",
  "Product consolidation",
  "License reduction",
  "Reseller change",
  "Scope reduction",
  "Multi-year agreement",
  "One-time cost expiration",
  "Avoided purchase",
  "Other",
] as const;

export type BudgetPlanStatus = (typeof budgetPlanStatuses)[number];
export type BudgetWorksheetType = (typeof budgetWorksheetTypes)[number];
export type BudgetFundingStatus = (typeof budgetFundingStatuses)[number];
export type RowReviewState = (typeof rowReviewStates)[number];
export type RecurringClassification = (typeof recurringClassifications)[number];
export type RenewalStatus = (typeof renewalStatuses)[number];
export type ProcurementStatus = (typeof procurementStatuses)[number];
export type SavingsType = (typeof savingsTypes)[number];

export type BudgetAccount = {
  id: string;
  code: string;
  name: string;
  defaultWorksheet: BudgetWorksheetType;
  active: boolean;
  sortOrder: number;
};

export type FiscalYearOption = {
  id: string;
  label: string;
  startsOn: string;
  endsOn: string;
};

export type BudgetPlan = {
  id: string;
  fiscalYearId: string;
  fiscalYear: string;
  name: string;
  status: BudgetPlanStatus;
  version: string;
  priorFiscalYear?: string;
  planningOwner: string;
  submissionDueDate: string;
  createdAt: string;
  updatedAt: string;
  assumptions: string;
  executiveNarrative: string;
};

export type BudgetItem = {
  id: string;
  name: string;
  description: string;
  vendorId?: string;
  resellerId?: string;
  contractId?: string;
  productId?: string;
  productModuleId?: string;
  owner: string;
  strategicProgramArea: string;
  active: boolean;
};

export type BudgetAnnualFinancial = {
  id: string;
  budgetPlanId: string;
  scenarioId: string;
  fiscalYear: string;
  budgetItemId: string;
  accountId: string;
  accountOverrideId?: string;
  worksheet: BudgetWorksheetType;
  sortOrder: number;
  priorApprovedAmountCents: number;
  currentApprovedAmountCents: number;
  baseAmountCents: number;
  requestedAmountCents: number;
  proposedAmountCents: number;
  approvedAmountCents: number;
  revisedApprovedAmountCents: number;
  forecastAmountCents: number;
  encumberedAmountCents: number;
  actualAmountCents: number;
  unitCostCents: number;
  quantity: number;
  oneTimeAmountCents: number;
  recurringAmountCents: number;
  savingsAmountCents: number;
  costAvoidanceAmountCents: number;
  fundingStatus: BudgetFundingStatus;
  recurrence: RecurringClassification;
  reviewState: RowReviewState;
  isNewRequest: boolean;
  isRecurring: boolean;
  isOneTime: boolean;
  isRetired: boolean;
  comments: string;
  businessJustification: string;
  riskIfNotFunded: string;
  complianceRequirement?: string;
  owner: string;
  linkedMaintenanceRenewalId?: string;
};

export type SoftwareBudgetDetail = {
  annualFinancialId: string;
  reseller?: string;
  requestType?: "New" | "Replacement";
  replaces?: string;
  notes: string;
};

export type TrainingBudgetDetail = {
  annualFinancialId: string;
  training: string;
  quantity: number;
  costCents: number;
};

export type ConferenceBudgetDetail = {
  annualFinancialId: string;
  conference: string;
  attendees: number;
  registrationFeeCents: number;
};

export type TravelBudgetDetail = {
  annualFinancialId: string;
  conferenceOrTrip: string;
  attendees: number;
  airfareCents: number;
  hotelCents: number;
  perDiemCents: number;
  luggageCents: number;
  parkingCents: number;
  taxiUberCents: number;
};

export type ProfessionalServicesBudgetDetail = {
  annualFinancialId: string;
  vendor: string;
  productOrEmployee: string;
  amount: number;
  rateCents: number;
};

export type HardwareBudgetDetail = {
  annualFinancialId: string;
  vendor: string;
  equipment: string;
  quantity: number;
  unitCostCents: number;
  installationCents: number;
  maintenanceCents: number;
  replacementOrNew: "Replacement" | "New";
  replaces?: string;
};

export type MembershipBudgetDetail = {
  annualFinancialId: string;
  employee: string;
  organization: string;
  certification: string;
  annualFeeCents: number;
};

export type PersonnelBudgetDetail = {
  annualFinancialId: string;
  positionTitle: string;
  positionType: "Existing" | "New" | "Reclassified";
  positionCount: number;
  salaryCents: number;
  benefitsCents: number;
  proposedStartDate?: string;
};

export type MaintenanceRenewal = {
  id: string;
  budgetPlanId: string;
  linkedAnnualFinancialId?: string;
  vendorId?: string;
  resellerId?: string;
  contractId?: string;
  productId?: string;
  vendor: string;
  productOrService: string;
  reseller?: string;
  currentCostCents: number;
  renewalQuoteCents: number;
  negotiatedCostCents: number;
  renewalDate: string;
  contractStart: string;
  contractEnd: string;
  noticePeriodDays: number;
  autoRenewal: boolean;
  paymentFrequency: string;
  fundingAccountId: string;
  renewalStatus: RenewalStatus;
  procurementStatus: ProcurementStatus;
  quoteReceivedDate?: string;
  purchaseRequestNumber?: string;
  purchaseOrderNumber?: string;
  expectedPaymentDate?: string;
  renewalOwner: string;
  procurementOwner: string;
  renewalStrategy: string;
  renewalRisk: "Low" | "Medium" | "High" | "Critical";
  notes: string;
};

export type SavingsRecord = {
  id: string;
  budgetPlanId: string;
  annualFinancialId?: string;
  renewalId?: string;
  type: SavingsType;
  description: string;
  amountCents: number;
  costAvoidanceCents: number;
  isBudgetReduction: boolean;
  owner: string;
};

export type BudgetWorkspaceData = {
  fiscalYears: FiscalYearOption[];
  accounts: BudgetAccount[];
  plans: BudgetPlan[];
  items: BudgetItem[];
  annualFinancials: BudgetAnnualFinancial[];
  softwareDetails: SoftwareBudgetDetail[];
  trainingDetails: TrainingBudgetDetail[];
  conferenceDetails: ConferenceBudgetDetail[];
  travelDetails: TravelBudgetDetail[];
  professionalServicesDetails: ProfessionalServicesBudgetDetail[];
  hardwareDetails: HardwareBudgetDetail[];
  membershipDetails: MembershipBudgetDetail[];
  personnelDetails: PersonnelBudgetDetail[];
  maintenanceRenewals: MaintenanceRenewal[];
  savingsRecords: SavingsRecord[];
};
