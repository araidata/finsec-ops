"use client";

import { useActionState, useState } from "react";

import {
  createRenewalFromContractAction,
  pushContractToBudgetAction,
} from "@/app/contracts/actions";
import {
  Field,
  FormShell,
  MutationError,
  SelectBox,
  type Option,
} from "@/components/catalog/relational-controls";
import { Button } from "@/components/ui/button";
import { emptyActionResult } from "@/lib/server/action-result";

type ContractHandoffSummary = {
  id: string;
  title: string;
  businessOwner?: string | null;
  annualValue: unknown;
  lineItems?: Array<{ renewable: boolean }>;
};

function money(value: unknown) {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number);
}

export function CreateRenewalPanel({
  onClose,
  contract,
  fiscalOptions,
  budgetPlanOptions,
  accountOptions,
  annualOptions,
}: {
  onClose: () => void;
  contract: ContractHandoffSummary;
  fiscalOptions: Option[];
  budgetPlanOptions: Option[];
  accountOptions: Option[];
  annualOptions: Option[];
}) {
  const renewableLineCount =
    contract.lineItems?.filter((line) => line.renewable).length ?? 0;
  const [fiscalYearId, setFiscalYearId] = useState(fiscalOptions[0]?.id ?? "");
  const [budgetPlanId, setBudgetPlanId] = useState(
    budgetPlanOptions[0]?.id ?? ""
  );
  const [fundingAccountId, setFundingAccountId] = useState(
    accountOptions[0]?.id ?? ""
  );
  const [linkedAnnualFinancialId, setLinkedAnnualFinancialId] =
    useState("none");

  return (
    <section className="rounded-lg border border-border/80 bg-card/95">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/80 p-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Push Contract to Renewal
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Copies the contract header and renewable line-item baseline into a
            new operational renewal case.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close Renewal
        </Button>
      </div>
      <div className="p-3">
        <FormShell
          title={contract.title}
          action={createRenewalFromContractAction}
        >
          {(_state, pending) => (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input type="hidden" name="contractId" value={contract.id} />
              <SelectBox
                label="Target fiscal year"
                name="fiscalYearId"
                options={fiscalOptions}
                value={fiscalYearId}
                onChange={setFiscalYearId}
              />
              <SelectBox
                label="Budget plan"
                name="budgetPlanId"
                options={budgetPlanOptions}
                value={budgetPlanId}
                onChange={setBudgetPlanId}
              />
              <SelectBox
                label="Funding account"
                name="fundingAccountId"
                options={accountOptions}
                value={fundingAccountId}
                onChange={setFundingAccountId}
              />
              <SelectBox
                label="Linked annual financial"
                name="linkedAnnualFinancialId"
                options={annualOptions}
                value={linkedAnnualFinancialId}
                onChange={setLinkedAnnualFinancialId}
                includeNone
              />
              <Field label="Department" name="department" defaultValue="" />
              <Field label="Cost center" name="costCenter" defaultValue="" />
              <Field
                label="Renewal owner"
                name="renewalOwner"
                defaultValue={contract.businessOwner ?? ""}
              />
              <div
                className={`rounded-lg border p-3 text-xs ${
                  renewableLineCount
                    ? "border-border/80 bg-secondary/30 text-muted-foreground"
                    : "border-amber-400/40 bg-amber-400/10 text-amber-100"
                }`}
              >
                {renewableLineCount} renewable lines will be copied as renewal
                pricing snapshots.
              </div>
              <div className="md:col-span-2 xl:col-span-4">
                <Button
                  type="submit"
                  disabled={pending || renewableLineCount === 0}
                >
                  {pending ? "Pushing..." : "Push to Renewal"}
                </Button>
              </div>
            </div>
          )}
        </FormShell>
      </div>
    </section>
  );
}

export function PushBudgetPanel({
  onClose,
  contract,
  fiscalOptions,
  budgetPlanOptions,
  accountOptions,
}: {
  onClose: () => void;
  contract: ContractHandoffSummary;
  fiscalOptions: Option[];
  budgetPlanOptions: Option[];
  accountOptions: Option[];
}) {
  const defaultAccount =
    accountOptions.find((option) => option.label.includes("63256")) ??
    accountOptions.find((option) => option.label.includes("62094")) ??
    accountOptions[0];
  const [fiscalYearId, setFiscalYearId] = useState(fiscalOptions[0]?.id ?? "");
  const [budgetPlanId, setBudgetPlanId] = useState(
    budgetPlanOptions[0]?.id ?? ""
  );
  const [accountId, setAccountId] = useState(defaultAccount?.id ?? "");
  const [state, formAction, pending] = useActionState(
    pushContractToBudgetAction,
    emptyActionResult
  );

  return (
    <section className="rounded-lg border border-border/80 bg-card/95">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/80 p-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Push Contract to Budget
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Creates or updates a budget planning row from this contract&apos;s
            annual value.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close Budget
        </Button>
      </div>
      <div className="p-3">
        <form
          action={formAction}
          className="grid gap-3 rounded-lg border border-border/80 bg-card/80 p-4"
        >
          <h3 className="text-sm font-semibold text-slate-100">
            {contract.title}
          </h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input type="hidden" name="contractId" value={contract.id} />
            <SelectBox
              label="Target fiscal year"
              name="fiscalYearId"
              options={fiscalOptions}
              value={fiscalYearId}
              onChange={setFiscalYearId}
            />
            <SelectBox
              label="Budget plan"
              name="budgetPlanId"
              options={budgetPlanOptions}
              value={budgetPlanId}
              onChange={setBudgetPlanId}
            />
            <SelectBox
              label="Budget account"
              name="accountId"
              options={accountOptions}
              value={accountId}
              onChange={setAccountId}
            />
            <div className="rounded-lg border border-border/80 bg-secondary/30 p-3 text-xs text-muted-foreground">
              <span className="block uppercase">Annual value</span>
              <span className="text-base font-semibold text-slate-100">
                {money(contract.annualValue)}
              </span>
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              <Button type="submit" disabled={pending}>
                {pending ? "Pushing..." : "Push to Budget"}
              </Button>
            </div>
          </div>
          <MutationError result={state} />
        </form>
      </div>
    </section>
  );
}
