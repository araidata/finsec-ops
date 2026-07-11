"use client";

import { useActionState, useMemo, useState, type ReactNode } from "react";
import {
  Boxes,
  Building2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";

import {
  saveFeatureAction,
  saveModuleAction,
  saveProductAction,
  saveResellerAction,
  saveVendorAction,
} from "@/app/products/actions";
import { WorkspaceShell } from "@/components/app/workspace-shell";
import {
  EmptyState,
  Field,
  MutationError,
  SubmitButton,
  TextBlock,
  ToggleField,
  type Option,
} from "@/components/catalog/relational-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  emptyActionResult,
  type ActionResult,
} from "@/lib/server/action-result";
import { cn } from "@/lib/utils";

type CompanyRoleType =
  | "VENDOR"
  | "RESELLER"
  | "SERVICE_PROVIDER"
  | "IMPLEMENTATION_PARTNER"
  | "CONSULTANT";
type CatalogTab = "vendors" | "resellers";
type StatusFilter = "all" | "active" | "inactive";
type EditorKind = "vendor" | "reseller" | "product" | "component" | "function";

type Role = { role: CompanyRoleType };
type Company = {
  id: string;
  name: string;
  legalName: string | null;
  website: string | null;
  contactEmail: string | null;
  active: boolean;
  roles: Role[];
};
type Capability = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
};
type CapabilityLink = {
  capability: Capability;
  isPrimary?: boolean;
  notesText?: string | null;
  allocationGuidance?: string | null;
};
type Product = {
  id: string;
  vendorCompanyId: string | null;
  name: string;
  offeringType: string;
  productCategory: string;
  description: string | null;
  active: boolean;
  capabilities: CapabilityLink[];
  _count: { modules: number; features: number; sellers: number };
};
type ProductComponent = {
  id: string;
  productId: string;
  name: string;
  description: string | null;
  componentType: string;
  sku: string | null;
  licenseMetric: string | null;
  separatelyPurchasable: boolean;
  separatelyRenewable: boolean;
  purpose: string | null;
  lifecycleStatus: string;
  planningEstimate: unknown;
  active: boolean;
  capabilities: CapabilityLink[];
};
type ProductFunction = {
  id: string;
  productId: string;
  moduleId: string | null;
  relatedCapabilityId: string | null;
  name: string;
  description: string | null;
  strategicImportance: string | null;
  notesText: string | null;
  active: boolean;
  relatedCapability: Capability | null;
  capabilities: CapabilityLink[];
};
type ContractRecord = {
  id: string;
  title: string;
  sellerCompanyId: string | null;
  annualValue: unknown;
};
type PurchaseRecord = {
  id: string;
  title: string;
  sellerCompanyId: string | null;
  totalAmount: unknown;
};
type RenewalRecord = {
  id: string;
  title: string;
  renewalDate: string | Date;
  contract: { sellerCompanyId: string | null; title: string };
};

type CatalogData = {
  companies: Company[];
  capabilities: Capability[];
  products: Product[];
  modules: ProductComponent[];
  features: ProductFunction[];
  contracts: ContractRecord[];
  purchases: PurchaseRecord[];
  renewals: RenewalRecord[];
};

type EditorState = {
  kind: EditorKind;
  record?: Company | Product | ProductComponent | ProductFunction;
  defaults?: Record<string, string>;
};

type CatalogAction = (
  prev: ActionResult,
  formData: FormData
) => Promise<ActionResult>;

const optionSets = {
  productOfferingTypes: [
    "SOFTWARE",
    "SAAS",
    "HARDWARE",
    "MANAGED_SERVICE",
    "PROFESSIONAL_SERVICE",
    "TRAINING",
    "SUPPORT",
    "OTHER",
  ],
  productComponentTypes: [
    "MODULE",
    "ADD_ON",
    "LICENSE_TIER",
    "SERVICE",
    "SUPPORT",
    "CAPACITY",
    "RETENTION",
    "TRAINING",
    "HARDWARE",
    "OTHER",
  ],
  productCategories: [
    "ENDPOINT_SECURITY",
    "IDENTITY_ACCESS",
    "NETWORK_SECURITY",
    "CLOUD_SECURITY",
    "DATA_SECURITY",
    "APPLICATION_SECURITY",
    "SECURITY_OPERATIONS",
    "GOVERNANCE_RISK_COMPLIANCE",
    "VULNERABILITY_EXPOSURE_MANAGEMENT",
    "THREAT_INTELLIGENCE",
    "WORKFORCE_SECURITY_AWARENESS",
    "CYBERSECURITY_STAFF_TRAINING_DEVELOPMENT",
    "BACKUP_RESILIENCE",
    "ASSET_CONFIGURATION_MANAGEMENT",
    "MANAGED_SECURITY_SERVICES",
    "PROFESSIONAL_SERVICES",
    "OTHER",
  ],
  licenseMetrics: [
    "USERS",
    "IDENTITIES",
    "ENDPOINTS",
    "SERVERS",
    "DEVICES",
    "APPLICATIONS",
    "CLOUD_ACCOUNTS",
    "TERABYTES",
    "GIGABYTES_PER_DAY",
    "EVENTS_PER_SECOND",
    "SEATS",
    "ENTERPRISE_LICENSE",
    "FIXED_SERVICE",
    "OTHER",
  ],
  catalogLifecycleStatuses: [
    "PLANNED",
    "EVALUATING",
    "ACTIVE",
    "RETIRING",
    "RETIRED",
  ],
  strategicValues: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
} as const;

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function hasRole(company: Company, role: CompanyRoleType) {
  return company.roles.some((item) => item.role === role);
}

