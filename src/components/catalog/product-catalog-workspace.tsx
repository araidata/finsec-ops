"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useActionState, useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  Check,
  ChevronRight,
  Package,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";

import {
  saveAgreementAction,
  saveCapabilityAction,
  saveCompanyAction,
  saveFeatureAction,
  saveModuleAction,
  saveProductAction,
  saveSellerAction,
  saveVehicleAction,
  setActiveAction,
} from "@/app/products/actions";
import { WorkspaceShell } from "@/components/app/workspace-shell";
import {
  ActiveBadge,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

type CatalogData = {
  companies: any[];
  capabilities: any[];
  products: any[];
  modules: any[];
  features: any[];
  sellers: any[];
  vehicles: any[];
  agreements: any[];
};

type CompanyFilter = "ALL" | "VENDOR" | "RESELLER";
type EditorKind =
  | "company"
  | "product"
  | "module"
  | "feature"
  | "capability"
  | "vehicle"
  | "seller"
  | "agreement";

type EditorState = {
  kind: EditorKind;
  record?: any;
  defaults?: Record<string, any>;
};

type CatalogAction = (
  prev: ActionResult,
  formData: FormData
) => Promise<ActionResult>;

const optionSets = {
  companyRoles: [
    "VENDOR",
    "RESELLER",
    "SERVICE_PROVIDER",
    "IMPLEMENTATION_PARTNER",
    "CONSULTANT",
  ],
  sellerRelationshipTypes: [
    "DIRECT_VENDOR",
    "RESELLER",
    "SERVICE_PROVIDER",
    "MARKETPLACE",
    "OTHER",
  ],
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
};

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function ids(rows: { capability: { id: string } }[] = []) {
  return rows.map((row) => row.capability.id);
}

function dateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function roleNames(company: any) {
  return company.roles.map((role: any) => titleCase(role.role)).join(", ");
}

function hasCompanyRole(company: any, roleName: string) {
  return company.roles.some((role: any) => role.role === roleName);
}

function catalogFilterFromParam(value?: string): CompanyFilter {
  const normalized = value?.toLowerCase();

  if (normalized === "vendors") return "VENDOR";
  if (normalized === "resellers") return "RESELLER";

  return "ALL";
}

function companyRoleIds(company?: any, fallback: string[] = []) {
  return company?.roles.map((role: any) => role.role) ?? fallback;
}

export function ProductCatalogWorkspace({
  data,
  initialTab,
}: {
  data: CatalogData;
  initialTab?: string;
}) {
  const vendors = useMemo(
    () => data.companies.filter((company) => hasCompanyRole(company, "VENDOR")),
    [data.companies]
  );
  const resellers = useMemo(
    () =>
      data.companies.filter((company) => hasCompanyRole(company, "RESELLER")),
    [data.companies]
  );

  const [companyFilter, setCompanyFilter] = useState<CompanyFilter>(
    catalogFilterFromParam(initialTab)
  );
  const [companySearch, setCompanySearch] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState(
    vendors[0]?.id ?? ""
  );
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [editor, setEditor] = useState<EditorState>({
    kind: "company",
    record: vendors[0],
    defaults: { roles: ["VENDOR"] },
  });
  const [featureProductId, setFeatureProductId] = useState(
    data.products[0]?.id ?? ""
  );
  const [adminSection, setAdminSection] = useState<
    "capabilities" | "eligibility" | "vehicles" | "agreements"
  >("capabilities");

  const selectedVendor =
    vendors.find((vendor) => vendor.id === selectedVendorId) ?? vendors[0];
  const vendorProducts = data.products.filter(
    (product) => product.vendorCompanyId === selectedVendor?.id
  );
  const selectedProduct =
    vendorProducts.find((product) => product.id === selectedProductId) ??
    vendorProducts[0];
  const selectedModule =
    data.modules.find((module) => module.id === selectedModuleId) ??
    data.modules.find((module) => module.productId === selectedProduct?.id);

  const vendorOptions: Option[] = vendors.map((company) => ({
    id: company.id,
    label: company.name,
    active: company.active,
  }));
  const productOptions: Option[] = data.products.map((product) => ({
    id: product.id,
    label: product.name,
    active: product.active,
    hint: product.vendorCompany?.name ?? "Legacy vendor",
  }));
  const sellerOptions: Option[] = data.companies
    .filter((company) =>
      company.roles.some((role: any) =>
        ["VENDOR", "RESELLER", "SERVICE_PROVIDER"].includes(role.role)
      )
    )
    .map((company) => ({
      id: company.id,
      label: company.name,
      active: company.active,
      hint: roleNames(company),
    }));
  const capabilityOptions: Option[] = data.capabilities.map((capability) => ({
    id: capability.id,
    label: capability.name,
    active: capability.active,
  }));
  const vehicleOptions: Option[] = data.vehicles.map((vehicle) => ({
    id: vehicle.id,
    label: vehicle.name,
    active: vehicle.active,
    hint: vehicle.issuingOrganization,
  }));

  const filteredCompanies = data.companies.filter((company) => {
    const matchesRole =
      companyFilter === "ALL" || hasCompanyRole(company, companyFilter);
    const matchesSearch = company.name
      .toLowerCase()
      .includes(companySearch.toLowerCase());

    return matchesRole && matchesSearch;
  });

  function openEditor(nextEditor: EditorState) {
    setEditor(nextEditor);

    if (nextEditor.kind === "feature") {
      setFeatureProductId(
        nextEditor.record?.productId ??
          nextEditor.defaults?.productId ??
          selectedProduct?.id ??
          data.products[0]?.id ??
          ""
      );
    }
  }

  function selectCompany(company: any) {
    if (hasCompanyRole(company, "VENDOR")) {
      setSelectedVendorId(company.id);
      setSelectedProductId("");
      setSelectedModuleId("");
    }

    openEditor({ kind: "company", record: company });
  }

  return (
    <WorkspaceShell
      title="Product Catalog"
      description="Relationship-first catalog for vendor-owned products, modules, features, company roles, and optional purchasing eligibility."
      actionLabel="New Catalog Item"
    >
      <section className="grid gap-3 xl:grid-cols-[19rem_minmax(0,1fr)_24rem]">
        <CompanyRail
          companies={filteredCompanies}
          allCount={data.companies.length}
          vendorCount={vendors.length}
          resellerCount={resellers.length}
          filter={companyFilter}
          search={companySearch}
          selectedVendorId={selectedVendor?.id}
          onFilterChange={setCompanyFilter}
          onSearchChange={setCompanySearch}
          onCompanySelect={selectCompany}
          onNewVendor={() =>
            openEditor({ kind: "company", defaults: { roles: ["VENDOR"] } })
          }
          onNewReseller={() =>
            openEditor({ kind: "company", defaults: { roles: ["RESELLER"] } })
          }
        />

        <VendorPortfolio
          vendor={selectedVendor}
          products={vendorProducts}
          modules={data.modules}
          features={data.features}
          sellers={data.sellers}
          selectedProductId={selectedProduct?.id}
          selectedModuleId={selectedModule?.id}
          onProductSelect={(product) => {
            setSelectedProductId(product.id);
            setSelectedModuleId("");
          }}
          onModuleSelect={(module) => {
            setSelectedProductId(module.productId);
            setSelectedModuleId(module.id);
          }}
          onEditVendor={() =>
            selectedVendor &&
            openEditor({ kind: "company", record: selectedVendor })
          }
          onAddProduct={() =>
            selectedVendor &&
            openEditor({
              kind: "product",
              defaults: { vendorCompanyId: selectedVendor.id },
            })
          }
          onEditProduct={(product) =>
            openEditor({ kind: "product", record: product })
          }
          onAddModule={(product) =>
            openEditor({ kind: "module", defaults: { productId: product.id } })
          }
          onEditModule={(module) =>
            openEditor({ kind: "module", record: module })
          }
          onAddFeature={(product, module) =>
            openEditor({
              kind: "feature",
              defaults: { productId: product.id, moduleId: module?.id },
            })
          }
          onEditFeature={(feature) =>
            openEditor({ kind: "feature", record: feature })
          }
          onAddEligibility={(product) =>
            openEditor({ kind: "seller", defaults: { productId: product.id } })
          }
        />

        <EditorPanel
          editor={editor}
          selectedVendor={selectedVendor}
          selectedProduct={selectedProduct}
          featureProductId={featureProductId}
          vendorOptions={vendorOptions}
          productOptions={productOptions}
          sellerOptions={sellerOptions}
          capabilityOptions={capabilityOptions}
          vehicleOptions={vehicleOptions}
          modules={data.modules}
          onCancel={() =>
            openEditor({
              kind: "company",
              record: selectedVendor,
              defaults: { roles: ["VENDOR"] },
            })
          }
          onFeatureProductChange={setFeatureProductId}
        />
      </section>

      <AdminDataPanel
        section={adminSection}
        setSection={setAdminSection}
        data={data}
        productOptions={productOptions}
        sellerOptions={sellerOptions}
        vehicleOptions={vehicleOptions}
        capabilityOptions={capabilityOptions}
        openEditor={openEditor}
      />
    </WorkspaceShell>
  );
}

function CompanyRail({
  companies,
  allCount,
  vendorCount,
  resellerCount,
  filter,
  search,
  selectedVendorId,
  onFilterChange,
  onSearchChange,
  onCompanySelect,
  onNewVendor,
  onNewReseller,
}: {
  companies: any[];
  allCount: number;
  vendorCount: number;
  resellerCount: number;
  filter: CompanyFilter;
  search: string;
  selectedVendorId?: string;
  onFilterChange: (filter: CompanyFilter) => void;
  onSearchChange: (value: string) => void;
  onCompanySelect: (company: any) => void;
  onNewVendor: () => void;
  onNewReseller: () => void;
}) {
  const filters = [
    { id: "ALL" as const, label: "Companies", count: allCount },
    { id: "VENDOR" as const, label: "Vendors", count: vendorCount },
    { id: "RESELLER" as const, label: "Resellers", count: resellerCount },
  ];

  return (
    <CatalogPanel title="Companies">
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={onNewVendor}>
          <Plus data-icon="inline-start" />
          New vendor
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={onNewReseller}
        >
          <Plus data-icon="inline-start" />
          New reseller
        </Button>
      </div>
      <div className="flex rounded-lg border border-border/80 bg-secondary/30 p-1">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onFilterChange(item.id)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition",
              filter === item.id && "bg-cyan-400 text-slate-950"
            )}
          >
            {item.label}
            <span className="ml-1 font-mono">{item.count}</span>
          </button>
        ))}
      </div>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="Search companies"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search companies..."
          className="border-border/80 bg-secondary/45 pl-8"
        />
      </div>
      <div className="grid max-h-[39rem] gap-2 overflow-y-auto pr-1">
        {companies.map((company) => (
          <button
            key={company.id}
            type="button"
            onClick={() => onCompanySelect(company)}
            className={cn(
              "grid gap-2 rounded-lg border border-border/70 bg-secondary/20 p-3 text-left transition hover:border-cyan-300/50 hover:bg-secondary/45",
              company.id === selectedVendorId &&
                "border-cyan-300/70 bg-cyan-400/10"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-100">
                  {company.name}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {roleNames(company)}
                </p>
              </div>
              <span
                aria-label={company.active ? "Active" : "Inactive"}
                className={cn(
                  "mt-1 size-2.5 shrink-0 rounded-full",
                  company.active ? "bg-emerald-300" : "bg-amber-300"
                )}
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {company.roles.map((role: any) => (
                <Badge key={role.role} variant="outline">
                  {titleCase(role.role)}
                </Badge>
              ))}
            </div>
          </button>
        ))}
        {!companies.length ? (
          <EmptyState>No matching companies.</EmptyState>
        ) : null}
      </div>
    </CatalogPanel>
  );
}

