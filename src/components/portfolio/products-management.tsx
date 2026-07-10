"use client";

import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { WorkspaceShell } from "@/components/app/workspace-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  NumberField,
  SelectField,
  SummaryCard,
  TextAreaField,
  TextField,
  ValueBadge,
} from "@/components/portfolio/portfolio-ui";
import {
  calculateProductSummary,
  formatCurrency,
  getRedundancyCandidates,
  isUnderusedModule,
} from "@/lib/portfolio-analytics";
import {
  budgetItems,
  contracts,
  portfolioResellers,
  portfolioVendors,
  productModules as initialProductModules,
  products as initialProducts,
} from "@/lib/portfolio-data";
import type {
  AdoptionLevel,
  CapabilityCategory,
  DeploymentStatus,
  PriorityLevel,
  Product,
  ProductCategory,
  ProductModule,
} from "@/types/portfolio";
import {
  adoptionLevels,
  capabilityCategories,
  deploymentStatuses,
  priorityLevels,
  productCategories,
} from "@/types/portfolio";

type SortKey =
  | "productName"
  | "vendorId"
  | "productCategory"
  | "capabilityCategory"
  | "deploymentStatus"
  | "strategicValue"
  | "criticality"
  | "annualCost"
  | "securityOwner";

const emptyProduct: Product = {
  id: "",
  vendorId: "rapid7",
  resellerId: undefined,
  productName: "",
  productCategory: "Security Operations",
  capabilityCategory: "SIEM",
  description: "",
  deploymentStatus: "Planned",
  businessOwner: "",
  technicalOwner: "",
  securityOwner: "",
  primaryUseCase: "",
  strategicValue: "Medium",
  criticality: "Medium",
  annualCost: 0,
  contractId: undefined,
  budgetItemId: undefined,
  notes: "",
};

const emptyModule: ProductModule = {
  id: "",
  productId: "",
  moduleName: "",
  description: "",
  capabilityModuleCategory: "Other",
  enabled: true,
  adoptionLevel: "Medium",
  licenseCount: 0,
  usedCount: 0,
  moduleCost: 0,
  owner: "",
  notes: "",
};

const vendorOptions = portfolioVendors.map((vendor) => ({
  value: vendor.id,
  label: vendor.name,
}));

const resellerOptions = portfolioResellers.map((reseller) => ({
  value: reseller.id,
  label: reseller.name,
}));

const contractOptions = [
  { value: "none", label: "None" },
  ...contracts.map((contract) => ({
    value: contract.id,
    label: contract.contractName,
  })),
];

const budgetOptions = [
  { value: "none", label: "None" },
  ...budgetItems.map((budgetItem) => ({
    value: budgetItem.id,
    label: budgetItem.productOrServiceName,
  })),
];

function vendorName(vendorId: string): string {
  return (
    portfolioVendors.find((vendor) => vendor.id === vendorId)?.name ?? vendorId
  );
}

function resellerName(resellerId?: string): string {
  if (!resellerId || resellerId === "direct") {
    return "Direct";
  }

  return (
    portfolioResellers.find((reseller) => reseller.id === resellerId)?.name ??
    resellerId
  );
}

function contractName(contractId?: string): string {
  if (!contractId) {
    return "None";
  }

  return (
    contracts.find((contract) => contract.id === contractId)?.contractName ??
    contractId
  );
}

function budgetName(budgetItemId?: string): string {
  if (!budgetItemId) {
    return "None";
  }

  return (
    budgetItems.find((budgetItem) => budgetItem.id === budgetItemId)
      ?.productOrServiceName ?? budgetItemId
  );
}

function compareProducts(a: Product, b: Product, sortKey: SortKey) {
  const aValue = a[sortKey];
  const bValue = b[sortKey];

  if (typeof aValue === "number" && typeof bValue === "number") {
    return aValue - bValue;
  }

  return String(aValue).localeCompare(String(bValue));
}

