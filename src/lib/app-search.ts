export type AppSearchTarget = {
  label: string;
  description: string;
  href: string;
  keywords: readonly string[];
};

export const appSearchTargets = [
  {
    label: "Dashboard",
    description: "Financial operations command center",
    href: "/",
    keywords: ["home", "metrics", "forecast", "reporting", "summary"],
  },
  {
    label: "Budget",
    description: "Fiscal-year planning and worksheet rows",
    href: "/budgets",
    keywords: ["budget", "spend", "forecast", "finance", "software", "training"],
  },
  {
    label: "Contracts",
    description: "Commercial terms, sellers, and product pricing",
    href: "/contracts",
    keywords: ["contract", "contracts", "agreement", "seller", "pricing"],
  },
  {
    label: "Maintenance Renewals",
    description: "Renewal tracking, financials, co-op agreements, and history",
    href: "/renewals",
    keywords: ["maintenance", "renewal", "renewals", "expiration", "quote", "coop", "co-op"],
  },
  {
    label: "Deployment",
    description: "Department-scoped deployments and usage history",
    href: "/deployment",
    keywords: ["deployment", "deployments", "usage", "environment", "owner"],
  },
  {
    label: "Product Catalog",
    description: "Vendors, resellers, products, components, and functions",
    href: "/products",
    keywords: [
      "catalog",
      "vendor",
      "vendors",
      "reseller",
      "resellers",
      "product",
      "products",
      "component",
      "components",
      "capability",
      "capabilities",
      "function",
      "functions",
    ],
  },
  {
    label: "Documents",
    description: "Linked document records and audit history",
    href: "/documents",
    keywords: ["document", "documents", "audit", "evidence", "link", "records"],
  },
  {
    label: "Settings",
    description: "Reference data for departments, fiscal years, owners, and options",
    href: "/settings",
    keywords: ["settings", "department", "departments", "fiscal", "owner", "team", "reference"],
  },
] as const satisfies readonly AppSearchTarget[];

export function getAppSearchMatches(query: string): AppSearchTarget[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return [];

  return appSearchTargets
    .map((target) => ({ target, score: scoreTarget(target, normalizedQuery) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.target.label.localeCompare(b.target.label))
    .map((result) => result.target);
}

export function buildContextualHref(href: string, currentSearch: string): string {
  if (href === "#") return href;

  const [path, rawTargetSearch = ""] = href.split("?");
  const targetParams = new URLSearchParams(rawTargetSearch);
  const currentParams = new URLSearchParams(currentSearch);

  for (const key of ["department", "fy"]) {
    const value = currentParams.get(key);
    if (value && !targetParams.has(key)) targetParams.set(key, value);
  }

  const query = targetParams.toString();
  return query ? `${path}?${query}` : path;
}

function scoreTarget(target: AppSearchTarget, query: string): number {
  const label = target.label.toLowerCase();
  const description = target.description.toLowerCase();

  if (label === query) return 100;
  if (label.startsWith(query)) return 80;
  if (target.keywords.some((keyword) => keyword === query)) return 70;
  if (label.includes(query)) return 50;
  if (target.keywords.some((keyword) => keyword.startsWith(query))) return 40;
  if (target.keywords.some((keyword) => keyword.includes(query))) return 30;
  if (description.includes(query)) return 20;

  return 0;
}