function VendorPortfolio({
  vendor,
  products,
  modules,
  features,
  sellers,
  selectedProductId,
  selectedModuleId,
  onProductSelect,
  onModuleSelect,
  onEditVendor,
  onAddProduct,
  onEditProduct,
  onAddModule,
  onEditModule,
  onAddFeature,
  onEditFeature,
  onAddEligibility,
}: {
  vendor?: any;
  products: any[];
  modules: any[];
  features: any[];
  sellers: any[];
  selectedProductId?: string;
  selectedModuleId?: string;
  onProductSelect: (product: any) => void;
  onModuleSelect: (module: any) => void;
  onEditVendor: () => void;
  onAddProduct: () => void;
  onEditProduct: (product: any) => void;
  onAddModule: (product: any) => void;
  onEditModule: (module: any) => void;
  onAddFeature: (product: any, module?: any) => void;
  onEditFeature: (feature: any) => void;
  onAddEligibility: (product: any) => void;
}) {
  if (!vendor) {
    return (
      <CatalogPanel title="Vendor Portfolio">
        <EmptyState>
          Create or select a vendor to manage products and modules.
        </EmptyState>
      </CatalogPanel>
    );
  }

  return (
    <CatalogPanel
      title="Vendor Portfolio"
      action={
        <Button size="sm" onClick={onAddProduct}>
          <Plus data-icon="inline-start" />
          Add product
        </Button>
      }
    >
      <div className="rounded-lg border border-border/80 bg-secondary/30 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-cyan-200">
              <Building2 className="size-4" />
              Selected vendor
            </div>
            <h2 className="mt-1 text-xl font-semibold text-slate-50">
              {vendor.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {products.length} product{products.length === 1 ? "" : "s"}{" "}
              managed under this vendor.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onEditVendor}>
            <Pencil data-icon="inline-start" />
            Edit vendor
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {products.map((product) => {
          const productModules = modules.filter(
            (module) => module.productId === product.id
          );
          const productFeatures = features.filter(
            (feature) => feature.productId === product.id && !feature.moduleId
          );
          const productSellers = sellers.filter(
            (seller) => seller.productId === product.id
          );
          const active = selectedProductId === product.id;

          return (
            <article
              key={product.id}
              className={cn(
                "rounded-lg border border-border/80 bg-card/80 p-4",
                active && "border-cyan-300/70 bg-cyan-400/5"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onProductSelect(product)}
                  className="min-w-0 text-left"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="size-4 text-cyan-200" />
                    {titleCase(product.offeringType)}
                    <ChevronRight className="size-3" />
                    {titleCase(product.productCategory)}
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-slate-50">
                    {product.name}
                  </h3>
                </button>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditProduct(product)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddModule(product)}
                  >
                    <Plus data-icon="inline-start" />
                    Module
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddFeature(product)}
                  >
                    <Plus data-icon="inline-start" />
                    Feature
                  </Button>
                </div>
              </div>

              <CapabilityBadges rows={product.capabilities} />

              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Modules
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {productModules.length}
                    </span>
                  </div>
                  {productModules.length ? (
                    productModules.map((module) => {
                      const moduleFeatures = features.filter(
                        (feature) => feature.moduleId === module.id
                      );

                      return (
                        <div
                          key={module.id}
                          className={cn(
                            "rounded-lg border border-border/70 bg-secondary/25 p-3",
                            selectedModuleId === module.id &&
                              "border-cyan-300/70"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => onModuleSelect(module)}
                              className="min-w-0 text-left"
                            >
                              <p className="truncate text-sm font-semibold text-slate-100">
                                {module.name}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {moduleFeatures.length} feature
                                {moduleFeatures.length === 1 ? "" : "s"}
                              </p>
                            </button>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onEditModule(module)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onAddFeature(product, module)}
                              >
                                <Plus />
                              </Button>
                            </div>
                          </div>
                          <CapabilityBadges
                            rows={module.capabilities}
                            compact
                          />
                          {moduleFeatures.length ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {moduleFeatures.map((feature) => (
                                <button
                                  key={feature.id}
                                  type="button"
                                  onClick={() => onEditFeature(feature)}
                                  className="rounded-full border border-border/80 px-2 py-1 text-xs text-slate-200 hover:border-cyan-300/70"
                                >
                                  {feature.name}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <EmptyState>No modules yet.</EmptyState>
                  )}
                </div>

                <div className="grid gap-2 rounded-lg border border-border/70 bg-secondary/20 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Purchasing eligibility
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAddEligibility(product)}
                    >
                      <Plus />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optional only. Budget reseller choices come from
                    reseller-role companies.
                  </p>
                  {productSellers.length ? (
                    <div className="grid gap-1">
                      {productSellers.map((seller) => (
                        <div
                          key={seller.id}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="truncate text-slate-200">
                            {seller.seller.name}
                          </span>
                          <Badge
                            variant={seller.preferred ? "default" : "outline"}
                          >
                            {seller.preferred
                              ? "Preferred"
                              : titleCase(seller.relationshipType)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No optional eligibility set.
                    </p>
                  )}
                  {productFeatures.length ? (
                    <div className="border-t border-border/70 pt-2">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Product features
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {productFeatures.map((feature) => (
                          <button
                            key={feature.id}
                            type="button"
                            onClick={() => onEditFeature(feature)}
                            className="rounded-full border border-border/80 px-2 py-1 text-xs text-slate-200 hover:border-cyan-300/70"
                          >
                            {feature.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
        {!products.length ? (
          <EmptyState>
            This vendor does not have catalog products yet.
          </EmptyState>
        ) : null}
      </div>
    </CatalogPanel>
  );
}

function EditorPanel({
  editor,
  selectedVendor,
  selectedProduct,
  featureProductId,
  vendorOptions,
  productOptions,
  sellerOptions,
  capabilityOptions,
  vehicleOptions,
  modules,
  onCancel,
  onFeatureProductChange,
}: {
  editor: EditorState;
  selectedVendor?: any;
  selectedProduct?: any;
  featureProductId: string;
  vendorOptions: Option[];
  productOptions: Option[];
  sellerOptions: Option[];
  capabilityOptions: Option[];
  vehicleOptions: Option[];
  modules: any[];
  onCancel: () => void;
  onFeatureProductChange: (value: string) => void;
}) {
  const record = editor.record;
  const defaults = editor.defaults ?? {};
  const editorTitle =
    record?.name ??
    record?.title ??
    record?.sellerAwardNumber ??
    {
      company: defaults.roles?.includes("RESELLER")
        ? "New reseller"
        : "New company",
      product: "New product or service",
      module: "New module",
      feature: "New feature",
      capability: "New capability",
      vehicle: "New purchasing vehicle",
      seller: "New purchasing eligibility",
      agreement: "New purchasing agreement",
    }[editor.kind];

  const context = editorContext(
    editor,
    selectedVendor,
    selectedProduct,
    modules
  );

  return (
    <CatalogPanel title="Create / Edit">
      <div className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-100">
          Context
        </p>
        <h2 className="mt-1 text-base font-semibold text-slate-50">
          {editorTitle}
        </h2>
        <p className="mt-1 text-xs text-cyan-100/80">{context}</p>
      </div>

      {editor.kind === "company" ? (
        <EditorForm
          key={`company-${record?.id ?? defaults.roles?.join("-") ?? "new"}`}
          title={record ? "Edit company" : "Create company"}
          action={saveCompanyAction}
          submitLabel="Save company"
          onCancel={onCancel}
        >
          <input name="id" type="hidden" value={record?.id ?? ""} />
          <FieldGroup title="Identity">
            <Field
              label="Company name"
              name="name"
              defaultValue={record?.name}
            />
            <Field
              label="Legal name"
              name="legalName"
              defaultValue={record?.legalName}
            />
            <Field
              label="Website"
              name="website"
              defaultValue={record?.website}
            />
            <Field
              label="Contact email"
              name="contactEmail"
              defaultValue={record?.contactEmail}
            />
          </FieldGroup>
          <FieldGroup title="Classification">
            <CheckChipGroup
              label="Company roles"
              name="roles"
              options={optionSets.companyRoles.map((role) => ({
                id: role,
                label: titleCase(role),
              }))}
              defaultValues={companyRoleIds(record, defaults.roles ?? [])}
            />
            <ToggleField defaultChecked={record?.active ?? true} />
          </FieldGroup>
        </EditorForm>
      ) : null}

      {editor.kind === "product" ? (
        <EditorForm
          key={`product-${record?.id ?? defaults.vendorCompanyId ?? "new"}`}
          title={
            record ? "Edit product or service" : "Create product or service"
          }
          action={saveProductAction}
          submitLabel="Save product"
          onCancel={onCancel}
        >
          <input name="id" type="hidden" value={record?.id ?? ""} />
          <FieldGroup title="Relationship">
            <NativeSelect
              label="Vendor"
              name="vendorCompanyId"
              options={vendorOptions}
              defaultValue={
                record?.vendorCompanyId ??
                defaults.vendorCompanyId ??
                vendorOptions[0]?.id
              }
            />
          </FieldGroup>
          <FieldGroup title="Identity">
            <Field label="Name" name="name" defaultValue={record?.name} />
            <NativeSelect
              label="Offering type"
              name="offeringType"
              options={optionSets.productOfferingTypes.map((type) => ({
                id: type,
                label: titleCase(type),
              }))}
              defaultValue={record?.offeringType ?? "SAAS"}
            />
            <NativeSelect
              label="Product category"
              name="productCategory"
              options={optionSets.productCategories.map((category) => ({
                id: category,
                label: titleCase(category),
              }))}
              defaultValue={record?.productCategory ?? "OTHER"}
            />
          </FieldGroup>
          <FieldGroup title="Capabilities">
            <CheckChipGroup
              label="Capabilities"
              name="capabilityIds"
              options={capabilityOptions}
              defaultValues={ids(record?.capabilities)}
              searchable
            />
          </FieldGroup>
          <FieldGroup title="Notes">
            <TextBlock
              label="Description"
              name="description"
              defaultValue={record?.description}
            />
            <ToggleField defaultChecked={record?.active ?? true} />
          </FieldGroup>
        </EditorForm>
      ) : null}

      {editor.kind === "module" ? (
        <EditorForm
          key={`module-${record?.id ?? defaults.productId ?? "new"}`}
          title={record ? "Edit module" : "Create module"}
          action={saveModuleAction}
          submitLabel="Save module"
          onCancel={onCancel}
        >
          <input name="id" type="hidden" value={record?.id ?? ""} />
          <FieldGroup title="Relationship">
            <NativeSelect
              label="Parent product"
              name="productId"
              options={productOptions}
              defaultValue={
                record?.productId ?? defaults.productId ?? productOptions[0]?.id
              }
            />
          </FieldGroup>
          <FieldGroup title="Identity">
            <Field
              label="Module name"
              name="name"
              defaultValue={record?.name}
            />
          </FieldGroup>
          <FieldGroup title="Capabilities">
            <CheckChipGroup
              label="Capabilities"
              name="capabilityIds"
              options={capabilityOptions}
              defaultValues={ids(record?.capabilities)}
              searchable
            />
          </FieldGroup>
          <FieldGroup title="Notes">
            <TextBlock
              label="Description"
              name="description"
              defaultValue={record?.description}
            />
            <ToggleField defaultChecked={record?.active ?? true} />
          </FieldGroup>
        </EditorForm>
      ) : null}

      {editor.kind === "feature" ? (
        <EditorForm
          key={`feature-${record?.id ?? defaults.productId ?? defaults.moduleId ?? "new"}`}
          title={record ? "Edit feature" : "Create feature"}
          action={saveFeatureAction}
          submitLabel="Save feature"
          onCancel={onCancel}
        >
          <input name="id" type="hidden" value={record?.id ?? ""} />
          <FieldGroup title="Relationship">
            <NativeSelect
              label="Product"
              name="productId"
              options={productOptions}
              defaultValue={
                record?.productId ?? defaults.productId ?? featureProductId
              }
              onChange={onFeatureProductChange}
            />
            <NativeSelect
              label="Module"
              name="moduleId"
              options={modules
                .filter((module) => module.productId === featureProductId)
                .map((module) => ({
                  id: module.id,
                  label: module.name,
                  active: module.active,
                }))}
              defaultValue={record?.moduleId ?? defaults.moduleId ?? "none"}
              includeNone
            />
          </FieldGroup>
          <FieldGroup title="Identity">
            <Field
              label="Feature name"
              name="name"
              defaultValue={record?.name}
            />
          </FieldGroup>
          <FieldGroup title="Capabilities">
            <CheckChipGroup
              label="Capabilities"
              name="capabilityIds"
              options={capabilityOptions}
              defaultValues={ids(record?.capabilities)}
              searchable
            />
          </FieldGroup>
          <FieldGroup title="Notes">
            <TextBlock
              label="Description"
              name="description"
              defaultValue={record?.description}
            />
            <ToggleField defaultChecked={record?.active ?? true} />
          </FieldGroup>
        </EditorForm>
      ) : null}

      {editor.kind === "capability" ? (
        <EditorForm
          key={`capability-${record?.id ?? "new"}`}
          title={record ? "Edit capability" : "Create capability"}
          action={saveCapabilityAction}
          submitLabel="Save capability"
          onCancel={onCancel}
        >
          <input name="id" type="hidden" value={record?.id ?? ""} />
          <FieldGroup title="Identity">
            <Field label="Name" name="name" defaultValue={record?.name} />
            <TextBlock
              label="Description"
              name="description"
              defaultValue={record?.description}
            />
            <ToggleField defaultChecked={record?.active ?? true} />
          </FieldGroup>
        </EditorForm>
      ) : null}

      {editor.kind === "vehicle" ? (
        <EditorForm
          key={`vehicle-${record?.id ?? "new"}`}
          title={
            record ? "Edit purchasing vehicle" : "Create purchasing vehicle"
          }
          action={saveVehicleAction}
          submitLabel="Save vehicle"
          onCancel={onCancel}
        >
          <input name="id" type="hidden" value={record?.id ?? ""} />
          <FieldGroup title="Identity">
            <Field label="Name" name="name" defaultValue={record?.name} />
            <Field
              label="Contract number"
              name="contractNumber"
              defaultValue={record?.contractNumber}
            />
            <Field
              label="Issuing organization"
              name="issuingOrganization"
              defaultValue={record?.issuingOrganization}
            />
          </FieldGroup>
          <FieldGroup title="Dates and notes">
            <Field
              label="Start date"
              name="startsOn"
              type="date"
              defaultValue={dateOnly(record?.startsOn)}
            />
            <Field
              label="End date"
              name="endsOn"
              type="date"
              defaultValue={dateOnly(record?.endsOn)}
            />
            <TextBlock
              label="Notes"
              name="notesText"
              defaultValue={record?.notesText}
            />
            <ToggleField defaultChecked={record?.active ?? true} />
          </FieldGroup>
        </EditorForm>
      ) : null}

      {editor.kind === "seller" ? (
        <EditorForm
          key={`seller-${record?.id ?? defaults.productId ?? "new"}`}
          title={
            record
              ? "Edit purchasing eligibility"
              : "Create purchasing eligibility"
          }
          action={saveSellerAction}
          submitLabel="Save eligibility"
          onCancel={onCancel}
        >
          <input name="id" type="hidden" value={record?.id ?? ""} />
          <FieldGroup title="Optional product eligibility">
            <NativeSelect
              label="Product"
              name="productId"
              options={productOptions}
              defaultValue={
                record?.productId ?? defaults.productId ?? productOptions[0]?.id
              }
            />
            <NativeSelect
              label="Seller company"
              name="sellerCompanyId"
              options={sellerOptions}
              defaultValue={record?.sellerCompanyId ?? sellerOptions[0]?.id}
            />
            <NativeSelect
              label="Relationship type"
              name="relationshipType"
              options={optionSets.sellerRelationshipTypes.map((type) => ({
                id: type,
                label: titleCase(type),
              }))}
              defaultValue={record?.relationshipType ?? "RESELLER"}
            />
          </FieldGroup>
          <FieldGroup title="Commercial details">
            <Field
              label="Seller SKU"
              name="sellerSku"
              defaultValue={record?.sellerSku}
            />
            <ToggleField
              name="preferred"
              label="Preferred seller"
              defaultChecked={record?.preferred ?? false}
            />
            <ToggleField defaultChecked={record?.active ?? true} />
          </FieldGroup>
        </EditorForm>
      ) : null}

      {editor.kind === "agreement" ? (
        <EditorForm
          key={`agreement-${record?.id ?? "new"}`}
          title={
            record ? "Edit purchasing agreement" : "Create purchasing agreement"
          }
          action={saveAgreementAction}
          submitLabel="Save agreement"
          onCancel={onCancel}
        >
          <input name="id" type="hidden" value={record?.id ?? ""} />
          <FieldGroup title="Relationship">
            <NativeSelect
              label="Purchasing vehicle"
              name="purchasingVehicleId"
              options={vehicleOptions}
              defaultValue={
                record?.purchasingVehicleId ?? vehicleOptions[0]?.id
              }
            />
            <NativeSelect
              label="Seller company"
              name="sellerCompanyId"
              options={sellerOptions}
              defaultValue={record?.sellerCompanyId ?? sellerOptions[0]?.id}
            />
          </FieldGroup>
          <FieldGroup title="Agreement">
            <Field
              label="Agreement number"
              name="sellerAwardNumber"
              defaultValue={record?.sellerAwardNumber}
            />
            <Field label="Title" name="title" defaultValue={record?.title} />
            <Field
              label="Start date"
              name="startsOn"
              type="date"
              defaultValue={dateOnly(record?.startsOn)}
            />
            <Field
              label="End date"
              name="endsOn"
              type="date"
              defaultValue={dateOnly(record?.endsOn)}
            />
            <CheckChipGroup
              label="Eligible products"
              name="productIds"
              options={productOptions}
              defaultValues={
                record?.productEligibility
                  .map((item: any) => item.productId)
                  .filter(Boolean) ?? []
              }
              searchable
            />
          </FieldGroup>
          <FieldGroup title="Notes">
            <TextBlock
              label="Notes"
              name="notesText"
              defaultValue={record?.notesText}
            />
            <ToggleField defaultChecked={record?.active ?? true} />
          </FieldGroup>
        </EditorForm>
      ) : null}
    </CatalogPanel>
  );
}

function editorContext(
  editor: EditorState,
  selectedVendor?: any,
  selectedProduct?: any,
  modules: any[] = []
) {
  const record = editor.record;
  const defaults = editor.defaults ?? {};

  if (editor.kind === "company") {
    return "Company master data. Vendor and reseller roles are reusable across catalog, budget, and renewal workflows.";
  }

  if (editor.kind === "product") {
    return `${selectedVendor?.name ?? "Vendor"} > Product or service`;
  }

  if (editor.kind === "module") {
    return `${selectedVendor?.name ?? "Vendor"} > ${
      selectedProduct?.name ?? "Product"
    } > Module`;
  }

  if (editor.kind === "feature") {
    const selectedFeatureModule = modules.find(
      (item) => item.id === (record?.moduleId ?? defaults.moduleId)
    );
    return `${selectedVendor?.name ?? "Vendor"} > ${
      selectedProduct?.name ?? "Product"
    }${selectedFeatureModule ? ` > ${selectedFeatureModule.name}` : ""} > Feature`;
  }

  if (editor.kind === "seller") {
    return "Optional purchasing eligibility. Budget reseller selection does not depend on this record.";
  }

  return "Supporting catalog administration.";
}

function AdminDataPanel({
  section,
  setSection,
  data,
  openEditor,
}: {
  section: "capabilities" | "eligibility" | "vehicles" | "agreements";
  setSection: (
    section: "capabilities" | "eligibility" | "vehicles" | "agreements"
  ) => void;
  data: CatalogData;
  productOptions: Option[];
  sellerOptions: Option[];
  vehicleOptions: Option[];
  capabilityOptions: Option[];
  openEditor: (editor: EditorState) => void;
}) {
  const sections = [
    { id: "capabilities" as const, label: "Capabilities" },
    { id: "eligibility" as const, label: "Purchasing Eligibility" },
    { id: "vehicles" as const, label: "Purchasing Vehicles" },
    { id: "agreements" as const, label: "Purchasing Agreements" },
  ];

  return (
    <CatalogPanel
      title="Admin Data"
      action={
        <div className="flex flex-wrap gap-2">
          {sections.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={section === item.id ? "default" : "outline"}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      }
    >
      {section === "capabilities" ? (
        <AdminTable
          rows={data.capabilities}
          heads={[
            "Capability",
            "Products",
            "Modules",
            "Features",
            "Status",
            "Actions",
          ]}
          empty="No capabilities yet."
          createLabel="New capability"
          onCreate={() => openEditor({ kind: "capability" })}
          renderRow={(capability) => [
            capability.name,
            capability._count.products,
            capability._count.modules,
            capability._count.features,
            <ActiveBadge key="active" active={capability.active} />,
            <RowActions
              key="actions"
              edit={() =>
                openEditor({ kind: "capability", record: capability })
              }
              kind="capability"
              id={capability.id}
              active={capability.active}
            />,
          ]}
        />
      ) : null}

      {section === "eligibility" ? (
        <AdminTable
          rows={data.sellers}
          heads={[
            "Product",
            "Seller",
            "Type",
            "Preferred",
            "Status",
            "Actions",
          ]}
          empty="No optional purchasing eligibility yet."
          createLabel="New eligibility"
          onCreate={() => openEditor({ kind: "seller" })}
          renderRow={(seller) => [
            seller.product.name,
            seller.seller.name,
            titleCase(seller.relationshipType),
            seller.preferred ? "Yes" : "No",
            <ActiveBadge key="active" active={seller.active} />,
            <RowActions
              key="actions"
              edit={() => openEditor({ kind: "seller", record: seller })}
              kind="seller"
              id={seller.id}
              active={seller.active}
            />,
          ]}
        />
      ) : null}

      {section === "vehicles" ? (
        <AdminTable
          rows={data.vehicles}
          heads={[
            "Vehicle",
            "Issuer",
            "Agreement Count",
            "Expires",
            "Status",
            "Actions",
          ]}
          empty="No purchasing vehicles yet."
          createLabel="New vehicle"
          onCreate={() => openEditor({ kind: "vehicle" })}
          renderRow={(vehicle) => [
            vehicle.name,
            vehicle.issuingOrganization,
            vehicle._count.sellerEligibility,
            dateOnly(vehicle.endsOn) || "No end date",
            <ActiveBadge key="active" active={vehicle.active} />,
            <RowActions
              key="actions"
              edit={() => openEditor({ kind: "vehicle", record: vehicle })}
              kind="vehicle"
              id={vehicle.id}
              active={vehicle.active}
            />,
          ]}
        />
      ) : null}

      {section === "agreements" ? (
        <AdminTable
          rows={data.agreements}
          heads={[
            "Agreement",
            "Vehicle",
            "Seller",
            "Eligible Products",
            "Expires",
            "Status",
            "Actions",
          ]}
          empty="No purchasing agreements yet."
          createLabel="New agreement"
          onCreate={() => openEditor({ kind: "agreement" })}
          renderRow={(agreement) => [
            agreement.title ?? agreement.sellerAwardNumber ?? "Agreement",
            agreement.purchasingVehicle.name,
            agreement.seller.name,
            agreement.productEligibility
              .map((item: any) => item.product?.name)
              .filter(Boolean)
              .join(", "),
            dateOnly(agreement.endsOn) || "No end date",
            <ActiveBadge key="active" active={agreement.active} />,
            <RowActions
              key="actions"
              edit={() => openEditor({ kind: "agreement", record: agreement })}
              kind="agreement"
              id={agreement.id}
              active={agreement.active}
            />,
          ]}
        />
      ) : null}
    </CatalogPanel>
  );
}

function AdminTable({
  rows,
  heads,
  renderRow,
  empty,
  createLabel,
  onCreate,
}: {
  rows: any[];
  heads: string[];
  renderRow: (row: any) => ReactNode[];
  empty: string;
  createLabel: string;
  onCreate: () => void;
}) {
  return (
    <div className="grid gap-3">
      <div>
        <Button size="sm" onClick={onCreate}>
          <Plus data-icon="inline-start" />
          {createLabel}
        </Button>
      </div>
      {rows.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              {heads.map((head) => (
                <TableHead key={head}>{head}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {renderRow(row).map((cell, index) => (
                  <TableCell key={index}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState>{empty}</EmptyState>
      )}
    </div>
  );
}

function CatalogPanel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle aria-level={2} role="heading" className="text-base">
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="grid gap-4">{children}</CardContent>
    </Card>
  );
}

function EditorForm({
  title,
  action,
  submitLabel,
  onCancel,
  children,
}: {
  title: string;
  action: CatalogAction;
  submitLabel: string;
  onCancel: () => void;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    emptyActionResult
  );

  return (
    <form action={formAction} className="grid gap-4">
      <h3 className="sr-only">{title}</h3>
      {children}
      <div className="sticky bottom-0 -mx-1 grid gap-2 border-t border-border/80 bg-card/95 px-1 py-3">
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <MutationError result={state} />
    </form>
  );
}

function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="grid gap-3 rounded-lg border border-border/80 bg-secondary/20 p-3">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function NativeSelect({
  label,
  name,
  options,
  defaultValue = "",
  includeNone = false,
  onChange,
}: {
  label: string;
  name: string;
  options: Option[];
  defaultValue?: string;
  includeNone?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-300">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-9 rounded-lg border border-border/80 bg-secondary/45 px-3 text-sm text-slate-100"
      >
        {includeNone ? <option value="none">None</option> : null}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
            {option.active === false ? " (inactive)" : ""}
            {option.hint ? ` - ${option.hint}` : ""}
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
  searchable = false,
}: {
  label: string;
  name: string;
  options: Option[];
  defaultValues?: string[];
  searchable?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-300">{label}</span>
        <span className="text-[0.68rem] text-muted-foreground">
          Select all that apply
        </span>
      </div>
      {searchable ? (
        <Input
          aria-label={`Search ${label.toLowerCase()}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${label.toLowerCase()}...`}
          className="h-8 border-border/80 bg-secondary/45 text-sm"
        />
      ) : null}
      <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto rounded-lg border border-border/70 bg-background/20 p-2">
        {filteredOptions.map((option) => (
          <label key={option.id} className="group cursor-pointer">
            <input
              name={name}
              type="checkbox"
              value={option.id}
              defaultChecked={defaultValues.includes(option.id)}
              className="peer sr-only"
            />
            <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border/80 px-3 py-1 text-xs text-slate-200 transition peer-checked:border-cyan-300 peer-checked:bg-cyan-400 peer-checked:text-slate-950 group-hover:border-cyan-300/70">
              <Check className="hidden size-3 peer-checked:block" />
              {option.label}
            </span>
          </label>
        ))}
        {!filteredOptions.length ? (
          <span className="text-xs text-muted-foreground">No matches.</span>
        ) : null}
      </div>
    </div>
  );
}

function CapabilityBadges({
  rows,
  compact = false,
}: {
  rows: { capability: { id: string; name: string } }[];
  compact?: boolean;
}) {
  if (!rows.length) return null;

  return (
    <div className={cn("mt-3 flex flex-wrap gap-1", compact && "mt-2")}>
      {rows.slice(0, compact ? 3 : 5).map((row) => (
        <Badge key={row.capability.id} variant="secondary">
          <ShieldCheck data-icon="inline-start" />
          {row.capability.name}
        </Badge>
      ))}
      {rows.length > (compact ? 3 : 5) ? (
        <Badge variant="outline">+{rows.length - (compact ? 3 : 5)}</Badge>
      ) : null}
    </div>
  );
}

function RowActions({
  edit,
  kind,
  id,
  active,
}: {
  edit: () => void;
  kind: string;
  id: string;
  active: boolean;
}) {
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={edit}>
        Edit
      </Button>
      <DeactivateForm kind={kind} id={id} active={active} />
    </div>
  );
}

function DeactivateForm({
  kind,
  id,
  active,
}: {
  kind: string;
  id: string;
  active: boolean;
}) {
  return (
    <form action={setActiveAction}>
      <input name="kind" type="hidden" value={kind} />
      <input name="id" type="hidden" value={id} />
      <input name="active" type="hidden" value={String(!active)} />
      <Button size="sm" variant="outline" type="submit">
        {active ? "Deactivate" : "Activate"}
      </Button>
    </form>
  );
}
