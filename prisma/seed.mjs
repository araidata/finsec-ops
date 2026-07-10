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
    unit42,
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
      ["Unit 42", "https://unit42.paloaltonetworks.com"],
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
    unit42Company,
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
      roles: ["VENDOR"],
    }),
    createCompany({
      name: "Unit 42",
      website: "https://unit42.paloaltonetworks.com",
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
    ["Splunk", "https://www.splunk.com"],
    ["Elastic", "https://www.elastic.co"],
    ["Wiz", "https://www.wiz.io"],
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
    ["Delenia", "https://delinea.com"],
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
    ["Nomic Networks", "https://www.nozominetworks.com"],
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
    ["Mandiant", "https://cloud.google.com/security/mandiant"],
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
      {
        name: "Palo Alto Networks",
        legacyVendor: paloAlto,
        company: paloAltoCompany,
      },
      { name: "Unit 42", legacyVendor: unit42, company: unit42Company },
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
      ["capability-edr", "EDR"],
      ["capability-xdr", "XDR"],
      ["capability-siem", "SIEM"],
      ["capability-soar", "SOAR"],
      ["capability-dlp", "DLP"],
      ["capability-email-security", "Email Security"],
      ["capability-security-awareness", "Security Awareness"],
      ["capability-certification-training", "Certification Training"],
      ["capability-mdr", "MDR"],
      ["capability-exposure-management", "Exposure Management"],
      ["capability-cnapp", "CNAPP"],
      ["capability-sase", "SASE"],
      ["capability-sse", "SSE"],
      ["capability-ztna", "ZTNA"],
      ["capability-waf", "WAF"],
      ["capability-appsec", "Application Security"],
      ["capability-api-security", "API Security"],
      ["capability-dspm", "DSPM"],
      ["capability-ndr", "NDR"],
      ["capability-ot-security", "OT Security"],
      ["capability-security-validation", "Security Validation"],
      ["capability-password-management", "Password Management"],
      ["capability-secrets-management", "Secrets Management"],
      ["capability-mobile-security", "Mobile Security"],
      ["capability-backup-resilience", "Backup Resilience"],
      ["capability-asset-management", "Asset Management"],
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

  const [xsiamSiem, xsiamSoar, xsiamXdr] = await Promise.all(
    [
      ["SIEM", "Security event collection, correlation, and investigation."],
      ["SOAR", "Automation playbooks and response orchestration."],
      ["XDR", "Endpoint and telemetry-driven detection workflows."],
    ].map(([name, description]) =>
      prisma.productModule.create({
        data: {
          productId: cortexXsiam.id,
          name,
          capabilityCategory: name,
          active: true,
          enabled: false,
          adoptionLevel: "NOT_USED",
          description,
        },
      })
    )
  );

  const unit42Mdr = await prisma.product.create({
    data: {
      vendorId: unit42.id,
      vendorCompanyId: unit42Company.id,
      name: "Unit 42 Managed Detection and Response",
      offeringType: "MANAGED_SERVICE",
      productCategory: "MANAGED_SECURITY_SERVICES",
      capabilityCategory: "MDR",
      deploymentStatus: "UNDER_REVIEW",
      strategicValue: "HIGH",
      criticality: "HIGH",
      annualCost: "0.00",
      description: "Managed detection and response service offering.",
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
        productName: "Cisco Secure Access",
        productCategory: "NETWORK_SECURITY",
        capabilityCategory: "SECURE_WEB_GATEWAY",
        capabilities: ["SASE", "SSE", "ZTNA", "DNS Security"],
        description:
          "Cisco secure access service edge and security service edge platform.",
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
        vendorName: "Splunk",
        productName: "Splunk Enterprise Security",
        productCategory: "SECURITY_OPERATIONS",
        capabilityCategory: "SIEM",
        capabilities: ["SIEM", "SOAR"],
        description: "Security information and event management platform.",
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
        vendorName: "Wiz",
        productName: "Wiz Cloud Security Platform",
        productCategory: "CLOUD_SECURITY",
        capabilityCategory: "CNAPP",
        capabilities: ["CNAPP", "CSPM", "CWPP", "DSPM"],
        description:
          "Cloud-native application protection and cloud risk platform.",
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
        vendorName: "Mandiant",
        productName: "Mandiant Incident Response Retainer",
        offeringType: "PROFESSIONAL_SERVICE",
        productCategory: "PROFESSIONAL_SERVICES",
        capabilityCategory: "INCIDENT_RESPONSE",
        capabilities: ["Incident Response", "Threat Intelligence"],
        description:
          "Incident response, readiness, and threat intelligence services.",
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
        productModuleId: xsiamSiem.id,
        capabilityId: capabilityByName.get("SIEM").id,
      },
      {
        productModuleId: xsiamSoar.id,
        capabilityId: capabilityByName.get("SOAR").id,
      },
      {
        productModuleId: xsiamXdr.id,
        capabilityId: capabilityByName.get("XDR").id,
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
        moduleId: xsiamSiem.id,
        name: "Data ingestion",
        description: "Log and telemetry ingestion pipelines.",
        capabilities: {
          create: [{ capabilityId: capabilityByName.get("SIEM").id }],
        },
      },
    }),
    prisma.productFeature.create({
      data: {
        productId: cortexXsiam.id,
        moduleId: xsiamSoar.id,
        name: "Automation playbooks",
        description: "Automated response workflows.",
        capabilities: {
          create: [{ capabilityId: capabilityByName.get("SOAR").id }],
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
        sellerCompanyId: unit42Company.id,
        relationshipType: "DIRECT_VENDOR",
        preferred: true,
        sellerSku: "UNIT42-MDR",
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
    data: expandedCatalogProducts.flatMap((product, index) => {
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
    }),
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