function selectedTab(initialTab?: string): CatalogTab {
  return initialTab?.toLowerCase() === "resellers" ? "resellers" : "vendors";
}

function preferredVendor(vendors: Company[]) {
  return (
    vendors.find((vendor) => vendor.name === "Palo Alto Networks") ??
    vendors.find((vendor) => vendor.name === "Microsoft") ??
    vendors[0]
  );
}

function vendorRank(name: string) {
  const preferred = ["Palo Alto Networks", "Microsoft", "Rapid7", "KnowBe4"];
  const index = preferred.indexOf(name);
  return index === -1 ? preferred.length : index;
}

function sortVendorsForCatalog(vendors: Company[]) {
  return [...vendors].sort((left, right) => {
    const rank = vendorRank(left.name) - vendorRank(right.name);
    return rank || left.name.localeCompare(right.name);
  });
}

function sortProductsForVendor(products: Product[]) {
  return [...products].sort((left, right) => {
    const leftRank = left.name === "Cortex XSIAM" ? 0 : 1;
    const rightRank = right.name === "Cortex XSIAM" ? 0 : 1;
    return leftRank - rightRank || left.name.localeCompare(right.name);
  });
}

function matchesStatus(active: boolean, filter: StatusFilter) {
  if (filter === "active") return active;
  if (filter === "inactive") return !active;
  return true;
}

function options(
  rows: { id: string; name: string; active?: boolean }[]
): Option[] {
  return rows.map((row) => ({
    id: row.id,
    label: row.name,
    active: row.active,
  }));
}

function capabilityIds(rows: CapabilityLink[] = []) {
  return rows.map((row) => row.capability.id);
}

function decimalValue(value: unknown) {
  return value == null ? "" : String(value);
}

