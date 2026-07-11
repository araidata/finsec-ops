export const renewalDispositions = [
  "REVIEW_REQUIRED",
  "DECISION_PENDING",
  "RENEW_AS_IS",
  "RENEW_WITH_CHANGES",
  "RENEGOTIATE",
  "REPLACE",
  "CONSOLIDATE",
  "EXTEND_TEMPORARILY",
  "DECOMMISSION",
  "DO_NOT_RENEW",
] as const;

export const renewalDecisionStatuses = [
  "NOT_STARTED",
  "UNDER_REVIEW",
  "RECOMMENDATION_SUBMITTED",
  "APPROVED",
  "REJECTED",
  "DEFERRED",
] as const;

export const renewalWorkflowStages = [
  "NOT_STARTED",
  "RENEWAL_REVIEW",
  "REQUIREMENTS_VALIDATION",
  "USAGE_VALUE_REVIEW",
  "DISPOSITION_RECOMMENDATION",
  "DISPOSITION_APPROVAL",
  "QUOTE_REQUESTED",
  "QUOTE_RECEIVED",
  "QUOTE_NEGOTIATION",
  "FUNDING_CONFIRMATION",
  "COURT_BRIEF_PREPARATION",
  "MANAGEMENT_APPROVAL",
  "PURCHASING_REVIEW",
  "LEGAL_REVIEW",
  "COMMISSIONERS_COURT_SUBMISSION",
  "PURCHASE_ORDER_PENDING",
  "ORDER_PLACED",
  "INVOICE_RECEIVED",
  "PAYMENT_PROCESSING",
  "REPLACEMENT_MIGRATION",
  "DECOMMISSIONING",
  "COMPLETED",
  "CANCELLED_NOT_RENEWING",
] as const;

export const renewalOverallStatuses = [
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
  "NOT_RENEWING",
  "ARCHIVED",
] as const;

export const renewalRiskStatuses = [
  "ON_TRACK",
  "ATTENTION_REQUIRED",
  "AT_RISK",
  "CRITICAL",
] as const;

export const renewalFundingStatuses = [
  "NOT_STARTED",
  "IDENTIFIED",
  "CONFIRMED",
  "APPROVED",
  "PARTIALLY_FUNDED",
  "UNFUNDED",
  "BLOCKED",
] as const;

export const renewalQuoteStatuses = [
  "NOT_REQUESTED",
  "REQUESTED",
  "RECEIVED",
  "IN_NEGOTIATION",
  "FINAL_SELECTED",
  "EXPIRED",
  "NOT_REQUIRED",
] as const;

export const renewalTaskStatuses = [
  "OPEN",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETED",
  "SKIPPED",
  "NOT_APPLICABLE",
] as const;

export type RenewalDisposition = (typeof renewalDispositions)[number];
export type RenewalDecisionStatus = (typeof renewalDecisionStatuses)[number];
export type RenewalWorkflowStage = (typeof renewalWorkflowStages)[number];

export type DispositionDefinition = {
  value: RenewalDisposition;
  label: string;
  shortDescription: string;
  guidance: string;
  requiredFields: string[];
  defaultTasks: string[];
  activeStages: RenewalWorkflowStage[];
};

