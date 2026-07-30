export const DEPLOYMENT_LIST_DEFAULT_SIZE = 50;
export const DEPLOYMENT_LIST_MAX_SIZE = 100;
export const DEPLOYMENT_USAGE_DEFAULT_SIZE = 50;
export const DEPLOYMENT_USAGE_MAX_SIZE = 100;

export type DeploymentSortKey =
  | "updatedAt"
  | "scopeName"
  | "owner"
  | "status"
  | "deploymentPercent"
  | "utilizationPercent";

export type DeploymentListFilters = {
  search?: string;
  departmentId?: string;
  ownerTeamMemberId?: string;
  vendorCompanyId?: string;
  productId?: string;
  status?: string;
  sortBy?: DeploymentSortKey;
  sortDirection?: "asc" | "desc";
  cursor?: string;
  pageSize?: number;
};

export type DeploymentCompanyDto = { id: string; name: string };
export type DeploymentProductDto = {
  id: string;
  name: string;
  vendorCompany: DeploymentCompanyDto | null;
};
export type DeploymentProductModuleDto = { id: string; name: string };

export type DeploymentRenewalSummaryDto = {
  id: string;
  renewalDate: string;
  departmentId: string | null;
  departmentRef: { name: string } | null;
  vendorCompany: DeploymentCompanyDto | null;
};

export type DeploymentRenewalLineDto = {
  id: string;
  maintenanceRenewalId: string;
  description: string;
  currentQuantity: string;
  proposedQuantity: string;
  product: DeploymentProductDto | null;
  productModule: DeploymentProductModuleDto | null;
  maintenanceRenewal: DeploymentRenewalSummaryDto;
};

export type DeploymentContractLineDto = {
  id: string;
  contractId: string;
  description: string;
  quantity: string;
  licenseMetric: string | null;
  annualAmount: string;
  product: DeploymentProductDto | null;
  productModule: DeploymentProductModuleDto | null;
  contract: {
    id: string;
    title: string;
    vendorCompany: DeploymentCompanyDto | null;
  };
};

export type DeploymentPurchaseItemDto = {
  id: string;
  quantity: string | null;
  product: DeploymentProductDto | null;
  productModule: DeploymentProductModuleDto | null;
  purchase: {
    title: string;
    contract: { title: string } | null;
    sellerCompany: DeploymentCompanyDto | null;
  } | null;
};

export type DeploymentListRowDto = {
  id: string;
  updatedAt: string;
  departmentId: string | null;
  ownerTeamMemberId: string | null;
  contractLineItemId: string | null;
  purchaseItemId: string | null;
  maintenanceRenewalId: string | null;
  maintenanceRenewalLineItemId: string | null;
  scopeName: string;
  environment: string | null;
  department: string | null;
  owner: string | null;
  status: string;
  deploymentPercent: string;
  utilizationPercent: string | null;
  licensedQuantity: number | null;
  activeUsageQuantity: number | null;
  targetPopulation: number | null;
  deployedPopulation: number | null;
  targetDate: string | null;
  completedDate: string | null;
  blockers: string | null;
  contractLineItem: DeploymentContractLineDto | null;
  maintenanceRenewal: DeploymentRenewalSummaryDto | null;
  maintenanceRenewalLineItem: DeploymentRenewalLineDto | null;
  purchaseItem: DeploymentPurchaseItemDto | null;
};

export type DeploymentDetailDto = DeploymentListRowDto & {
  adoptionLevel: string | null;
  valueNarrative: string | null;
};

export type DeploymentUsageDto = {
  id: string;
  measuredAt: string;
  licensedCount: number | null;
  deployedCount: number | null;
  activeUsageCount: number | null;
  utilizationPercent: string | null;
  source: string | null;
  notesText: string | null;
};

export type DeploymentMetricsDto = {
  tracked: number;
  fullyDeployed: number;
  partiallyDeployed: number;
  notStartedOrBlocked: number;
  averageUtilization: string;
};

export type DeploymentFilterOptionsDto = {
  departments: Array<{ id: string; name: string; active: boolean }>;
  owners: Array<{
    id: string;
    fullName: string;
    active: boolean;
    departmentId: string | null;
  }>;
  vendors: DeploymentCompanyDto[];
  products: Array<{ id: string; name: string; vendorCompanyId: string | null }>;
};

export type DeploymentEditorOptionsDto = {
  renewalLineItems: DeploymentRenewalLineDto[];
  departments: DeploymentFilterOptionsDto["departments"];
  teamMembers: DeploymentFilterOptionsDto["owners"];
  deploymentEnvironments: Array<{
    id: string;
    name: string;
    active: boolean;
  }>;
};

export type DeploymentPageDataDto = {
  deployments: DeploymentListRowDto[];
  selectedDeployment: DeploymentDetailDto | null;
  usageMeasurements: DeploymentUsageDto[];
  nextCursor: string | null;
  nextUsageCursor: string | null;
  metrics: DeploymentMetricsDto;
  filterOptions: DeploymentFilterOptionsDto;
  editorOptions: DeploymentEditorOptionsDto;
  filters: Required<
    Pick<DeploymentListFilters, "sortBy" | "sortDirection" | "pageSize">
  > &
    Omit<DeploymentListFilters, "sortBy" | "sortDirection" | "pageSize">;
  optionSets: {
    deploymentStatuses: readonly string[];
    adoptionLevels: readonly string[];
  };
};