export function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [modules, setModules] = useState<ProductModule[]>(
    initialProductModules
  );
  const [draft, setDraft] = useState<Product>({
    ...emptyProduct,
    id: "product-new",
  });
  const [moduleDraft, setModuleDraft] = useState<ProductModule>({
    ...emptyModule,
    id: "module-new",
    productId: initialProducts[0].id,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState(
    initialProducts[0].id
  );
  const [sortKey, setSortKey] = useState<SortKey>("annualCost");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [vendorFilter, setVendorFilter] = useState<string | "All">("All");
  const [resellerFilter, setResellerFilter] = useState<string | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "All">(
    "All"
  );
  const [capabilityFilter, setCapabilityFilter] = useState<
    CapabilityCategory | "All"
  >("All");
  const [statusFilter, setStatusFilter] = useState<DeploymentStatus | "All">(
    "All"
  );
  const [strategicValueFilter, setStrategicValueFilter] = useState<
    PriorityLevel | "All"
  >("All");
  const [criticalityFilter, setCriticalityFilter] = useState<
    PriorityLevel | "All"
  >("All");
  const [ownerFilter, setOwnerFilter] = useState<string | "All">("All");

  const owners = useMemo(
    () => [...new Set(products.map((product) => product.securityOwner))],
    [products]
  );
  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product.id,
        label: product.productName,
      })),
    [products]
  );

  const filteredProducts = useMemo(() => {
    return [...products]
      .filter(
        (product) => vendorFilter === "All" || product.vendorId === vendorFilter
      )
      .filter((product) => {
        if (resellerFilter === "All") {
          return true;
        }

        return (product.resellerId ?? "direct") === resellerFilter;
      })
      .filter(
        (product) =>
          categoryFilter === "All" || product.productCategory === categoryFilter
      )
      .filter(
        (product) =>
          capabilityFilter === "All" ||
          product.capabilityCategory === capabilityFilter
      )
      .filter(
        (product) =>
          statusFilter === "All" || product.deploymentStatus === statusFilter
      )
      .filter(
        (product) =>
          strategicValueFilter === "All" ||
          product.strategicValue === strategicValueFilter
      )
      .filter(
        (product) =>
          criticalityFilter === "All" ||
          product.criticality === criticalityFilter
      )
      .filter(
        (product) =>
          ownerFilter === "All" || product.securityOwner === ownerFilter
      )
      .sort((a, b) => {
        const sorted = compareProducts(a, b, sortKey);
        return sortDirection === "asc" ? sorted : -sorted;
      });
  }, [
    capabilityFilter,
    categoryFilter,
    criticalityFilter,
    ownerFilter,
    products,
    resellerFilter,
    sortDirection,
    sortKey,
    statusFilter,
    strategicValueFilter,
    vendorFilter,
  ]);

  const summary = calculateProductSummary(filteredProducts, modules);
  const selectedProduct =
    products.find((product) => product.id === selectedProductId) ??
    filteredProducts[0] ??
    products[0];
  const selectedModules = modules.filter(
    (module) => module.productId === selectedProduct?.id
  );
  const redundancyCandidates = getRedundancyCandidates(products);
  const selectedRedundancy = redundancyCandidates.find(
    (candidate) => candidate.product.id === selectedProduct?.id
  );

  function toggleSort(nextSortKey: SortKey) {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection("asc");
  }

  function saveProduct() {
    const normalized: Product = {
      ...draft,
      id: editingId ?? `product-${Date.now()}`,
      resellerId: draft.resellerId === "direct" ? undefined : draft.resellerId,
      contractId: draft.contractId === "none" ? undefined : draft.contractId,
      budgetItemId:
        draft.budgetItemId === "none" ? undefined : draft.budgetItemId,
    };

    setProducts((current) =>
      editingId
        ? current.map((product) =>
            product.id === editingId ? normalized : product
          )
        : [normalized, ...current]
    );
    setSelectedProductId(normalized.id);
    setEditingId(null);
    setDraft({ ...emptyProduct, id: "product-new" });
  }

  function editProduct(product: Product) {
    setEditingId(product.id);
    setDraft({
      ...product,
      resellerId: product.resellerId ?? "direct",
      contractId: product.contractId ?? "none",
      budgetItemId: product.budgetItemId ?? "none",
    });
  }

  function deleteProduct(productId: string) {
    setProducts((current) =>
      current.filter((product) => product.id !== productId)
    );
    setModules((current) =>
      current.filter((module) => module.productId !== productId)
    );
    if (selectedProductId === productId) {
      setSelectedProductId(
        products.find((product) => product.id !== productId)?.id ?? ""
      );
    }
  }

  function saveModule() {
    const normalized: ProductModule = {
      ...moduleDraft,
      id: editingModuleId ?? `module-${Date.now()}`,
    };

    setModules((current) =>
      editingModuleId
        ? current.map((module) =>
            module.id === editingModuleId ? normalized : module
          )
        : [normalized, ...current]
    );
    setEditingModuleId(null);
    setModuleDraft({
      ...emptyModule,
      id: "module-new",
      productId: selectedProduct?.id ?? products[0].id,
    });
  }

  function editModule(module: ProductModule) {
    setEditingModuleId(module.id);
    setModuleDraft(module);
  }

  function deleteModule(moduleId: string) {
    setModules((current) => current.filter((module) => module.id !== moduleId));
  }

  return (
    <WorkspaceShell
      title="Products & Modules"
      description="Manage the cybersecurity product portfolio, capability categories, modules, cost, utilization, and redundancy signals."
      actionLabel="New Product"
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <SummaryCard
          label="Total Products"
          value={String(summary.totalProducts)}
        />
        <SummaryCard
          label="Active Products"
          value={String(summary.activeProducts)}
        />
        <SummaryCard label="Under Review" value={String(summary.underReview)} />
        <SummaryCard label="Retiring" value={String(summary.retiring)} />
        <SummaryCard
          label="Annual Product Cost"
          value={formatCurrency(summary.totalAnnualCost)}
        />
        <SummaryCard
          label="Underused Modules"
          value={String(summary.underusedModules)}
        />
        <SummaryCard
          label="Redundancy Candidates"
          value={String(summary.redundancyCandidates)}
        />
      </section>

      <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle>{editingId ? "Edit Product" : "Create Product"}</CardTitle>
          <CardDescription>
            Product category is broad; capability category is the specific
            portfolio capability.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextField
            label="Product name"
            value={draft.productName}
            onChange={(productName) => setDraft({ ...draft, productName })}
          />
          <SelectField
            label="Vendor"
            value={draft.vendorId}
            options={vendorOptions}
            onChange={(vendorId) => setDraft({ ...draft, vendorId })}
          />
          <SelectField
            label="Reseller"
            value={draft.resellerId ?? "direct"}
            options={resellerOptions}
            onChange={(resellerId) => setDraft({ ...draft, resellerId })}
          />
          <SelectField
            label="Product category"
            value={draft.productCategory}
            options={productCategories}
            onChange={(productCategory) =>
              setDraft({
                ...draft,
                productCategory: productCategory as ProductCategory,
              })
            }
          />
          <SelectField
            label="Capability category"
            value={draft.capabilityCategory}
            options={capabilityCategories}
            onChange={(capabilityCategory) =>
              setDraft({
                ...draft,
                capabilityCategory: capabilityCategory as CapabilityCategory,
              })
            }
          />
          <SelectField
            label="Deployment status"
            value={draft.deploymentStatus}
            options={deploymentStatuses}
            onChange={(deploymentStatus) =>
              setDraft({
                ...draft,
                deploymentStatus: deploymentStatus as DeploymentStatus,
              })
            }
          />
          <SelectField
            label="Strategic value"
            value={draft.strategicValue}
            options={priorityLevels}
            onChange={(strategicValue) =>
              setDraft({
                ...draft,
                strategicValue: strategicValue as PriorityLevel,
              })
            }
          />
          <SelectField
            label="Criticality"
            value={draft.criticality}
            options={priorityLevels}
            onChange={(criticality) =>
              setDraft({ ...draft, criticality: criticality as PriorityLevel })
            }
          />
          <TextField
            label="Business owner"
            value={draft.businessOwner}
            onChange={(businessOwner) => setDraft({ ...draft, businessOwner })}
          />
          <TextField
            label="Technical owner"
            value={draft.technicalOwner}
            onChange={(technicalOwner) =>
              setDraft({ ...draft, technicalOwner })
            }
          />
          <TextField
            label="Security owner"
            value={draft.securityOwner}
            onChange={(securityOwner) => setDraft({ ...draft, securityOwner })}
          />
          <NumberField
            label="Annual cost"
            value={draft.annualCost}
            onChange={(annualCost) => setDraft({ ...draft, annualCost })}
          />
          <SelectField
            label="Contract association"
            value={draft.contractId ?? "none"}
            options={contractOptions}
            onChange={(contractId) => setDraft({ ...draft, contractId })}
          />
          <SelectField
            label="Budget association"
            value={draft.budgetItemId ?? "none"}
            options={budgetOptions}
            onChange={(budgetItemId) => setDraft({ ...draft, budgetItemId })}
          />
          <TextAreaField
            label="Description"
            value={draft.description}
            onChange={(description) => setDraft({ ...draft, description })}
          />
          <TextAreaField
            label="Primary use case"
            value={draft.primaryUseCase}
            onChange={(primaryUseCase) =>
              setDraft({ ...draft, primaryUseCase })
            }
          />
          <TextAreaField
            label="Notes"
            value={draft.notes}
            onChange={(notes) => setDraft({ ...draft, notes })}
          />
          <div className="flex items-end gap-2">
            <Button onClick={saveProduct}>
              {editingId ? "Save Changes" : "Create Product"}
            </Button>
            {editingId ? (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setDraft({ ...emptyProduct, id: "product-new" });
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle>Product Portfolio</CardTitle>
          <CardDescription>
            Filterable and sortable executive portfolio inventory.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-8">
            <SelectField
              label="Vendor"
              value={vendorFilter}
              options={vendorOptions}
              includeAll
              onChange={setVendorFilter}
            />
            <SelectField
              label="Reseller"
              value={resellerFilter}
              options={resellerOptions}
              includeAll
              onChange={setResellerFilter}
            />
            <SelectField
              label="Product category"
              value={categoryFilter}
              options={productCategories}
              includeAll
              onChange={setCategoryFilter}
            />
            <SelectField
              label="Capability"
              value={capabilityFilter}
              options={capabilityCategories}
              includeAll
              onChange={setCapabilityFilter}
            />
            <SelectField
              label="Deployment"
              value={statusFilter}
              options={deploymentStatuses}
              includeAll
              onChange={setStatusFilter}
            />
            <SelectField
              label="Strategic value"
              value={strategicValueFilter}
              options={priorityLevels}
              includeAll
              onChange={setStrategicValueFilter}
            />
            <SelectField
              label="Criticality"
              value={criticalityFilter}
              options={priorityLevels}
              includeAll
              onChange={setCriticalityFilter}
            />
            <SelectField
              label="Owner"
              value={ownerFilter}
              options={owners}
              includeAll
              onChange={setOwnerFilter}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                {[
                  ["productName", "Product"],
                  ["vendorId", "Vendor"],
                  ["productCategory", "Category"],
                  ["capabilityCategory", "Capability"],
                  ["deploymentStatus", "Status"],
                  ["strategicValue", "Value"],
                  ["criticality", "Criticality"],
                  ["annualCost", "Annual Cost"],
                ].map(([key, label]) => (
                  <TableHead key={key}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort(key as SortKey)}
                    >
                      <ArrowUpDown data-icon="inline-start" />
                      {label}
                    </Button>
                  </TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow
                  key={product.id}
                  className={
                    selectedProduct?.id === product.id
                      ? "bg-muted/40"
                      : undefined
                  }
                >
                  <TableCell>
                    <button
                      className="text-left font-medium text-cyan-200 hover:underline"
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      {product.productName}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{vendorName(product.vendorId)}</span>
                      <span className="text-xs text-muted-foreground">
                        {resellerName(product.resellerId)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ValueBadge value={product.productCategory} />
                  </TableCell>
                  <TableCell>
                    <ValueBadge value={product.capabilityCategory} />
                  </TableCell>
                  <TableCell>
                    <ValueBadge value={product.deploymentStatus} />
                  </TableCell>
                  <TableCell>
                    <ValueBadge value={product.strategicValue} />
                  </TableCell>
                  <TableCell>
                    <ValueBadge value={product.criticality} />
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(product.annualCost)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Edit ${product.productName}`}
                        onClick={() => editProduct(product)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        aria-label={`Delete ${product.productName}`}
                        onClick={() => deleteProduct(product.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedProduct ? (
        <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
            <CardHeader className="border-b border-border/70 pb-4">
              <CardTitle>{selectedProduct.productName}</CardTitle>
              <CardDescription>
                Detail view with associations, owners, modules, and notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Detail
                  label="Vendor"
                  value={vendorName(selectedProduct.vendorId)}
                />
                <Detail
                  label="Reseller"
                  value={resellerName(selectedProduct.resellerId)}
                />
                <Detail
                  label="Associated contract"
                  value={contractName(selectedProduct.contractId)}
                />
                <Detail
                  label="Associated budget item"
                  value={budgetName(selectedProduct.budgetItemId)}
                />
                <Detail
                  label="Annual cost"
                  value={formatCurrency(selectedProduct.annualCost)}
                />
                <Detail
                  label="Business owner"
                  value={selectedProduct.businessOwner}
                />
                <Detail
                  label="Technical owner"
                  value={selectedProduct.technicalOwner}
                />
                <Detail
                  label="Security owner"
                  value={selectedProduct.securityOwner}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Use case
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-100">
                  {selectedProduct.primaryUseCase}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Notes
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-100">
                  {selectedProduct.notes}
                </p>
              </div>
              {selectedRedundancy ? (
                <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3">
                  <p className="text-sm font-medium text-amber-200">
                    Potential redundancy signal
                  </p>
                  <p className="mt-1 text-xs leading-5 text-amber-100/80">
                    Overlaps with{" "}
                    {selectedRedundancy.overlaps
                      .map((product) => product.productName)
                      .join(", ")}
                    . Treat as a review prompt, not an automatic decision.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
            <CardHeader className="border-b border-border/70 pb-4">
              <CardTitle>Modules</CardTitle>
              <CardDescription>
                Add, edit, delete, and review module adoption for the selected
                product.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <TextField
                  label="Module name"
                  value={moduleDraft.moduleName}
                  onChange={(moduleName) =>
                    setModuleDraft({ ...moduleDraft, moduleName })
                  }
                />
                <SelectField
                  label="Parent product"
                  value={moduleDraft.productId || selectedProduct.id}
                  options={productOptions}
                  onChange={(productId) =>
                    setModuleDraft({ ...moduleDraft, productId })
                  }
                />
                <SelectField
                  label="Capability / module category"
                  value={moduleDraft.capabilityModuleCategory}
                  options={capabilityCategories}
                  onChange={(capabilityModuleCategory) =>
                    setModuleDraft({
                      ...moduleDraft,
                      capabilityModuleCategory:
                        capabilityModuleCategory as CapabilityCategory,
                    })
                  }
                />
                <SelectField
                  label="Adoption level"
                  value={moduleDraft.adoptionLevel}
                  options={adoptionLevels}
                  onChange={(adoptionLevel) =>
                    setModuleDraft({
                      ...moduleDraft,
                      adoptionLevel: adoptionLevel as AdoptionLevel,
                    })
                  }
                />
                <NumberField
                  label="License count"
                  value={moduleDraft.licenseCount}
                  onChange={(licenseCount) =>
                    setModuleDraft({ ...moduleDraft, licenseCount })
                  }
                />
                <NumberField
                  label="Used count"
                  value={moduleDraft.usedCount}
                  onChange={(usedCount) =>
                    setModuleDraft({ ...moduleDraft, usedCount })
                  }
                />
                <NumberField
                  label="Module cost"
                  value={moduleDraft.moduleCost}
                  onChange={(moduleCost) =>
                    setModuleDraft({ ...moduleDraft, moduleCost })
                  }
                />
                <TextField
                  label="Owner"
                  value={moduleDraft.owner}
                  onChange={(owner) =>
                    setModuleDraft({ ...moduleDraft, owner })
                  }
                />
                <label className="flex items-center gap-2 text-sm text-slate-200">
                  <input
                    checked={moduleDraft.enabled}
                    type="checkbox"
                    onChange={(event) =>
                      setModuleDraft({
                        ...moduleDraft,
                        enabled: event.target.checked,
                      })
                    }
                  />
                  Enabled
                </label>
                <TextAreaField
                  label="Description"
                  value={moduleDraft.description}
                  onChange={(description) =>
                    setModuleDraft({ ...moduleDraft, description })
                  }
                />
                <TextAreaField
                  label="Notes"
                  value={moduleDraft.notes}
                  onChange={(notes) =>
                    setModuleDraft({ ...moduleDraft, notes })
                  }
                />
                <div className="flex items-end gap-2">
                  <Button onClick={saveModule}>
                    {editingModuleId ? "Save Module" : "Add Module"}
                  </Button>
                  {editingModuleId ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingModuleId(null);
                        setModuleDraft({
                          ...emptyModule,
                          id: "module-new",
                          productId: selectedProduct.id,
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Capability</TableHead>
                    <TableHead>Adoption</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Signal</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedModules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell>{module.moduleName}</TableCell>
                      <TableCell>
                        <ValueBadge value={module.capabilityModuleCategory} />
                      </TableCell>
                      <TableCell>
                        <ValueBadge value={module.adoptionLevel} />
                      </TableCell>
                      <TableCell className="font-mono">
                        {module.usedCount} / {module.licenseCount}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(module.moduleCost)}
                      </TableCell>
                      <TableCell>
                        <ValueBadge
                          value={
                            isUnderusedModule(module)
                              ? "Under Review"
                              : "Active"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label={`Edit ${module.moduleName}`}
                            onClick={() => editModule(module)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon-sm"
                            aria-label={`Delete ${module.moduleName}`}
                            onClick={() => deleteModule(module.id)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </WorkspaceShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-slate-100">{value}</p>
    </div>
  );
}