export const dispositionDefinitions: DispositionDefinition[] = [
  {
    value: "REVIEW_REQUIRED",
    label: "Review Required",
    shortDescription:
      "A formal usage, value, risk, scope, capability, or business need review is required before a recommendation can be made.",
    guidance:
      "Use this when the team does not yet have enough evidence to recommend renewal, replacement, consolidation, or retirement.",
    requiredFields: ["Review owner", "Review due date", "Recommendation task"],
    defaultTasks: [
      "Assign review owner",
      "Complete usage review",
      "Complete value and capability review",
      "Prepare disposition recommendation",
    ],
    activeStages: [
      "RENEWAL_REVIEW",
      "USAGE_VALUE_REVIEW",
      "DISPOSITION_RECOMMENDATION",
    ],
  },
  {
    value: "DECISION_PENDING",
    label: "Decision Pending",
    shortDescription:
      "Review work is underway, but no final recommendation or approval has been completed.",
    guidance:
      "Unlike Review Required, this means the process has started and the open question is the decision outcome.",
    requiredFields: ["Decision owner", "Decision due date", "Next action"],
    defaultTasks: [
      "Confirm decision owner",
      "Document open decision blockers",
      "Set next action and due date",
    ],
    activeStages: ["DISPOSITION_RECOMMENDATION", "DISPOSITION_APPROVAL"],
  },
  {
    value: "RENEW_AS_IS",
    label: "Renew As-Is",
    shortDescription:
      "Continue with substantially the same scope, quantities, modules, services, and contract structure.",
    guidance:
      "Use this when the product remains needed and no material commercial or operational change is planned.",
    requiredFields: ["Funding confirmation", "Quote", "Approval"],
    defaultTasks: [
      "Confirm current scope",
      "Request renewal quote",
      "Confirm funding",
      "Submit purchasing package",
    ],
    activeStages: [
      "QUOTE_REQUESTED",
      "QUOTE_RECEIVED",
      "FUNDING_CONFIRMATION",
      "PURCHASING_REVIEW",
      "PURCHASE_ORDER_PENDING",
    ],
  },
  {
    value: "RENEW_WITH_CHANGES",
    label: "Renew with Changes",
    shortDescription:
      "Continue the product but change scope, modules, features, quantities, services, support level, term, or price.",
    guidance:
      "This is different from renegotiation: the intended scope change is known and should be tracked against financial impact.",
    requiredFields: ["Scope comparison", "Updated pricing", "Owner approval"],
    defaultTasks: [
      "Document added and removed scope",
      "Validate changed quantities",
      "Update forecast",
      "Collect owner approval",
    ],
    activeStages: [
      "REQUIREMENTS_VALIDATION",
      "QUOTE_NEGOTIATION",
      "FUNDING_CONFIRMATION",
      "MANAGEMENT_APPROVAL",
    ],
  },
  {
    value: "RENEGOTIATE",
    label: "Renegotiate",
    shortDescription:
      "Continue only if acceptable pricing, terms, scope, or service conditions can be obtained.",
    guidance:
      "Use this when the renewal is commercially conditional and the target outcome is still being negotiated.",
    requiredFields: [
      "Negotiation owner",
      "Target amount",
      "Maximum acceptable amount",
      "Decision deadline",
    ],
    defaultTasks: [
      "Set negotiation objective",
      "Record current quote",
      "Confirm alternative option",
      "Document negotiation outcome",
    ],
    activeStages: [
      "QUOTE_RECEIVED",
      "QUOTE_NEGOTIATION",
      "DISPOSITION_APPROVAL",
    ],
  },
  {
    value: "REPLACE",
    label: "Replace",
    shortDescription:
      "Transition to a different product or service that provides the same or improved capability.",
    guidance:
      "Replacement requires migration planning and may still need a temporary extension for the current product.",
    requiredFields: [
      "Replacement product or project",
      "Migration owner",
      "Migration target date",
      "Transition plan",
    ],
    defaultTasks: [
      "Create replacement plan",
      "Confirm migration owner",
      "Define transition risk",
      "Review contract overlap need",
    ],
    activeStages: [
      "DISPOSITION_APPROVAL",
      "REPLACEMENT_MIGRATION",
      "PURCHASING_REVIEW",
    ],
  },
  {
    value: "CONSOLIDATE",
    label: "Consolidate",
    shortDescription:
      "Move the capability into another existing product, platform, contract, or enterprise service.",
    guidance:
      "Unlike Replace, consolidation uses an existing destination and should track license, capability, and savings impacts.",
    requiredFields: [
      "Destination product",
      "Capability mapping",
      "Migration owner",
      "Savings estimate",
    ],
    defaultTasks: [
      "Identify destination platform",
      "Map current capability coverage",
      "Estimate license and cost impact",
      "Plan migration completion",
    ],
    activeStages: ["USAGE_VALUE_REVIEW", "REPLACEMENT_MIGRATION"],
  },
  {
    value: "EXTEND_TEMPORARILY",
    label: "Extend Temporarily",
    shortDescription:
      "Extend the current product for a limited period while replacement, procurement, migration, or a final decision completes.",
    guidance:
      "This is not a normal renewal. It must have an end date, reason, approver, and next decision milestone.",
    requiredFields: [
      "Extension length",
      "Extension end date",
      "Reason",
      "Authorized approver",
      "Next review date",
    ],
    defaultTasks: [
      "Document extension reason",
      "Confirm extension end date",
      "Record authorized approver",
      "Schedule follow-up decision",
    ],
    activeStages: [
      "DISPOSITION_APPROVAL",
      "QUOTE_NEGOTIATION",
      "PURCHASE_ORDER_PENDING",
    ],
  },
  {
    value: "DECOMMISSION",
    label: "Decommission",
    shortDescription:
      "Formally retire the application, service, product, platform, or capability through an operational shutdown process.",
    guidance:
      "Decommission is an operational retirement plan. It is not the same as the commercial choice to let a contract lapse.",
    requiredFields: [
      "Decommission owner",
      "Target decommission date",
      "Decommission plan",
      "Final signoff",
    ],
    defaultTasks: [
      "Create decommissioning plan",
      "Confirm business owner signoff",
      "Remove access and integrations",
      "Collect completion evidence",
    ],
    activeStages: ["DECOMMISSIONING", "COMPLETED"],
  },
  {
    value: "DO_NOT_RENEW",
    label: "Do Not Renew",
    shortDescription:
      "Allow the contract or subscription to expire without renewing it.",
    guidance:
      "Do Not Renew is a purchasing or commercial decision. It may still require a separate decommissioning plan.",
    requiredFields: [
      "Reason",
      "Vendor notice review",
      "Business impact confirmation",
      "Decommissioning required yes/no",
    ],
    defaultTasks: [
      "Document non-renewal reason",
      "Review vendor notice requirement",
      "Confirm business impact",
      "Decide whether decommissioning is required",
    ],
    activeStages: [
      "DISPOSITION_APPROVAL",
      "CANCELLED_NOT_RENEWING",
      "DECOMMISSIONING",
    ],
  },
];

