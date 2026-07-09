import {
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  FileArchive,
  FileText,
  Home,
  Landmark,
  PackageCheck,
  ReceiptText,
  Settings,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";

export const navigationItems = [
  { label: "Overview", icon: Home, active: true },
  { label: "Budgets", icon: CircleDollarSign, active: false },
  { label: "Vendors", icon: Users, active: false },
  { label: "Contracts", icon: FileText, active: false },
  { label: "Renewals", icon: CalendarClock, active: false },
  { label: "Procurement", icon: ClipboardList, active: false },
  { label: "Reports", icon: BarChart3, active: false },
  { label: "Documents", icon: FileArchive, active: false },
  { label: "Settings", icon: Settings, active: false },
] as const;

export const metricCards = [
  {
    label: "Budget Utilization",
    value: "$8.4M",
    detail: "68% of approved FY plan",
    trend: "+4.2% vs last quarter",
    accent: "teal",
    icon: Landmark,
  },
  {
    label: "Renewal Exposure",
    value: "$2.1M",
    detail: "Next 120 days",
    trend: "17 renewals in window",
    accent: "amber",
    icon: CalendarClock,
  },
  {
    label: "Forecast Variance",
    value: "-3.8%",
    detail: "Below planned baseline",
    trend: "Driven by deferred tooling",
    accent: "blue",
    icon: TrendingUp,
  },
  {
    label: "Contract Spend",
    value: "$11.7M",
    detail: "Active commitments",
    trend: "42 vendor agreements",
    accent: "red",
    icon: BriefcaseBusiness,
  },
] as const;

export const spendCategoryData = [
  { category: "Cloud Security", spend: 2.4, fill: "var(--color-cloud)" },
  { category: "Identity", spend: 1.8, fill: "var(--color-identity)" },
  { category: "Endpoint", spend: 1.2, fill: "var(--color-endpoint)" },
  { category: "Data Security", spend: 0.9, fill: "var(--color-data)" },
  { category: "Risk Ops", spend: 0.7, fill: "var(--color-risk)" },
];

export const forecastTrendData = [
  { month: "Jan", planned: 6.8, forecast: 6.5 },
  { month: "Feb", planned: 7.1, forecast: 6.9 },
  { month: "Mar", planned: 7.5, forecast: 7.2 },
  { month: "Apr", planned: 7.8, forecast: 7.7 },
  { month: "May", planned: 8.3, forecast: 8.0 },
  { month: "Jun", planned: 8.9, forecast: 8.4 },
];

export const upcomingRenewals = [
  {
    vendor: "CrowdStrike",
    product: "Falcon Complete",
    owner: "SecOps",
    window: "Aug 2026",
    amount: "$420K",
    status: "Review",
  },
  {
    vendor: "Microsoft",
    product: "E5 Security",
    owner: "Identity",
    window: "Sep 2026",
    amount: "$780K",
    status: "Approved",
  },
  {
    vendor: "Wiz",
    product: "CNAPP",
    owner: "Cloud Security",
    window: "Oct 2026",
    amount: "$315K",
    status: "Negotiating",
  },
  {
    vendor: "Splunk",
    product: "Enterprise Security",
    owner: "Detection",
    window: "Nov 2026",
    amount: "$610K",
    status: "At Risk",
  },
];

export const procurementQueue = [
  {
    title: "Data security expansion",
    owner: "Privacy Engineering",
    amount: "$180K",
    status: "Business case",
    accent: "blue",
  },
  {
    title: "Third-party risk enrichment",
    owner: "Security Governance",
    amount: "$95K",
    status: "Sourcing",
    accent: "teal",
  },
  {
    title: "SIEM storage increase",
    owner: "Detection",
    amount: "$240K",
    status: "Variance review",
    accent: "amber",
  },
] as const;

export const portfolioHighlights = [
  { label: "Planning scope", value: "Cybersecurity portfolio" },
  { label: "Budget cycle", value: "FY 2026 operating plan" },
  { label: "Forecast model", value: "Quarterly baseline" },
  { label: "Reporting audience", value: "CISO + finance leadership" },
] as const;

export const portfolioIcon = Shield;
export const moduleIcon = PackageCheck;
export const receiptIcon = ReceiptText;
