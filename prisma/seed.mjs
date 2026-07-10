import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const connectionString =
  process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or POSTGRES_PRISMA_URL is required to seed the Prisma database."
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const date = (value) => new Date(`${value}T00:00:00.000Z`);

async function clearDatabase() {
  await prisma.activityLog.deleteMany();
  await prisma.note.deleteMany();
  await prisma.document.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.savingsRecord.deleteMany();
  await prisma.maintenanceRenewal.deleteMany();
  await prisma.budgetAnnualFinancial.deleteMany();
  await prisma.budgetLineItem.deleteMany();
  await prisma.purchaseRequest.deleteMany();
  await prisma.renewal.deleteMany();
  await prisma.budgetScenario.deleteMany();
  await prisma.budgetPlan.deleteMany();
  await prisma.budgetItem.deleteMany();
  await prisma.budgetAccount.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.productModule.deleteMany();
  await prisma.product.deleteMany();
  await prisma.reseller.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.budgetCategory.deleteMany();
  await prisma.fiscalYear.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await clearDatabase();

  const owner = await prisma.user.create({
    data: {
      email: "ciso@example.gov",
      name: "Jordan Rivera",
      role: "CISO",
    },
  });

  const fiscalYear = await prisma.fiscalYear.create({
    data: {
      label: "FY2027",
      startsOn: date("2026-07-01"),
      endsOn: date("2027-06-30"),
    },
  });

  const [fy2025, fy2026] = await Promise.all([
    prisma.fiscalYear.create({
      data: {
        label: "FY2025",
        startsOn: date("2024-07-01"),
        endsOn: date("2025-06-30"),
      },
    }),
    prisma.fiscalYear.create({
      data: {
        label: "FY2026",
        startsOn: date("2025-07-01"),
        endsOn: date("2026-06-30"),
      },
    }),
  ]);

  const budgetAccounts = await Promise.all(
    [
      ["acct-62050", "62050", "Conference / Staff Development", "TRAVEL_CONFERENCES", 10],
      ["acct-62081", "62081", "Organizational Dues", "ORGANIZATIONAL_DUES", 20],
      ["acct-62093", "62093", "Computer Hardware", "HARDWARE", 30],
      ["acct-62094", "62094", "Software / Software as a Service", "SOFTWARE_SAAS", 40],
      ["acct-62460", "62460", "Training Fees", "TRAINING", 50],
      ["acct-62026", "62026", "Business Travel", "TRAVEL_CONFERENCES", 60],
      ["acct-62225", "62225", "Professional Services", "PROFESSIONAL_SERVICES", 70],
      ["acct-63256", "63256", "Maintenance Contracts", "MAINTENANCE_RENEWALS", 80],
    ].map(([id, code, name, defaultWorksheet, sortOrder]) =>
      prisma.budgetAccount.create({
        data: {
          id,
          code,
          name,
          defaultWorksheet,
          sortOrder,
        },
      })
    )
  );

  const categories = await Promise.all(
    [
      "Identity & Access Management",
      "Endpoint Security",
      "Vulnerability & Exposure Management",
      "Workforce Security Awareness",
      "Cybersecurity Staff Training & Development",
      "Network Security",
    ].map((name) =>
      prisma.budgetCategory.create({
        data: {
          fiscalYearId: fiscalYear.id,
          name,
        },
      })
    )
  );

  const [identity, endpoint, exposure, awareness, staffTraining, network] =
    categories;

  const [microsoft, sentinelOne, rapid7, knowBe4, mimecast, sans, onetrust] =
    await Promise.all(
      [
        ["Microsoft", "https://www.microsoft.com/security"],
        ["SentinelOne", "https://www.sentinelone.com"],
        ["Rapid7", "https://www.rapid7.com"],
        ["KnowBe4", "https://www.knowbe4.com"],
        ["Mimecast", "https://www.mimecast.com"],
        ["SANS Institute", "https://www.sans.org"],
        ["OneTrust", "https://www.onetrust.com"],
      ].map(([name, website]) =>
        prisma.vendor.create({
          data: {
            name,
            website,
          },
        })
      )
    );

  const [shi, cdwg] = await Promise.all(
    [
      ["SHI Government Solutions", "https://www.shi.com"],
      ["CDW-G", "https://www.cdwg.com"],
    ].map(([name, website]) =>
      prisma.reseller.create({
        data: {
          name,
          website,
        },
      })
    )
  );

  const microsoftG5 = await prisma.product.create({
    data: {
      vendorId: microsoft.id,
      name: "Microsoft 365 G5",
      productCategory: "IDENTITY_ACCESS",
      capabilityCategory: "IAM",
      deploymentStatus: "ACTIVE",
      strategicValue: "CRITICAL",
      criticality: "CRITICAL",
      annualCost: "1250000.00",
      description:
        "Government licensing suite with identity, endpoint, and compliance capabilities.",
    },
  });

  const [entraP2, defenderOffice, purview] = await Promise.all(
    [
      [
        "Entra ID P2",
        "Privileged identity and conditional access capabilities.",
      ],
      [
        "Defender for Office 365 Plan 2",
        "Advanced email and collaboration protection.",
      ],
      ["Purview eDiscovery", "Compliance and investigation module."],
    ].map(([name, description]) =>
      prisma.productModule.create({
        data: {
          productId: microsoftG5.id,
          name,
          capabilityCategory: name === "Entra ID P2" ? "PAM" : "OTHER",
          enabled: true,
          adoptionLevel: "HIGH",
          description,
        },
      })
    )
  );

  const sentinelOneProduct = await prisma.product.create({
    data: {
      vendorId: sentinelOne.id,
      name: "Singularity Complete",
      productCategory: "ENDPOINT_SECURITY",
      capabilityCategory: "EDR",
      deploymentStatus: "ACTIVE",
      strategicValue: "CRITICAL",
      criticality: "CRITICAL",
      annualCost: "420000.00",
      description: "Endpoint detection, response, and protection platform.",
      modules: {
        create: [
          {
            name: "Cloud Workload Security",
            capabilityCategory: "CWPP",
            enabled: true,
            adoptionLevel: "MEDIUM",
            licenseCount: 700,
            usedCount: 390,
            moduleCost: "85000.00",
            description: "Runtime workload protection add-on.",
          },
        ],
      },
    },
  });

  const rapid7Product = await prisma.product.create({
    data: {
      vendorId: rapid7.id,
      name: "InsightVM",
      productCategory: "VULNERABILITY_EXPOSURE_MANAGEMENT",
      capabilityCategory: "VULNERABILITY_MANAGEMENT",
      deploymentStatus: "ACTIVE",
      strategicValue: "HIGH",
      criticality: "HIGH",
      annualCost: "295000.00",
      description: "Vulnerability and exposure management platform.",
      modules: {
        create: [
          {
            name: "Remediation Projects",
            capabilityCategory: "EXPOSURE_MANAGEMENT",
            enabled: true,
            adoptionLevel: "LOW",
            licenseCount: 1500,
            usedCount: 420,
            moduleCost: "45000.00",
            description: "Workflow support for remediation ownership.",
          },
        ],
      },
    },
  });

  const knowBe4Product = await prisma.product.create({
    data: {
      vendorId: knowBe4.id,
      name: "Security Awareness Training",
      productCategory: "WORKFORCE_SECURITY_AWARENESS",
      capabilityCategory: "SECURITY_AWARENESS",
      deploymentStatus: "ACTIVE",
      strategicValue: "HIGH",
      criticality: "MEDIUM",
      annualCost: "85000.00",
      description: "Security awareness and phishing simulation platform.",
      modules: {
        create: [
          {
            name: "PhishER",
            capabilityCategory: "PHISHING_SIMULATION",
            enabled: true,
            adoptionLevel: "LOW",
            licenseCount: 9000,
            usedCount: 2400,
            moduleCost: "18000.00",
            description: "Phishing incident triage and response module.",
          },
        ],
      },
    },
  });

  const mimecastProduct = await prisma.product.create({
    data: {
      vendorId: mimecast.id,
      name: "Mimecast Email Security",
      productCategory: "NETWORK_SECURITY",
      capabilityCategory: "EMAIL_SECURITY",
      deploymentStatus: "IMPLEMENTING",
      strategicValue: "HIGH",
      criticality: "HIGH",
      annualCost: "185000.00",
      description: "Email security, continuity, and archive platform.",
      modules: {
        create: [
          {
            name: "Targeted Threat Protection",
            capabilityCategory: "EMAIL_SECURITY",
            enabled: true,
            adoptionLevel: "MEDIUM",
            description: "URL, attachment, and impersonation protection.",
          },
        ],
      },
    },
  });

  const sansProduct = await prisma.product.create({
    data: {
      vendorId: sans.id,
      name: "SANS Training Vouchers",
      productCategory: "CYBERSECURITY_STAFF_TRAINING_DEVELOPMENT",
      capabilityCategory: "CERTIFICATION_TRAINING",
      deploymentStatus: "ACTIVE",
      strategicValue: "HIGH",
      criticality: "MEDIUM",
      annualCost: "140000.00",
      description:
        "Technical cybersecurity staff training and certification vouchers.",
    },
  });

  const microsoftContract = await prisma.contract.create({
    data: {
      vendorId: microsoft.id,
      resellerId: shi.id,
      ownerId: owner.id,
      contractNumber: "CT-FY27-MS-G5",
      title: "Microsoft 365 G5 Enterprise Agreement",
      contractType: "SAAS",
      associatedProductOrService: "Microsoft 365 G5",
      status: "ACTIVE",
      renewalDate: date("2027-05-01"),
      autoRenewal: false,
      noticePeriodDays: 90,
      annualValue: "1250000.00",
      totalValue: "1250000.00",
      paymentFrequency: "ANNUAL",
      businessOwner: "Digital Workplace",
      securityOwner: "Identity Security",
      procurementContact: "Casey Nguyen",
      vendorAccountManager: "Microsoft public sector account team",
      resellerAccountManager: "SHI account team",
      renewalRiskLevel: "MEDIUM",
      renewalStrategy: "Renew after license utilization review.",
      startsOn: date("2026-07-01"),
      endsOn: date("2027-06-30"),
      products: {
        connect: [{ id: microsoftG5.id }],
      },
      productModules: {
        connect: [
          { id: entraP2.id },
          { id: defenderOffice.id },
          { id: purview.id },
        ],
      },
    },
  });

  const sentinelOneContract = await prisma.contract.create({
    data: {
      vendorId: sentinelOne.id,
      resellerId: cdwg.id,
      ownerId: owner.id,
      contractNumber: "CT-FY27-S1",
      title: "SentinelOne Endpoint Protection",
      contractType: "SAAS",
      associatedProductOrService: "Singularity Complete",
      status: "ACTIVE",
      renewalDate: date("2027-07-01"),
      autoRenewal: false,
      noticePeriodDays: 90,
      annualValue: "420000.00",
      totalValue: "420000.00",
      paymentFrequency: "ANNUAL",
      businessOwner: "Infrastructure",
      securityOwner: "Endpoint Security",
      procurementContact: "Casey Nguyen",
      vendorAccountManager: "SentinelOne account team",
      resellerAccountManager: "CDW-G account team",
      renewalRiskLevel: "MEDIUM",
      renewalStrategy: "Benchmark endpoint bundle before renewal.",
      startsOn: date("2026-09-01"),
      endsOn: date("2027-08-31"),
      products: {
        connect: [{ id: sentinelOneProduct.id }],
      },
    },
  });

  const rapid7Contract = await prisma.contract.create({
    data: {
      vendorId: rapid7.id,
      ownerId: owner.id,
      contractNumber: "CT-FY27-R7",
      title: "Rapid7 Exposure Management",
      contractType: "SAAS",
      associatedProductOrService: "InsightVM",
      status: "RENEWING",
      renewalDate: date("2027-04-01"),
      autoRenewal: false,
      noticePeriodDays: 60,
      annualValue: "275000.00",
      totalValue: "275000.00",
      paymentFrequency: "ANNUAL",
      businessOwner: "Security Operations",
      securityOwner: "Exposure Management",
      procurementContact: "Casey Nguyen",
      vendorAccountManager: "Rapid7 account team",
      renewalRiskLevel: "HIGH",
      renewalStrategy: "Renew after module rationalization and seat review.",
      startsOn: date("2026-04-01"),
      endsOn: date("2027-03-31"),
      products: {
        connect: [{ id: rapid7Product.id }],
      },
    },
  });

  const rapid7Renewal = await prisma.renewal.create({
    data: {
      contractId: rapid7Contract.id,
      fiscalYearId: fiscalYear.id,
      ownerId: owner.id,
      title: "Rapid7 FY2027 Renewal",
      stage: "PROCUREMENT_REVIEW",
      status: "IN_PROGRESS",
      renewalDate: date("2027-04-01"),
      noticeDate: date("2026-12-31"),
      exposureAmount: "295000.00",
      products: {
        connect: [{ id: rapid7Product.id }],
      },
    },
  });

  const fy2027BudgetPlan = await prisma.budgetPlan.create({
    data: {
      fiscalYearId: fiscalYear.id,
      name: "FY2027 Cybersecurity Budget",
      status: "DRAFT",
      version: "Initial Request",
      priorFiscalYear: "FY2026",
      planningOwner: "Jennifer Morris",
      submissionDueDate: date("2026-09-15"),
      assumptions:
        "Renewals roll forward from current approved values with known quotes where available.",
      executiveNarrative:
        "Draft request prioritizes maintenance renewals, identity controls, staff training, and selective new risk reduction.",
    },
  });

  await Promise.all([
    prisma.budgetPlan.create({
      data: {
        fiscalYearId: fy2025.id,
        name: "FY2025 Cybersecurity Budget",
        status: "CLOSED",
        version: "Final Approved",
        planningOwner: "Jennifer Morris",
      },
    }),
    prisma.budgetPlan.create({
      data: {
        fiscalYearId: fy2026.id,
        name: "FY2026 Cybersecurity Budget",
        status: "APPROVED",
        version: "Final Approved",
        priorFiscalYear: "FY2025",
        planningOwner: "Jennifer Morris",
      },
    }),
  ]);

  const fy2027Scenario = await prisma.budgetScenario.create({
    data: {
      budgetPlanId: fy2027BudgetPlan.id,
      label: "INITIAL_REQUEST",
      description: "Working request before executive reduction review.",
      isActive: true,
    },
  });

  const accountByCode = new Map(
    budgetAccounts.map((account) => [account.code, account])
  );

  const onetrustItem = await prisma.budgetItem.create({
    data: {
      vendorId: onetrust.id,
      name: "OneTrust Platform Enterprise",
      owner: "Maria Santos",
      strategicProgramArea: "Governance, Risk & Compliance",
      description: "Privacy and third-party risk platform.",
    },
  });

  const rapid7BudgetItem = await prisma.budgetItem.create({
    data: {
      vendorId: rapid7.id,
      contractId: rapid7Contract.id,
      productId: rapid7Product.id,
      name: "Rapid7 InsightIDR",
      owner: "David Kim",
      strategicProgramArea: "Security Operations",
      description: "Detection and response renewal.",
    },
  });

  const sansBudgetItem = await prisma.budgetItem.create({
    data: {
      vendorId: sans.id,
      productId: sansProduct.id,
      name: "SANS Institute Technical Training",
      owner: "Lisa Grant",
      strategicProgramArea: "Cybersecurity Staff Training & Development",
      description: "Security staff training vouchers.",
    },
  });

  const onetrustAnnual = await prisma.budgetAnnualFinancial.create({
    data: {
      budgetPlanId: fy2027BudgetPlan.id,
      scenarioId: fy2027Scenario.id,
      fiscalYearId: fiscalYear.id,
      budgetItemId: onetrustItem.id,
      accountId: accountByCode.get("62094").id,
      worksheet: "SOFTWARE_SAAS",
      priorApprovedAmount: "187740.00",
      currentApprovedAmount: "195000.00",
      baseAmount: "187740.00",
      requestedAmount: "187740.00",
      proposedAmount: "187740.00",
      forecastAmount: "187740.00",
      fundingStatus: "REQUESTED",
      reviewState: "NEEDS_REVIEW",
      comments: "Negotiated renewal below initial vendor quote.",
      businessJustification:
        "Maintains governance, privacy, and third-party risk operations.",
      riskIfNotFunded:
        "Manual supplier risk intake and reporting would continue.",
    },
  });

  const rapid7Annual = await prisma.budgetAnnualFinancial.create({
    data: {
      budgetPlanId: fy2027BudgetPlan.id,
      scenarioId: fy2027Scenario.id,
      fiscalYearId: fiscalYear.id,
      budgetItemId: rapid7BudgetItem.id,
      accountId: accountByCode.get("63256").id,
      worksheet: "MAINTENANCE_RENEWALS",
      priorApprovedAmount: "86000.00",
      currentApprovedAmount: "90000.00",
      baseAmount: "90000.00",
      requestedAmount: "95000.00",
      proposedAmount: "95000.00",
      forecastAmount: "95000.00",
      fundingStatus: "RECOMMENDED",
      reviewState: "UPDATED",
      comments: "Known renewal quote carried into budget.",
    },
  });

  await prisma.budgetAnnualFinancial.create({
    data: {
      budgetPlanId: fy2027BudgetPlan.id,
      scenarioId: fy2027Scenario.id,
      fiscalYearId: fiscalYear.id,
      budgetItemId: sansBudgetItem.id,
      accountId: accountByCode.get("62460").id,
      worksheet: "TRAINING",
      priorApprovedAmount: "60000.00",
      currentApprovedAmount: "60000.00",
      baseAmount: "66708.00",
      requestedAmount: "66708.00",
      proposedAmount: "66708.00",
      forecastAmount: "66708.00",
      unitCost: "5559.00",
      quantity: "12.00",
      fundingStatus: "REQUESTED",
      reviewState: "UPDATED",
      comments: "12 attendees at 5,559 each.",
    },
  });

  const oneTrustMaintenanceRenewal = await prisma.maintenanceRenewal.create({
    data: {
      budgetPlanId: fy2027BudgetPlan.id,
      fiscalYearId: fiscalYear.id,
      linkedAnnualFinancialId: onetrustAnnual.id,
      vendorId: onetrust.id,
      fundingAccountId: accountByCode.get("62094").id,
      productOrService: "OneTrust Platform Enterprise",
      currentAnnualCost: "195000.00",
      renewalQuote: "212900.00",
      negotiatedCost: "187740.00",
      renewalDate: date("2027-01-15"),
      contractStart: date("2027-02-01"),
      contractEnd: date("2028-01-31"),
      noticePeriodDays: 180,
      noticeDate: date("2026-07-19"),
      paymentFrequency: "ANNUAL",
      renewalStatus: "NEGOTIATING",
      procurementStatus: "IN_PREPARATION",
      renewalOwner: "Maria Santos",
      procurementOwner: "Casey Nguyen",
      renewalStrategy:
        "Negotiated concession creates budget savings.",
      renewalRisk: "HIGH",
    },
  });

  await prisma.maintenanceRenewal.create({
    data: {
      budgetPlanId: fy2027BudgetPlan.id,
      fiscalYearId: fiscalYear.id,
      linkedAnnualFinancialId: rapid7Annual.id,
      vendorId: rapid7.id,
      contractId: rapid7Contract.id,
      productId: rapid7Product.id,
      fundingAccountId: accountByCode.get("63256").id,
      productOrService: "InsightIDR",
      currentAnnualCost: "90000.00",
      renewalQuote: "104500.00",
      negotiatedCost: "95000.00",
      renewalDate: date("2026-09-30"),
      contractStart: date("2026-09-30"),
      contractEnd: date("2027-09-29"),
      noticePeriodDays: 90,
      noticeDate: date("2026-07-02"),
      paymentFrequency: "ANNUAL",
      renewalStatus: "BUDGET_CONFIRMED",
      procurementStatus: "APPROVED",
      purchaseRequestNumber: "PR-FY27-REN-003",
      renewalOwner: "David Kim",
      procurementOwner: "Casey Nguyen",
      renewalRisk: "MEDIUM",
    },
  });

  await prisma.savingsRecord.create({
    data: {
      budgetPlanId: fy2027BudgetPlan.id,
      annualFinancialId: onetrustAnnual.id,
      maintenanceRenewalId: oneTrustMaintenanceRenewal.id,
      type: "CONTRACT_NEGOTIATION",
      description: "Negotiated OneTrust renewal below initial quote.",
      amount: "25160.00",
      costAvoidanceAmount: "0.00",
      isBudgetReduction: true,
      owner: "Maria Santos",
    },
  });

  const mimecastPurchaseRequest = await prisma.purchaseRequest.create({
    data: {
      fiscalYearId: fiscalYear.id,
      vendorId: mimecast.id,
      resellerId: cdwg.id,
      productId: mimecastProduct.id,
      ownerId: owner.id,
      requestNumber: "PR-FY27-EMAIL-001",
      title: "Mimecast email security expansion",
      status: "UNDER_REVIEW",
      requestAmount: "185000.00",
      submittedAt: date("2026-08-15"),
    },
  });

  const invoice = await prisma.invoice.create({
    data: {
      fiscalYearId: fiscalYear.id,
      vendorId: microsoft.id,
      resellerId: shi.id,
      contractId: microsoftContract.id,
      invoiceNumber: "INV-SHI-MS-G5-FY27-Q1",
      status: "PAID",
      amount: "312500.00",
      issuedOn: date("2026-07-15"),
      dueOn: date("2026-08-14"),
    },
  });

  await prisma.payment.create({
    data: {
      fiscalYearId: fiscalYear.id,
      invoiceId: invoice.id,
      contractId: microsoftContract.id,
      status: "PAID",
      amount: "312500.00",
      reference: "ACH-2026-0801-MS",
      paidOn: date("2026-08-01"),
    },
  });

  await prisma.budgetLineItem.createMany({
    data: [
      {
        fiscalYearId: fiscalYear.id,
        budgetCategoryId: identity.id,
        vendorId: microsoft.id,
        resellerId: shi.id,
        ownerId: owner.id,
        contractId: microsoftContract.id,
        productId: microsoftG5.id,
        name: "Microsoft G5 government licensing",
        productOrService: "Microsoft 365 G5",
        status: "APPROVED",
        expenseType: "SUBSCRIPTION",
        fundingType: "RENEWAL",
        budgetedAmount: "1250000.00",
        approvedAmount: "1250000.00",
        forecastAmount: "1250000.00",
        committedAmount: "1250000.00",
        actualAmount: "312500.00",
      },
      {
        fiscalYearId: fiscalYear.id,
        budgetCategoryId: endpoint.id,
        vendorId: sentinelOne.id,
        resellerId: cdwg.id,
        ownerId: owner.id,
        contractId: sentinelOneContract.id,
        productId: sentinelOneProduct.id,
        name: "SentinelOne endpoint protection",
        status: "APPROVED",
        expenseType: "SUBSCRIPTION",
        fundingType: "BASELINE",
        budgetedAmount: "420000.00",
        approvedAmount: "420000.00",
        forecastAmount: "430000.00",
        committedAmount: "420000.00",
        actualAmount: "0.00",
      },
      {
        fiscalYearId: fiscalYear.id,
        budgetCategoryId: exposure.id,
        vendorId: rapid7.id,
        ownerId: owner.id,
        contractId: rapid7Contract.id,
        renewalId: rapid7Renewal.id,
        productId: rapid7Product.id,
        name: "Rapid7 exposure management renewal",
        productOrService: "InsightVM",
        status: "REQUESTED",
        expenseType: "SOFTWARE_SAAS",
        fundingType: "RENEWAL",
        budgetedAmount: "295000.00",
        approvedAmount: "0.00",
        forecastAmount: "295000.00",
        committedAmount: "0.00",
        actualAmount: "0.00",
      },
      {
        fiscalYearId: fiscalYear.id,
        budgetCategoryId: awareness.id,
        vendorId: knowBe4.id,
        ownerId: owner.id,
        productId: knowBe4Product.id,
        name: "KnowBe4 awareness training",
        status: "APPROVED",
        expenseType: "TRAINING",
        fundingType: "BASELINE",
        budgetedAmount: "85000.00",
        approvedAmount: "85000.00",
        forecastAmount: "85000.00",
        committedAmount: "85000.00",
        actualAmount: "0.00",
      },
      {
        fiscalYearId: fiscalYear.id,
        budgetCategoryId: network.id,
        vendorId: mimecast.id,
        resellerId: cdwg.id,
        ownerId: owner.id,
        purchaseRequestId: mimecastPurchaseRequest.id,
        productId: mimecastProduct.id,
        name: "Mimecast email security platform",
        status: "REQUESTED",
        expenseType: "SUBSCRIPTION",
        fundingType: "EXPANSION",
        budgetedAmount: "185000.00",
        approvedAmount: "0.00",
        forecastAmount: "185000.00",
        committedAmount: "0.00",
        actualAmount: "0.00",
      },
      {
        fiscalYearId: fiscalYear.id,
        budgetCategoryId: staffTraining.id,
        vendorId: sans.id,
        ownerId: owner.id,
        productId: sansProduct.id,
        name: "SANS technical training vouchers",
        productOrService: "SANS Training Vouchers",
        status: "PARTIALLY_APPROVED",
        expenseType: "CERTIFICATION",
        fundingType: "BASELINE",
        budgetedAmount: "140000.00",
        approvedAmount: "90000.00",
        forecastAmount: "165000.00",
        committedAmount: "90000.00",
        actualAmount: "42000.00",
        businessJustification:
          "Maintains analyst and engineer depth for incident response and cloud security work.",
        riskIfNotFunded:
          "Critical staff certifications and advanced response skills would lag the threat profile.",
      },
    ],
  });

  await prisma.document.createMany({
    data: [
      {
        uploadedById: owner.id,
        vendorId: microsoft.id,
        resellerId: shi.id,
        contractId: microsoftContract.id,
        type: "CONTRACT",
        title: "Microsoft G5 Enterprise Agreement",
        url: "https://example.gov/documents/microsoft-g5-enterprise-agreement",
      },
      {
        uploadedById: owner.id,
        vendorId: mimecast.id,
        resellerId: cdwg.id,
        purchaseRequestId: mimecastPurchaseRequest.id,
        productId: mimecastProduct.id,
        type: "QUOTE",
        title: "Mimecast expansion quote",
        url: "https://example.gov/documents/mimecast-expansion-quote",
      },
    ],
  });

  await prisma.note.create({
    data: {
      authorId: owner.id,
      renewalId: rapid7Renewal.id,
      body: "Confirm whether exposure management renewal includes remediation workflow seats before procurement review closes.",
    },
  });

  await prisma.activityLog.create({
    data: {
      actorId: owner.id,
      action: "STATUS_CHANGE",
      entityType: "Renewal",
      entityId: rapid7Renewal.id,
      fieldName: "status",
      previousValue: "PLANNED",
      newValue: "IN_PROGRESS",
      metadata: {
        reason: "Initial seed data for Phase 1 database architecture.",
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
