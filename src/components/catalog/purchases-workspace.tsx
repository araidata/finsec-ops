"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";

import {
  addAllocationAction,
  addDeploymentAction,
  addItemAction,
  addUsageAction,
  createPurchaseAction,
} from "@/app/purchases/actions";
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
  type Option,
} from "@/components/catalog/relational-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PurchaseData = Record<string, any[]>;

const purchaseStatuses = [
  "APPROVED",
  "ORDERED",
  "COMMITTED",
  "RECEIVED",
  "COMPLETED",
  "CANCELED",
];
const licenseMetrics = [
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
];
const deploymentStatuses = [
  "PLANNED",
  "IMPLEMENTING",
  "ACTIVE",
  "PARTIALLY_DEPLOYED",
  "UNDER_REVIEW",
  "RETIRING",
  "RETIRED",
];
const adoptionLevels = ["NOT_USED", "LOW", "MEDIUM", "HIGH", "FULLY_ADOPTED"];

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function money(value: unknown) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value ?? 0));
}

function dateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function PurchasesWorkspace({ data }: { data: PurchaseData }) {
  const [vendorId, setVendorId] = useState(data.companies[0]?.id ?? "");
  const vendorProducts = data.products.filter(
    (product) => product.vendorCompanyId === vendorId && product.active
  );
  const [productId, setProductId] = useState(vendorProducts[0]?.id ?? "");
  const [moduleId, setModuleId] = useState("");
  const selectedProductId =
    productId || vendorProducts[0]?.id || data.products[0]?.id;

  const productModules = data.modules.filter(
    (module) => module.productId === selectedProductId && module.active
  );
  const productFeatures = data.features.filter(
    (feature) =>
      feature.productId === selectedProductId &&
      (!moduleId || moduleId === "none" || feature.moduleId === moduleId) &&
      feature.active
  );
  const sellerRows = data.productSellers.filter(
    (seller) => seller.productId === selectedProductId && seller.active
  );
  const agreementRows = data.agreements.filter((agreement) => {
    return (
      sellerRows.some(
        (seller) => seller.sellerCompanyId === agreement.sellerCompanyId
      ) &&
      agreement.productEligibility.some(
        (eligibility: any) =>
          !eligibility.productId || eligibility.productId === selectedProductId
      )
    );
  });

  const vendorOptions = data.companies
    .filter((company) =>
      company.roles.some((role: any) => role.role === "VENDOR")
    )
    .map((company) => ({
      id: company.id,
      label: company.name,
      active: company.active,
    }));
  const productOptions = vendorProducts.map((product) => ({
    id: product.id,
    label: product.name,
    active: product.active,
  }));
  const moduleOptions = productModules.map((module) => ({
    id: module.id,
    label: module.name,
    active: module.active,
  }));
  const featureOptions = productFeatures.map((feature) => ({
    id: feature.id,
    label: feature.name,
    active: feature.active,
  }));
  const sellerOptions = sellerRows.map((seller) => ({
    id: seller.sellerCompanyId,
    label: seller.seller.name,
    active: seller.seller.active,
    hint: `${titleCase(seller.relationshipType)}${seller.preferred ? " preferred" : ""}`,
  }));
  const agreementOptions = agreementRows.map((agreement) => ({
    id: agreement.id,
    label:
      agreement.title ??
      agreement.sellerAwardNumber ??
      agreement.purchasingVehicle.name,
    active: agreement.active,
    hint: `${agreement.purchasingVehicle.name} expires ${dateOnly(agreement.endsOn) || "open"}`,
  }));
  const fiscalOptions = data.fiscalYears.map((fy) => ({
    id: fy.id,
    label: fy.label,
  }));
  const contractOptions = data.contracts.map((contract) => ({
    id: contract.id,
    label: contract.title,
  }));
  const requestOptions = data.purchaseRequests.map((request) => ({
    id: request.id,
    label: `${request.requestNumber ?? "Request"} - ${request.title}`,
  }));
  const purchaseOptions = data.purchases.map((purchase) => ({
    id: purchase.id,
    label: purchase.title,
  }));
  const itemOptions = data.purchases.flatMap((purchase) =>
    purchase.items.map((item: any) => ({
      id: item.id,
      label: `${purchase.title} - ${item.product.name}`,
      parentId: purchase.id,
    }))
  );
  const deploymentOptions = data.purchases.flatMap((purchase) =>
    purchase.items.flatMap((item: any) =>
      item.deployments.map((deployment: any) => ({
        id: deployment.id,
        label: `${item.product.name} - ${deployment.scopeName}`,
      }))
    )
  );

  return (
    <WorkspaceShell
      title="Purchases"
      description="Database-backed purchase headers, line items, allocations, deployments, and usage history."
      actionLabel="New Purchase"
    >
      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <FormShell title="Create Purchase" action={createPurchaseAction}>
          {(_state, pending) => (
            <>
              <Field label="Title" name="title" />
              <SelectBox
                label="Fiscal year"
                name="fiscalYearId"
                options={fiscalOptions}
                defaultValue={fiscalOptions[0]?.id}
              />
              <SelectBox
                label="Purchase request"
                name="purchaseRequestId"
                options={requestOptions}
                includeNone
              />
              <SelectBox
                label="Vendor"
                name="vendorCompanyId"
                options={vendorOptions}
                defaultValue={vendorId}
                onChange={(value) => {
                  setVendorId(value);
                  setProductId("");
                  setModuleId("");
                }}
              />
              <SelectBox
                label="Product or service"
                name="productId"
                options={productOptions}
                defaultValue={selectedProductId}
                onChange={(value) => {
                  setProductId(value);
                  setModuleId("");
                }}
              />
              <SelectBox
                label="Product Component"
                name="productModuleId"
                options={moduleOptions}
                includeNone
                onChange={setModuleId}
              />
              <MultiSelect
                label="Included functions"
                name="featureIds"
                options={featureOptions}
              />
              <SelectBox
                label="Seller company"
                name="sellerCompanyId"
                options={sellerOptions}
                defaultValue={sellerOptions[0]?.id}
              />
              <SelectBox
                label="Commercial contract"
                name="contractId"
                options={contractOptions}
                includeNone
              />
              <SelectBox
                label="Purchasing agreement"
                name="purchasingAgreementId"
                options={agreementOptions}
                includeNone
              />
              <SelectBox
                label="Status"
                name="status"
                options={purchaseStatuses.map((status) => ({
                  id: status,
                  label: titleCase(status),
                }))}
                defaultValue="APPROVED"
              />
              <Field label="Currency" name="currencyCode" defaultValue="USD" />
              <Field label="Start date" name="startsOn" type="date" />
              <Field label="End date" name="endsOn" type="date" />
              <Field label="Renewal date" name="renewalDate" type="date" />
              <LineItemFields />
              <TextBlock label="Notes" name="notesText" />
              <SubmitButton pending={pending}>Create Purchase</SubmitButton>
            </>
          )}
        </FormShell>

        <CatalogCard title="Purchase Register">
          {data.purchases.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      {purchase.title}
                      <div className="text-xs text-muted-foreground">
                        Request:{" "}
                        {purchase.purchaseRequest?.requestNumber ?? "none"}
                      </div>
                    </TableCell>
                    <TableCell>{purchase.sellerCompany?.name}</TableCell>
                    <TableCell>{titleCase(purchase.status)}</TableCell>
                    <TableCell>{money(purchase.totalAmount)}</TableCell>
                    <TableCell>{purchase.items.length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState>No purchases yet.</EmptyState>
          )}
        </CatalogCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <FormShell title="Add Purchase Item" action={addItemAction}>
          {(_state, pending) => (
            <>
              <SelectBox
                label="Purchase"
                name="purchaseId"
                options={purchaseOptions}
                defaultValue={purchaseOptions[0]?.id}
              />
              <SelectBox
                label="Vendor"
                name="vendorCompanyId"
                options={vendorOptions}
                defaultValue={vendorId}
                onChange={(value) => {
                  setVendorId(value);
                  setProductId("");
                  setModuleId("");
                }}
              />
              <SelectBox
                label="Product or service"
                name="productId"
                options={productOptions}
                defaultValue={selectedProductId}
                onChange={(value) => {
                  setProductId(value);
                  setModuleId("");
                }}
              />
              <SelectBox
                label="Product Component"
                name="productModuleId"
                options={moduleOptions}
                includeNone
                onChange={setModuleId}
              />
              <MultiSelect
                label="Included functions"
                name="featureIds"
                options={featureOptions}
              />
              <LineItemFields />
              <SubmitButton pending={pending}>Add Item</SubmitButton>
            </>
          )}
        </FormShell>

        <FormShell title="Add Budget Allocation" action={addAllocationAction}>
          {(_state, pending) => (
            <>
              <SelectBox
                label="Purchase"
                name="purchaseId"
                options={purchaseOptions}
                defaultValue={purchaseOptions[0]?.id}
              />
              <SelectBox
                label="Purchase item"
                name="purchaseItemId"
                options={itemOptions}
                includeNone
              />
              <SelectBox
                label="Budget annual financial"
                name="budgetAnnualFinancialId"
                options={budgetAnnualOptions(data.budgetAnnualFinancials)}
                defaultValue={data.budgetAnnualFinancials[0]?.id}
              />
              <Field
                label="Allocation amount"
                name="allocatedAmount"
                type="number"
              />
              <TextBlock label="Notes" name="notesText" />
              <SubmitButton pending={pending}>Add Allocation</SubmitButton>
            </>
          )}
        </FormShell>

        <FormShell title="Add Deployment Scope" action={addDeploymentAction}>
          {(_state, pending) => (
            <>
              <SelectBox
                label="Purchase item"
                name="purchaseItemId"
                options={itemOptions}
                defaultValue={itemOptions[0]?.id}
              />
              <Field label="Scope name" name="scopeName" />
              <Field label="Environment" name="environment" />
              <Field label="Business unit" name="department" />
              <SelectBox
                label="Status"
                name="status"
                options={deploymentStatuses.map((status) => ({
                  id: status,
                  label: titleCase(status),
                }))}
                defaultValue="PLANNED"
              />
              <Field
                label="Deployment percentage"
                name="deploymentPercent"
                type="number"
                defaultValue="0"
              />
              <Field
                label="Target population"
                name="targetPopulation"
                type="number"
              />
              <Field
                label="Deployed population"
                name="deployedPopulation"
                type="number"
              />
              <SelectBox
                label="Adoption level"
                name="adoptionLevel"
                options={adoptionLevels.map((level) => ({
                  id: level,
                  label: titleCase(level),
                }))}
                includeNone
              />
              <Field label="Target date" name="targetDate" type="date" />
              <Field label="Completed date" name="completedDate" type="date" />
              <TextBlock label="Blockers" name="blockers" />
              <TextBlock label="Expected outcome" name="expectedOutcome" />
              <TextBlock label="Realized outcome" name="realizedOutcome" />
              <TextBlock label="Value narrative" name="valueNarrative" />
              <SubmitButton pending={pending}>Add Deployment</SubmitButton>
            </>
          )}
        </FormShell>

        <FormShell title="Add Usage Measurement" action={addUsageAction}>
          {(_state, pending) => (
            <>
              <SelectBox
                label="Deployment"
                name="deploymentId"
                options={deploymentOptions}
                defaultValue={deploymentOptions[0]?.id}
              />
              <Field label="Measurement date" name="measuredAt" type="date" />
              <Field
                label="Licensed count"
                name="licensedCount"
                type="number"
              />
              <Field
                label="Deployed count"
                name="deployedCount"
                type="number"
              />
              <Field
                label="Active usage count"
                name="activeUsageCount"
                type="number"
              />
              <Field
                label="Utilization percentage"
                name="utilizationPercent"
                type="number"
              />
              <Field label="Source" name="source" />
              <TextBlock label="Notes" name="notesText" />
              <SubmitButton pending={pending}>Add Measurement</SubmitButton>
            </>
          )}
        </FormShell>
      </section>

      <CatalogCard title="Deployment And Usage History">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Latest Measurement</TableHead>
              <TableHead>Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.purchases.flatMap((purchase) =>
              purchase.items.flatMap((item: any) =>
                item.deployments.map((deployment: any) => (
                  <TableRow key={deployment.id}>
                    <TableCell>{item.product.name}</TableCell>
                    <TableCell>{deployment.scopeName}</TableCell>
                    <TableCell>
                      <ActiveBadge active={deployment.status === "ACTIVE"} />{" "}
                      {titleCase(deployment.status)}
                    </TableCell>
                    <TableCell>{latestMeasurement(deployment)}</TableCell>
                    <TableCell>
                      {deployment.usageMeasurements
                        .map(
                          (m: any) =>
                            `${dateOnly(m.measuredAt)} ${m.utilizationPercent ?? 0}%`
                        )
                        .join(" -> ")}
                    </TableCell>
                  </TableRow>
                ))
              )
            )}
          </TableBody>
        </Table>
      </CatalogCard>
    </WorkspaceShell>
  );
}