export const dispositionDefinitionByValue = Object.fromEntries(
  dispositionDefinitions.map((definition) => [definition.value, definition])
) as Record<RenewalDisposition, DispositionDefinition>;

export function titleCaseEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function defaultTaskTitlesForDisposition(
  disposition: RenewalDisposition
) {
  return dispositionDefinitionByValue[disposition].defaultTasks;
}

export function requiresDecisionReason(input: {
  decisionStatus: RenewalDecisionStatus;
  recommendedDisposition?: RenewalDisposition;
  approvedDisposition?: RenewalDisposition;
}) {
  return (
    input.decisionStatus === "REJECTED" ||
    input.decisionStatus === "DEFERRED" ||
    Boolean(
      input.approvedDisposition &&
      input.recommendedDisposition &&
      input.approvedDisposition !== input.recommendedDisposition
    )
  );
}

export function validateDispositionRequirements(input: {
  disposition: RenewalDisposition;
  replacementRequired?: boolean;
  replacementProductId?: string;
  replacementProject?: string;
  targetReplacementDate?: string;
  decommissioningRequired?: boolean;
  targetDecommissionDate?: string;
  temporaryExtensionTerm?: string;
  nextReviewDate?: string;
  decisionDueDate?: string;
}) {
  const missing: string[] = [];

  if (
    input.disposition === "REPLACE" &&
    !input.replacementProductId &&
    !input.replacementProject
  ) {
    missing.push("replacement product or project");
  }

  if (input.disposition === "REPLACE" && !input.targetReplacementDate) {
    missing.push("target replacement date");
  }

  if (input.disposition === "DECOMMISSION" && !input.targetDecommissionDate) {
    missing.push("target decommission date");
  }

  if (
    input.disposition === "DO_NOT_RENEW" &&
    input.decommissioningRequired &&
    !input.targetDecommissionDate
  ) {
    missing.push("target decommission date");
  }

  if (
    input.disposition === "EXTEND_TEMPORARILY" &&
    (!input.temporaryExtensionTerm || !input.nextReviewDate)
  ) {
    missing.push("temporary extension term and next review date");
  }

  if (input.disposition === "DECISION_PENDING" && !input.decisionDueDate) {
    missing.push("decision due date");
  }

  return missing;
}
