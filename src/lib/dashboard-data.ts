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
  { label: "Overview", href: "/", icon: Home, active: true },
  { label: "Budgets", href: "/budgets", icon: CircleDollarSign, active: false },
  { label: "Vendors", href: "#", icon: Users, active: false },
  { label: "Contracts", href: "/contracts", icon: FileText, active: false },
  {
    label: "Product Catalog",
    href: "/products",
    icon: PackageCheck,
    active: false,
  },
  { label: "Purchases", href: "/purchases", icon: ReceiptText, active: false },
  { label: "Renewals", href: "#", icon: CalendarClock, active: false },
  { label: "Procurement", href: "#", icon: ClipboardList, active: false },
  { label: "Reports", href: "#", icon: BarChart3, active: false },
  { label: "Documents", href: "#", icon: FileArchive, active: false },
  { label: "Settings", href: "#", icon: Settings, active: false },
] as const;

export const metricCards = [
  {
    label: "Budget Utilization",
    value: "72%",
    detail: "$18.2M of $25.0M",
    trend: "6% vs prior FYTD",
    accent: "teal",
    display: "ring",
    icon: Landmark,
  },
  {
    label: "Renewal Exposure",
    value: "$6.7M",
    detail: "21 renewals next 90 days",
    trend: "12% vs prior FYTD",
    accent: "amber",
    display: "ring",
    icon: CalendarClock,
  },
  {
    label: "Forecast Variance",
    value: "-$1.3M",
    detail: "Below approved plan",
    trend: "8% vs budget",
    accent: "blue",
    display: "bar",
    icon: TrendingUp,
  },
  {
    label: "Contract Spend",
    value: "$14.8M",
    detail: "Active commitments",
    trend: "9% vs prior FYTD",
    accent: "green",
    display: "bar",
    icon: BriefcaseBusiness,
  },
] as const;

export const spendCategoryData = [
  {
    category: "Security Operations",
    spend: 6.2,
    share: "34%",
    fill: "#22c7d9",
  },
  { category: "Cloud Security", spend: 4.1, share: "23%", fill: "#3b82f6" },
  { category: "Identity & Access", spend: 3.2, share: "18%", fill: "#f59e0b" },
  { category: "Data Protection", spend: 2.6, share: "14%", fill: "#10b981" },
  { category: "GRC & Risk", spend: 1.2, share: "7%", fill: "#8b5cf6" },
  { category: "Other", spend: 0.9, share: "4%", fill: "#64748b" },
];

export const forecastTrendData = [
  { month: "Jan", actual: 3.8, forecast: 3.9, budget: 4.2 },
  { month: "Feb", actual: 5.4, forecast: 5.6, budget: 6.1 },
  { month: "Mar", actual: 6.2, forecast: 6.3, budget: 7.6 },
  { month: "Apr", actual: 6.1, forecast: 6.8, budget: 9.5 },
  { month: "May", actual: 8.2, forecast: 9.7, budget: 12.4 },
  { month: "Jun", actual: 10.9, forecast: 12.2, budget: 15.1 },
  { month: "Jul", actual: 13.1, forecast: 13.6, budget: 17.6 },
  { month: "Aug", actual: null, forecast: 14.8, budget: 19.2 },
  { month: "Sep", actual: null, forecast: 16.3, budget: 21.0 },
  { month: "Oct", actual: null, forecast: 18.4, budget: 23.2 },
  { month: "Nov", actual: null, forecast: 19.8, budget: 24.9 },
  { month: "Dec", actual: null, forecast: 20.9, budget: 26.4 },
];

export const upcomingRenewals = [
  {
    vendor: "Palo Alto Networks",
    mark: "PA",
    product: "Cortex XDR",
    owner: "Alex Rivera",
    window: "Jun 1 - Jun 30, 2026",
    amount: "$850K",
    status: "At Risk",
  },
  {
    vendor: "CrowdStrike",
    mark: "CS",
    product: "Falcon Complete",
    owner: "Jamie Patel",
    window: "Jun 15 - Jul 15, 2026",
    amount: "$720K",
    status: "At Risk",
  },
  {
    vendor: "Microsoft",
    mark: "MS",
    product: "Defender for Cloud",
    owner: "Jordan Lee",
    window: "Jul 1 - Jul 31, 2026",
    amount: "$530K",
    status: "On Track",
  },
  {
    vendor: "Okta",
    mark: "OK",
    product: "Identity Cloud",
    owner: "Morgan Smith",
    window: "Jul 15 - Aug 15, 2026",
    amount: "$410K",
    status: "On Track",
  },
  {
    vendor: "Cisco",
    mark: "CI",
    product: "Secure Firewall",
    owner: "Riley Kim",
    window: "Aug 1 - Aug 31, 2026",
    amount: "$380K",
    status: "Pending",
  },
];

export const procurementQueue = [
  {
    title: "SASE Platform",
    category: "Network Security",
    owner: "Casey Nguyen",
    amount: "$250K",
    status: "Review",
    accent: "blue",
  },
  {
    title: "Cloud Workload Protection",
    category: "Cloud Security",
    owner: "David Park",
    amount: "$180K",
    status: "Review",
    accent: "teal",
  },
  {
    title: "Privileged Access Mgmt",
    category: "Identity & Access",
    owner: "Taylor Chen",
    amount: "$120K",
    status: "Triage",
    accent: "amber",
  },
  {
    title: "Data Security Posture Mgmt",
    category: "Data Protection",
    owner: "Alex Rivera",
    amount: "$95K",
    status: "Triage",
    accent: "amber",
  },
] as const;

export const portfolioHighlights = [
  { label: "Planning scope", value: "Enterprise" },
  { label: "Budget cycle", value: "FY 2026 operating plan" },
  { label: "Coverage", value: "Jan 1 - Dec 31, 2026" },
  { label: "Portfolio context", value: "Strategic & Operational" },
] as const;

export const portfolioIcon = Shield;
export const moduleIcon = PackageCheck;
export const receiptIcon = ReceiptText;
