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
  calculateContractSummary,
  formatCurrency,
  getNoticeDeadline,
  getRenewalUrgency,
  getUpcomingRenewals,
} from "@/lib/portfolio-analytics";
import {
  contracts as initialContracts,
  portfolioResellers,
  portfolioVendors,
} from "@/lib/portfolio-data";
import type {
  Contract,
  ContractStatus,
  ContractType,
  PaymentFrequency,
  RenewalRiskLevel,
} from "@/types/portfolio";
import {
  contractStatuses,
  contractTypes,
  paymentFrequencies,
  renewalRiskLevels,
} from "@/types/portfolio";

type SortKey =
  | "contractName"
  | "vendorId"
  | "contractType"
  | "endDate"
  | "renewalDate"
  | "annualContractValue"
  | "contractStatus"
  | "renewalRiskLevel"
  | "contractOwner";

const emptyContract: Contract = {
  id: "",
  vendorId: "rapid7",
  resellerId: undefined,
  contractName: "",
  contractType: "SaaS",
  associatedProductOrService: "",
  startDate: "2026-07-01",
  endDate: "2027-06-30",
  renewalDate: "2027-05-01",
  autoRenewal: false,
  noticePeriodDays: 60,
  annualContractValue: 0,
  totalContractValue: 0,
  paymentFrequency: "Annual",
  contractOwner: "",
  businessOwner: "",
  securityOwner: "",
  procurementContact: "",
  vendorAccountManager: "",
  resellerAccountManager: "",
  contractStatus: "Pending",
  renewalRiskLevel: "Low",
  renewalStrategy: "",
  notes: "",
  productIds: [],
};

const vendorOptions = portfolioVendors.map((vendor) => ({
  value: vendor.id,
  label: vendor.name,
}));

const resellerOptions = portfolioResellers.map((reseller) => ({
  value: reseller.id,
  label: reseller.name,
}));

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

function compareContracts(a: Contract, b: Contract, sortKey: SortKey) {
  const aValue = a[sortKey];
  const bValue = b[sortKey];

  if (typeof aValue === "number" && typeof bValue === "number") {
    return aValue - bValue;
  }

  return String(aValue).localeCompare(String(bValue));
}

