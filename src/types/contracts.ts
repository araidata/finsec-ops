export const CONTRACT_LIST_DEFAULT_SIZE = 50;
export const CONTRACT_LIST_MAX_SIZE = 100;

export type ContractSortKey =
  | "title"
  | "department"
  | "vendor"
  | "seller"
  | "term"
  | "annualValue"
  | "totalValue"
  | "notice"
  | "status"
  | "owner";

export type ContractListFilters = {
  search?: string;
  vendorCompanyId?: string;
  sellerCompanyId?: string;
  status?: string;
  renewalWindow?: "Past due" | "30 days" | "60 days" | "90 days" | "Later";
  sortBy?: ContractSortKey;
  sortDirection?: "asc" | "desc";
  cursor?: string;
  pageSize?: number;
};

export type ContractCompanyDto = {
  id: string;
  name: string;
  active: boolean;
  roles: Array<{ role: string }>;
};

export type ContractRenewalSummaryDto = {
  id: string;
  renewalName: string;
  renewalDate: string;
  workflowStage: string;
  overallStatus: string;
  approvedDisposition: string | null;
  recommendedDisposition: string;
  currentAnnualCost: string;
  forecastedRenewalCost: string;
  lineItemCount: number;
};

export type ContractListRowDto = {
  id: string;
  updatedAt: string;
  departmentId: string | null;
  department: { name: string } | null;
  contractNumber: string | null;
  title: string;
  vendorCompanyId: string | null;
  sellerCompanyId: string | null;
  contractType: string;
  status: string;
  renewalDate: string | null;
  autoRenewal: boolean;
  noticePeriodDays: number;
  annualValue: string;
  totalValue: string;
  paymentFrequency: string;
  businessOwner: string | null;
  securityOwner: string | null;
  procurementContact: string | null;
  contractOwner: string | null;
  vendorAccountManager: string | null;
  resellerAccountManager: string | null;
  renewalRiskLevel: string;
  startsOn: string;
  endsOn: string;
  vendorCompany: { name: string; active: boolean } | null;
  sellerCompany: { name: string; active: boolean } | null;
  owner: { name: string } | null;
  lineItemCount: number;
  latestRenewal: ContractRenewalSummaryDto | null;
};

export type ContractLineItemDto = {
  id: string;
  productId: string | null;
  productModuleId: string | null;
  description: string;
  sku: string | null;
  quantity: string;
  licenseMetric: string | null;
  unitPrice: string;
  annualAmount: string;
  totalAmount: string;
  startsOn: string | null;
  endsOn: string | null;
  renewable: boolean;
  sortOrder: number;
  notesText: string | null;
  product: { name: string } | null;
  productModule: { name: string } | null;
};

export type ContractDetailDto = ContractListRowDto & {
  renewalStrategy: string | null;
  notesText: string | null;
  lineItems: ContractLineItemDto[];
  maintenanceRenewals: ContractRenewalSummaryDto[];
  documents: Array<{ id: string; title: string; type: string }>;
};

export type ContractMetricsDto = {
  active: number;
  annualValue: string;
  totalValue: string;
  due90: number;
  noRenewal: number;
  lineItems: number;
};

export type ContractListResultDto = {
  rows: ContractListRowDto[];
  nextCursor: string | null;
  metrics: ContractMetricsDto;
};

export type ContractEditorOptionsDto = {
  products: Array<{
    id: string;
    name: string;
    active: boolean;
    vendorCompanyId: string | null;
    vendorCompany: { name: string } | null;
  }>;
  modules: Array<{
    id: string;
    name: string;
    active: boolean;
    productId: string;
    product: { name: string } | null;
  }>;
  paymentFrequencies: string[];
  licenseMetrics: string[];
};

export type ContractHandoffOptionsDto = {
  fiscalYears: Array<{ id: string; label: string }>;
  budgetPlans: Array<{
    id: string;
    name: string;
    version: string;
    fiscalYear: { label: string };
  }>;
  budgetAccounts: Array<{ id: string; code: string; name: string }>;
  annualFinancials: Array<{
    id: string;
    budgetPlan: { name: string };
    scenario: { label: string };
    account: { code: string };
    budgetItem: { name: string };
  }>;
};

export type ContractPageDataDto = {
  contracts: ContractListRowDto[];
  selectedContract: ContractDetailDto | null;
  nextCursor: string | null;
  metrics: ContractMetricsDto;
  companies: ContractCompanyDto[];
  optionSets: {
    contractTypes: readonly string[];
    contractStatuses: readonly string[];
    paymentFrequencies: readonly string[];
    renewalRisks: readonly string[];
    licenseMetrics: readonly string[];
  };
  filters: Required<
    Pick<ContractListFilters, "sortBy" | "sortDirection" | "pageSize">
  > &
    Omit<ContractListFilters, "sortBy" | "sortDirection" | "pageSize">;
};
