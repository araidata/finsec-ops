"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState, type ReactNode } from "react";
import {
  type ColumnFiltersState,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Boxes,
  Building2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import {
  deleteVendorAction,
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

type CatalogTab = "vendors" | "resellers";
type StatusFilter = "all" | "active" | "inactive";
type EditorKind = "vendor" | "reseller" | "product" | "component" | "function";

type Company = {
  id: string;
  name: string;
  legalName: string | null;
  website: string | null;
  contactEmail: string | null;
  active: boolean;
  productCount?: number;
  activeProductCount?: number;
  productCategories?: string[];
  contractCount?: number;
  purchaseCount?: number;
  renewalCount?: number;
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
type CatalogData = {
  query: {
    search: string;
    status: StatusFilter;
    sort: "name-asc" | "name-desc";
    page: number;
    productPage: number;
  };
  pagination: Pagination;
  productPagination: Pagination | null;
  selectedCompanyId: string | null;
  selectedCompany: Company | null;
  selectedProductId: string | null;
  companies: Company[];
  capabilities: Capability[];
  products: Product[];
  modules: ProductComponent[];
  features: ProductFunction[];
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
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

function selectedTab(initialTab?: string): CatalogTab {
  return initialTab?.toLowerCase() === "resellers" ? "resellers" : "vendors";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = selectedTab(initialTab);
  const vendors = tab === "vendors" ? data.companies : [];
  const resellers = tab === "resellers" ? data.companies : [];
  const [vendorSearch, setVendorSearch] = useState(data.query.search);
  const [resellerSearch, setResellerSearch] = useState(data.query.search);
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(
    new Set(data.selectedProductId ? [data.selectedProductId] : [])
  );
  const [editor, setEditor] = useState<EditorState | null>(null);

  const selectedVendorSummary = vendors.find(
    (vendor) => vendor.id === data.selectedCompanyId
  );
  const selectedVendor = data.selectedCompany
    ? { ...selectedVendorSummary, ...data.selectedCompany }
    : selectedVendorSummary;
  const vendorProducts = data.products;

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
    setEditor(null);
    router.replace(`/products?tab=${nextTab}`);
  }

  function replaceQuery(
    updates: Record<string, string | number | null>,
    resetPage = true
  ) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", tab);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    if (resetPage) next.delete("page");
    router.replace(`/products?${next.toString()}`);
  }

  const activeSearch = tab === "vendors" ? vendorSearch : resellerSearch;
  useEffect(() => {
    if (activeSearch === data.query.search) return;
    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("tab", tab);
      if (activeSearch.trim()) next.set("search", activeSearch.trim());
      else next.delete("search");
      next.delete("page");
      next.delete("company");
      next.delete("product");
      router.replace(`/products?${next.toString()}`);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [activeSearch, data.query.search, router, searchParams, tab]);

  function toggleProduct(productId: string) {
    if (productId !== data.selectedProductId) {
      replaceQuery({ product: productId }, false);
      return;
    }
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
            search={vendorSearch}
            status={data.query.status}
            sort={data.query.sort}
            pagination={data.pagination}
            selectedVendorId={selectedVendor?.id}
            onSearchChange={setVendorSearch}
            onStatusChange={(status) =>
              replaceQuery(
                { status, company: null, product: null, productPage: null },
                true
              )
            }
            onSortChange={(sort) =>
              replaceQuery({ sort, company: null, product: null }, true)
            }
            onPageChange={(page) =>
              replaceQuery({ page, company: null, product: null }, false)
            }
            onSelect={(vendorId) =>
              replaceQuery(
                { company: vendorId, product: null, productPage: null },
                false
              )
            }
            onAdd={() => setEditor({ kind: "vendor" })}
            onClear={() =>
              replaceQuery({ company: null, product: null }, false)
            }
          />
          <VendorDetail
            vendor={selectedVendor}
            products={vendorProducts}
            selectedProductId={data.selectedProductId}
            components={data.modules}
            functions={data.features}
            expandedProductIds={expandedProductIds}
            onToggleProduct={toggleProduct}
            onEditVendor={(vendor) =>
              setEditor({ kind: "vendor", record: vendor })
            }
            onDeleteVendor={(vendor) => {
              if (vendor.id === data.selectedCompanyId) {
                replaceQuery({ company: null, product: null }, false);
              }
            }}
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
            productPagination={data.productPagination}
            onProductPageChange={(page) =>
              replaceQuery({ productPage: page, product: null }, false)
            }
          />
        </div>
      ) : (
        <ResellerWorkspace
          resellers={resellers}
          search={resellerSearch}
          status={data.query.status}
          sort={data.query.sort}
          pagination={data.pagination}
          onSearchChange={setResellerSearch}
          onStatusChange={(status) =>
            replaceQuery({ status, company: null }, true)
          }
          onSortChange={(sort) => replaceQuery({ sort }, true)}
          onPageChange={(page) => replaceQuery({ page }, false)}
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
  search,
  status,
  sort,
  pagination,
  selectedVendorId,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onPageChange,
  onSelect,
  onAdd,
  onClear,
}: {
  vendors: Company[];
  search: string;
  status: StatusFilter;
  sort: "name-asc" | "name-desc";
  pagination: Pagination;
  selectedVendorId?: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onSortChange: (value: "name-asc" | "name-desc") => void;
  onPageChange: (page: number) => void;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onClear: () => void;
}) {
  return (
    <aside className="grid w-full content-start gap-3 rounded-lg border border-border/80 bg-card/80 p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-100">Vendors</h2>
        <span className="text-xs text-muted-foreground">
          {pagination.total}
        </span>
      </div>
      <SearchField
        label="Search vendors"
        value={search}
        onChange={onSearchChange}
      />
      <StatusButtons value={status} onChange={onStatusChange} />
      <NameSortButton value={sort} onChange={onSortChange} />
      <Button size="sm" onClick={onAdd}>
        <Plus data-icon="inline-start" />
        Add Vendor
      </Button>
      <Button size="sm" variant="outline" onClick={onClear}>
        Clear Selected
      </Button>
      <div className="grid max-h-[34rem] gap-2 overflow-y-auto pr-1">
        {vendors.map((vendor) => {
          const categories = (vendor.productCategories ?? []).map(titleCase);
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
                  <span>
                    {vendor.productCount ?? 0} products
                    {vendor.productCount
                      ? ` • ${vendor.activeProductCount ?? 0} active`
                      : ""}
                  </span>
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
        {!vendors.length ? <EmptyState>No matching vendors.</EmptyState> : null}
      </div>
      <PageControls pagination={pagination} onChange={onPageChange} />
    </aside>
  );
}

function NameSortButton({
  value,
  onChange,
}: {
  value: "name-asc" | "name-desc";
  onChange: (value: "name-asc" | "name-desc") => void;
}) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => onChange(value === "name-asc" ? "name-desc" : "name-asc")}
    >
      Name {value === "name-asc" ? "A–Z" : "Z–A"}
    </Button>
  );
}

function PageControls({
  pagination,
  onChange,
}: {
  pagination: Pagination;
  onChange: (page: number) => void;
}) {
  if (pagination.pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
      <Button
        size="sm"
        variant="outline"
        disabled={!pagination.hasPreviousPage}
        onClick={() => onChange(pagination.page - 1)}
      >
        Previous
      </Button>
      <span>
        Page {pagination.page} of {pagination.pageCount}
      </span>
      <Button
        size="sm"
        variant="outline"
        disabled={!pagination.hasNextPage}
        onClick={() => onChange(pagination.page + 1)}
      >
        Next
      </Button>
    </div>
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
  selectedProductId,
  components,
  functions,
  expandedProductIds,
  onToggleProduct,
  onEditVendor,
  onDeleteVendor,
  onAddProduct,
  onEditProduct,
  onAddCapability,
  onAddComponent,
  onEditComponent,
  onAddFunction,
  onEditFunction,
  productPagination,
  onProductPageChange,
}: {
  vendor?: Company;
  products: Product[];
  selectedProductId: string | null;
  components: ProductComponent[];
  functions: ProductFunction[];
  expandedProductIds: Set<string>;
  onToggleProduct: (id: string) => void;
  onEditVendor: (vendor: Company) => void;
  onDeleteVendor: (vendor: Company) => void;
  onAddProduct: (vendor: Company) => void;
  onEditProduct: (product: Product) => void;
  onAddCapability: (product: Product) => void;
  onAddComponent: (product: Product) => void;
  onEditComponent: (component: ProductComponent) => void;
  onAddFunction: (product: Product, component?: ProductComponent) => void;
  onEditFunction: (productFunction: ProductFunction) => void;
  productPagination: Pagination | null;
  onProductPageChange: (page: number) => void;
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
                value={`${vendor.productCount ?? products.length} product${
                  (vendor.productCount ?? products.length) === 1 ? "" : "s"
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
            <VendorDeleteButton
              vendor={vendor}
              onDeleted={() => onDeleteVendor(vendor)}
            />
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
            {productPagination?.total ?? products.length} records
          </span>
        </div>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            components={product.id === selectedProductId ? components : []}
            functions={product.id === selectedProductId ? functions : []}
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
        {productPagination ? (
          <PageControls
            pagination={productPagination}
            onChange={onProductPageChange}
          />
        ) : null}
      </section>
    </main>
  );
}

function VendorDeleteButton({
  vendor,
  onDeleted,
}: {
  vendor: Company;
  onDeleted: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    deleteVendorAction,
    emptyActionResult
  );

  useEffect(() => {
    if (state.ok) {
      onDeleted();
    }
  }, [onDeleted, state.ok]);

  return (
    <form action={formAction} className="grid gap-2">
      <input name="id" type="hidden" value={vendor.id} />
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={(event) => {
          if (
            !window.confirm(
              `Delete ${vendor.name} and its vendor-owned catalog records? This cannot be undone.`
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <Trash2 data-icon="inline-start" />
        {pending ? "Deleting..." : "Delete Vendor"}
      </Button>
      {state.ok === false ? <MutationError result={state} /> : null}
    </form>
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

export function ResellerWorkspace({
  resellers,
  search,
  status,
  sort,
  pagination,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onPageChange,
  onAdd,
  onEdit,
}: {
  resellers: Company[];
  search: string;
  status: StatusFilter;
  sort: "name-asc" | "name-desc";
  pagination: Pagination;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onSortChange: (value: "name-asc" | "name-desc") => void;
  onPageChange: (page: number) => void;
  onAdd: () => void;
  onEdit: (reseller: Company) => void;
}) {
  const columns: ColumnDef<Company>[] = [
    { id: "name", header: "Reseller" },
    { id: "legalName", header: "Legal Name", enableSorting: false },
    { id: "website", header: "Website", enableSorting: false },
    { id: "contactEmail", header: "Primary Contact", enableSorting: false },
    { id: "contractCount", header: "Contracts", enableSorting: false },
    { id: "purchaseCount", header: "Purchases", enableSorting: false },
    { id: "renewalCount", header: "Renewals", enableSorting: false },
    { id: "active", header: "Status", enableSorting: false },
    { id: "actions", header: "Edit", enableSorting: false },
  ];
  const sorting: SortingState = [{ id: "name", desc: sort === "name-desc" }];
  const columnFilters: ColumnFiltersState =
    status === "all" ? [] : [{ id: "active", value: status === "active" }];
  const tablePagination: PaginationState = {
    pageIndex: Math.max(0, pagination.page - 1),
    pageSize: pagination.pageSize,
  };
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 exposes stable instance methods by design.
  const table = useReactTable({
    data: resellers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (reseller) => reseller.id,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: pagination.pageCount,
    rowCount: pagination.total,
    state: {
      columnFilters,
      globalFilter: search,
      pagination: tablePagination,
      sorting,
    },
  });
  const rows = table.getRowModel().rows;

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
        <NameSortButton value={sort} onChange={onSortChange} />
        <Button onClick={onAdd}>
          <Plus data-icon="inline-start" />
          Add Reseller
        </Button>
      </div>

      <div className="w-full min-w-0 rounded-lg border border-border/80 bg-card/80">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              {table.getHeaderGroups()[0]?.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={resellerColumnWidth(header.id)}
                >
                  {String(header.column.columnDef.header)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const reseller = row.original;
              return (
                <TableRow key={row.id}>
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
                  <TableCell>{reseller.contractCount ?? 0}</TableCell>
                  <TableCell>{reseller.purchaseCount ?? 0}</TableCell>
                  <TableCell>{reseller.renewalCount ?? 0}</TableCell>
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
        {!rows.length ? (
          <div className="p-4">
            <EmptyState>No matching resellers.</EmptyState>
          </div>
        ) : null}
      </div>
      <PageControls pagination={pagination} onChange={onPageChange} />
    </section>
  );
}

function resellerColumnWidth(columnId: string): string {
  const widths: Record<string, string> = {
    name: "w-[18%]",
    legalName: "w-[8%]",
    website: "w-[20%]",
    contactEmail: "w-[14%]",
    contractCount: "w-[8%]",
    purchaseCount: "w-[8%]",
    renewalCount: "w-[8%]",
    active: "w-[9%]",
    actions: "w-[7%]",
  };
  return widths[columnId] ?? "";
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
