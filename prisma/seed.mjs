import { config as loadEnv } from "dotenv";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

loadEnv({ path: ".env.local", override: false, quiet: true });
loadEnv({ path: ".env", override: false, quiet: true });

neonConfig.webSocketConstructor = ws;

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or POSTGRES_PRISMA_URL is required to seed the Prisma database."
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const date = (value) => new Date(`${value}T00:00:00.000Z`);

async function createCompany({
  name,
  website,
  roles,
  legalName,
  contactEmail,
}) {
  return prisma.company.create({
    data: {
      name,
      legalName,
      website,
      contactEmail,
      roles: {
        create: roles.map((role) => ({ role })),
      },
    },
  });
}

async function createLegacyVendor({ name, website }) {
  return prisma.vendor.create({
    data: {
      name,
      website,
    },
  });
}

async function createLegacyReseller({ name, website }) {
  return prisma.reseller.create({
    data: {
      name,
      website,
    },
  });
}

async function clearDatabase() {
  await prisma.activityLog.deleteMany();
  await prisma.note.deleteMany();
  await prisma.document.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.usageMeasurement.deleteMany();
  await prisma.deployment.deleteMany();
  await prisma.purchaseBudgetAllocation.deleteMany();
  await prisma.purchaseItemFeature.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
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
  await prisma.purchasingVehicleProductEligibility.deleteMany();
  await prisma.purchasingVehicleSeller.deleteMany();
  await prisma.purchasingVehicle.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.productFeatureCapability.deleteMany();
  await prisma.productModuleCapability.deleteMany();
  await prisma.productCapability.deleteMany();
  await prisma.productSeller.deleteMany();
  await prisma.productFeature.deleteMany();
  await prisma.productModule.deleteMany();
  await prisma.product.deleteMany();
  await prisma.capability.deleteMany();
  await prisma.companyRole.deleteMany();
  await prisma.company.deleteMany();
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
      [
        "acct-62050",
        "62050",
        "Conference / Staff Development",
        "TRAVEL_CONFERENCES",
        10,
      ],
      ["acct-62081", "62081", "Organizational Dues", "ORGANIZATIONAL_DUES", 20],
      ["acct-62093", "62093", "Computer Hardware", "HARDWARE", 30],
      [
        "acct-62094",
        "62094",
        "Software / Software as a Service",
        "SOFTWARE_SAAS",
        40,
      ],
      ["acct-62460", "62460", "Training Fees", "TRAINING", 50],
      ["acct-62026", "62026", "Business Travel", "TRAVEL_CONFERENCES", 60],
      [
        "acct-62225",
        "62225",
        "Professional Services",
        "PROFESSIONAL_SERVICES",
        70,
      ],
      [
        "acct-63256",
        "63256",
        "Maintenance Contracts",
        "MAINTENANCE_RENEWALS",
        80,
      ],
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

  const [
    microsoft,
    sentinelOne,
    rapid7,
    knowBe4,
    mimecast,
    sans,
    onetrust,
    paloAlto,
    google,
  ] = await Promise.all(
    [
      ["Microsoft", "https://www.microsoft.com/security"],
      ["SentinelOne", "https://www.sentinelone.com"],
      ["Rapid7", "https://www.rapid7.com"],
      ["KnowBe4", "https://www.knowbe4.com"],
      ["Mimecast", "https://www.mimecast.com"],
      ["SANS Institute", "https://www.sans.org"],
      ["OneTrust", "https://www.onetrust.com"],
      ["Palo Alto Networks", "https://www.paloaltonetworks.com"],
      ["Google", "https://cloud.google.com/security"],
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
      ["Presidio", "https://www.presidio.com"],
    ].map(([name, website]) =>
      prisma.reseller.create({
        data: {
          name,
          website,
        },
      })
    )
  );

  const [
    microsoftCompany,
    sentinelOneCompany,
    rapid7Company,
    knowBe4Company,
    mimecastCompany,
    sansCompany,
    onetrustCompany,
    paloAltoCompany,
    googleCompany,
    shiCompany,
    cdwgCompany,
    presidioCompany,
  ] = await Promise.all([
    createCompany({
      name: "Microsoft",
      website: "https://www.microsoft.com/security",
      roles: ["VENDOR"],
    }),
    createCompany({
      name: "SentinelOne",
      website: "https://www.sentinelone.com",
      roles: ["VENDOR"],
    }),
    createCompany({
      name: "Rapid7",
      website: "https://www.rapid7.com",
      roles: ["VENDOR"],
    }),
    createCompany({
      name: "KnowBe4",
      website: "https://www.knowbe4.com",
      roles: ["VENDOR"],
    }),
    createCompany({
      name: "Mimecast",
      website: "https://www.mimecast.com",
      roles: ["VENDOR"],
    }),
    createCompany({
      name: "SANS Institute",
      website: "https://www.sans.org",
      roles: ["VENDOR", "SERVICE_PROVIDER"],
    }),
    createCompany({
      name: "OneTrust",
      website: "https://www.onetrust.com",
      roles: ["VENDOR"],
    }),
    createCompany({
      name: "Palo Alto Networks",
      website: "https://www.paloaltonetworks.com",
      roles: ["VENDOR", "SERVICE_PROVIDER"],
    }),
    createCompany({
      name: "Google",
      website: "https://cloud.google.com/security",
      roles: ["VENDOR", "SERVICE_PROVIDER"],
    }),
    createCompany({
      name: "SHI Government Solutions",
      website: "https://www.shi.com",
      roles: ["RESELLER"],
    }),
    createCompany({
      name: "CDW-G",
      website: "https://www.cdwg.com",
      roles: ["RESELLER"],
    }),
    createCompany({
      name: "Presidio",
      website: "https://www.presidio.com",
      roles: ["RESELLER", "IMPLEMENTATION_PARTNER"],
    }),
  ]);

  const additionalVendorSpecs = [
    ["CrowdStrike", "https://www.crowdstrike.com"],
    ["Okta", "https://www.okta.com"],
    ["Zscaler", "https://www.zscaler.com"],
    ["Cloudflare", "https://www.cloudflare.com"],
    ["Cisco", "https://www.cisco.com"],
    ["Fortinet", "https://www.fortinet.com"],
    ["Check Point", "https://www.checkpoint.com"],
    ["Elastic", "https://www.elastic.co"],
    ["Orca Security", "https://orca.security"],
    ["Tanium", "https://www.tanium.com"],
    ["Tenable", "https://www.tenable.com"],
    ["Qualys", "https://www.qualys.com"],
    ["Trellix", "https://www.trellix.com"],
    ["Proofpoint", "https://www.proofpoint.com"],
    ["Abnormal Security", "https://abnormalsecurity.com"],
    ["Cofense", "https://cofense.com"],
    ["Duo Security", "https://duo.com"],
    ["CyberArk", "https://www.cyberark.com"],
    ["Delinea", "https://delinea.com"],
    ["SailPoint", "https://www.sailpoint.com"],
    ["Beyond Trust", "https://www.beyondtrust.com"],
    ["HashiCorp", "https://www.hashicorp.com"],
    ["1Password", "https://1password.com"],
    ["Bitwarden", "https://bitwarden.com"],
    ["Varonis", "https://www.varonis.com"],
    ["BigID", "https://bigid.com"],
    ["Rubrik", "https://www.rubrik.com"],
    ["Cohesity", "https://www.cohesity.com"],
    ["Arctic Wolf", "https://arcticwolf.com"],
    ["ReliaQuest", "https://www.reliaquest.com"],
    ["Dragos", "https://www.dragos.com"],
    ["Nozomi Networks", "https://www.nozominetworks.com"],
    ["Absolute", "https://www.absolute.com"],
    ["FireMon", "https://www.firemon.com"],
    ["Akamai", "https://www.akamai.com"],
    ["F5", "https://www.f5.com"],
    ["Imperva", "https://www.imperva.com"],
    ["Veracode", "https://www.veracode.com"],
    ["Snyk", "https://snyk.io"],
    ["Checkmarx", "https://checkmarx.com"],
    ["GitHub", "https://github.com"],
    ["GitLab", "https://about.gitlab.com"],
    ["CrowdStrike Services", "https://www.crowdstrike.com/services"],
    ["BlueVoyant", "https://www.bluevoyant.com"],
    ["Darktrace", "https://darktrace.com"],
    ["Recorded Future", "https://www.recordedfuture.com"],
    ["PagerDuty", "https://www.pagerduty.com"],
    ["Atlassian", "https://www.atlassian.com"],
    ["ManageEngine", "https://www.manageengine.com"],
    ["Zayo", "https://www.zayo.com"],
    ["ExtraHop", "https://www.extrahop.com"],
    ["Flashpoint", "https://flashpoint.io"],
    ["Armis", "https://www.armis.com"],
    ["Axonius", "https://www.axonius.com"],
    ["Jamf", "https://www.jamf.com"],
  ];

  const additionalResellerSpecs = [
    ["Carahsoft", "https://www.carahsoft.com"],
    ["Optiv", "https://www.optiv.com"],
    ["GuidePoint Security", "https://www.guidepointsecurity.com"],
    ["Solid Border", "https://solidborder.com"],
    ["Trace3", "https://www.trace3.com"],
    ["Insight Public Sector", "https://www.insight.com"],
    ["World Wide Technology", "https://www.wwt.com"],
    ["Connection Public Sector Solutions", "https://www.connection.com"],
    ["Zones", "https://www.zones.com"],
    ["Softchoice", "https://www.softchoice.com"],
    ["ePlus", "https://www.eplus.com"],
    ["Ahead", "https://www.ahead.com"],
    ["Computacenter", "https://www.computacenter.com"],
  ];

  const vendorCatalogEntries = await Promise.all(
    additionalVendorSpecs.map(async ([name, website]) => ({
      name,
      legacyVendor: await createLegacyVendor({ name, website }),
      company: await createCompany({
        name,
        website,
        roles:
          name.includes("Services") || name === "Mandiant"
            ? ["VENDOR", "SERVICE_PROVIDER"]
            : ["VENDOR"],
      }),
    }))
  );

  const resellerCatalogEntries = await Promise.all(
    additionalResellerSpecs.map(async ([name, website]) => ({
      name,
      legacyReseller: await createLegacyReseller({ name, website }),
      company: await createCompany({
        name,
        website,
        roles:
          name === "GuidePoint Security" || name === "Optiv"
            ? ["RESELLER", "SERVICE_PROVIDER", "CONSULTANT"]
            : ["RESELLER"],
      }),
    }))
  );

  const vendorCatalog = new Map(
    [
      { name: "Microsoft", legacyVendor: microsoft, company: microsoftCompany },
      {
        name: "SentinelOne",
        legacyVendor: sentinelOne,
        company: sentinelOneCompany,
      },
      { name: "Rapid7", legacyVendor: rapid7, company: rapid7Company },
      { name: "KnowBe4", legacyVendor: knowBe4, company: knowBe4Company },
      { name: "Mimecast", legacyVendor: mimecast, company: mimecastCompany },
      { name: "SANS Institute", legacyVendor: sans, company: sansCompany },
      { name: "OneTrust", legacyVendor: onetrust, company: onetrustCompany },
      { name: "Google", legacyVendor: google, company: googleCompany },
      {
        name: "Palo Alto Networks",
        legacyVendor: paloAlto,
        company: paloAltoCompany,
      },
      ...vendorCatalogEntries,
    ].map((entry) => [entry.name, entry])
  );

  const resellerCatalog = new Map(
    [
      {
        name: "SHI Government Solutions",
        legacyReseller: shi,
        company: shiCompany,
      },
      { name: "CDW-G", legacyReseller: cdwg, company: cdwgCompany },
      {
        name: "Presidio",
        legacyReseller: await prisma.reseller.findFirst({
          where: { name: "Presidio" },
        }),
        company: presidioCompany,
      },
      ...resellerCatalogEntries,
    ].map((entry) => [entry.name, entry])
  );

  const capabilities = await Promise.all(
    [
      ["capability-iam", "IAM"],
      ["capability-pam", "PAM"],
      ["capability-mfa", "MFA"],
      ["capability-sso", "SSO"],
      ["capability-edr", "EDR"],
      ["capability-xdr", "XDR"],
      ["capability-siem", "SIEM"],
      ["capability-soar", "SOAR"],
      ["capability-threat-detection-response", "Threat Detection and Response"],
      ["capability-incident-management", "Incident Management"],
      ["capability-dlp", "DLP"],
      ["capability-email-security", "Email Security"],
      ["capability-security-awareness", "Security Awareness"],
      ["capability-certification-training", "Certification Training"],
      ["capability-staff-training", "Staff Training"],
      ["capability-mdr", "MDR"],
      ["capability-exposure-management", "Exposure Management"],
      ["capability-vulnerability-management", "Vulnerability Management"],
      ["capability-cnapp", "CNAPP"],
      ["capability-sase", "SASE"],
      ["capability-sse", "SSE"],
      ["capability-ztna", "ZTNA"],
      ["capability-waf", "WAF"],
      ["capability-appsec", "Application Security"],
      ["capability-api-security", "API Security"],
      ["capability-dspm", "DSPM"],
      ["capability-grc", "GRC"],
      ["capability-third-party-risk", "Third-Party Risk"],
      ["capability-ndr", "NDR"],
      ["capability-ot-security", "OT Security"],
      ["capability-security-validation", "Security Validation"],
      ["capability-password-management", "Password Management"],
      ["capability-secrets-management", "Secrets Management"],
      ["capability-mobile-security", "Mobile Security"],
      ["capability-backup-resilience", "Backup Resilience"],
      ["capability-backup", "Backup"],
      ["capability-asset-management", "Asset Management"],
      ["capability-asset-inventory", "Asset Inventory"],
      ["capability-mdm", "MDM"],
      ["capability-threat-intelligence", "Threat Intelligence"],
      ["capability-email-protection", "Email Protection"],
      ["capability-managed-detection", "Managed Detection"],
      ["capability-incident-response", "Incident Response"],
      ["capability-casb", "CASB"],
      ["capability-cspm", "CSPM"],
      ["capability-cwpp", "CWPP"],
      ["capability-dns-security", "DNS Security"],
      ["capability-firewall", "Firewall"],
      ["capability-ips", "IPS"],
      ["capability-secure-web-gateway", "Secure Web Gateway"],
    ].map(([id, name]) =>
      prisma.capability.create({
        data: {
          id,
          name,
        },
      })
    )
  );

  const capabilityByName = new Map(
    capabilities.map((capability) => [capability.name, capability])
  );

  const microsoftG5 = await prisma.product.create({
    data: {
      vendorId: microsoft.id,
      vendorCompanyId: microsoftCompany.id,
      name: "Microsoft 365 G5",
      offeringType: "SAAS",
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
      vendorCompanyId: sentinelOneCompany.id,
      name: "Singularity Complete",
      offeringType: "SAAS",
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
      vendorCompanyId: rapid7Company.id,
      name: "InsightVM",
      offeringType: "SAAS",
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
      vendorCompanyId: knowBe4Company.id,
      name: "Security Awareness Training",
      offeringType: "TRAINING",
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
      vendorCompanyId: mimecastCompany.id,
      name: "Mimecast Email Security",
      offeringType: "SAAS",
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
      vendorCompanyId: sansCompany.id,
      name: "SANS Training Vouchers",
      offeringType: "TRAINING",
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

  const cortexXsiam = await prisma.product.create({
    data: {
      vendorId: paloAlto.id,
      vendorCompanyId: paloAltoCompany.id,
      name: "Cortex XSIAM",
      offeringType: "SAAS",
      productCategory: "SECURITY_OPERATIONS",
      capabilityCategory: "XDR",
      deploymentStatus: "PLANNED",
      strategicValue: "HIGH",
      criticality: "HIGH",
      annualCost: "0.00",
      description: "Security operations platform for SIEM, SOAR, and XDR.",
    },
  });

  const [xsiamDataIngestion] = await Promise.all(
    [
      [
        "Additional Data Ingestion",
        "CAPACITY",
        "XSIAM-INGEST",
        "GIGABYTES_PER_DAY",
        "Commercial capacity add-on for expanded log ingestion.",
      ],
      [
        "Premium Support",
        "SUPPORT",
        "XSIAM-SUPPORT",
        "FIXED_SERVICE",
        "Commercial support package for the XSIAM deployment.",
      ],
    ].map(([name, componentType, sku, licenseMetric, description]) =>
      prisma.productModule.create({
        data: {
          productId: cortexXsiam.id,
          name,
          componentType,
          sku,
          licenseMetric,
          separatelyPurchasable: true,
          separatelyRenewable: true,
          capabilityCategory: "OTHER",
          active: true,
          enabled: false,
          adoptionLevel: "NOT_USED",
          purpose: description,
          description,
        },
      })
    )
  );

  const unit42Mdr = await prisma.product.create({
    data: {
      vendorId: paloAlto.id,
      vendorCompanyId: paloAltoCompany.id,
      name: "Unit 42 Managed Detection and Response",
      offeringType: "MANAGED_SERVICE",
      productCategory: "MANAGED_SECURITY_SERVICES",
      capabilityCategory: "MDR",
      deploymentStatus: "UNDER_REVIEW",
      strategicValue: "HIGH",
      criticality: "HIGH",
      annualCost: "0.00",
      description:
        "Palo Alto Networks Unit 42 managed detection and response service offering.",
    },
  });

  async function createCatalogProduct({
    vendorName,
    productName,
    offeringType = "SAAS",
    productCategory,
    capabilityCategory,
    capabilities,
    description,
    modules = [],
    functions = [],
  }) {
    const vendorEntry = vendorCatalog.get(vendorName);

    if (!vendorEntry) {
      throw new Error(`Seed vendor not found: ${vendorName}`);
    }

    const product = await prisma.product.create({
      data: {
        vendorId: vendorEntry.legacyVendor.id,
        vendorCompanyId: vendorEntry.company.id,
        name: productName,
        offeringType,
        productCategory,
        capabilityCategory,
        deploymentStatus: "PLANNED",
        strategicValue: "HIGH",
        criticality: "HIGH",
        annualCost: "0.00",
        description,
        modules: modules.length
          ? {
              create: modules.map((module) => ({
                name: module.name,
                description: module.description,
                capabilityCategory:
                  module.capabilityCategory ?? capabilityCategory,
                active: true,
                enabled: false,
                adoptionLevel: "NOT_USED",
              })),
            }
          : undefined,
      },
    });

    const capabilityRows = capabilities
      .map((capabilityName) => capabilityByName.get(capabilityName))
      .filter(Boolean)
      .map((capability) => ({
        productId: product.id,
        capabilityId: capability.id,
      }));

    if (capabilityRows.length) {
      await prisma.productCapability.createMany({ data: capabilityRows });
    }

    if (functions.length) {
      const createdModules = modules.length
        ? await prisma.productModule.findMany({
            where: { productId: product.id },
            select: { id: true, name: true },
          })
        : [];
      const moduleByName = new Map(
        createdModules.map((module) => [module.name, module])
      );

      for (const productFunction of functions) {
        await prisma.productFeature.create({
          data: {
            productId: product.id,
            moduleId: productFunction.moduleName
              ? moduleByName.get(productFunction.moduleName)?.id
              : undefined,
            relatedCapabilityId: productFunction.relatedCapability
              ? capabilityByName.get(productFunction.relatedCapability)?.id
              : undefined,
            name: productFunction.name,
            description: productFunction.description,
            strategicImportance: productFunction.strategicImportance ?? "HIGH",
            notesText: productFunction.notesText,
            capabilities: {
              create: (productFunction.capabilities ?? [])
                .map((capabilityName) => capabilityByName.get(capabilityName))
                .filter(Boolean)
                .map((capability) => ({ capabilityId: capability.id })),
            },
          },
        });
      }
    }

    return product;
  }

  const expandedCatalogProducts = await Promise.all(
    [
      {
        vendorName: "CrowdStrike",
        productName: "Falcon Complete",
        productCategory: "ENDPOINT_SECURITY",
        capabilityCategory: "MDR",
        capabilities: ["EDR", "XDR", "MDR"],
        description: "Managed endpoint detection and response platform.",
        modules: [
          {
            name: "Falcon Insight XDR",
            description: "Endpoint and cross-domain detection telemetry.",
            capabilityCategory: "XDR",
          },
          {
            name: "Falcon Cloud Security",
            description: "Cloud security posture and workload protection.",
            capabilityCategory: "CNAPP",
          },
        ],
      },
      {
        vendorName: "Okta",
        productName: "Okta Workforce Identity",
        productCategory: "IDENTITY_ACCESS",
        capabilityCategory: "SSO",
        capabilities: ["IAM", "MFA", "SSO"],
        description: "Workforce identity, SSO, MFA, and lifecycle access.",
      },
      {
        vendorName: "Duo Security",
        productName: "Duo MFA",
        productCategory: "IDENTITY_ACCESS",
        capabilityCategory: "MFA",
        capabilities: ["MFA", "ZTNA"],
        description: "Multi-factor authentication and device trust controls.",
      },
      {
        vendorName: "CyberArk",
        productName: "CyberArk Privilege Cloud",
        productCategory: "IDENTITY_ACCESS",
        capabilityCategory: "PAM",
        capabilities: ["PAM", "Secrets Management"],
        description: "Privileged access management and credential security.",
      },
      {
        vendorName: "Delinea",
        productName: "Delinea Platform",
        productCategory: "IDENTITY_ACCESS",
        capabilityCategory: "PAM",
        capabilities: ["PAM", "Secrets Management"],
        description:
          "Privileged access management, secret server, and credential security platform.",
      },
      {
        vendorName: "SailPoint",
        productName: "Identity Security Cloud",
        productCategory: "IDENTITY_ACCESS",
        capabilityCategory: "IAM",
        capabilities: ["IAM", "GRC"],
        description: "Identity governance and administration platform.",
      },
      {
        vendorName: "Beyond Trust",
        productName: "Beyond Trust PRA and Endpoint Privilege Management",
        productCategory: "IDENTITY_ACCESS",
        capabilityCategory: "PAM",
        capabilities: ["PAM"],
        description:
          "Privileged remote access and endpoint privilege controls.",
      },
      {
        vendorName: "Zscaler",
        productName: "Zscaler Zero Trust Exchange",
        productCategory: "NETWORK_SECURITY",
        capabilityCategory: "SECURE_WEB_GATEWAY",
        capabilities: ["SASE", "SSE", "ZTNA", "CASB", "Secure Web Gateway"],
        description:
          "SASE/SSE platform for secure web, private app, and cloud access.",
        modules: [
          {
            name: "ZIA",
            description: "Secure internet and web gateway.",
            capabilityCategory: "SECURE_WEB_GATEWAY",
          },
          {
            name: "ZPA",
            description: "Zero-trust private application access.",
            capabilityCategory: "OTHER",
          },
        ],
      },
      {
        vendorName: "Cloudflare",
        productName: "Cloudflare One",
        productCategory: "NETWORK_SECURITY",
        capabilityCategory: "SECURE_WEB_GATEWAY",
        capabilities: ["SASE", "SSE", "ZTNA", "WAF", "DLP"],
        description: "Network, application, and zero-trust security platform.",
      },
      {
        vendorName: "Cisco",
        productName: "Cisco Umbrella SIG Essentials",
        productCategory: "NETWORK_SECURITY",
        capabilityCategory: "SECURE_WEB_GATEWAY",
        capabilities: ["SASE", "SSE", "ZTNA", "DNS Security"],
        description:
          "Cisco secure internet gateway bundle for DNS, web, and basic remote-user protection.",
      },
      {
        vendorName: "Fortinet",
        productName: "FortiGate and FortiSASE",
        productCategory: "NETWORK_SECURITY",
        capabilityCategory: "FIREWALL",
        capabilities: ["Firewall", "SASE", "IPS"],
        description: "Firewall, SD-WAN, and SASE security platform.",
      },
      {
        vendorName: "Check Point",
        productName: "Check Point Harmony and Quantum",
        productCategory: "NETWORK_SECURITY",
        capabilityCategory: "FIREWALL",
        capabilities: ["Firewall", "Email Security", "CNAPP"],
        description: "Network, endpoint, email, and cloud security portfolio.",
      },
      {
        vendorName: "Cisco",
        productName: "Cisco XDR",
        productCategory: "SECURITY_OPERATIONS",
        capabilityCategory: "XDR",
        capabilities: ["XDR", "Threat Detection and Response"],
        description:
          "Cisco extended detection and response platform for cross-tool investigation and correlation.",
      },
      {
        vendorName: "Elastic",
        productName: "Elastic Security",
        productCategory: "SECURITY_OPERATIONS",
        capabilityCategory: "SIEM",
        capabilities: ["SIEM", "EDR", "Threat Intelligence"],
        description:
          "Search-powered SIEM, endpoint, and threat hunting platform.",
      },
      {
        vendorName: "Google",
        productName: "Google Threat Intelligence",
        productCategory: "THREAT_INTELLIGENCE",
        capabilityCategory: "THREAT_INTELLIGENCE",
        capabilities: ["Threat Intelligence"],
        description:
          "Google intelligence content and enrichment services for threat monitoring and investigations.",
      },
      {
        vendorName: "Google",
        productName: "Google Security Command Center",
        productCategory: "CLOUD_SECURITY",
        capabilityCategory: "CNAPP",
        capabilities: ["CNAPP", "CSPM"],
        description:
          "Google Cloud security posture and risk visibility for cloud environments.",
      },
      {
        vendorName: "Orca Security",
        productName: "Orca Cloud Security Platform",
        productCategory: "CLOUD_SECURITY",
        capabilityCategory: "CNAPP",
        capabilities: ["CNAPP", "CSPM", "CWPP"],
        description:
          "Agentless cloud security and vulnerability risk platform.",
      },
      {
        vendorName: "Tenable",
        productName: "Tenable One",
        productCategory: "VULNERABILITY_EXPOSURE_MANAGEMENT",
        capabilityCategory: "EXPOSURE_MANAGEMENT",
        capabilities: [
          "Exposure Management",
          "Vulnerability Management",
          "CNAPP",
        ],
        description:
          "Exposure management across assets, cloud, identity, and vulnerabilities.",
      },
      {
        vendorName: "Tanium",
        productName: "Tanium XEM",
        productCategory: "ASSET_CONFIGURATION_MANAGEMENT",
        capabilityCategory: "ASSET_INVENTORY",
        capabilities: ["Asset Management", "Exposure Management"],
        description:
          "Endpoint management, asset visibility, vulnerability, and exposure management platform.",
      },
      {
        vendorName: "Qualys",
        productName: "Qualys VMDR",
        productCategory: "VULNERABILITY_EXPOSURE_MANAGEMENT",
        capabilityCategory: "VULNERABILITY_MANAGEMENT",
        capabilities: ["Vulnerability Management", "Asset Management"],
        description:
          "Vulnerability management, detection, and response platform.",
      },
      {
        vendorName: "Trellix",
        productName: "Trellix Endpoint Security",
        productCategory: "ENDPOINT_SECURITY",
        capabilityCategory: "EDR",
        capabilities: ["EDR", "XDR"],
        description: "Endpoint prevention, detection, and response platform.",
      },
      {
        vendorName: "Proofpoint",
        productName: "Proofpoint Email Protection",
        productCategory: "NETWORK_SECURITY",
        capabilityCategory: "EMAIL_SECURITY",
        capabilities: ["Email Security", "Email Protection", "DLP"],
        description:
          "Email threat protection and information protection platform.",
      },
      {
        vendorName: "Abnormal Security",
        productName: "Abnormal Behavior Technology Platform",
        productCategory: "NETWORK_SECURITY",
        capabilityCategory: "EMAIL_SECURITY",
        capabilities: ["Email Security", "Email Protection"],
        description:
          "Behavioral email security for business email compromise and social engineering.",
      },
      {
        vendorName: "Cofense",
        productName: "Cofense Phishing Defense Center",
        productCategory: "WORKFORCE_SECURITY_AWARENESS",
        capabilityCategory: "PHISHING_SIMULATION",
        capabilities: ["Phishing Simulation", "Email Protection"],
        description: "Phishing reporting, triage, and response services.",
      },
      {
        vendorName: "HashiCorp",
        productName: "HashiCorp Vault",
        productCategory: "IDENTITY_ACCESS",
        capabilityCategory: "PAM",
        capabilities: ["Secrets Management", "PAM"],
        description:
          "Secrets management, encryption, and machine identity platform.",
      },
      {
        vendorName: "1Password",
        productName: "1Password Extended Access Management",
        productCategory: "IDENTITY_ACCESS",
        capabilityCategory: "IAM",
        capabilities: ["Password Management", "IAM"],
        description: "Password management and extended access controls.",
      },
      {
        vendorName: "Bitwarden",
        productName: "Bitwarden Enterprise",
        productCategory: "IDENTITY_ACCESS",
        capabilityCategory: "IAM",
        capabilities: ["Password Management"],
        description: "Enterprise password management and secrets support.",
      },
      {
        vendorName: "Varonis",
        productName: "Varonis Data Security Platform",
        productCategory: "DATA_SECURITY",
        capabilityCategory: "DLP",
        capabilities: ["DLP", "DSPM"],
        description:
          "Data access governance, DSPM, and insider-risk visibility.",
      },
      {
        vendorName: "BigID",
        productName: "BigID Data Security Posture Management",
        productCategory: "DATA_SECURITY",
        capabilityCategory: "DSPM",
        capabilities: ["DSPM", "DLP"],
        description:
          "Data discovery, classification, privacy, and security posture management.",
      },
      {
        vendorName: "Rubrik",
        productName: "Rubrik Security Cloud",
        productCategory: "BACKUP_RESILIENCE",
        capabilityCategory: "BACKUP",
        capabilities: ["Backup Resilience"],
        description:
          "Cyber resilience, backup, recovery, and ransomware recovery platform.",
      },
      {
        vendorName: "Cohesity",
        productName: "Cohesity DataProtect",
        productCategory: "BACKUP_RESILIENCE",
        capabilityCategory: "BACKUP",
        capabilities: ["Backup Resilience"],
        description: "Backup, recovery, and data security platform.",
      },
      {
        vendorName: "Arctic Wolf",
        productName: "Arctic Wolf Managed Detection and Response",
        offeringType: "MANAGED_SERVICE",
        productCategory: "MANAGED_SECURITY_SERVICES",
        capabilityCategory: "MDR",
        capabilities: ["MDR", "Managed Detection"],
        description: "Managed detection and response service.",
      },
      {
        vendorName: "ReliaQuest",
        productName: "GreyMatter",
        offeringType: "MANAGED_SERVICE",
        productCategory: "MANAGED_SECURITY_SERVICES",
        capabilityCategory: "MDR",
        capabilities: ["MDR", "SIEM", "SOAR"],
        description:
          "Managed detection, response, and security operations platform.",
      },
      {
        vendorName: "Dragos",
        productName: "Dragos Platform",
        productCategory: "ASSET_CONFIGURATION_MANAGEMENT",
        capabilityCategory: "ASSET_INVENTORY",
        capabilities: ["OT Security", "Threat Intelligence"],
        description: "Industrial control system and OT security platform.",
      },
      {
        vendorName: "Nozomi Networks",
        productName: "Nozomi Networks Guardian",
        productCategory: "ASSET_CONFIGURATION_MANAGEMENT",
        capabilityCategory: "ASSET_INVENTORY",
        capabilities: ["OT Security", "NDR"],
        description: "OT, IoT, and network visibility and threat detection.",
      },
      {
        vendorName: "Absolute",
        productName: "Absolute Secure Endpoint",
        productCategory: "ENDPOINT_SECURITY",
        capabilityCategory: "MDM",
        capabilities: ["Asset Management", "Mobile Security"],
        description:
          "Endpoint resilience, device visibility, and control platform.",
      },
      {
        vendorName: "FireMon",
        productName: "FireMon Policy Manager",
        productCategory: "NETWORK_SECURITY",
        capabilityCategory: "FIREWALL",
        capabilities: ["Firewall"],
        description:
          "Firewall policy management, rule cleanup, and network security policy visibility.",
      },
      {
        vendorName: "Akamai",
        productName: "Akamai App and API Protector",
        productCategory: "APPLICATION_SECURITY",
        capabilityCategory: "OTHER",
        capabilities: ["WAF", "API Security"],
        description: "Web application and API protection platform.",
      },
      {
        vendorName: "F5",
        productName: "F5 Distributed Cloud WAAP",
        productCategory: "APPLICATION_SECURITY",
        capabilityCategory: "OTHER",
        capabilities: ["WAF", "API Security"],
        description: "Web application and API security controls.",
      },
      {
        vendorName: "Imperva",
        productName: "Imperva Application Security",
        productCategory: "APPLICATION_SECURITY",
        capabilityCategory: "OTHER",
        capabilities: ["WAF", "API Security", "DLP"],
        description: "Application, API, and data security platform.",
      },
      {
        vendorName: "Veracode",
        productName: "Veracode Application Risk Management",
        productCategory: "APPLICATION_SECURITY",
        capabilityCategory: "OTHER",
        capabilities: ["Application Security"],
        description: "Application security testing and risk management.",
      },
      {
        vendorName: "Snyk",
        productName: "Snyk AppRisk",
        productCategory: "APPLICATION_SECURITY",
        capabilityCategory: "OTHER",
        capabilities: ["Application Security", "API Security"],
        description:
          "Developer security, SCA, container, IaC, and application risk platform.",
      },
      {
        vendorName: "Checkmarx",
        productName: "Checkmarx One",
        productCategory: "APPLICATION_SECURITY",
        capabilityCategory: "OTHER",
        capabilities: ["Application Security", "API Security"],
        description: "Application security testing platform.",
      },
      {
        vendorName: "GitHub",
        productName: "GitHub Advanced Security",
        productCategory: "APPLICATION_SECURITY",
        capabilityCategory: "OTHER",
        capabilities: ["Application Security", "Secrets Management"],
        description: "Code scanning, secret scanning, and dependency security.",
      },
      {
        vendorName: "GitLab",
        productName: "GitLab Ultimate Security",
        productCategory: "APPLICATION_SECURITY",
        capabilityCategory: "OTHER",
        capabilities: ["Application Security", "Secrets Management"],
        description:
          "DevSecOps security testing and software supply chain controls.",
      },
      {
        vendorName: "Google",
        productName: "Google Cloud Threat Advisory",
        offeringType: "PROFESSIONAL_SERVICE",
        productCategory: "PROFESSIONAL_SERVICES",
        capabilityCategory: "THREAT_INTELLIGENCE",
        capabilities: ["Threat Intelligence"],
        description:
          "Google threat advisory and strategic intelligence support services.",
      },
      {
        vendorName: "CrowdStrike Services",
        productName: "CrowdStrike Incident Response Retainer",
        offeringType: "PROFESSIONAL_SERVICE",
        productCategory: "PROFESSIONAL_SERVICES",
        capabilityCategory: "INCIDENT_RESPONSE",
        capabilities: ["Incident Response"],
        description: "Incident response and proactive security services.",
      },
      {
        vendorName: "BlueVoyant",
        productName: "BlueVoyant MDR",
        offeringType: "MANAGED_SERVICE",
        productCategory: "MANAGED_SECURITY_SERVICES",
        capabilityCategory: "MDR",
        capabilities: ["MDR", "Managed Detection"],
        description: "Managed detection and response service.",
      },
      {
        vendorName: "Darktrace",
        productName: "Darktrace ActiveAI Security Platform",
        productCategory: "SECURITY_OPERATIONS",
        capabilityCategory: "OTHER",
        capabilities: ["NDR", "Email Security"],
        description:
          "Network, cloud, email, and operational security detection platform.",
      },
      {
        vendorName: "Recorded Future",
        productName: "Recorded Future Intelligence Cloud",
        productCategory: "THREAT_INTELLIGENCE",
        capabilityCategory: "THREAT_INTELLIGENCE",
        capabilities: ["Threat Intelligence"],
        description: "Threat intelligence platform.",
      },
      {
        vendorName: "PagerDuty",
        productName: "PagerDuty Operations Cloud",
        productCategory: "SECURITY_OPERATIONS",
        capabilityCategory: "INCIDENT_RESPONSE",
        capabilities: ["Incident Response"],
        description:
          "Incident response orchestration, on-call, and operational event management.",
      },
      {
        vendorName: "Atlassian",
        productName: "Jira Service Management",
        productCategory: "SECURITY_OPERATIONS",
        capabilityCategory: "INCIDENT_RESPONSE",
        capabilities: ["Incident Response"],
        description:
          "Service management and incident workflow platform for security operations.",
      },
      {
        vendorName: "ManageEngine",
        productName: "ManageEngine Endpoint Central",
        productCategory: "ENDPOINT_SECURITY",
        capabilityCategory: "MDM",
        capabilities: ["Asset Management", "Mobile Security"],
        description:
          "Endpoint management, patching, asset inventory, and endpoint controls.",
      },
      {
        vendorName: "Zayo",
        productName: "Zayo Secure Networking",
        productCategory: "NETWORK_SECURITY",
        capabilityCategory: "OTHER",
        capabilities: ["SASE", "Secure Web Gateway"],
        description:
          "Network connectivity and secure networking services for enterprise environments.",
      },
      {
        vendorName: "ExtraHop",
        productName: "ExtraHop RevealX",
        productCategory: "SECURITY_OPERATIONS",
        capabilityCategory: "OTHER",
        capabilities: ["NDR", "Threat Intelligence"],
        description:
          "Network detection and response platform for threat detection and investigation.",
      },
      {
        vendorName: "Flashpoint",
        productName: "Flashpoint Ignite",
        productCategory: "THREAT_INTELLIGENCE",
        capabilityCategory: "THREAT_INTELLIGENCE",
        capabilities: ["Threat Intelligence"],
        description:
          "Threat intelligence, vulnerability intelligence, and fraud intelligence.",
      },
      {
        vendorName: "Armis",
        productName: "Armis Centrix",
        productCategory: "ASSET_CONFIGURATION_MANAGEMENT",
        capabilityCategory: "ASSET_INVENTORY",
        capabilities: ["Asset Management", "OT Security"],
        description:
          "Cyber exposure management and asset intelligence platform.",
      },
      {
        vendorName: "Axonius",
        productName: "Axonius Cybersecurity Asset Management",
        productCategory: "ASSET_CONFIGURATION_MANAGEMENT",
        capabilityCategory: "ASSET_INVENTORY",
        capabilities: ["Asset Management"],
        description:
          "Cyber asset attack surface management and controls enforcement.",
      },
      {
        vendorName: "Jamf",
        productName: "Jamf Protect",
        productCategory: "ENDPOINT_SECURITY",
        capabilityCategory: "MDM",
        capabilities: ["Mobile Security", "EDR"],
        description: "Apple endpoint and mobile threat defense platform.",
      },
    ].map(createCatalogProduct)
  );

  const curatedCatalogProducts = await Promise.all(
    [
      {
        vendorName: "Microsoft",
        productName: "Microsoft Defender XDR",
        productCategory: "SECURITY_OPERATIONS",
        capabilityCategory: "XDR",
        capabilities: [
          "XDR",
          "EDR",
          "Email Security",
          "Threat Detection and Response",
          "Incident Response",
        ],
        description:
          "Unified XDR platform spanning endpoint, email, identity, and SaaS telemetry.",
        modules: [
          {
            name: "Defender for Endpoint",
            description:
              "Endpoint prevention, detection, investigation, and response.",
            capabilityCategory: "EDR",
          },
          {
            name: "Defender for Office 365",
            description:
              "Email, collaboration, and impersonation threat protection.",
            capabilityCategory: "EMAIL_SECURITY",
          },
          {
            name: "Defender for Identity",
            description:
              "Identity threat detection and lateral movement analytics.",
            capabilityCategory: "IAM",
          },
          {
            name: "Defender for Cloud Apps",
            description: "SaaS security posture and CASB controls.",
            capabilityCategory: "CASB",
          },
        ],
        functions: [
          {
            name: "Cross-domain incident queue",
            description:
              "Correlates endpoint, identity, email, and cloud alerts into unified incidents.",
            relatedCapability: "XDR",
            capabilities: ["XDR", "Incident Response"],
          },
          {
            moduleName: "Defender for Endpoint",
            name: "Endpoint isolation and live response",
            description:
              "Allows analysts to isolate hosts and run remote investigation actions.",
            relatedCapability: "EDR",
            capabilities: ["EDR", "Threat Detection and Response"],
          },
          {
            moduleName: "Defender for Office 365",
            name: "Safe Links and Safe Attachments",
            description:
              "Protects users against malicious URLs, payloads, and business-email-compromise campaigns.",
            relatedCapability: "Email Security",
            capabilities: ["Email Security"],
          },
          {
            moduleName: "Defender for Cloud Apps",
            name: "Shadow IT and SaaS session controls",
            description:
              "Discovers unsanctioned SaaS usage and applies inline session controls.",
            relatedCapability: "CASB",
            capabilities: ["CASB"],
          },
        ],
      },
      {
        vendorName: "Microsoft",
        productName: "Microsoft Sentinel",
        productCategory: "SECURITY_OPERATIONS",
        capabilityCategory: "SIEM",
        capabilities: [
          "SIEM",
          "SOAR",
          "Threat Intelligence",
          "Incident Management",
        ],
        description:
          "Cloud-native SIEM and automation platform for Microsoft and third-party telemetry.",
        modules: [
          {
            name: "Analytics Rules",
            description:
              "Detection content, scheduled rules, and alert tuning.",
            capabilityCategory: "SIEM",
          },
          {
            name: "Automation Rules and Playbooks",
            description: "Response orchestration using Logic Apps playbooks.",
            capabilityCategory: "SOAR",
          },
          {
            name: "Threat Intelligence Management",
            description:
              "Indicator ingestion, matching, and threat enrichment.",
            capabilityCategory: "THREAT_INTELLIGENCE",
          },
        ],
        functions: [
          {
            moduleName: "Analytics Rules",
            name: "Detection engineering and alert correlation",
            description:
              "Maintains detection content, suppression, and correlated incident workflows.",
            relatedCapability: "SIEM",
            capabilities: ["SIEM", "Incident Management"],
          },
          {
            moduleName: "Automation Rules and Playbooks",
            name: "Incident enrichment and containment playbooks",
            description:
              "Automates triage, ticketing, and response actions from Sentinel incidents.",
            relatedCapability: "SOAR",
            capabilities: ["SOAR", "Incident Response"],
          },
          {
            moduleName: "Threat Intelligence Management",
            name: "Indicator matching across incidents",
            description:
              "Applies internal and external indicators to surfaced detections and hunts.",
            relatedCapability: "Threat Intelligence",
            capabilities: ["Threat Intelligence"],
          },
        ],
      },
      {
        vendorName: "Microsoft",
        productName: "Microsoft Entra Suite",
        productCategory: "IDENTITY_ACCESS",
        capabilityCategory: "IAM",
        capabilities: ["IAM", "PAM", "MFA", "SSO", "ZTNA"],
        description:
          "Identity, privileged access, conditional access, and zero-trust network access portfolio.",
        modules: [
          {
            name: "Entra ID P2",
            description:
              "Conditional access, risk-based identity protection, and lifecycle controls.",
            capabilityCategory: "IAM",
          },
          {
            name: "Entra Private Access",
            description:
              "Zero-trust private application access for remote users.",
            capabilityCategory: "OTHER",
          },
          {
            name: "Entra Internet Access",
            description: "Identity-aware secure internet access controls.",
            capabilityCategory: "OTHER",
          },
          {
            name: "Entra ID Governance",
            description:
              "Access reviews, entitlement management, and approvals.",
            capabilityCategory: "PAM",
          },
        ],
        functions: [
          {
            moduleName: "Entra ID P2",
            name: "Conditional access and risk policies",
            description:
              "Applies identity, device, and session context to access control decisions.",
            relatedCapability: "IAM",
            capabilities: ["IAM", "MFA"],
          },
          {
            moduleName: "Entra ID Governance",
            name: "Access reviews and entitlement workflows",
            description:
              "Governs standing access, request flows, and periodic recertification.",
            relatedCapability: "PAM",
            capabilities: ["PAM", "IAM"],
          },
          {
            moduleName: "Entra Private Access",
            name: "Private application segmentation",
            description:
              "Provides brokered application access without exposing the internal network.",
            relatedCapability: "ZTNA",
            capabilities: ["ZTNA"],
          },
        ],
      },
      {
        vendorName: "Microsoft",
        productName: "Microsoft Purview",
        productCategory: "DATA_SECURITY",
        capabilityCategory: "DLP",
        capabilities: ["DLP", "DSPM", "GRC"],
        description:
          "Data security, investigation, insider risk, and compliance governance platform.",
        modules: [
          {
            name: "Data Loss Prevention",
            description:
              "Endpoint, email, Teams, and cloud-app data loss prevention.",
            capabilityCategory: "DLP",
          },
          {
            name: "eDiscovery and Audit",
            description:
              "Investigation, legal hold, and advanced audit tooling.",
            capabilityCategory: "GRC",
          },
          {
            name: "Insider Risk Management",
            description:
              "Insider risk detection, policying, and case management.",
            capabilityCategory: "GRC",
          },
          {
            name: "Information Protection",
            description:
              "Sensitivity labels, auto-labeling, and encryption controls.",
            capabilityCategory: "DLP",
          },
        ],
        functions: [
          {
            moduleName: "Data Loss Prevention",
            name: "Endpoint DLP",
            description:
              "Prevents sensitive-data exfiltration from managed endpoints.",
            relatedCapability: "DLP",
            capabilities: ["DLP"],
          },
          {
            moduleName: "Data Loss Prevention",
            name: "Teams and Exchange DLP",
            description:
              "Applies communication and collaboration DLP policies across Microsoft 365 workloads.",
            relatedCapability: "DLP",
            capabilities: ["DLP"],
          },
          {
            moduleName: "Information Protection",
            name: "Sensitivity labels and auto-labeling",
            description:
              "Classifies and protects data with persistent labeling and policy enforcement.",
            relatedCapability: "DLP",
            capabilities: ["DLP", "GRC"],
          },
          {
            moduleName: "eDiscovery and Audit",
            name: "Investigation holds and audit search",
            description:
              "Supports investigations, response, and legal/compliance evidence collection.",
            relatedCapability: "GRC",
            capabilities: ["GRC", "Incident Response"],
          },
        ],
      },
      {
        vendorName: "Microsoft",
        productName: "Microsoft Defender for Cloud",
        productCategory: "CLOUD_SECURITY",
        capabilityCategory: "CNAPP",
        capabilities: ["CNAPP", "CSPM", "CWPP"],
        description:
          "Cloud posture management, workload protection, and attack-path analytics.",
        modules: [
          {
            name: "Cloud Security Posture Management",
            description:
              "Continuous cloud misconfiguration and posture monitoring.",
            capabilityCategory: "CSPM",
          },
          {
            name: "Workload Protection",
            description:
              "Server, container, database, and Kubernetes workload protection plans.",
            capabilityCategory: "CWPP",
          },
        ],
        functions: [
          {
            moduleName: "Cloud Security Posture Management",
            name: "Regulatory posture and hardening recommendations",
            description:
              "Tracks posture drift, benchmark controls, and prioritized remediation guidance.",
            relatedCapability: "CSPM",
            capabilities: ["CSPM"],
          },
          {
            moduleName: "Workload Protection",
            name: "Agent-based server and container alerts",
            description:
              "Extends runtime workload monitoring and cloud alerting to protected resources.",
            relatedCapability: "CWPP",
            capabilities: ["CWPP"],
          },
        ],
      },
      {
        vendorName: "Palo Alto Networks",
        productName: "Cortex Cloud",
        productCategory: "CLOUD_SECURITY",
        capabilityCategory: "CNAPP",
        capabilities: ["CNAPP", "CSPM", "CWPP", "DSPM"],
        description:
          "Cloud security platform covering posture, runtime, application, and data risk.",
        modules: [
          {
            name: "Cloud Posture Security",
            description: "Cloud configuration, identity, and exposure posture.",
            capabilityCategory: "CSPM",
          },
          {
            name: "Runtime Security",
            description:
              "Runtime defense for hosts, containers, and serverless workloads.",
            capabilityCategory: "CWPP",
          },
          {
            name: "Application Security",
            description:
              "Code-to-cloud findings, supply-chain, and application risk signals.",
            capabilityCategory: "CNAPP",
          },
          {
            name: "Data Security",
            description:
              "Cloud data discovery, exposure analysis, and risk prioritization.",
            capabilityCategory: "DSPM",
          },
        ],
        functions: [
          {
            moduleName: "Cloud Posture Security",
            name: "Attack path and toxic-combination analysis",
            description:
              "Prioritizes exploitable cloud risk chains across identities, assets, and internet exposure.",
            relatedCapability: "CSPM",
            capabilities: ["CSPM", "CNAPP"],
          },
          {
            moduleName: "Runtime Security",
            name: "Container and host runtime defense",
            description:
              "Detects workload drift, privilege abuse, and malicious runtime behaviors.",
            relatedCapability: "CWPP",
            capabilities: ["CWPP"],
          },
          {
            moduleName: "Data Security",
            name: "Sensitive data discovery and public exposure monitoring",
            description:
              "Finds exposed cloud data stores and ties risk to identity and configuration context.",
            relatedCapability: "DSPM",
            capabilities: ["DSPM"],
          },
        ],
      },
      {
        vendorName: "Palo Alto Networks",
        productName: "Cortex XDR",
        productCategory: "ENDPOINT_SECURITY",
        capabilityCategory: "XDR",
        capabilities: ["XDR", "EDR", "Threat Detection and Response"],
        description:
          "Endpoint and cross-domain detection and response platform with behavioral analytics.",
        modules: [
          {
            name: "Endpoint Prevention",
            description:
              "Exploit prevention, malware prevention, and host protection.",
            capabilityCategory: "EDR",
          },
          {
            name: "Analytics and Correlation",
            description:
              "Cross-data behavioral analytics for endpoint, identity, and network signals.",
            capabilityCategory: "XDR",
          },
        ],
        functions: [
          {
            moduleName: "Endpoint Prevention",
            name: "Malware prevention and host isolation",
            description:
              "Stops malware and allows containment actions during response.",
            relatedCapability: "EDR",
            capabilities: ["EDR"],
          },
          {
            moduleName: "Analytics and Correlation",
            name: "Cross-domain detection correlation",
            description:
              "Links endpoint, identity, and network telemetry into correlated detections.",
            relatedCapability: "XDR",
            capabilities: ["XDR", "Threat Detection and Response"],
          },
        ],
      },
      {
        vendorName: "Palo Alto Networks",
        productName: "Prisma Access",
        productCategory: "NETWORK_SECURITY",
        capabilityCategory: "SECURE_WEB_GATEWAY",
        capabilities: ["SASE", "SSE", "ZTNA", "CASB", "Secure Web Gateway"],
        description:
          "Cloud-delivered SASE platform for users, branches, SaaS, and private apps.",
        modules: [
          {
            name: "Mobile Users",
            description:
              "User-based SSE controls for roaming and remote users.",
            capabilityCategory: "SECURE_WEB_GATEWAY",
          },
          {
            name: "Remote Networks",
            description:
              "Branch and site connectivity with cloud-enforced controls.",
            capabilityCategory: "SECURE_WEB_GATEWAY",
          },
          {
            name: "Explicit Proxy",
            description:
              "Forward-proxy support for managed egress enforcement.",
            capabilityCategory: "SECURE_WEB_GATEWAY",
          },
        ],
        functions: [
          {
            moduleName: "Mobile Users",
            name: "URL filtering and user-based policy",
            description:
              "Applies identity-aware web controls, malware inspection, and acceptable-use policy.",
            relatedCapability: "Secure Web Gateway",
            capabilities: ["Secure Web Gateway"],
          },
          {
            moduleName: "Remote Networks",
            name: "Branch policy enforcement",
            description:
              "Extends cloud security controls to branches and egress points without local appliances.",
            relatedCapability: "SASE",
            capabilities: ["SASE", "SSE"],
          },
          {
            name: "Private application access",
            description:
              "Delivers application-level access to internal apps without traditional VPN exposure.",
            relatedCapability: "ZTNA",
            capabilities: ["ZTNA"],
          },
        ],
      },
      {
        vendorName: "Palo Alto Networks",
        productName: "Strata Network Security Platform",
        productCategory: "NETWORK_SECURITY",
        capabilityCategory: "FIREWALL",
        capabilities: ["Firewall", "IPS", "DNS Security"],
        description:
          "Palo Alto Networks firewall platform for branch, campus, and data-center policy enforcement.",
        modules: [
          {
            name: "Next-Generation Firewall",
            description:
              "Policy, App-ID, SSL decryption, and threat prevention foundation.",
            capabilityCategory: "FIREWALL",
          },
          {
            name: "Advanced Threat Prevention",
            description:
              "Inline exploit, malware, and command-and-control protection.",
            capabilityCategory: "IPS",
          },
          {
            name: "Advanced URL Filtering",
            description:
              "URL categorization, risk signals, and acceptable-use controls.",
            capabilityCategory: "DNS_SECURITY",
          },
        ],
        functions: [
          {
            moduleName: "Next-Generation Firewall",
            name: "App-ID and user-based segmentation",
            description:
              "Applies application-aware and identity-aware controls to network traffic.",
            relatedCapability: "Firewall",
            capabilities: ["Firewall"],
          },
          {
            moduleName: "Advanced Threat Prevention",
            name: "Inline exploit and C2 disruption",
            description:
              "Blocks exploit attempts, malware delivery, and suspicious network sessions.",
            relatedCapability: "IPS",
            capabilities: ["IPS", "Threat Detection and Response"],
          },
        ],
      },
      {
        vendorName: "SentinelOne",
        productName: "Singularity Cloud Security",
        productCategory: "CLOUD_SECURITY",
        capabilityCategory: "CNAPP",
        capabilities: ["CNAPP", "CSPM", "CWPP"],
        description:
          "Cloud workload, posture, and runtime security for hybrid and multi-cloud environments.",
        modules: [
          {
            name: "Agentless CSPM",
            description:
              "Cloud posture and exposure discovery without host agents.",
            capabilityCategory: "CSPM",
          },
          {
            name: "Cloud Workload Runtime",
            description:
              "Cloud workload runtime detection and response controls.",
            capabilityCategory: "CWPP",
          },
        ],
        functions: [
          {
            moduleName: "Agentless CSPM",
            name: "Cloud misconfiguration and identity exposure monitoring",
            description:
              "Finds risky cloud posture, exposed assets, and excessive permissions.",
            relatedCapability: "CSPM",
            capabilities: ["CSPM", "CNAPP"],
          },
          {
            moduleName: "Cloud Workload Runtime",
            name: "Runtime drift and malicious behavior detection",
            description:
              "Detects runtime anomalies, persistence attempts, and suspicious cloud workload activity.",
            relatedCapability: "CWPP",
            capabilities: ["CWPP"],
          },
        ],
      },
      {
        vendorName: "SentinelOne",
        productName: "SentinelOne Vigilance MDR",
        offeringType: "MANAGED_SERVICE",
        productCategory: "MANAGED_SECURITY_SERVICES",
        capabilityCategory: "MDR",
        capabilities: [
          "MDR",
          "Managed Detection",
          "Threat Detection and Response",
        ],
        description:
          "SentinelOne managed detection and response service layer on Singularity telemetry.",
        modules: [
          {
            name: "24x7 Monitoring",
            description:
              "Analyst-led monitoring, triage, and escalation coverage.",
            capabilityCategory: "MDR",
          },
          {
            name: "Threat Hunting",
            description:
              "Proactive hunts and hypothesis-driven analyst investigations.",
            capabilityCategory: "MDR",
          },
        ],
        functions: [
          {
            moduleName: "24x7 Monitoring",
            name: "Managed alert triage and escalation",
            description:
              "Provides around-the-clock monitoring, verification, and escalation support.",
            relatedCapability: "MDR",
            capabilities: ["MDR", "Managed Detection"],
          },
          {
            moduleName: "Threat Hunting",
            name: "Analyst-led proactive hunting",
            description:
              "Searches SentinelOne telemetry for stealthy or emerging attacker behaviors.",
            relatedCapability: "Managed Detection",
            capabilities: [
              "Managed Detection",
              "Threat Detection and Response",
            ],
          },
        ],
      },
      {
        vendorName: "Rapid7",
        productName: "InsightIDR",
        productCategory: "SECURITY_OPERATIONS",
        capabilityCategory: "SIEM",
        capabilities: [
          "SIEM",
          "Threat Detection and Response",
          "Incident Management",
        ],
        description:
          "Rapid7 detection and response platform for SIEM, UEBA, and alert investigation.",
        modules: [
          {
            name: "Detection Library",
            description:
              "Managed and custom detection content for common attacker behaviors.",
            capabilityCategory: "SIEM",
          },
          {
            name: "User Behavior Analytics",
            description: "Identity and user anomaly monitoring.",
            capabilityCategory: "SIEM",
          },
          {
            name: "Case Management",
            description: "Investigation workflow and analyst case tracking.",
            capabilityCategory: "OTHER",
          },
        ],
        functions: [
          {
            moduleName: "Detection Library",
            name: "Managed detections and alert tuning",
            description:
              "Maintains detection coverage and environment-specific alert refinement.",
            relatedCapability: "SIEM",
            capabilities: ["SIEM"],
          },
          {
            moduleName: "User Behavior Analytics",
            name: "Identity anomaly monitoring",
            description:
              "Highlights unusual account use, privilege changes, and risky user behavior.",
            relatedCapability: "Threat Detection and Response",
            capabilities: ["Threat Detection and Response"],
          },
          {
            moduleName: "Case Management",
            name: "Investigation workflow tracking",
            description:
              "Tracks ownership, status, and evidence across analyst investigations.",
            relatedCapability: "Incident Management",
            capabilities: ["Incident Management"],
          },
        ],
      },
      {
        vendorName: "Rapid7",
        productName: "InsightConnect",
        productCategory: "SECURITY_OPERATIONS",
        capabilityCategory: "SOAR",
        capabilities: ["SOAR", "Incident Response"],
        description:
          "Rapid7 automation and orchestration platform for security operations workflows.",
        modules: [
          {
            name: "Workflow Builder",
            description:
              "Low-code automation workflows for security and IT actions.",
            capabilityCategory: "SOAR",
          },
          {
            name: "Case Integrations",
            description:
              "Integrated workflow triggers for ticketing and collaboration tools.",
            capabilityCategory: "SOAR",
          },
        ],
        functions: [
          {
            moduleName: "Workflow Builder",
            name: "Automated enrichment and containment flows",
            description:
              "Automates enrichment, validation, and repeatable response playbooks.",
            relatedCapability: "SOAR",
            capabilities: ["SOAR", "Incident Response"],
          },
          {
            moduleName: "Case Integrations",
            name: "Ticketing and notification orchestration",
            description:
              "Coordinates escalations and response handoffs across collaboration systems.",
            relatedCapability: "Incident Response",
            capabilities: ["Incident Response"],
          },
        ],
      },
      {
        vendorName: "Rapid7",
        productName: "Rapid7 MDR",
        offeringType: "MANAGED_SERVICE",
        productCategory: "MANAGED_SECURITY_SERVICES",
        capabilityCategory: "MDR",
        capabilities: [
          "MDR",
          "Managed Detection",
          "Threat Detection and Response",
        ],
        description:
          "Rapid7 managed detection and response service using InsightIDR and analyst operations.",
        modules: [
          {
            name: "Managed Detection",
            description:
              "Continuous alert monitoring and analyst investigation.",
            capabilityCategory: "MDR",
          },
          {
            name: "Threat Hunting",
            description:
              "Analyst-led proactive threat hunts and detection refinement.",
            capabilityCategory: "MDR",
          },
        ],
        functions: [
          {
            moduleName: "Managed Detection",
            name: "24x7 analyst monitoring",
            description:
              "Provides triage, escalation, and coordination support for high-priority detections.",
            relatedCapability: "MDR",
            capabilities: ["MDR", "Managed Detection"],
          },
          {
            moduleName: "Threat Hunting",
            name: "Proactive hunt and response recommendations",
            description:
              "Identifies emergent attacker behaviors and recommends targeted response actions.",
            relatedCapability: "Managed Detection",
            capabilities: [
              "Managed Detection",
              "Threat Detection and Response",
            ],
          },
        ],
      },
      {
        vendorName: "Rapid7",
        productName: "InsightCloudSec",
        productCategory: "CLOUD_SECURITY",
        capabilityCategory: "CNAPP",
        capabilities: ["CNAPP", "CSPM"],
        description:
          "Cloud security posture and governance platform for multi-cloud risk management.",
        modules: [
          {
            name: "Cloud Governance",
            description:
              "Policy monitoring, cloud posture, and remediation workflows.",
            capabilityCategory: "CSPM",
          },
          {
            name: "Infrastructure as Code Guardrails",
            description:
              "Policy checks for infrastructure definitions and cloud resource templates.",
            capabilityCategory: "CNAPP",
          },
        ],
        functions: [
          {
            moduleName: "Cloud Governance",
            name: "Cloud policy drift detection",
            description:
              "Flags posture drift, compliance issues, and owner-ready remediation context.",
            relatedCapability: "CSPM",
            capabilities: ["CSPM"],
          },
          {
            moduleName: "Infrastructure as Code Guardrails",
            name: "Preventive cloud policy checks",
            description:
              "Applies policy controls before infrastructure changes are promoted to runtime environments.",
            relatedCapability: "CNAPP",
            capabilities: ["CNAPP"],
          },
        ],
      },
      {
        vendorName: "Cisco",
        productName: "Cisco Secure Firewall",
        productCategory: "NETWORK_SECURITY",
        capabilityCategory: "FIREWALL",
        capabilities: ["Firewall", "IPS", "Threat Detection and Response"],
        description:
          "Cisco firewall platform for segmentation, IPS, malware defense, and network enforcement.",
        modules: [
          {
            name: "Firewall Policy",
            description:
              "Layer 3-7 policy, NAT, segmentation, and secure connectivity.",
            capabilityCategory: "FIREWALL",
          },
          {
            name: "Intrusion Prevention",
            description: "Inline IPS and exploit-blocking controls.",
            capabilityCategory: "IPS",
          },
          {
            name: "Malware Defense",
            description: "File and network malware inspection and disposition.",
            capabilityCategory: "OTHER",
          },
        ],
        functions: [
          {
            moduleName: "Firewall Policy",
            name: "Application and network segmentation",
            description:
              "Enforces policy between trusted zones, business systems, and sensitive assets.",
            relatedCapability: "Firewall",
            capabilities: ["Firewall"],
          },
          {
            moduleName: "Intrusion Prevention",
            name: "Inline exploit prevention",
            description:
              "Identifies and blocks exploit attempts, malicious traffic, and policy evasion.",
            relatedCapability: "IPS",
            capabilities: ["IPS", "Threat Detection and Response"],
          },
        ],
      },
      {
        vendorName: "Cisco",
        productName: "Cisco Umbrella",
        productCategory: "NETWORK_SECURITY",
        capabilityCategory: "DNS_SECURITY",
        capabilities: ["DNS Security", "Secure Web Gateway", "CASB"],
        description:
          "Cisco cloud-delivered DNS, web, and SaaS protection service.",
        modules: [
          {
            name: "DNS Security",
            description: "DNS-layer protection against malicious destinations.",
            capabilityCategory: "DNS_SECURITY",
          },
          {
            name: "Secure Web Gateway",
            description:
              "Web filtering, inspection, and web policy enforcement.",
            capabilityCategory: "SECURE_WEB_GATEWAY",
          },
          {
            name: "Cloud Access Security Broker",
            description: "Sanctioned SaaS posture and policy visibility.",
            capabilityCategory: "CASB",
          },
        ],
        functions: [
          {
            moduleName: "DNS Security",
            name: "Recursive DNS threat blocking",
            description:
              "Blocks user and branch access to malicious, risky, or prohibited destinations.",
            relatedCapability: "DNS Security",
            capabilities: ["DNS Security"],
          },
          {
            moduleName: "Secure Web Gateway",
            name: "URL filtering and web policy enforcement",
            description:
              "Applies user-aware web filtering and content controls across internet traffic.",
            relatedCapability: "Secure Web Gateway",
            capabilities: ["Secure Web Gateway"],
          },
        ],
      },
      {
        vendorName: "Cisco",
        productName: "Cisco Secure Access",
        productCategory: "NETWORK_SECURITY",
        capabilityCategory: "SECURE_WEB_GATEWAY",
        capabilities: ["SASE", "SSE", "ZTNA", "DNS Security"],
        description:
          "Cisco SSE and SASE platform for modern user, branch, and application access.",
        modules: [
          {
            name: "User Access",
            description:
              "Identity-aware internet and application access for users.",
            capabilityCategory: "SECURE_WEB_GATEWAY",
          },
          {
            name: "Private Application Access",
            description: "Zero-trust access to internal applications.",
            capabilityCategory: "OTHER",
          },
        ],
        functions: [
          {
            moduleName: "User Access",
            name: "User-based web access controls",
            description:
              "Applies policy, inspection, and acceptable-use controls to user internet traffic.",
            relatedCapability: "SSE",
            capabilities: ["SSE", "Secure Web Gateway"],
          },
          {
            moduleName: "Private Application Access",
            name: "Private app access without VPN sprawl",
            description:
              "Delivers granular access to internal apps using zero-trust principles.",
            relatedCapability: "ZTNA",
            capabilities: ["ZTNA"],
          },
        ],
      },
      {
        vendorName: "Cisco",
        productName: "Splunk Enterprise Security",
        productCategory: "SECURITY_OPERATIONS",
        capabilityCategory: "SIEM",
        capabilities: ["SIEM", "Threat Intelligence", "Incident Management"],
        description:
          "Cisco-owned Splunk SIEM and security content platform for enterprise SOC operations.",
        modules: [
          {
            name: "Correlation Searches",
            description: "Detection content and notable-event creation.",
            capabilityCategory: "SIEM",
          },
          {
            name: "Threat Intelligence Framework",
            description: "Indicator management and matching workflow support.",
            capabilityCategory: "THREAT_INTELLIGENCE",
          },
          {
            name: "Enterprise Security Analyst Queue",
            description: "Notable-event review and triage workflows.",
            capabilityCategory: "OTHER",
          },
        ],
        functions: [
          {
            moduleName: "Correlation Searches",
            name: "Detection engineering and notable-event correlation",
            description:
              "Transforms telemetry into prioritized notable events and tuned investigations.",
            relatedCapability: "SIEM",
            capabilities: ["SIEM"],
          },
          {
            moduleName: "Threat Intelligence Framework",
            name: "Indicator enrichment and matching",
            description:
              "Matches internal and external indicators against ingested telemetry for context.",
            relatedCapability: "Threat Intelligence",
            capabilities: ["Threat Intelligence"],
          },
        ],
      },
      {
        vendorName: "Cisco",
        productName: "Splunk SOAR",
        productCategory: "SECURITY_OPERATIONS",
        capabilityCategory: "SOAR",
        capabilities: ["SOAR", "Incident Response"],
        description:
          "Cisco-owned Splunk automation and orchestration platform for response workflows.",
        modules: [
          {
            name: "Playbook Automation",
            description:
              "Automated enrichment, triage, and containment playbooks.",
            capabilityCategory: "SOAR",
          },
          {
            name: "Analyst Workbench",
            description:
              "Case-centric automation and investigation handoff support.",
            capabilityCategory: "OTHER",
          },
        ],
        functions: [
          {
            moduleName: "Playbook Automation",
            name: "Automated enrichment and response actions",
            description:
              "Drives repeatable playbooks for triage, ticketing, containment, and communications.",
            relatedCapability: "SOAR",
            capabilities: ["SOAR", "Incident Response"],
          },
        ],
      },
      {
        vendorName: "Cisco",
        productName: "Duo Identity and Access",
        productCategory: "IDENTITY_ACCESS",
        capabilityCategory: "MFA",
        capabilities: ["MFA", "SSO", "ZTNA"],
        description:
          "Cisco-owned Duo security portfolio for multi-factor authentication and trusted access.",
        modules: [
          {
            name: "Multi-Factor Authentication",
            description:
              "Push, passkey, and phishing-resistant authentication controls.",
            capabilityCategory: "MFA",
          },
          {
            name: "Device Trust",
            description:
              "Managed-device and posture checks before access is granted.",
            capabilityCategory: "OTHER",
          },
        ],
        functions: [
          {
            moduleName: "Multi-Factor Authentication",
            name: "Phishing-resistant user authentication",
            description:
              "Strengthens workforce authentication through step-up and phishing-resistant controls.",
            relatedCapability: "MFA",
            capabilities: ["MFA"],
          },
          {
            moduleName: "Device Trust",
            name: "Access decisions using device posture",
            description:
              "Evaluates device state and trust before authorizing application access.",
            relatedCapability: "ZTNA",
            capabilities: ["ZTNA"],
          },
        ],
      },
      {
        vendorName: "Google",
        productName: "Wiz Cloud Security Platform",
        productCategory: "CLOUD_SECURITY",
        capabilityCategory: "CNAPP",
        capabilities: ["CNAPP", "CSPM", "CWPP", "DSPM"],
        description:
          "Google-owned Wiz platform for graph-based cloud exposure and posture analysis.",
        modules: [
          {
            name: "Security Graph",
            description:
              "Unified cloud graph across identities, workloads, data, and network paths.",
            capabilityCategory: "CNAPP",
          },
          {
            name: "Cloud Posture and Exposure",
            description:
              "Posture, external exposure, and toxic-combination risk analysis.",
            capabilityCategory: "CSPM",
          },
          {
            name: "Data Security Posture",
            description: "Sensitive-data discovery and data-exposure analysis.",
            capabilityCategory: "DSPM",
          },
        ],
        functions: [
          {
            moduleName: "Security Graph",
            name: "Attack path prioritization",
            description:
              "Highlights exploitable cloud risk paths that combine exposure, identity, and data sensitivity.",
            relatedCapability: "CNAPP",
            capabilities: ["CNAPP", "CSPM"],
          },
          {
            moduleName: "Data Security Posture",
            name: "Sensitive data exposure analysis",
            description:
              "Finds exposed storage, excessive data access, and risky data placement patterns.",
            relatedCapability: "DSPM",
            capabilities: ["DSPM"],
          },
        ],
      },
      {
        vendorName: "Google",
        productName: "Chronicle Security Operations",
        productCategory: "SECURITY_OPERATIONS",
        capabilityCategory: "SIEM",
        capabilities: ["SIEM", "SOAR", "Threat Intelligence"],
        description:
          "Google security operations platform for search, detection, hunting, and automated response.",
        modules: [
          {
            name: "Chronicle SIEM",
            description:
              "Security data search, detections, and large-scale investigations.",
            capabilityCategory: "SIEM",
          },
          {
            name: "Chronicle SOAR",
            description:
              "Playbook automation and response orchestration workflows.",
            capabilityCategory: "SOAR",
          },
          {
            name: "Google Threat Intelligence",
            description:
              "Threat intelligence context and enrichment for investigations.",
            capabilityCategory: "THREAT_INTELLIGENCE",
          },
        ],
        functions: [
          {
            moduleName: "Chronicle SIEM",
            name: "Telemetry search and detection engineering",
            description:
              "Supports high-scale search, UDM normalization, and detection content management.",
            relatedCapability: "SIEM",
            capabilities: ["SIEM"],
          },
          {
            moduleName: "Chronicle SOAR",
            name: "Automated response orchestration",
            description:
              "Automates case workflows, enrichment, and response activities across tooling.",
            relatedCapability: "SOAR",
            capabilities: ["SOAR", "Incident Response"],
          },
        ],
      },
      {
        vendorName: "Google",
        productName: "Security Command Center Enterprise",
        productCategory: "CLOUD_SECURITY",
        capabilityCategory: "CNAPP",
        capabilities: ["CNAPP", "CSPM", "Threat Intelligence"],
        description:
          "Google Cloud security posture, exposure, and attack-path management platform.",
        modules: [
          {
            name: "Cloud Asset Discovery",
            description:
              "Asset inventory and exposure context for Google Cloud environments.",
            capabilityCategory: "CSPM",
          },
          {
            name: "Attack Path Simulation",
            description:
              "Risk graphing and attacker path visualization for cloud risk.",
            capabilityCategory: "CNAPP",
          },
        ],
        functions: [
          {
            moduleName: "Attack Path Simulation",
            name: "Cloud attack path prioritization",
            description:
              "Surfaces the most exploitable risk chains for remediation prioritization.",
            relatedCapability: "CNAPP",
            capabilities: ["CNAPP", "Threat Intelligence"],
          },
        ],
      },
      {
        vendorName: "Google",
        productName: "Mandiant Incident Response Retainer",
        offeringType: "PROFESSIONAL_SERVICE",
        productCategory: "PROFESSIONAL_SERVICES",
        capabilityCategory: "INCIDENT_RESPONSE",
        capabilities: ["Incident Response", "Threat Intelligence"],
        description:
          "Google-owned Mandiant incident response, compromise assessment, and threat advisory retainer.",
        modules: [
          {
            name: "Incident Response Services",
            description:
              "Retained response support and major-incident mobilization.",
            capabilityCategory: "INCIDENT_RESPONSE",
          },
          {
            name: "Threat Intelligence Advisory",
            description:
              "Intelligence-backed guidance during crisis and readiness planning.",
            capabilityCategory: "THREAT_INTELLIGENCE",
          },
        ],
        functions: [
          {
            moduleName: "Incident Response Services",
            name: "Emergency incident mobilization",
            description:
              "Provides rapid responder access, containment guidance, and forensic support during major incidents.",
            relatedCapability: "Incident Response",
            capabilities: ["Incident Response"],
          },
          {
            moduleName: "Threat Intelligence Advisory",
            name: "Threat actor and intrusion intelligence support",
            description:
              "Supplies actor context, intrusion tradecraft, and threat-driven response recommendations.",
            relatedCapability: "Threat Intelligence",
            capabilities: ["Threat Intelligence"],
          },
        ],
      },
      {
        vendorName: "Tanium",
        productName: "Tanium Core Platform",
        productCategory: "ASSET_CONFIGURATION_MANAGEMENT",
        capabilityCategory: "ASSET_INVENTORY",
        capabilities: [
          "Asset Inventory",
          "Asset Management",
          "Exposure Management",
        ],
        description:
          "Tanium core platform for endpoint visibility, control, and real-time operations.",
        modules: [
          {
            name: "Asset Inventory",
            description:
              "Real-time endpoint discovery, inventory, and posture visibility.",
            capabilityCategory: "ASSET_INVENTORY",
          },
          {
            name: "Interact and Investigate",
            description:
              "Live endpoint query and investigative operations tooling.",
            capabilityCategory: "OTHER",
          },
        ],
        functions: [
          {
            moduleName: "Asset Inventory",
            name: "Real-time endpoint census",
            description:
              "Maintains real-time visibility into device inventory, ownership, and health state.",
            relatedCapability: "Asset Inventory",
            capabilities: ["Asset Inventory", "Asset Management"],
          },
          {
            moduleName: "Interact and Investigate",
            name: "Live endpoint interrogation",
            description:
              "Lets operations and security teams ask live questions and validate remediation at scale.",
            relatedCapability: "Asset Management",
            capabilities: ["Asset Management", "Exposure Management"],
          },
        ],
      },
      {
        vendorName: "Tanium",
        productName: "Tanium Endpoint Management",
        productCategory: "ASSET_CONFIGURATION_MANAGEMENT",
        capabilityCategory: "MDM",
        capabilities: ["MDM", "Asset Management"],
        description:
          "Tanium endpoint operations suite for deployment, patching, and endpoint control.",
        modules: [
          {
            name: "Tanium Deploy",
            description: "Software deployment and package distribution.",
            capabilityCategory: "MDM",
          },
          {
            name: "Tanium Patch",
            description: "Patch deployment, exception handling, and reporting.",
            capabilityCategory: "MDM",
          },
        ],
        functions: [
          {
            moduleName: "Tanium Deploy",
            name: "Software package deployment",
            description:
              "Deploys security and operational software to targeted endpoint populations.",
            relatedCapability: "MDM",
            capabilities: ["MDM", "Asset Management"],
          },
          {
            moduleName: "Tanium Patch",
            name: "Patch orchestration and compliance reporting",
            description:
              "Schedules patching, validates completion, and reports endpoint patch posture.",
            relatedCapability: "MDM",
            capabilities: ["MDM", "Exposure Management"],
          },
        ],
      },
      {
        vendorName: "Tanium",
        productName: "Tanium Comply",
        productCategory: "VULNERABILITY_EXPOSURE_MANAGEMENT",
        capabilityCategory: "VULNERABILITY_MANAGEMENT",
        capabilities: [
          "Vulnerability Management",
          "Exposure Management",
          "Security Validation",
        ],
        description:
          "Tanium vulnerability, configuration, and compliance platform for endpoint exposure reduction.",
        modules: [
          {
            name: "Vulnerability Exposure",
            description: "Endpoint vulnerability discovery and prioritization.",
            capabilityCategory: "VULNERABILITY_MANAGEMENT",
          },
          {
            name: "Configuration Compliance",
            description:
              "Configuration drift, benchmark controls, and compliance checks.",
            capabilityCategory: "SECURITY_AWARENESS",
          },
        ],
        functions: [
          {
            moduleName: "Vulnerability Exposure",
            name: "Endpoint vulnerability prioritization",
            description:
              "Identifies exposed vulnerabilities and ties prioritization to endpoint context.",
            relatedCapability: "Vulnerability Management",
            capabilities: ["Vulnerability Management", "Exposure Management"],
          },
          {
            moduleName: "Configuration Compliance",
            name: "Configuration benchmark validation",
            description:
              "Measures endpoint settings against expected baselines and hardening standards.",
            relatedCapability: "Security Validation",
            capabilities: ["Security Validation"],
          },
        ],
      },
      {
        vendorName: "Tanium",
        productName: "Tanium Threat Response",
        productCategory: "ENDPOINT_SECURITY",
        capabilityCategory: "EDR",
        capabilities: ["EDR", "Threat Detection and Response"],
        description:
          "Tanium endpoint threat-hunting and response workflow product.",
        modules: [
          {
            name: "Threat Hunting",
            description:
              "Hunting, triage, and evidence collection on endpoints.",
            capabilityCategory: "EDR",
          },
          {
            name: "Response Actions",
            description:
              "Endpoint containment, quarantine, and response support actions.",
            capabilityCategory: "EDR",
          },
        ],
        functions: [
          {
            moduleName: "Threat Hunting",
            name: "Hunt across endpoints in real time",
            description:
              "Investigates threats and suspicious artifacts across distributed endpoints without waiting on scans.",
            relatedCapability: "EDR",
            capabilities: ["EDR", "Threat Detection and Response"],
          },
          {
            moduleName: "Response Actions",
            name: "Endpoint containment and remediation",
            description:
              "Supports targeted endpoint isolation, process actioning, and remediation validation.",
            relatedCapability: "Threat Detection and Response",
            capabilities: ["Threat Detection and Response"],
          },
        ],
      },
    ].map(createCatalogProduct)
  );

  await prisma.productCapability.createMany({
    data: [
      {
        productId: microsoftG5.id,
        capabilityId: capabilityByName.get("IAM").id,
      },
      {
        productId: microsoftG5.id,
        capabilityId: capabilityByName.get("DLP").id,
      },
      {
        productId: sentinelOneProduct.id,
        capabilityId: capabilityByName.get("EDR").id,
      },
      {
        productId: rapid7Product.id,
        capabilityId: capabilityByName.get("Exposure Management").id,
      },
      {
        productId: knowBe4Product.id,
        capabilityId: capabilityByName.get("Security Awareness").id,
      },
      {
        productId: mimecastProduct.id,
        capabilityId: capabilityByName.get("Email Security").id,
      },
      {
        productId: sansProduct.id,
        capabilityId: capabilityByName.get("Certification Training").id,
      },
      {
        productId: cortexXsiam.id,
        capabilityId: capabilityByName.get("SIEM").id,
      },
      {
        productId: cortexXsiam.id,
        capabilityId: capabilityByName.get("SOAR").id,
      },
      {
        productId: cortexXsiam.id,
        capabilityId: capabilityByName.get("XDR").id,
      },
      {
        productId: cortexXsiam.id,
        capabilityId: capabilityByName.get("Threat Detection and Response").id,
      },
      {
        productId: cortexXsiam.id,
        capabilityId: capabilityByName.get("Incident Management").id,
      },
      { productId: unit42Mdr.id, capabilityId: capabilityByName.get("MDR").id },
    ],
  });

  await prisma.productModuleCapability.createMany({
    data: [
      {
        productModuleId: entraP2.id,
        capabilityId: capabilityByName.get("PAM").id,
      },
      {
        productModuleId: xsiamDataIngestion.id,
        capabilityId: capabilityByName.get("SIEM").id,
        allocationGuidance:
          "Use only when spend is explicitly tied to incremental ingestion capacity.",
      },
    ],
  });

  const [endpointDlp, exchangeDlp, teamsDlp] = await Promise.all([
    prisma.productFeature.create({
      data: {
        productId: microsoftG5.id,
        moduleId: purview.id,
        name: "Endpoint DLP",
        description: "Endpoint data-loss prevention controls.",
        capabilities: {
          create: [{ capabilityId: capabilityByName.get("DLP").id }],
        },
      },
    }),
    prisma.productFeature.create({
      data: {
        productId: microsoftG5.id,
        moduleId: purview.id,
        name: "Exchange DLP",
        description: "Exchange data-loss prevention policies.",
        capabilities: {
          create: [{ capabilityId: capabilityByName.get("DLP").id }],
        },
      },
    }),
    prisma.productFeature.create({
      data: {
        productId: microsoftG5.id,
        moduleId: purview.id,
        name: "Teams DLP",
        description: "Teams data-loss prevention policies.",
        capabilities: {
          create: [{ capabilityId: capabilityByName.get("DLP").id }],
        },
      },
    }),
  ]);

  await Promise.all([
    prisma.productFeature.create({
      data: {
        productId: cortexXsiam.id,
        name: "Log ingestion",
        description: "Log and telemetry ingestion pipelines.",
        relatedCapabilityId: capabilityByName.get("SIEM").id,
        capabilities: {
          create: [{ capabilityId: capabilityByName.get("SIEM").id }],
        },
      },
    }),
    prisma.productFeature.create({
      data: {
        productId: cortexXsiam.id,
        name: "Event correlation",
        description: "Correlation of security events and suspicious activity.",
        relatedCapabilityId: capabilityByName.get("SIEM").id,
        capabilities: {
          create: [{ capabilityId: capabilityByName.get("SIEM").id }],
        },
      },
    }),
    prisma.productFeature.create({
      data: {
        productId: cortexXsiam.id,
        name: "Automation playbooks",
        description: "Automated response workflows.",
        relatedCapabilityId: capabilityByName.get("SOAR").id,
        capabilities: {
          create: [{ capabilityId: capabilityByName.get("SOAR").id }],
        },
      },
    }),
    prisma.productFeature.create({
      data: {
        productId: cortexXsiam.id,
        name: "Case management",
        description: "Security incident case tracking and collaboration.",
        relatedCapabilityId: capabilityByName.get("Incident Management").id,
        capabilities: {
          create: [
            { capabilityId: capabilityByName.get("Incident Management").id },
          ],
        },
      },
    }),
    prisma.productFeature.create({
      data: {
        productId: cortexXsiam.id,
        name: "Threat hunting",
        description: "Cross-domain investigation and proactive threat search.",
        relatedCapabilityId: capabilityByName.get("XDR").id,
        capabilities: {
          create: [{ capabilityId: capabilityByName.get("XDR").id }],
        },
      },
    }),
  ]);

  await prisma.productSeller.createMany({
    data: [
      {
        productId: microsoftG5.id,
        sellerCompanyId: shiCompany.id,
        relationshipType: "RESELLER",
        preferred: true,
        sellerSku: "MS-G5-GOV",
      },
      {
        productId: microsoftG5.id,
        sellerCompanyId: cdwgCompany.id,
        relationshipType: "RESELLER",
        sellerSku: "MS-G5-CDWG",
      },
      {
        productId: sentinelOneProduct.id,
        sellerCompanyId: cdwgCompany.id,
        relationshipType: "RESELLER",
        preferred: true,
        sellerSku: "S1-COMPLETE",
      },
      {
        productId: rapid7Product.id,
        sellerCompanyId: rapid7Company.id,
        relationshipType: "DIRECT_VENDOR",
        preferred: true,
        sellerSku: "R7-DIRECT",
      },
      {
        productId: cortexXsiam.id,
        sellerCompanyId: shiCompany.id,
        relationshipType: "RESELLER",
        preferred: true,
        sellerSku: "PAN-XSIAM-SHI",
      },
      {
        productId: cortexXsiam.id,
        sellerCompanyId: presidioCompany.id,
        relationshipType: "RESELLER",
        sellerSku: "PAN-XSIAM-PRESIDIO",
      },
      {
        productId: sansProduct.id,
        sellerCompanyId: sansCompany.id,
        relationshipType: "DIRECT_VENDOR",
        preferred: true,
        sellerSku: "SANS-VOUCHER",
      },
      {
        productId: unit42Mdr.id,
        sellerCompanyId: paloAltoCompany.id,
        relationshipType: "DIRECT_VENDOR",
        preferred: true,
        sellerSku: "PAN-UNIT42-MDR",
      },
      {
        productId: unit42Mdr.id,
        sellerCompanyId: presidioCompany.id,
        relationshipType: "RESELLER",
        sellerSku: "UNIT42-MDR-PRESIDIO",
      },
    ],
  });

  const resellerSellerCompanies = [
    shiCompany,
    cdwgCompany,
    presidioCompany,
    resellerCatalog.get("Carahsoft").company,
    resellerCatalog.get("Optiv").company,
    resellerCatalog.get("GuidePoint Security").company,
    resellerCatalog.get("Solid Border").company,
    resellerCatalog.get("Insight Public Sector").company,
  ];

  await prisma.productSeller.createMany({
    data: [...expandedCatalogProducts, ...curatedCatalogProducts].flatMap(
      (product, index) => {
        const directSeller = {
          productId: product.id,
          sellerCompanyId: product.vendorCompanyId,
          relationshipType: "DIRECT_VENDOR",
          preferred: index % 3 === 0,
          sellerSku: `${product.name
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, "-")
            .replace(/^-|-$/g, "")}-DIRECT`,
        };
        const firstReseller =
          resellerSellerCompanies[index % resellerSellerCompanies.length];
        const secondReseller =
          resellerSellerCompanies[(index + 3) % resellerSellerCompanies.length];

        return [
          directSeller,
          {
            productId: product.id,
            sellerCompanyId: firstReseller.id,
            relationshipType: "RESELLER",
            preferred: index % 3 !== 0,
            sellerSku: `${product.name
              .toUpperCase()
              .replace(/[^A-Z0-9]+/g, "-")
              .replace(/^-|-$/g, "")}-${firstReseller.name
              .toUpperCase()
              .replace(/[^A-Z0-9]+/g, "-")}`,
          },
          {
            productId: product.id,
            sellerCompanyId: secondReseller.id,
            relationshipType:
              secondReseller.name === "Optiv" ||
              secondReseller.name === "GuidePoint Security"
                ? "SERVICE_PROVIDER"
                : "RESELLER",
            preferred: false,
            sellerSku: `${product.name
              .toUpperCase()
              .replace(/[^A-Z0-9]+/g, "-")
              .replace(/^-|-$/g, "")}-${secondReseller.name
              .toUpperCase()
              .replace(/[^A-Z0-9]+/g, "-")}`,
          },
        ];
      }
    ),
  });

  const dirVehicle = await prisma.purchasingVehicle.create({
    data: {
      name: "DIR Cooperative Contract",
      contractNumber: "DIR-CPO-0001",
      issuingOrganization: "Texas Department of Information Resources",
      startsOn: date("2025-09-01"),
      endsOn: date("2028-08-31"),
      notesText: "Seeded cooperative vehicle for seller/product filtering.",
    },
  });

  const buyBoardVehicle = await prisma.purchasingVehicle.create({
    data: {
      name: "BuyBoard Technology Contract",
      contractNumber: "BUYBOARD-TECH-2027",
      issuingOrganization: "BuyBoard",
      startsOn: date("2026-01-01"),
      endsOn: date("2028-12-31"),
    },
  });

  const [dirShiEligibility, dirCdwgEligibility, buyBoardPresidioEligibility] =
    await Promise.all([
      prisma.purchasingVehicleSeller.create({
        data: {
          purchasingVehicleId: dirVehicle.id,
          sellerCompanyId: shiCompany.id,
          sellerAwardNumber: "DIR-SHI-SECURITY",
        },
      }),
      prisma.purchasingVehicleSeller.create({
        data: {
          purchasingVehicleId: dirVehicle.id,
          sellerCompanyId: cdwgCompany.id,
          sellerAwardNumber: "DIR-CDWG-SECURITY",
        },
      }),
      prisma.purchasingVehicleSeller.create({
        data: {
          purchasingVehicleId: buyBoardVehicle.id,
          sellerCompanyId: presidioCompany.id,
          sellerAwardNumber: "BUYBOARD-PRESIDIO-SECURITY",
        },
      }),
    ]);

  await prisma.purchasingVehicleProductEligibility.createMany({
    data: [
      {
        purchasingVehicleSellerId: dirShiEligibility.id,
        productId: microsoftG5.id,
        awardNumber: "DIR-SHI-MS-G5",
      },
      {
        purchasingVehicleSellerId: dirCdwgEligibility.id,
        productId: sentinelOneProduct.id,
        awardNumber: "DIR-CDWG-S1",
      },
      {
        purchasingVehicleSellerId: buyBoardPresidioEligibility.id,
        productId: cortexXsiam.id,
        awardNumber: "BUYBOARD-PRESIDIO-XSIAM",
      },
    ],
  });

  const microsoftContract = await prisma.contract.create({
    data: {
      vendorId: microsoft.id,
      resellerId: shi.id,
      vendorCompanyId: microsoftCompany.id,
      sellerCompanyId: shiCompany.id,
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
      vendorCompanyId: sentinelOneCompany.id,
      sellerCompanyId: cdwgCompany.id,
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
      vendorCompanyId: rapid7Company.id,
      sellerCompanyId: rapid7Company.id,
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

  const microsoftBudgetItem = await prisma.budgetItem.create({
    data: {
      vendorId: microsoft.id,
      resellerId: shi.id,
      vendorCompanyId: microsoftCompany.id,
      sellerCompanyId: shiCompany.id,
      contractId: microsoftContract.id,
      productId: microsoftG5.id,
      name: "Microsoft 365 G5 Enterprise Agreement",
      owner: "Jordan Rivera",
      strategicProgramArea: "Identity & Access Management",
      description: "Baseline Microsoft security and compliance licensing.",
    },
  });

  const onetrustItem = await prisma.budgetItem.create({
    data: {
      vendorId: onetrust.id,
      vendorCompanyId: onetrustCompany.id,
      name: "OneTrust Platform Enterprise",
      owner: "Maria Santos",
      strategicProgramArea: "Governance, Risk & Compliance",
      description: "Privacy and third-party risk platform.",
    },
  });

  const rapid7BudgetItem = await prisma.budgetItem.create({
    data: {
      vendorId: rapid7.id,
      vendorCompanyId: rapid7Company.id,
      sellerCompanyId: rapid7Company.id,
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
      vendorCompanyId: sansCompany.id,
      sellerCompanyId: sansCompany.id,
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

  const microsoftPurchase = await prisma.purchase.create({
    data: {
      title: "Microsoft 365 G5 FY2027 committed acquisition",
      fiscalYearId: fiscalYear.id,
      sellerCompanyId: shiCompany.id,
      contractId: microsoftContract.id,
      purchasingVehicleId: dirVehicle.id,
      status: "COMMITTED",
      purchasingChannel: "COOPERATIVE_OR_PURCHASING_CONTRACT",
      quoteNumber: "Q-SHI-MS-G5-FY27",
      totalAmount: "1250000.00",
      startsOn: date("2026-07-01"),
      endsOn: date("2027-06-30"),
      renewalDate: date("2027-05-01"),
      notesText:
        "Committed acquisition after request approval; not a replacement for the pre-commit purchase request workflow.",
    },
  });

  const microsoftPurchaseItem = await prisma.purchaseItem.create({
    data: {
      purchaseId: microsoftPurchase.id,
      productId: microsoftG5.id,
      productModuleId: purview.id,
      description: "Microsoft Purview compliance and DLP capabilities.",
      quantity: "12000.00",
      quantityType: "USERS",
      unitCost: "104.17",
      totalCost: "1250000.00",
      recurringCost: "1250000.00",
      licenseStartsOn: date("2026-07-01"),
      licenseEndsOn: date("2027-06-30"),
    },
  });

  await prisma.purchaseItemFeature.createMany({
    data: [
      { purchaseItemId: microsoftPurchaseItem.id, featureId: endpointDlp.id },
      { purchaseItemId: microsoftPurchaseItem.id, featureId: exchangeDlp.id },
      { purchaseItemId: microsoftPurchaseItem.id, featureId: teamsDlp.id },
    ],
  });

  await prisma.purchaseBudgetAllocation.create({
    data: {
      purchaseId: microsoftPurchase.id,
      purchaseItemId: microsoftPurchaseItem.id,
      fiscalYearId: fiscalYear.id,
      budgetItemId: microsoftBudgetItem.id,
      allocatedAmount: "1250000.00",
      notesText:
        "Full Microsoft G5 purchase allocated to the baseline licensing budget item.",
    },
  });

  const microsoftDeployment = await prisma.deployment.create({
    data: {
      purchaseItemId: microsoftPurchaseItem.id,
      status: "ACTIVE",
      scopeName: "Countywide Microsoft Purview rollout",
      environment: "Production",
      department: "All departments",
      wave: "FY2027 baseline",
      deploymentPercent: "82.50",
      targetPopulation: 12000,
      deployedPopulation: 9900,
      adoptionLevel: "HIGH",
      businessOwnerId: owner.id,
      technicalOwnerId: owner.id,
      securityOwnerId: owner.id,
      targetDate: date("2026-12-31"),
      expectedOutcome:
        "Reduce unmanaged sensitive-data exposure across collaboration platforms.",
      realizedOutcome:
        "Core policies active for Exchange, Teams, SharePoint, and endpoint pilot groups.",
      valueNarrative:
        "Deployment metrics are tracked as usage history rather than overwriting the purchase item.",
    },
  });

  await prisma.usageMeasurement.createMany({
    data: [
      {
        deploymentId: microsoftDeployment.id,
        measuredAt: date("2026-09-30"),
        activeUsageCount: 7400,
        utilizationPercent: "61.67",
        source: "Microsoft admin center",
        notesText: "Initial adoption checkpoint.",
      },
      {
        deploymentId: microsoftDeployment.id,
        measuredAt: date("2026-12-31"),
        activeUsageCount: 9900,
        utilizationPercent: "82.50",
        source: "Microsoft admin center",
        notesText: "Countywide production rollout checkpoint.",
      },
    ],
  });

  const oneTrustMaintenanceRenewal = await prisma.maintenanceRenewal.create({
    data: {
      budgetPlanId: fy2027BudgetPlan.id,
      fiscalYearId: fiscalYear.id,
      linkedAnnualFinancialId: onetrustAnnual.id,
      vendorId: onetrust.id,
      vendorCompanyId: onetrustCompany.id,
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
      renewalOwnerId: owner.id,
      procurementOwnerId: owner.id,
      renewalOwner: "Maria Santos",
      procurementOwner: "Casey Nguyen",
      renewalStrategy: "Negotiated concession creates budget savings.",
      renewalRisk: "HIGH",
    },
  });

  await prisma.maintenanceRenewal.create({
    data: {
      budgetPlanId: fy2027BudgetPlan.id,
      fiscalYearId: fiscalYear.id,
      linkedAnnualFinancialId: rapid7Annual.id,
      vendorId: rapid7.id,
      vendorCompanyId: rapid7Company.id,
      sellerCompanyId: rapid7Company.id,
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
      renewalOwnerId: owner.id,
      procurementOwnerId: owner.id,
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
      ownerId: owner.id,
      owner: "Maria Santos",
    },
  });

  const mimecastPurchaseRequest = await prisma.purchaseRequest.create({
    data: {
      fiscalYearId: fiscalYear.id,
      vendorId: mimecast.id,
      resellerId: cdwg.id,
      vendorCompanyId: mimecastCompany.id,
      sellerCompanyId: cdwgCompany.id,
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
      vendorCompanyId: microsoftCompany.id,
      sellerCompanyId: shiCompany.id,
      purchaseId: microsoftPurchase.id,
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
      purchaseId: microsoftPurchase.id,
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
        vendorCompanyId: microsoftCompany.id,
        sellerCompanyId: shiCompany.id,
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
        vendorCompanyId: sentinelOneCompany.id,
        sellerCompanyId: cdwgCompany.id,
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
        vendorCompanyId: rapid7Company.id,
        sellerCompanyId: rapid7Company.id,
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
        vendorCompanyId: knowBe4Company.id,
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
        vendorCompanyId: mimecastCompany.id,
        sellerCompanyId: cdwgCompany.id,
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
        vendorCompanyId: sansCompany.id,
        sellerCompanyId: sansCompany.id,
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
        companyId: microsoftCompany.id,
        purchaseId: microsoftPurchase.id,
        contractId: microsoftContract.id,
        type: "CONTRACT",
        title: "Microsoft G5 Enterprise Agreement",
        url: "https://example.gov/documents/microsoft-g5-enterprise-agreement",
      },
      {
        uploadedById: owner.id,
        vendorId: mimecast.id,
        resellerId: cdwg.id,
        companyId: mimecastCompany.id,
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
      companyId: rapid7Company.id,
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