export function ProductCatalogWorkspace({
  data,
  initialTab,
}: {
  data: CatalogData;
  initialTab?: string;
}) {
  const vendors = useMemo(
    () =>
      sortVendorsForCatalog(
        data.companies.filter((company) => hasRole(company, "VENDOR"))
      ),
    [data.companies]
  );
  const resellers = useMemo(
    () => data.companies.filter((company) => hasRole(company, "RESELLER")),
    [data.companies]
  );

  const [tab, setTab] = useState<CatalogTab>(selectedTab(initialTab));
  const [vendorSearch, setVendorSearch] = useState("");
  const [resellerSearch, setResellerSearch] = useState("");
  const [vendorStatus, setVendorStatus] = useState<StatusFilter>("active");
  const [resellerStatus, setResellerStatus] = useState<StatusFilter>("active");
  const [selectedVendorId, setSelectedVendorId] = useState(
    preferredVendor(vendors)?.id ?? ""
  );
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(
    new Set(
      data.products
        .filter((product) => product.name === "Cortex XSIAM")
        .slice(0, 1)
        .map((product) => product.id)
    )
  );
  const [editor, setEditor] = useState<EditorState | null>(null);

  const selectedVendor =
    vendors.find((vendor) => vendor.id === selectedVendorId) ??
    preferredVendor(vendors);
  const vendorProducts = sortProductsForVendor(
    data.products.filter(
      (product) => product.vendorCompanyId === selectedVendor?.id
    )
  );

  const capabilityOptions = options(data.capabilities);
  const productOptions = options(data.products);
  const componentOptions = options(
    data.modules.map((component) => ({
      id: component.id,
      name: component.name,
      active: component.active,
    }))
  );

  function switchTab(nextTab: CatalogTab) {
    setTab(nextTab);
    window.history.replaceState(null, "", `/products?tab=${nextTab}`);
  }

  function toggleProduct(productId: string) {
    setExpandedProductIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  return (
    <WorkspaceShell
      title="Product Catalog"
      description="Manage vendor-owned products, commercial components, capabilities, functions, and reseller master data without catalog-level buying constraints."
      actionLabel={tab === "vendors" ? "Add Vendor" : "Add Reseller"}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80">
        <div className="flex gap-2">
          <TabButton
            active={tab === "vendors"}
            onClick={() => switchTab("vendors")}
          >
            Vendors
          </TabButton>
          <TabButton
            active={tab === "resellers"}
            onClick={() => switchTab("resellers")}
          >
            Resellers
          </TabButton>
        </div>
        <Button
          className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
          onClick={() =>
            setEditor(
              tab === "vendors" ? { kind: "vendor" } : { kind: "reseller" }
            )
          }
        >
          <Plus data-icon="inline-start" />
          {tab === "vendors" ? "Add Vendor" : "Add Reseller"}
        </Button>
      </div>

      {tab === "vendors" ? (
        <div className="grid w-full min-w-0 min-h-[42rem] gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
          <VendorListPane
            vendors={vendors}
            products={data.products}
            search={vendorSearch}
            status={vendorStatus}
            selectedVendorId={selectedVendor?.id}
            onSearchChange={setVendorSearch}
            onStatusChange={setVendorStatus}
            onSelect={(vendorId) => {
              setSelectedVendorId(vendorId);
              const firstProduct = sortProductsForVendor(
                data.products.filter(
                  (product) => product.vendorCompanyId === vendorId
                )
              )[0];
              setExpandedProductIds(
                firstProduct ? new Set([firstProduct.id]) : new Set()
              );
            }}
            onAdd={() => setEditor({ kind: "vendor" })}
            onClear={() => setSelectedVendorId("")}
          />
          <VendorDetail
            vendor={selectedVendor}
            products={vendorProducts}
            components={data.modules}
            functions={data.features}
            expandedProductIds={expandedProductIds}
            onToggleProduct={toggleProduct}
            onEditVendor={(vendor) =>
              setEditor({ kind: "vendor", record: vendor })
            }
            onAddProduct={(vendor) =>
              setEditor({
                kind: "product",
                defaults: { vendorCompanyId: vendor.id },
              })
            }
            onEditProduct={(product) =>
              setEditor({ kind: "product", record: product })
            }
            onAddCapability={(product) =>
              setEditor({ kind: "product", record: product })
            }
            onAddComponent={(product) =>
              setEditor({
                kind: "component",
                defaults: { productId: product.id },
              })
            }
            onEditComponent={(component) =>
              setEditor({ kind: "component", record: component })
            }
            onAddFunction={(product, component) =>
              setEditor({
                kind: "function",
                defaults: {
                  productId: product.id,
                  moduleId: component?.id ?? "",
                },
              })
            }
            onEditFunction={(productFunction) =>
              setEditor({ kind: "function", record: productFunction })
            }
          />
        </div>
      ) : (
        <ResellerWorkspace
          resellers={resellers}
          contracts={data.contracts}
          purchases={data.purchases}
          renewals={data.renewals}
          search={resellerSearch}
          status={resellerStatus}
          onSearchChange={setResellerSearch}
          onStatusChange={setResellerStatus}
          onAdd={() => setEditor({ kind: "reseller" })}
          onEdit={(reseller) =>
            setEditor({ kind: "reseller", record: reseller })
          }
        />
      )}

      <CatalogEditorDrawer
        editor={editor}
        vendors={vendors}
        products={data.products}
        components={data.modules}
        capabilities={data.capabilities}
        vendorOptions={options(vendors)}
        productOptions={productOptions}
        componentOptions={componentOptions}
        capabilityOptions={capabilityOptions}
        onOpenChange={(open) => !open && setEditor(null)}
      />
    </WorkspaceShell>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-b-2 px-4 py-2 text-sm font-semibold transition",
        active
          ? "border-cyan-300 text-cyan-200"
          : "border-transparent text-muted-foreground hover:text-slate-100"
      )}
    >
      {children}
    </button>
  );
}

function StatusButtons({
  value,
  onChange,
}: {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(["all", "active", "inactive"] as const).map((item) => (
        <Button
          key={item}
          size="sm"
          variant={value === item ? "default" : "outline"}
          onClick={() => onChange(item)}
        >
          {titleCase(item)}
        </Button>
      ))}
    </div>
  );
}

function VendorListPane({
  vendors,
  products,
  search,
  status,
  selectedVendorId,
  onSearchChange,
  onStatusChange,
  onSelect,
  onAdd,
  onClear,
}: {
  vendors: Company[];
  products: Product[];
  search: string;
  status: StatusFilter;
  selectedVendorId?: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onClear: () => void;
}) {
  const filtered = vendors.filter(
    (vendor) =>
      vendor.name.toLowerCase().includes(search.toLowerCase()) &&
      matchesStatus(vendor.active, status)
  );

  return (
    <aside className="grid w-full content-start gap-3 rounded-lg border border-border/80 bg-card/80 p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-100">Vendors</h2>
        <span className="text-xs text-muted-foreground">{filtered.length}</span>
      </div>
      <SearchField
        label="Search vendors"
        value={search}
        onChange={onSearchChange}
      />
      <StatusButtons value={status} onChange={onStatusChange} />
      <Button size="sm" onClick={onAdd}>
        <Plus data-icon="inline-start" />
        Add Vendor
      </Button>
      <Button size="sm" variant="outline" onClick={onClear}>
        Clear Selected
      </Button>
      <div className="grid max-h-[34rem] gap-2 overflow-y-auto pr-1">
        {filtered.map((vendor) => {
          const productCount = products.filter(
            (product) => product.vendorCompanyId === vendor.id
          ).length;
          const categories = Array.from(
            new Set(
              products
                .filter((product) => product.vendorCompanyId === vendor.id)
                .map((product) => titleCase(product.productCategory))
            )
          );
          return (
            <button
              key={vendor.id}
              type="button"
              onClick={() => onSelect(vendor.id)}
              className={cn(
                "grid gap-2 rounded-lg border border-border/70 bg-secondary/25 p-3 text-left transition hover:border-cyan-300/60",
                vendor.id === selectedVendorId &&
                  "border-cyan-300/80 bg-cyan-400/10"
              )}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-100">
                  {vendor.name}
                </span>
                <span className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{productCount} products</span>
                  <ActiveDot active={vendor.active} />
                </span>
              </span>
              {categories.length ? (
                <span className="truncate text-[0.68rem] text-muted-foreground">
                  {categories.slice(0, 2).join(", ")}
                </span>
              ) : null}
            </button>
          );
        })}
        {!filtered.length ? (
          <EmptyState>No matching vendors.</EmptyState>
        ) : null}
      </div>
    </aside>
  );
}

