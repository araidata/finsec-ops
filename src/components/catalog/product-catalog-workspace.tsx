"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo, useState } from "react";

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
  FormShell,
  MultiSelect,
  SelectBox,
  SubmitButton,
  TextBlock,
  ToggleField,
  type Option,
} from "@/components/catalog/relational-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

const tabs = [
  "Companies",
  "Products and Services",
  "Modules",
  "Features",
  "Capabilities",
  "Seller Relationships",
  "Purchasing Vehicles",
  "Purchasing Agreements",
] as const;

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

function ids(rows: { capability: { id: string } }[]) {
  return rows.map((row) => row.capability.id);
}

function dateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function roleNames(company: any) {
  return company.roles.map((role: any) => titleCase(role.role)).join(", ");
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

export function ProductCatalogWorkspace({ data }: { data: CatalogData }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Companies");
  const [editing, setEditing] = useState<any>({});
  const [search, setSearch] = useState("");
  const [selectedFeatureProduct, setSelectedFeatureProduct] = useState(
    data.products[0]?.id ?? ""
  );

  const vendorOptions = data.companies
    .filter((company) =>
      company.roles.some((role: any) => role.role === "VENDOR")
    )
    .map((company) => ({
      id: company.id,
      label: company.name,
      active: company.active,
    }));
  const sellerOptions = data.companies
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
  const productOptions: Option[] = data.products.map((product) => ({
    id: product.id,
    label: product.name,
    active: product.active,
    hint: product.vendorCompany?.name ?? "Legacy vendor",
  }));
  const moduleOptions: Option[] = data.modules.map((module) => ({
    id: module.id,
    label: module.name,
    active: module.active,
    parentId: module.productId,
    hint: module.product?.name,
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

  const filteredCompanies = useMemo(
    () =>
      data.companies.filter((company) =>
        company.name.toLowerCase().includes(search.toLowerCase())
      ),
    [data.companies, search]
  );

  const currentFeature = editing.feature;
  const featureProductId =
    currentFeature?.productId ?? selectedFeatureProduct ?? data.products[0]?.id;
  const featureModuleOptions = moduleOptions.filter(
    (option) => option.parentId === featureProductId
  );

  return (
    <WorkspaceShell
      title="Product Catalog"
      description="Database-backed catalog, company, capability, seller, and purchasing vehicle management."
      actionLabel="New Catalog Item"
    >
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Button
            key={item}
            variant={tab === item ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(item)}
          >
            {item}
          </Button>
        ))}
      </div>

      {tab === "Companies" ? (
        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <FormShell
            title={editing.company ? "Edit Company" : "Create Company"}
            action={saveCompanyAction}
          >
            {(_state, pending) => (
              <>
                <input
                  name="id"
                  type="hidden"
                  value={editing.company?.id ?? ""}
                />
                <Field
                  label="Company name"
                  name="name"
                  defaultValue={editing.company?.name}
                />
                <Field
                  label="Legal name"
                  name="legalName"
                  defaultValue={editing.company?.legalName}
                />
                <Field
                  label="Website"
                  name="website"
                  defaultValue={editing.company?.website}
                />
                <Field
                  label="Contact email"
                  name="contactEmail"
                  defaultValue={editing.company?.contactEmail}
                />
                <MultiSelect
                  label="Roles"
                  name="roles"
                  options={optionSets.companyRoles.map((role) => ({
                    id: role,
                    label: titleCase(role),
                  }))}
                  defaultValues={
                    editing.company?.roles.map((role: any) => role.role) ?? []
                  }
                />
                <ToggleField defaultChecked={editing.company?.active ?? true} />
                <SubmitButton pending={pending}>Save Company</SubmitButton>
              </>
            )}
          </FormShell>
          <CatalogCard title="Companies">
            <Input
              aria-label="Search companies"
              value={search}
              placeholder="Search companies..."
              onChange={(event) => setSearch(event.target.value)}
              className="border-border/80 bg-secondary/45"
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>{roleNames(company)}</TableCell>
                    <TableCell>
                      <ActiveBadge active={company.active} />
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing({ company })}
                      >
                        Edit
                      </Button>
                      <DeactivateForm
                        kind="company"
                        id={company.id}
                        active={company.active}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CatalogCard>
        </section>
      ) : null}

      {tab === "Products and Services" ? (
        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <FormShell
            title={
              editing.product
                ? "Edit Product or Service"
                : "Create Product or Service"
            }
            action={saveProductAction}
          >
            {(_state, pending) => (
              <>
                <input
                  name="id"
                  type="hidden"
                  value={editing.product?.id ?? ""}
                />
                <SelectBox
                  label="Vendor"
                  name="vendorCompanyId"
                  options={vendorOptions}
                  defaultValue={
                    editing.product?.vendorCompanyId ?? vendorOptions[0]?.id
                  }
                />
                <Field
                  label="Name"
                  name="name"
                  defaultValue={editing.product?.name}
                />
                <SelectBox
                  label="Offering type"
                  name="offeringType"
                  options={optionSets.productOfferingTypes.map((type) => ({
                    id: type,
                    label: titleCase(type),
                  }))}
                  defaultValue={editing.product?.offeringType ?? "SAAS"}
                />
                <SelectBox
                  label="Product category"
                  name="productCategory"
                  options={optionSets.productCategories.map((category) => ({
                    id: category,
                    label: titleCase(category),
                  }))}
                  defaultValue={editing.product?.productCategory ?? "OTHER"}
                />
                <MultiSelect
                  label="Capabilities"
                  name="capabilityIds"
                  options={capabilityOptions}
                  defaultValues={ids(editing.product?.capabilities ?? [])}
                />
                <TextBlock
                  label="Description"
                  name="description"
                  defaultValue={editing.product?.description}
                />
                <ToggleField defaultChecked={editing.product?.active ?? true} />
                <SubmitButton pending={pending}>Save Product</SubmitButton>
              </>
            )}
          </FormShell>
          <CatalogCard title="Products and Services">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capabilities</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.vendorCompany?.name}</TableCell>
                    <TableCell>{titleCase(product.offeringType)}</TableCell>
                    <TableCell>
                      {product.capabilities
                        .map((capability: any) => capability.capability.name)
                        .join(", ")}
                    </TableCell>
                    <TableCell>
                      <ActiveBadge active={product.active} />
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing({ product })}
                      >
                        Edit
                      </Button>
                      <DeactivateForm
                        kind="product"
                        id={product.id}
                        active={product.active}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CatalogCard>
        </section>
      ) : null}

      {tab === "Modules" ? (
        <SectionFormTable
          title="Modules"
          form={
            <FormShell
              title={editing.module ? "Edit Module" : "Create Module"}
              action={saveModuleAction}
            >
              {(_state, pending) => (
                <>
                  <input
                    name="id"
                    type="hidden"
                    value={editing.module?.id ?? ""}
                  />
                  <SelectBox
                    label="Parent product"
                    name="productId"
                    options={productOptions}
                    defaultValue={
                      editing.module?.productId ?? productOptions[0]?.id
                    }
                  />
                  <Field
                    label="Module name"
                    name="name"
                    defaultValue={editing.module?.name}
                  />
                  <MultiSelect
                    label="Capabilities"
                    name="capabilityIds"
                    options={capabilityOptions}
                    defaultValues={ids(editing.module?.capabilities ?? [])}
                  />
                  <TextBlock
                    label="Description"
                    name="description"
                    defaultValue={editing.module?.description}
                  />
                  <ToggleField
                    defaultChecked={editing.module?.active ?? true}
                  />
                  <SubmitButton pending={pending}>Save Module</SubmitButton>
                </>
              )}
            </FormShell>
          }
          rows={data.modules}
          renderRow={(module) => [
            module.name,
            module.product?.name,
            module.capabilities
              .map((capability: any) => capability.capability.name)
              .join(", "),
            <ActiveBadge key="active" active={module.active} />,
            <RowActions
              key="actions"
              edit={() => setEditing({ module })}
              kind="module"
              id={module.id}
              active={module.active}
            />,
          ]}
          heads={["Module", "Product", "Capabilities", "Status", "Actions"]}
        />
      ) : null}

      {tab === "Features" ? (
        <SectionFormTable
          title="Features"
          form={
            <FormShell
              title={editing.feature ? "Edit Feature" : "Create Feature"}
              action={saveFeatureAction}
            >
              {(_state, pending) => (
                <>
                  <input
                    name="id"
                    type="hidden"
                    value={editing.feature?.id ?? ""}
                  />
                  <SelectBox
                    label="Product"
                    name="productId"
                    options={productOptions}
                    defaultValue={featureProductId}
                    onChange={setSelectedFeatureProduct}
                  />
                  <SelectBox
                    label="Module"
                    name="moduleId"
                    options={featureModuleOptions}
                    defaultValue={editing.feature?.moduleId ?? "none"}
                    includeNone
                  />
                  <Field
                    label="Feature name"
                    name="name"
                    defaultValue={editing.feature?.name}
                  />
                  <MultiSelect
                    label="Capabilities"
                    name="capabilityIds"
                    options={capabilityOptions}
                    defaultValues={ids(editing.feature?.capabilities ?? [])}
                  />
                  <TextBlock
                    label="Description"
                    name="description"
                    defaultValue={editing.feature?.description}
                  />
                  <ToggleField
                    defaultChecked={editing.feature?.active ?? true}
                  />
                  <SubmitButton pending={pending}>Save Feature</SubmitButton>
                </>
              )}
            </FormShell>
          }
          rows={data.features}
          heads={[
            "Feature",
            "Product",
            "Module",
            "Capabilities",
            "Status",
            "Actions",
          ]}
          renderRow={(feature) => [
            feature.name,
            feature.product?.name,
            feature.module?.name ?? "Product level",
            feature.capabilities
              .map((capability: any) => capability.capability.name)
              .join(", "),
            <ActiveBadge key="active" active={feature.active} />,
            <RowActions
              key="actions"
              edit={() => setEditing({ feature })}
              kind="feature"
              id={feature.id}
              active={feature.active}
            />,
          ]}
        />
      ) : null}

      {tab === "Capabilities" ? (
        <SectionFormTable
          title="Capabilities"
          form={
            <FormShell
              title={
                editing.capability ? "Edit Capability" : "Create Capability"
              }
              action={saveCapabilityAction}
            >
              {(_state, pending) => (
                <>
                  <input
                    name="id"
                    type="hidden"
                    value={editing.capability?.id ?? ""}
                  />
                  <Field
                    label="Name"
                    name="name"
                    defaultValue={editing.capability?.name}
                  />
                  <TextBlock
                    label="Description"
                    name="description"
                    defaultValue={editing.capability?.description}
                  />
                  <ToggleField
                    defaultChecked={editing.capability?.active ?? true}
                  />
                  <SubmitButton pending={pending}>Save Capability</SubmitButton>
                </>
              )}
            </FormShell>
          }
          rows={data.capabilities}
          heads={[
            "Capability",
            "Product Count",
            "Module Count",
            "Feature Count",
            "Status",
            "Actions",
          ]}
          renderRow={(capability) => [
            capability.name,
            capability._count.products,
            capability._count.modules,
            capability._count.features,
            <ActiveBadge key="active" active={capability.active} />,
            <RowActions
              key="actions"
              edit={() => setEditing({ capability })}
              kind="capability"
              id={capability.id}
              active={capability.active}
            />,
          ]}
        />
      ) : null}

      {tab === "Seller Relationships" ? (
        <SectionFormTable
          title="Seller Relationships"
          form={
            <FormShell
              title={
                editing.seller
                  ? "Edit Seller Relationship"
                  : "Create Seller Relationship"
              }
              action={saveSellerAction}
            >
              {(_state, pending) => (
                <>
                  <input
                    name="id"
                    type="hidden"
                    value={editing.seller?.id ?? ""}
                  />
                  <SelectBox
                    label="Product"
                    name="productId"
                    options={productOptions}
                    defaultValue={
                      editing.seller?.productId ?? productOptions[0]?.id
                    }
                  />
                  <SelectBox
                    label="Seller company"
                    name="sellerCompanyId"
                    options={sellerOptions}
                    defaultValue={
                      editing.seller?.sellerCompanyId ?? sellerOptions[0]?.id
                    }
                  />
                  <SelectBox
                    label="Relationship type"
                    name="relationshipType"
                    options={optionSets.sellerRelationshipTypes.map((type) => ({
                      id: type,
                      label: titleCase(type),
                    }))}
                    defaultValue={
                      editing.seller?.relationshipType ?? "RESELLER"
                    }
                  />
                  <Field
                    label="Seller SKU"
                    name="sellerSku"
                    defaultValue={editing.seller?.sellerSku}
                  />
                  <ToggleField
                    name="preferred"
                    label="Preferred seller"
                    defaultChecked={editing.seller?.preferred ?? false}
                  />
                  <ToggleField
                    defaultChecked={editing.seller?.active ?? true}
                  />
                  <SubmitButton pending={pending}>
                    Save Relationship
                  </SubmitButton>
                </>
              )}
            </FormShell>
          }
          rows={data.sellers}
          heads={[
            "Product",
            "Seller",
            "Type",
            "Preferred",
            "Status",
            "Actions",
          ]}
          renderRow={(seller) => [
            seller.product.name,
            seller.seller.name,
            titleCase(seller.relationshipType),
            seller.preferred ? "Yes" : "No",
            <ActiveBadge key="active" active={seller.active} />,
            <RowActions
              key="actions"
              edit={() => setEditing({ seller })}
              kind="seller"
              id={seller.id}
              active={seller.active}
            />,
          ]}
        />
      ) : null}

      {tab === "Purchasing Vehicles" ? (
        <SectionFormTable
          title="Purchasing Vehicles"
          form={
            <FormShell
              title={
                editing.vehicle
                  ? "Edit Purchasing Vehicle"
                  : "Create Purchasing Vehicle"
              }
              action={saveVehicleAction}
            >
              {(_state, pending) => (
                <>
                  <input
                    name="id"
                    type="hidden"
                    value={editing.vehicle?.id ?? ""}
                  />
                  <Field
                    label="Name"
                    name="name"
                    defaultValue={editing.vehicle?.name}
                  />
                  <Field
                    label="Contract number"
                    name="contractNumber"
                    defaultValue={editing.vehicle?.contractNumber}
                  />
                  <Field
                    label="Issuing organization"
                    name="issuingOrganization"
                    defaultValue={editing.vehicle?.issuingOrganization}
                  />
                  <Field
                    label="Start date"
                    name="startsOn"
                    type="date"
                    defaultValue={dateOnly(editing.vehicle?.startsOn)}
                  />
                  <Field
                    label="End date"
                    name="endsOn"
                    type="date"
                    defaultValue={dateOnly(editing.vehicle?.endsOn)}
                  />
                  <TextBlock
                    label="Notes"
                    name="notesText"
                    defaultValue={editing.vehicle?.notesText}
                  />
                  <ToggleField
                    defaultChecked={editing.vehicle?.active ?? true}
                  />
                  <SubmitButton pending={pending}>Save Vehicle</SubmitButton>
                </>
              )}
            </FormShell>
          }
          rows={data.vehicles}
          heads={[
            "Vehicle",
            "Issuer",
            "Agreement Count",
            "Expires",
            "Status",
            "Actions",
          ]}
          renderRow={(vehicle) => [
            vehicle.name,
            vehicle.issuingOrganization,
            vehicle._count.sellerEligibility,
            dateOnly(vehicle.endsOn) || "No end date",
            <ActiveBadge key="active" active={vehicle.active} />,
            <RowActions
              key="actions"
              edit={() => setEditing({ vehicle })}
              kind="vehicle"
              id={vehicle.id}
              active={vehicle.active}
            />,
          ]}
        />
      ) : null}

      {tab === "Purchasing Agreements" ? (
        <SectionFormTable
          title="Purchasing Agreements"
          form={
            <FormShell
              title={
                editing.agreement
                  ? "Edit Purchasing Agreement"
                  : "Create Purchasing Agreement"
              }
              action={saveAgreementAction}
            >
              {(_state, pending) => (
                <>
                  <input
                    name="id"
                    type="hidden"
                    value={editing.agreement?.id ?? ""}
                  />
                  <SelectBox
                    label="Purchasing vehicle"
                    name="purchasingVehicleId"
                    options={vehicleOptions}
                    defaultValue={
                      editing.agreement?.purchasingVehicleId ??
                      vehicleOptions[0]?.id
                    }
                  />
                  <SelectBox
                    label="Seller company"
                    name="sellerCompanyId"
                    options={sellerOptions}
                    defaultValue={
                      editing.agreement?.sellerCompanyId ?? sellerOptions[0]?.id
                    }
                  />
                  <Field
                    label="Agreement number"
                    name="sellerAwardNumber"
                    defaultValue={editing.agreement?.sellerAwardNumber}
                  />
                  <Field
                    label="Title"
                    name="title"
                    defaultValue={editing.agreement?.title}
                  />
                  <Field
                    label="Start date"
                    name="startsOn"
                    type="date"
                    defaultValue={dateOnly(editing.agreement?.startsOn)}
                  />
                  <Field
                    label="End date"
                    name="endsOn"
                    type="date"
                    defaultValue={dateOnly(editing.agreement?.endsOn)}
                  />
                  <MultiSelect
                    label="Eligible products"
                    name="productIds"
                    options={productOptions}
                    defaultValues={
                      editing.agreement?.productEligibility
                        .map((item: any) => item.productId)
                        .filter(Boolean) ?? []
                    }
                  />
                  <TextBlock
                    label="Notes"
                    name="notesText"
                    defaultValue={editing.agreement?.notesText}
                  />
                  <ToggleField
                    defaultChecked={editing.agreement?.active ?? true}
                  />
                  <SubmitButton pending={pending}>Save Agreement</SubmitButton>
                </>
              )}
            </FormShell>
          }
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
              edit={() => setEditing({ agreement })}
              kind="agreement"
              id={agreement.id}
              active={agreement.active}
            />,
          ]}
        />
      ) : null}
    </WorkspaceShell>
  );
}

function CatalogCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">{children}</CardContent>
    </Card>
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

function SectionFormTable({
  title,
  form,
  rows,
  heads,
  renderRow,
}: {
  title: string;
  form: React.ReactNode;
  rows: any[];
  heads: string[];
  renderRow: (row: any) => React.ReactNode[];
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      {form}
      <CatalogCard title={title}>
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
          <EmptyState>No records yet.</EmptyState>
        )}
      </CatalogCard>
    </section>
  );
}