function LineItemFields() {
  return (
    <>
      <TextBlock label="Line description" name="description" />
      <Field label="Quantity" name="quantity" type="number" defaultValue="1" />
      <SelectBox
        label="License metric"
        name="quantityType"
        options={licenseMetrics.map((metric) => ({
          id: metric,
          label: titleCase(metric),
        }))}
        includeNone
      />
      <Field label="Unit cost" name="unitCost" type="number" defaultValue="0" />
      <Field
        label="Recurring cost"
        name="recurringCost"
        type="number"
        defaultValue="0"
      />
      <Field
        label="Implementation cost"
        name="implementationCost"
        type="number"
        defaultValue="0"
      />
      <Field label="License start date" name="licenseStartsOn" type="date" />
      <Field label="License end date" name="licenseEndsOn" type="date" />
    </>
  );
}

function budgetAnnualOptions(rows: any[]): Option[] {
  return rows.map((row) => {
    const allocated =
      row.purchaseBudgetAllocations?.reduce(
        (total: number, allocation: any) =>
          total + Number(allocation.allocatedAmount),
        0
      ) ?? 0;
    const approved = Number(row.approvedAmount ?? row.proposedAmount ?? 0);
    return {
      id: row.id,
      label: `${row.budgetPlan.name} / ${titleCase(row.scenario.label)} / ${row.account.code} / ${row.budgetItem.name}`,
      hint: `available ${money(Math.max(approved - allocated, 0))}`,
    };
  });
}

function latestMeasurement(deployment: any) {
  const latest = deployment.usageMeasurements[0];
  if (!latest) return "No measurements";
  return `${dateOnly(latest.measuredAt)}: ${latest.activeUsageCount ?? 0} active, ${latest.utilizationPercent ?? 0}%`;
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