function SearchField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`${label}...`}
        className="border-border/80 bg-secondary/45 pl-8"
      />
    </div>
  );
}

function ActiveDot({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "size-2 rounded-full",
          active ? "bg-emerald-300" : "bg-amber-300"
        )}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function VendorDetail({
  vendor,
  products,
  components,
  functions,
  expandedProductIds,
  onToggleProduct,
  onEditVendor,
  onAddProduct,
  onEditProduct,
  onAddCapability,
  onAddComponent,
  onEditComponent,
  onAddFunction,
  onEditFunction,
}: {
  vendor?: Company;
  products: Product[];
  components: ProductComponent[];
  functions: ProductFunction[];
  expandedProductIds: Set<string>;
  onToggleProduct: (id: string) => void;
  onEditVendor: (vendor: Company) => void;
  onAddProduct: (vendor: Company) => void;
  onEditProduct: (product: Product) => void;
  onAddCapability: (product: Product) => void;
  onAddComponent: (product: Product) => void;
  onEditComponent: (component: ProductComponent) => void;
  onAddFunction: (product: Product, component?: ProductComponent) => void;
  onEditFunction: (productFunction: ProductFunction) => void;
}) {
  if (!vendor) {
    return <EmptyState>Select a vendor to manage products.</EmptyState>;
  }

  return (
    <main className="w-full min-w-0 space-y-4">
      <section className="w-full rounded-lg border border-border/80 bg-card/80 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase text-cyan-200">
              <Building2 className="size-4" />
              Vendor
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-50">
                {vendor.name}
              </h2>
              <Badge
                variant="outline"
                className="border-emerald-300/40 text-emerald-200"
              >
                {vendor.active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="mt-3 grid gap-x-8 gap-y-2 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
              <Info label="Legal name" value={vendor.legalName} />
              <Info label="Website" value={vendor.website} />
              <Info label="Primary contact" value={vendor.contactEmail} />
              <Info
                label="Portfolio"
                value={`${products.length} product${
                  products.length === 1 ? "" : "s"
                }`}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditVendor(vendor)}
            >
              <Pencil data-icon="inline-start" />
              Edit Vendor
            </Button>
            <Button size="sm" onClick={() => onAddProduct(vendor)}>
              <Plus data-icon="inline-start" />
              Add Product
            </Button>
          </div>
        </div>
      </section>

      <section className="w-full space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-100">Products</h2>
          <span className="text-xs text-muted-foreground">
            {products.length} records
          </span>
        </div>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            components={components.filter(
              (component) => component.productId === product.id
            )}
            functions={functions.filter(
              (productFunction) => productFunction.productId === product.id
            )}
            expanded={expandedProductIds.has(product.id)}
            onToggle={() => onToggleProduct(product.id)}
            onEditProduct={() => onEditProduct(product)}
            onAddCapability={() => onAddCapability(product)}
            onAddComponent={() => onAddComponent(product)}
            onEditComponent={onEditComponent}
            onAddFunction={(component) => onAddFunction(product, component)}
            onEditFunction={onEditFunction}
          />
        ))}
        {!products.length ? (
          <EmptyState>
            This vendor does not have catalog products yet.
          </EmptyState>
        ) : null}
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[0.68rem] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm text-slate-200">
        {value || "Not set"}
      </p>
    </div>
  );
}

function ProductCard({
  product,
  components,
  functions,
  expanded,
  onToggle,
  onEditProduct,
  onAddCapability,
  onAddComponent,
  onEditComponent,
  onAddFunction,
  onEditFunction,
}: {
  product: Product;
  components: ProductComponent[];
  functions: ProductFunction[];
  expanded: boolean;
  onToggle: () => void;
  onEditProduct: () => void;
  onAddCapability: () => void;
  onAddComponent: () => void;
  onEditComponent: (component: ProductComponent) => void;
  onAddFunction: (component?: ProductComponent) => void;
  onEditFunction: (productFunction: ProductFunction) => void;
}) {
  const productFunctions = functions.filter((item) => !item.moduleId);

  return (
    <article className="w-full overflow-hidden rounded-md border border-border/80 bg-card/70">
      <div className="flex items-center justify-between gap-3 border-b border-border/80 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border/80 bg-secondary/45 text-cyan-200">
            {expanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold text-slate-50">
              {product.name}
            </span>
            <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              {titleCase(product.offeringType)} /{" "}
              {titleCase(product.productCategory)}
            </span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-3">
          <ActiveDot active={product.active} />
          <Button size="sm" variant="outline" onClick={onEditProduct}>
            Edit
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="space-y-0">
          <ProductComponentsSection
            components={components}
            onAddComponent={onAddComponent}
            onEditComponent={onEditComponent}
          />
          <ProductCapabilitiesSection
            capabilities={product.capabilities}
            onAddCapability={onAddCapability}
          />
          <ProductFunctionsSection
            title="Functions"
            functions={productFunctions}
            onAddFunction={() => onAddFunction()}
            onEditFunction={onEditFunction}
          />
        </div>
      ) : null}
    </article>
  );
}

