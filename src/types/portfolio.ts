export const budgetCategories = [
  "Security Operations",
  "Identity & Access Management",
  "Endpoint Security",
  "Network Security",
  "Cloud Security",
  "Data Security",
  "Vulnerability & Exposure Management",
  "Governance, Risk & Compliance",
  "Workforce Security Awareness",
  "Cybersecurity Staff Training & Development",
  "Incident Response & Forensics",
  "Threat Intelligence",
  "Backup, Recovery & Resilience",
  "Asset & Configuration Management",
  "Managed Security Services",
  "Professional Services & Consulting",
  "Security Architecture & Engineering",
  "Compliance & Audit Support",
  "Other",
] as const;

export const expenseTypes = [
  "Software / SaaS",
  "Hardware",
  "Subscription",
  "Managed Service",
  "Professional Service",
  "Consulting",
  "Training",
  "Certification",
  "Support / Maintenance",
  "Cloud / Infrastructure",
  "One-Time Purchase",
  "Other",
] as const;

export const fundingStatuses = [
  "Planned",
  "Requested",
  "Approved",
  "Partially Approved",
  "Deferred",
  "Rejected",
  "Unfunded",
] as const;

export const contractTypes = [
  "Software",
  "SaaS",
  "Hardware",
  "Professional Services",
  "Managed Services",
  "Support",
  "Maintenance",
  "Training",
  "Certification",
  "Other",
] as const;

export const contractStatuses = [
  "Active",
  "Pending",
  "Renewing",
  "Expiring Soon",
  "Expired",
  "Terminated",
] as const;

export const renewalRiskLevels = ["Low", "Medium", "High", "Critical"] as const;

export const paymentFrequencies = [
  "Monthly",
  "Quarterly",
  "Annual",
  "Multi-Year",
  "One-Time",
] as const;

export const productCategories = [
  "Endpoint Security",
  "Identity & Access",
  "Network Security",
  "Cloud Security",
  "Data Security",
  "Application Security",
  "Security Operations",
  "Governance, Risk & Compliance",
  "Vulnerability & Exposure Management",
  "Threat Intelligence",
  "Workforce Security Awareness",
  "Cybersecurity Staff Training & Development",
  "Backup & Resilience",
  "Asset & Configuration Management",
  "Managed Security Services",
  "Professional Services",
  "Other",
] as const;

export const capabilityCategories = [
  "SIEM",
  "SOAR",
  "EDR",
  "XDR",
  "MDR",
  "Vulnerability Management",
  "Exposure Management",
  "IAM",
  "PAM",
  "MFA",
  "SSO",
  "Email Security",
  "DNS Security",
  "Secure Web Gateway",
  "Firewall",
  "IPS",
  "CASB",
  "CNAPP",
  "CSPM",
  "CWPP",
  "DLP",
  "DSPM",
  "GRC",
  "Third-Party Risk",
  "Security Awareness",
  "Phishing Simulation",
  "Staff Training",
  "Certification Training",
  "Asset Inventory",
  "MDM",
  "Backup",
  "Threat Intelligence",
  "Digital Forensics",
  "Incident Response",
  "Other",
] as const;

export const deploymentStatuses = [
  "Planned",
  "Implementing",
  "Active",
  "Partially Deployed",
  "Under Review",
  "Retiring",
  "Retired",
] as const;

export const priorityLevels = ["Low", "Medium", "High", "Critical"] as const;

export const adoptionLevels = [
  "Not Used",
  "Low",
  "Medium",
  "High",
  "Fully Adopted",
] as const;

export type BudgetCategory = (typeof budgetCategories)[number];
export type ExpenseType = (typeof expenseTypes)[number];
export type FundingStatus = (typeof fundingStatuses)[number];
export type ContractType = (typeof contractTypes)[number];
export type ContractStatus = (typeof contractStatuses)[number];
export type RenewalRiskLevel = (typeof renewalRiskLevels)[number];
export type PaymentFrequency = (typeof paymentFrequencies)[number];
export type ProductCategory = (typeof productCategories)[number];
export type CapabilityCategory = (typeof capabilityCategories)[number];
export type DeploymentStatus = (typeof deploymentStatuses)[number];
export type PriorityLevel = (typeof priorityLevels)[number];
export type AdoptionLevel = (typeof adoptionLevels)[number];

export type Vendor = {
  id: string;
  name: string;
  type: "Vendor" | "Reseller" | "Both";
};

export type Reseller = {
  id: string;
  name: string;
};

export type BudgetItem = {
  id: string;
  budgetYear: string;
  budgetCategory: BudgetCategory;
  expenseType: ExpenseType;
  vendorId: string;
  resellerId?: string;
  productOrServiceName: string;
  description: string;
  budgetedAmount: number;
  forecastedAmount: number;
  actualAmount: number;
  fundingStatus: FundingStatus;
  owner: string;
  businessJustification: string;
  riskIfNotFunded: string;
  notes: string;
  contractId?: string;
  productId?: string;
};

export type Contract = {
  id: string;
  vendorId: string;
  resellerId?: string;
  contractName: string;
  contractType: ContractType;
  associatedProductOrService: string;
  startDate: string;
  endDate: string;
  renewalDate: string;
  autoRenewal: boolean;
  noticePeriodDays: number;
  annualContractValue: number;
  totalContractValue: number;
  paymentFrequency: PaymentFrequency;
  contractOwner: string;
  businessOwner: string;
  securityOwner: string;
  procurementContact: string;
  vendorAccountManager: string;
  resellerAccountManager?: string;
  contractStatus: ContractStatus;
  renewalRiskLevel: RenewalRiskLevel;
  renewalStrategy: string;
  notes: string;
  productIds: string[];
};

export type ProductModule = {
  id: string;
  productId: string;
  moduleName: string;
  description: string;
  capabilityModuleCategory: CapabilityCategory;
  enabled: boolean;
  adoptionLevel: AdoptionLevel;
  licenseCount: number;
  usedCount: number;
  moduleCost: number;
  owner: string;
  notes: string;
};

export type Product = {
  id: string;
  vendorId: string;
  resellerId?: string;
  productName: string;
  productCategory: ProductCategory;
  capabilityCategory: CapabilityCategory;
  description: string;
  deploymentStatus: DeploymentStatus;
  businessOwner: string;
  technicalOwner: string;
  securityOwner: string;
  primaryUseCase: string;
  strategicValue: PriorityLevel;
  criticality: PriorityLevel;
  annualCost: number;
  contractId?: string;
  budgetItemId?: string;
  notes: string;
};