export function ContractsManagement() {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [draft, setDraft] = useState<Contract>({
    ...emptyContract,
    id: "contract-new",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("renewalDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [vendorFilter, setVendorFilter] = useState<string | "All">("All");
  const [resellerFilter, setResellerFilter] = useState<string | "All">("All");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "All">(
    "All"
  );
  const [riskFilter, setRiskFilter] = useState<RenewalRiskLevel | "All">("All");
  const [typeFilter, setTypeFilter] = useState<ContractType | "All">("All");
  const [ownerFilter, setOwnerFilter] = useState<string | "All">("All");
  const [windowFilter, setWindowFilter] = useState<string | "All">("All");
  const today = useMemo(() => new Date("2026-07-09T00:00:00.000Z"), []);

  const owners = useMemo(
    () => [...new Set(contracts.map((contract) => contract.contractOwner))],
    [contracts]
  );

  const filteredContracts = useMemo(() => {
    return [...contracts]
      .filter(
        (contract) =>
          vendorFilter === "All" || contract.vendorId === vendorFilter
      )
      .filter((contract) => {
        if (resellerFilter === "All") {
          return true;
        }

        return (contract.resellerId ?? "direct") === resellerFilter;
      })
      .filter(
        (contract) =>
          statusFilter === "All" || contract.contractStatus === statusFilter
      )
      .filter(
        (contract) =>
          riskFilter === "All" || contract.renewalRiskLevel === riskFilter
      )
      .filter(
        (contract) =>
          typeFilter === "All" || contract.contractType === typeFilter
      )
      .filter(
        (contract) =>
          ownerFilter === "All" || contract.contractOwner === ownerFilter
      )
      .filter((contract) => {
        if (windowFilter === "All") {
          return true;
        }

        const urgency = getRenewalUrgency(contract, today);
        return urgency === windowFilter;
      })
      .sort((a, b) => {
        const sorted = compareContracts(a, b, sortKey);
        return sortDirection === "asc" ? sorted : -sorted;
      });
  }, [
    contracts,
    ownerFilter,
    resellerFilter,
    riskFilter,
    sortDirection,
    sortKey,
    statusFilter,
    today,
    typeFilter,
    vendorFilter,
    windowFilter,
  ]);

  const summary = calculateContractSummary(filteredContracts, today);
  const upcomingRenewals = getUpcomingRenewals(filteredContracts, today).slice(
    0,
    5
  );
  const resellerSpend = filteredContracts
    .filter((contract) => contract.resellerId)
    .reduce((total, contract) => total + contract.annualContractValue, 0);
  const directSpend = filteredContracts
    .filter((contract) => !contract.resellerId)
    .reduce((total, contract) => total + contract.annualContractValue, 0);

  function toggleSort(nextSortKey: SortKey) {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection("asc");
  }

  function saveDraft() {
    const normalized: Contract = {
      ...draft,
      id: editingId ?? `contract-${Date.now()}`,
      resellerId: draft.resellerId === "direct" ? undefined : draft.resellerId,
    };

    setContracts((current) =>
      editingId
        ? current.map((contract) =>
            contract.id === editingId ? normalized : contract
          )
        : [normalized, ...current]
    );
    setEditingId(null);
    setDraft({ ...emptyContract, id: "contract-new" });
  }

  function editContract(contract: Contract) {
    setEditingId(contract.id);
    setDraft({ ...contract, resellerId: contract.resellerId ?? "direct" });
  }

  function deleteContract(contractId: string) {
    setContracts((current) =>
      current.filter((contract) => contract.id !== contractId)
    );
    if (editingId === contractId) {
      setEditingId(null);
      setDraft({ ...emptyContract, id: "contract-new" });
    }
  }

  return (
    <WorkspaceShell
      title="Contracts & Renewals"
      description="Track vendor and reseller contracts, renewal risk, notice deadlines, and upcoming decisions."
      actionLabel="New Contract"
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          label="Active Contracts"
          value={String(summary.activeContracts)}
        />
        <SummaryCard
          label="Annual Contract Value"
          value={formatCurrency(summary.annualContractValue)}
        />
        <SummaryCard
          label="Expiring 30 Days"
          value={String(summary.expiringIn30Days)}
        />
        <SummaryCard
          label="Expiring 60 Days"
          value={String(summary.expiringIn60Days)}
        />
        <SummaryCard
          label="Expiring 90 Days"
          value={String(summary.expiringIn90Days)}
        />
        <SummaryCard
          label="High-Risk Renewals"
          value={String(summary.highRiskRenewals)}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_0.75fr]">
        <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle>
              {editingId ? "Edit Contract" : "Create Contract"}
            </CardTitle>
            <CardDescription>
              Includes reseller tracking, notice periods, ownership, and renewal
              strategy.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TextField
              label="Contract name"
              value={draft.contractName}
              onChange={(contractName) => setDraft({ ...draft, contractName })}
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
              label="Contract type"
              value={draft.contractType}
              options={contractTypes}
              onChange={(contractType) =>
                setDraft({
                  ...draft,
                  contractType: contractType as ContractType,
                })
              }
            />
            <TextField
              label="Product or service"
              value={draft.associatedProductOrService}
              onChange={(associatedProductOrService) =>
                setDraft({ ...draft, associatedProductOrService })
              }
            />
            <TextField
              label="Start date"
              type="date"
              value={draft.startDate}
              onChange={(startDate) => setDraft({ ...draft, startDate })}
            />
            <TextField
              label="End date"
              type="date"
              value={draft.endDate}
              onChange={(endDate) => setDraft({ ...draft, endDate })}
            />
            <TextField
              label="Renewal date"
              type="date"
              value={draft.renewalDate}
              onChange={(renewalDate) => setDraft({ ...draft, renewalDate })}
            />
            <NumberField
              label="Notice period days"
              value={draft.noticePeriodDays}
              onChange={(noticePeriodDays) =>
                setDraft({ ...draft, noticePeriodDays })
              }
            />
            <NumberField
              label="Annual value"
              value={draft.annualContractValue}
              onChange={(annualContractValue) =>
                setDraft({ ...draft, annualContractValue })
              }
            />
            <NumberField
              label="Total value"
              value={draft.totalContractValue}
              onChange={(totalContractValue) =>
                setDraft({ ...draft, totalContractValue })
              }
            />
            <SelectField
              label="Payment frequency"
              value={draft.paymentFrequency}
              options={paymentFrequencies}
              onChange={(paymentFrequency) =>
                setDraft({
                  ...draft,
                  paymentFrequency: paymentFrequency as PaymentFrequency,
                })
              }
            />
            <TextField
              label="Contract owner"
              value={draft.contractOwner}
              onChange={(contractOwner) =>
                setDraft({ ...draft, contractOwner })
              }
            />
            <TextField
              label="Business owner"
              value={draft.businessOwner}
              onChange={(businessOwner) =>
                setDraft({ ...draft, businessOwner })
              }
            />
            <TextField
              label="Security owner"
              value={draft.securityOwner}
              onChange={(securityOwner) =>
                setDraft({ ...draft, securityOwner })
              }
            />
            <TextField
              label="Procurement contact"
              value={draft.procurementContact}
              onChange={(procurementContact) =>
                setDraft({ ...draft, procurementContact })
              }
            />
            <TextField
              label="Vendor account manager"
              value={draft.vendorAccountManager}
              onChange={(vendorAccountManager) =>
                setDraft({ ...draft, vendorAccountManager })
              }
            />
            <TextField
              label="Reseller account manager"
              value={draft.resellerAccountManager ?? ""}
              onChange={(resellerAccountManager) =>
                setDraft({ ...draft, resellerAccountManager })
              }
            />
            <SelectField
              label="Contract status"
              value={draft.contractStatus}
              options={contractStatuses}
              onChange={(contractStatus) =>
                setDraft({
                  ...draft,
                  contractStatus: contractStatus as ContractStatus,
                })
              }
            />
            <SelectField
              label="Renewal risk"
              value={draft.renewalRiskLevel}
              options={renewalRiskLevels}
              onChange={(renewalRiskLevel) =>
                setDraft({
                  ...draft,
                  renewalRiskLevel: renewalRiskLevel as RenewalRiskLevel,
                })
              }
            />
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                checked={draft.autoRenewal}
                type="checkbox"
                onChange={(event) =>
                  setDraft({ ...draft, autoRenewal: event.target.checked })
                }
              />
              Auto-renewal
            </label>
            <TextAreaField
              label="Renewal strategy"
              value={draft.renewalStrategy}
              onChange={(renewalStrategy) =>
                setDraft({ ...draft, renewalStrategy })
              }
            />
            <TextAreaField
              label="Notes"
              value={draft.notes}
              onChange={(notes) => setDraft({ ...draft, notes })}
            />
            <div className="flex items-end gap-2">
              <Button onClick={saveDraft}>
                {editingId ? "Save Changes" : "Create Contract"}
              </Button>
              {editingId ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setDraft({ ...emptyContract, id: "contract-new" });
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
            <CardTitle>Spend Channel Reporting</CardTitle>
            <CardDescription>
              Direct vendor spend and reseller-supported contract value.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <SummaryCard
              label="Direct Vendor Spend"
              value={formatCurrency(directSpend)}
            />
            <SummaryCard
              label="Reseller-Tied Spend"
              value={formatCurrency(resellerSpend)}
            />
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle>Contracts</CardTitle>
          <CardDescription>
            Filterable and sortable contract inventory with renewal urgency.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
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
              label="Status"
              value={statusFilter}
              options={contractStatuses}
              includeAll
              onChange={setStatusFilter}
            />
            <SelectField
              label="Renewal risk"
              value={riskFilter}
              options={renewalRiskLevels}
              includeAll
              onChange={setRiskFilter}
            />
            <SelectField
              label="Contract type"
              value={typeFilter}
              options={contractTypes}
              includeAll
              onChange={setTypeFilter}
            />
            <SelectField
              label="Owner"
              value={ownerFilter}
              options={owners}
              includeAll
              onChange={setOwnerFilter}
            />
            <SelectField
              label="Expiration window"
              value={windowFilter}
              options={["Critical", "High", "Medium", "Low"]}
              includeAll
              onChange={setWindowFilter}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                {[
                  ["contractName", "Contract"],
                  ["vendorId", "Vendor"],
                  ["contractType", "Type"],
                  ["endDate", "End"],
                  ["renewalDate", "Renewal"],
                  ["annualContractValue", "ACV"],
                  ["contractStatus", "Status"],
                  ["renewalRiskLevel", "Risk"],
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
                <TableHead>Auto</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>{contract.contractName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{vendorName(contract.vendorId)}</span>
                      <span className="text-xs text-muted-foreground">
                        {resellerName(contract.resellerId)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ValueBadge value={contract.contractType} />
                  </TableCell>
                  <TableCell className="font-mono">
                    {contract.endDate}
                  </TableCell>
                  <TableCell className="font-mono">
                    <div className="flex flex-col">
                      <span>{contract.renewalDate}</span>
                      <span className="text-xs text-muted-foreground">
                        Notice {getNoticeDeadline(contract)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(contract.annualContractValue)}
                  </TableCell>
                  <TableCell>
                    <ValueBadge value={contract.contractStatus} />
                  </TableCell>
                  <TableCell>
                    <ValueBadge value={contract.renewalRiskLevel} />
                  </TableCell>
                  <TableCell>
                    <ValueBadge value={contract.autoRenewal ? "Yes" : "No"} />
                  </TableCell>
                  <TableCell>
                    <ValueBadge value={getRenewalUrgency(contract, today)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Edit ${contract.contractName}`}
                        onClick={() => editContract(contract)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        aria-label={`Delete ${contract.contractName}`}
                        onClick={() => deleteContract(contract.id)}
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

      <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
        <CardHeader className="border-b border-border/70 pb-4">
          <CardTitle>Upcoming Renewals</CardTitle>
          <CardDescription>
            Sorted by nearest renewal date or notice deadline, whichever is
            sooner.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {upcomingRenewals.map((contract) => (
            <div
              key={contract.id}
              className="rounded-lg border border-border/70 bg-secondary/30 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-slate-100">
                  {contract.contractName}
                </p>
                <ValueBadge value={getRenewalUrgency(contract, today)} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {vendorName(contract.vendorId)} via{" "}
                {resellerName(contract.resellerId)}
              </p>
              <p className="mt-3 font-mono text-sm text-slate-200">
                Renewal {contract.renewalDate}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Notice {getNoticeDeadline(contract)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </WorkspaceShell>
  );
}