function ProductComponentsSection({
  components,
  onAddComponent,
  onEditComponent,
}: {
  components: ProductComponent[];
  onAddComponent: () => void;
  onEditComponent: (component: ProductComponent) => void;
}) {
  return (
    <section className="w-full border-b border-border/80 p-4">
      <SectionHeader
        title={`Product Components (${components.length})`}
        icon={<Boxes className="size-4" />}
        actionLabel="Add Component"
        onAction={onAddComponent}
      />
      {components.length ? (
        <Table className="mt-3 table-fixed border border-border/80 text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 w-[18%] border-r border-border/80 bg-secondary/35">
                Name
              </TableHead>
              <TableHead className="h-8 w-[14%] border-r border-border/80 bg-secondary/35">
                Type
              </TableHead>
              <TableHead className="h-8 w-[16%] border-r border-border/80 bg-secondary/35">
                SKU
              </TableHead>
              <TableHead className="h-8 w-[16%] border-r border-border/80 bg-secondary/35">
                Metric
              </TableHead>
              <TableHead className="h-8 w-[12%] border-r border-border/80 bg-secondary/35">
                Purchasable
              </TableHead>
              <TableHead className="h-8 w-[12%] border-r border-border/80 bg-secondary/35">
                Renewable
              </TableHead>
              <TableHead className="h-8 w-[12%] bg-secondary/35">
                Active
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {components.map((component) => (
              <TableRow key={component.id} className="hover:bg-secondary/30">
                <TableCell className="border-r border-border/80 font-medium text-slate-100">
                  <button
                    type="button"
                    className="text-left hover:text-cyan-200"
                    onClick={() => onEditComponent(component)}
                  >
                    {component.name}
                  </button>
                </TableCell>
                <TableCell className="border-r border-border/80">
                  {titleCase(component.componentType)}
                </TableCell>
                <TableCell className="border-r border-border/80">
                  {component.sku || "-"}
                </TableCell>
                <TableCell className="border-r border-border/80">
                  {component.licenseMetric
                    ? titleCase(component.licenseMetric)
                    : "-"}
                </TableCell>
                <TableCell className="border-r border-border/80">
                  {component.separatelyPurchasable ? "Yes" : "No"}
                </TableCell>
                <TableCell className="border-r border-border/80">
                  {component.separatelyRenewable ? "Yes" : "No"}
                </TableCell>
                <TableCell>
                  <ActiveDot active={component.active} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState>
          This product has no separately tracked commercial components.
        </EmptyState>
      )}
    </section>
  );
}

function ProductCapabilitiesSection({
  capabilities,
  onAddCapability,
}: {
  capabilities: CapabilityLink[];
  onAddCapability: () => void;
}) {
  return (
    <section className="w-full border-b border-border/80 p-4">
      <SectionHeader
        title={`Capabilities (${capabilities.length})`}
        icon={<ShieldCheck className="size-4" />}
        actionLabel="Add Capability"
        onAction={onAddCapability}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {capabilities.map((row) => (
          <Badge
            key={row.capability.id}
            variant="secondary"
            className="rounded-md border border-cyan-300/35 bg-cyan-400/10 px-3 text-cyan-200"
          >
            {row.capability.name}
          </Badge>
        ))}
        {!capabilities.length ? (
          <span className="text-sm text-muted-foreground">
            No capabilities assigned.
          </span>
        ) : null}
      </div>
    </section>
  );
}

function ProductFunctionsSection({
  title,
  functions,
  onAddFunction,
  onEditFunction,
}: {
  title: string;
  functions: ProductFunction[];
  onAddFunction: () => void;
  onEditFunction: (productFunction: ProductFunction) => void;
}) {
  return (
    <section className="w-full p-4">
      <SectionHeader
        title={`${title} (${functions.length})`}
        actionLabel="Add Function"
        onAction={onAddFunction}
      />
      {functions.length ? (
        <Table className="mt-3 table-fixed border border-border/80 text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 border-r border-border/80 bg-secondary/35">
                Function
              </TableHead>
              <TableHead className="h-8 border-r border-border/80 bg-secondary/35">
                Related Capability
              </TableHead>
              <TableHead className="h-8 bg-secondary/35">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {functions.map((productFunction) => (
              <TableRow
                key={productFunction.id}
                className="hover:bg-secondary/30"
              >
                <TableCell className="border-r border-border/80 font-medium text-slate-100">
                  <button
                    type="button"
                    className="text-left hover:text-cyan-200"
                    onClick={() => onEditFunction(productFunction)}
                  >
                    {productFunction.name}
                  </button>
                </TableCell>
                <TableCell className="border-r border-border/80">
                  {productFunction.relatedCapability?.name || "Unassigned"}
                </TableCell>
                <TableCell className="whitespace-normal">
                  {productFunction.description || "No description"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState>No product-level functions yet.</EmptyState>
      )}
    </section>
  );
}

function SectionHeader({
  title,
  icon,
  actionLabel,
  onAction,
}: {
  title: string;
  icon?: ReactNode;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
        {icon}
        {title}
      </h4>
      <Button size="sm" variant="outline" onClick={onAction}>
        <Plus data-icon="inline-start" />
        {actionLabel}
      </Button>
    </div>
  );
}

function ResellerWorkspace({
  resellers,
  contracts,
  purchases,
  renewals,
  search,
  status,
  onSearchChange,
  onStatusChange,
  onAdd,
  onEdit,
}: {
  resellers: Company[];
  contracts: ContractRecord[];
  purchases: PurchaseRecord[];
  renewals: RenewalRecord[];
  search: string;
  status: StatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onAdd: () => void;
  onEdit: (reseller: Company) => void;
}) {
  const filtered = resellers.filter(
    (reseller) =>
      reseller.name.toLowerCase().includes(search.toLowerCase()) &&
      matchesStatus(reseller.active, status)
  );

  return (
    <section className="grid w-full min-w-0 gap-4">
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div className="min-w-72 flex-1">
          <SearchField
            label="Search resellers"
            value={search}
            onChange={onSearchChange}
          />
        </div>
        <StatusButtons value={status} onChange={onStatusChange} />
        <Button onClick={onAdd}>
          <Plus data-icon="inline-start" />
          Add Reseller
        </Button>
      </div>

      <div className="w-full min-w-0 rounded-lg border border-border/80 bg-card/80">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[18%]">Reseller</TableHead>
              <TableHead className="w-[8%]">Legal Name</TableHead>
              <TableHead className="w-[20%]">Website</TableHead>
              <TableHead className="w-[14%]">Primary Contact</TableHead>
              <TableHead className="w-[8%]">Contracts</TableHead>
              <TableHead className="w-[8%]">Purchases</TableHead>
              <TableHead className="w-[8%]">Renewals</TableHead>
              <TableHead className="w-[9%]">Status</TableHead>
              <TableHead className="w-[7%]">Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((reseller) => {
              const relatedContracts = contracts.filter(
                (contract) => contract.sellerCompanyId === reseller.id
              );
              const relatedPurchases = purchases.filter(
                (purchase) => purchase.sellerCompanyId === reseller.id
              );
              const relatedRenewals = renewals.filter(
                (renewal) => renewal.contract.sellerCompanyId === reseller.id
              );
              return (
                <TableRow key={reseller.id}>
                  <TableCell className="truncate font-medium text-slate-100">
                    {reseller.name}
                  </TableCell>
                  <TableCell className="truncate">
                    {reseller.legalName || "-"}
                  </TableCell>
                  <TableCell className="truncate">
                    {reseller.website || "-"}
                  </TableCell>
                  <TableCell className="truncate">
                    {reseller.contactEmail || "-"}
                  </TableCell>
                  <TableCell>{relatedContracts.length}</TableCell>
                  <TableCell>{relatedPurchases.length}</TableCell>
                  <TableCell>{relatedRenewals.length}</TableCell>
                  <TableCell>
                    <ActiveDot active={reseller.active} />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(reseller)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {!filtered.length ? (
          <div className="p-4">
            <EmptyState>No matching resellers.</EmptyState>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CatalogEditorDrawer({
  editor,
  vendors,
  products,
  components,
  capabilities,
  vendorOptions,
  productOptions,
  componentOptions,
  capabilityOptions,
  onOpenChange,
}: {
  editor: EditorState | null;
  vendors: Company[];
  products: Product[];
  components: ProductComponent[];
  capabilities: Capability[];
  vendorOptions: Option[];
  productOptions: Option[];
  componentOptions: Option[];
  capabilityOptions: Option[];
  onOpenChange: (open: boolean) => void;
}) {
  const record = editor?.record;
  const defaults = editor?.defaults ?? {};
  const title = editor
    ? editorTitle(editor, products, components, vendors)
    : "";

  return (
    <Sheet open={Boolean(editor)} onOpenChange={onOpenChange}>
      <SheetContent className="z-[100] w-full gap-0 border-border bg-[#151a20] shadow-2xl sm:max-w-[31rem]">
        <SheetHeader className="border-b border-border/80 px-6 py-5">
          <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
        </SheetHeader>
        {editor?.kind === "vendor" ? (
          <CompanyForm
            action={saveVendorAction}
            record={record as Company | undefined}
            submitLabel="Save Vendor"
          />
        ) : null}
        {editor?.kind === "reseller" ? (
          <CompanyForm
            action={saveResellerAction}
            record={record as Company | undefined}
            submitLabel="Save Reseller"
          />
        ) : null}
        {editor?.kind === "product" ? (
          <ProductForm
            record={record as Product | undefined}
            vendorOptions={vendorOptions}
            capabilityOptions={capabilityOptions}
            defaultVendorId={defaults.vendorCompanyId}
          />
        ) : null}
        {editor?.kind === "component" ? (
          <ComponentForm
            record={record as ProductComponent | undefined}
            productOptions={productOptions}
            capabilityOptions={capabilityOptions}
            defaultProductId={defaults.productId}
          />
        ) : null}
        {editor?.kind === "function" ? (
          <FunctionForm
            record={record as ProductFunction | undefined}
            productOptions={productOptions}
            componentOptions={componentOptions}
            capabilityOptions={capabilityOptions}
            capabilities={capabilities}
            defaultProductId={defaults.productId}
            defaultComponentId={defaults.moduleId}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function editorTitle(
  editor: EditorState,
  products: Product[],
  components: ProductComponent[],
  vendors: Company[]
) {
  const defaults = editor.defaults ?? {};
  if (editor.kind === "vendor")
    return editor.record ? "Edit Vendor" : "Add Vendor";
  if (editor.kind === "reseller") {
    return editor.record ? "Edit Reseller" : "Add Reseller";
  }
  if (editor.kind === "product") {
    const vendor = vendors.find((item) => item.id === defaults.vendorCompanyId);
    return editor.record
      ? "Edit Product"
      : `Add Product${vendor ? ` to ${vendor.name}` : ""}`;
  }
  if (editor.kind === "component") {
    const product = products.find((item) => item.id === defaults.productId);
    return editor.record
      ? "Edit Product Component"
      : `Add Product Component${product ? ` to ${product.name}` : ""}`;
  }
  const component = components.find((item) => item.id === defaults.moduleId);
  const product = products.find((item) => item.id === defaults.productId);
  return editor.record
    ? "Edit Function"
    : `Add Function to ${component?.name ?? product?.name ?? "Product"}`;
}

function ActionForm({
  action,
  children,
}: {
  action: CatalogAction;
  children: (state: ActionResult, pending: boolean) => ReactNode;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    emptyActionResult
  );
  return (
    <form
      action={formAction}
      className="grid flex-1 content-start gap-5 overflow-y-auto px-6 py-5"
    >
      {children(state, pending)}
      <MutationError result={state} />
    </form>
  );
}

function CompanyForm({
  action,
  record,
  submitLabel,
}: {
  action: CatalogAction;
  record?: Company;
  submitLabel: string;
}) {
  return (
    <ActionForm action={action}>
      {(_state, pending) => (
        <>
          <input name="id" type="hidden" value={record?.id ?? ""} />
          <Field label="Name" name="name" defaultValue={record?.name} />
          <Field
            label="Legal name"
            name="legalName"
            defaultValue={record?.legalName ?? ""}
          />
          <Field
            label="Website"
            name="website"
            defaultValue={record?.website ?? ""}
          />
          <Field
            label="Contact email"
            name="contactEmail"
            defaultValue={record?.contactEmail ?? ""}
          />
          <ToggleField defaultChecked={record?.active ?? true} />
          <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

function ProductForm({
  record,
  vendorOptions,
  capabilityOptions,
  defaultVendorId,
}: {
  record?: Product;
  vendorOptions: Option[];
  capabilityOptions: Option[];
  defaultVendorId?: string;
}) {
  return (
    <ActionForm action={saveProductAction}>
      {(_state, pending) => (
        <>
          <input name="id" type="hidden" value={record?.id ?? ""} />
          <NativeSelect
            label="Vendor"
            name="vendorCompanyId"
            options={vendorOptions}
            defaultValue={record?.vendorCompanyId ?? defaultVendorId}
          />
          <Field label="Name" name="name" defaultValue={record?.name} />
          <NativeSelect
            label="Offering type"
            name="offeringType"
            options={optionSets.productOfferingTypes.map(enumOption)}
            defaultValue={record?.offeringType ?? "SAAS"}
          />
          <NativeSelect
            label="Broad category"
            name="productCategory"
            options={optionSets.productCategories.map(enumOption)}
            defaultValue={record?.productCategory ?? "OTHER"}
          />
          <TextBlock
            label="Purpose or use case"
            name="description"
            defaultValue={record?.description ?? ""}
          />
          <CheckChipGroup
            label="Capabilities"
            name="capabilityIds"
            options={capabilityOptions}
            defaultValues={capabilityIds(record?.capabilities)}
          />
          <ToggleField defaultChecked={record?.active ?? true} />
          <SubmitButton pending={pending}>Save Product</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

function ComponentForm({
  record,
  productOptions,
  capabilityOptions,
  defaultProductId,
}: {
  record?: ProductComponent;
  productOptions: Option[];
  capabilityOptions: Option[];
  defaultProductId?: string;
}) {
  return (
    <ActionForm action={saveModuleAction}>
      {(_state, pending) => (
        <>
          <input name="id" type="hidden" value={record?.id ?? ""} />
          <NativeSelect
            label="Product"
            name="productId"
            options={productOptions}
            defaultValue={record?.productId ?? defaultProductId}
          />
          <Field label="Name" name="name" defaultValue={record?.name} />
          <NativeSelect
            label="Component type"
            name="componentType"
            options={optionSets.productComponentTypes.map(enumOption)}
            defaultValue={record?.componentType ?? "MODULE"}
          />
          <Field label="SKU" name="sku" defaultValue={record?.sku ?? ""} />
          <NativeSelect
            label="License metric"
            name="licenseMetric"
            options={optionSets.licenseMetrics.map(enumOption)}
            defaultValue={record?.licenseMetric ?? ""}
            includeNone
          />
          <Field
            label="Planning estimate"
            name="planningEstimate"
            type="number"
            defaultValue={decimalValue(record?.planningEstimate)}
          />
          <TextBlock
            label="Purpose"
            name="purpose"
            defaultValue={record?.purpose ?? ""}
          />
          <TextBlock
            label="Description"
            name="description"
            defaultValue={record?.description ?? ""}
          />
          <CheckChipGroup
            label="Capabilities"
            name="capabilityIds"
            options={capabilityOptions}
            defaultValues={capabilityIds(record?.capabilities)}
          />
          <ToggleField
            name="separatelyPurchasable"
            label="Separately purchasable"
            defaultChecked={record?.separatelyPurchasable ?? false}
          />
          <ToggleField
            name="separatelyRenewable"
            label="Separately renewable"
            defaultChecked={record?.separatelyRenewable ?? false}
          />
          <NativeSelect
            label="Lifecycle status"
            name="lifecycleStatus"
            options={optionSets.catalogLifecycleStatuses.map(enumOption)}
            defaultValue={record?.lifecycleStatus ?? "ACTIVE"}
          />
          <ToggleField defaultChecked={record?.active ?? true} />
          <SubmitButton pending={pending}>Save Product Component</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

function FunctionForm({
  record,
  productOptions,
  componentOptions,
  capabilityOptions,
  capabilities,
  defaultProductId,
  defaultComponentId,
}: {
  record?: ProductFunction;
  productOptions: Option[];
  componentOptions: Option[];
  capabilityOptions: Option[];
  capabilities: Capability[];
  defaultProductId?: string;
  defaultComponentId?: string;
}) {
  const capabilitySelectOptions = [
    { id: "none", label: "None" },
    ...capabilityOptions,
  ];
  return (
    <ActionForm action={saveFeatureAction}>
      {(_state, pending) => (
        <>
          <input name="id" type="hidden" value={record?.id ?? ""} />
          <NativeSelect
            label="Product"
            name="productId"
            options={productOptions}
            defaultValue={record?.productId ?? defaultProductId}
          />
          <NativeSelect
            label="Product Component"
            name="moduleId"
            options={componentOptions}
            defaultValue={record?.moduleId ?? defaultComponentId ?? "none"}
            includeNone
          />
          <Field label="Name" name="name" defaultValue={record?.name} />
          <NativeSelect
            label="Related capability"
            name="relatedCapabilityId"
            options={capabilitySelectOptions}
            defaultValue={record?.relatedCapabilityId ?? "none"}
          />
          <NativeSelect
            label="Strategic importance"
            name="strategicImportance"
            options={[
              { id: "none", label: "None" },
              ...optionSets.strategicValues.map(enumOption),
            ]}
            defaultValue={record?.strategicImportance ?? "none"}
          />
          <TextBlock
            label="Description"
            name="description"
            defaultValue={record?.description ?? ""}
          />
          <TextBlock
            label="Notes"
            name="notesText"
            defaultValue={record?.notesText ?? ""}
          />
          <CheckChipGroup
            label="Capability tags"
            name="capabilityIds"
            options={options(capabilities)}
            defaultValues={capabilityIds(record?.capabilities)}
          />
          <ToggleField defaultChecked={record?.active ?? true} />
          <SubmitButton pending={pending}>Save Function</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

function enumOption(value: string): Option {
  return { id: value, label: titleCase(value), active: true };
}

function NativeSelect({
  label,
  name,
  options,
  defaultValue = "",
  includeNone = false,
}: {
  label: string;
  name: string;
  options: Option[];
  defaultValue?: string | null;
  includeNone?: boolean;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-300">
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="h-10 rounded-md border border-border/80 bg-secondary/45 px-3 text-sm text-slate-100"
      >
        {includeNone ? <option value="none">None</option> : null}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
            {option.active === false ? " (inactive)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckChipGroup({
  label,
  name,
  options,
  defaultValues = [],
}: {
  label: string;
  name: string;
  options: Option[];
  defaultValues?: string[];
}) {
  return (
    <div className="grid gap-2">
      <span className="text-xs font-medium text-slate-300">{label}</span>
      <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-md border border-border/70 bg-secondary/20 p-2">
        {options.map((option) => (
          <label key={option.id} className="cursor-pointer">
            <input
              name={name}
              type="checkbox"
              value={option.id}
              defaultChecked={defaultValues.includes(option.id)}
              className="peer sr-only"
            />
            <span className="inline-flex min-h-8 items-center rounded-full border border-border/80 px-3 py-1 text-xs text-slate-200 transition peer-checked:border-cyan-300 peer-checked:bg-cyan-400 peer-checked:text-slate-950">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
