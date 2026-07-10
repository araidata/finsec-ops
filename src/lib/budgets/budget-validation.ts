import type { BudgetAnnualFinancial, MaintenanceRenewal } from "@/types/budget";

export type ValidationResult = {
  valid: boolean;
  messages: string[];
};

export function validateBudgetLine(
  line: BudgetAnnualFinancial
): ValidationResult {
  const messages: string[] = [];

  if (line.proposedAmountCents < 0) {
    messages.push("Proposed amount cannot be negative.");
  }

  if (line.quantity < 0) {
    messages.push("Quantity cannot be negative.");
  }

  if (!line.owner.trim()) {
    messages.push("Owner is required.");
  }

  if (line.isNewRequest && !line.businessJustification.trim()) {
    messages.push("New requests require a business justification.");
  }

  return { valid: messages.length === 0, messages };
}

export function validateMaintenanceRenewal(
  renewal: MaintenanceRenewal
): ValidationResult {
  const messages: string[] = [];

  if (renewal.renewalQuoteCents < 0 || renewal.negotiatedCostCents < 0) {
    messages.push("Renewal amounts cannot be negative.");
  }

  if (renewal.noticePeriodDays < 0) {
    messages.push("Notice period cannot be negative.");
  }

  if (!renewal.renewalOwner.trim()) {
    messages.push("Renewal owner is required.");
  }

  return { valid: messages.length === 0, messages };
}
