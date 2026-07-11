import { z } from "zod";

import { FieldValidationError } from "@/lib/server/action-result";
import { getPrisma } from "@/lib/server/prisma";

type PrismaClientLike = ReturnType<typeof getPrisma>;

const companyRoles = [
  "VENDOR",
  "RESELLER",
  "SERVICE_PROVIDER",
  "IMPLEMENTATION_PARTNER",
  "CONSULTANT",
] as const;

const sellerRelationshipTypes = [
  "DIRECT_VENDOR",
  "RESELLER",
  "SERVICE_PROVIDER",
  "MARKETPLACE",
  "OTHER",
] as const;

const productOfferingTypes = [
  "SOFTWARE",
  "SAAS",
  "HARDWARE",
  "MANAGED_SERVICE",
  "PROFESSIONAL_SERVICE",
  "TRAINING",
  "SUPPORT",
  "OTHER",
] as const;

const productComponentTypes = [
  "MODULE",
  "ADD_ON",
  "LICENSE_TIER",
  "SERVICE",
  "SUPPORT",
  "CAPACITY",
  "RETENTION",
  "TRAINING",
  "HARDWARE",
  "OTHER",
] as const;

const catalogLifecycleStatuses = [
  "PLANNED",
  "EVALUATING",
  "ACTIVE",
  "RETIRING",
  "RETIRED",
] as const;

const capabilityAllocationMethods = [
  "DIRECT",
  "USER_ALLOCATED",
  "EQUAL",
  "PRIMARY_CAPABILITY",
  "UNALLOCATED",
] as const;

const productCategories = [
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
] as const;

const purchaseStatuses = [
  "APPROVED",
  "ORDERED",
  "COMMITTED",
  "RECEIVED",
  "COMPLETED",
  "CANCELED",
] as const;

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
] as const;

const deploymentStatuses = [
  "PLANNED",
  "IMPLEMENTING",
  "ACTIVE",
  "PARTIALLY_DEPLOYED",
  "UNDER_REVIEW",
  "RETIRING",
  "RETIRED",
] as const;

const adoptionLevels = [
  "NOT_USED",
  "LOW",
  "MEDIUM",
  "HIGH",
  "FULLY_ADOPTED",
] as const;

const strategicValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const catalogOptionSets = {
  companyRoles,
  sellerRelationshipTypes,
  productOfferingTypes,
  productComponentTypes,
  productCategories,
  catalogLifecycleStatuses,
  capabilityAllocationMethods,
  purchaseStatuses,
  licenseMetrics,
  deploymentStatuses,
  adoptionLevels,
  strategicValues,
};

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);
const requiredString = z.string().trim().min(1, "Required");
const idSchema = z.string().trim().min(1, "Required");
const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);
const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) =>
    value ? new Date(`${value}T00:00:00.000Z`) : undefined
  );
const decimal = z.coerce.number().min(0, "Must be zero or greater");
const optionalDecimal = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().min(0, "Must be zero or greater").optional()
);

function flattenZod(error: z.ZodError) {
  const flattened = error.flatten().fieldErrors as Record<string, string[]>;
  return Object.fromEntries(
    Object.entries(flattened).filter(([, value]) => value?.length)
  );
}

function parse<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new FieldValidationError(
      "Review the highlighted fields.",
      flattenZod(result.error)
    );
  }
  return result.data;
}

function toDecimalInput(value: number | undefined) {
  return value === undefined ? undefined : String(value);
}

function assertDateOrder(startsOn?: Date, endsOn?: Date) {
  if (startsOn && endsOn && startsOn > endsOn) {
    throw new FieldValidationError("Review the date range.", {
      endsOn: ["End date must be on or after the start date."],
    });
  }
}

async function assertCompanyRole(
  prisma: PrismaClientLike,
  companyId: string,
  role: (typeof companyRoles)[number],
  field = "companyId"
) {
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      active: true,
      roles: { some: { role } },
    },
  });

  if (!company) {
    throw new FieldValidationError("Selected company is not eligible.", {
      [field]: [`Company must be active with the ${role} role.`],
    });
  }

  return company;
}

async function ensureLegacyVendor(prisma: PrismaClientLike, companyId: string) {
  const company = await assertCompanyRole(
    prisma,
    companyId,
    "VENDOR",
    "vendorCompanyId"
  );

  return prisma.vendor.upsert({
    where: { name: company.name },
    create: {
      name: company.name,
      website: company.website,
      contactEmail: company.contactEmail,
    },
    update: {
      website: company.website,
      contactEmail: company.contactEmail,
    },
  });
}

function capabilityWrites(capabilityIds: string[]) {
  return {
    create: capabilityIds.map((capabilityId) => ({ capabilityId })),
  };
}

async function replaceCapabilityLinks(
  prisma: PrismaClientLike,
  owner: "product" | "module" | "feature",
  ownerId: string,
  capabilityIds: string[]
) {
  if (owner === "product") {
    await prisma.productCapability.deleteMany({
      where: { productId: ownerId },
    });
    if (capabilityIds.length) {
      await prisma.productCapability.createMany({
        data: capabilityIds.map((capabilityId) => ({
          productId: ownerId,
          capabilityId,
        })),
      });
    }
  }

  if (owner === "module") {
    await prisma.productModuleCapability.deleteMany({
      where: { productModuleId: ownerId },
    });
    if (capabilityIds.length) {
      await prisma.productModuleCapability.createMany({
        data: capabilityIds.map((capabilityId) => ({
          productModuleId: ownerId,
          capabilityId,
        })),
      });
    }
  }

  if (owner === "feature") {
    await prisma.productFeatureCapability.deleteMany({
      where: { productFeatureId: ownerId },
    });
    if (capabilityIds.length) {
      await prisma.productFeatureCapability.createMany({
        data: capabilityIds.map((capabilityId) => ({
          productFeatureId: ownerId,
          capabilityId,
        })),
      });
    }
  }
}

export async function getCatalogPageData() {
  const prisma = getPrisma();

  const [
    companies,
    capabilities,
    products,
    modules,
    features,
    sellers,
    vehicles,
    agreements,
    contracts,
    purchases,
    renewals,
  ] = await Promise.all([
    prisma.company.findMany({
      orderBy: { name: "asc" },
      include: { roles: { orderBy: { role: "asc" } } },
    }),
    prisma.capability.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: true, modules: true, features: true } },
      },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: {
        vendorCompany: true,
        capabilities: { include: { capability: true } },
        _count: { select: { modules: true, features: true, sellers: true } },
      },
    }),
    prisma.productModule.findMany({
      orderBy: { name: "asc" },
      include: {
        product: { include: { vendorCompany: true } },
        capabilities: { include: { capability: true } },
        _count: { select: { features: true, purchaseItems: true } },
      },
    }),
    prisma.productFeature.findMany({
      orderBy: { name: "asc" },
      include: {
        product: true,
        module: true,
        relatedCapability: true,
        capabilities: { include: { capability: true } },
      },
    }),
    prisma.productSeller.findMany({
      orderBy: [{ preferred: "desc" }, { createdAt: "desc" }],
      include: { product: true, seller: { include: { roles: true } } },
    }),
    prisma.purchasingVehicle.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { sellerEligibility: true, purchases: true } },
      },
    }),
    prisma.purchasingVehicleSeller.findMany({
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
      include: {
        purchasingVehicle: true,
        seller: { include: { roles: true } },
        productEligibility: { include: { product: true, productModule: true } },
      },
    }),
    prisma.contract.findMany({
      orderBy: { title: "asc" },
      include: { sellerCompany: true, vendorCompany: true },
    }),
    prisma.purchase.findMany({
      orderBy: { createdAt: "desc" },
      include: { sellerCompany: true, items: { include: { product: true } } },
    }),
    prisma.renewal.findMany({
      orderBy: { renewalDate: "asc" },
      include: { contract: { include: { sellerCompany: true } } },
    }),
  ]);

  return {
    companies,
    capabilities,
    products,
    modules,
    features,
    sellers,
    vehicles,
    agreements,
    contracts,
    purchases,
    renewals,
  };
}

const companySchema = z.object({
  id: optionalId,
  name: requiredString,
  legalName: optionalString,
  website: optionalString,
  contactEmail: optionalString,
  roles: z.array(z.enum(companyRoles)).min(1, "Select at least one role."),
  active: z.boolean().default(true),
});

export async function saveCompany(input: unknown) {
  const data = parse(companySchema, input);
  const prisma = getPrisma();

  const duplicate = await prisma.company.findFirst({
    where: { name: data.name, id: data.id ? { not: data.id } : undefined },
  });
  if (duplicate) {
    throw new FieldValidationError("Company name must be unique.", {
      name: ["A company with this name already exists."],
    });
  }

  const company = data.id
    ? await prisma.company.update({
        where: { id: data.id },
        data: {
          name: data.name,
          legalName: data.legalName,
          website: data.website,
          contactEmail: data.contactEmail,
          active: data.active,
          roles: {
            deleteMany: {},
            create: data.roles.map((role) => ({ role })),
          },
        },
      })
    : await prisma.company.create({
        data: {
          name: data.name,
          legalName: data.legalName,
          website: data.website,
          contactEmail: data.contactEmail,
          active: data.active,
          roles: { create: data.roles.map((role) => ({ role })) },
        },
      });

  return company.id;
}

const visibleCompanySchema = companySchema.omit({ roles: true });

async function saveCompanyWithVisibleRole(
  input: unknown,
  role: (typeof companyRoles)[number]
) {
  const data = parse(visibleCompanySchema, input);
  const prisma = getPrisma();
  const existingRoles = data.id
    ? (
        await prisma.companyRole.findMany({
          where: { companyId: data.id },
          select: { role: true },
        })
      ).map((item) => item.role)
    : [];

  return saveCompany({
    ...data,
    roles: Array.from(new Set([...existingRoles, role])),
  });
}

export async function saveVendorCompany(input: unknown) {
  return saveCompanyWithVisibleRole(input, "VENDOR");
}

export async function saveResellerCompany(input: unknown) {
  return saveCompanyWithVisibleRole(input, "RESELLER");
}

export async function deleteVendorCompany(companyId: string) {
  const prisma = getPrisma();
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { roles: true },
  });

  if (!company || !company.roles.some((role) => role.role === "VENDOR")) {
    throw new FieldValidationError("Vendor was not found.", {
      id: ["Select an existing vendor."],
    });
  }

  const vendorProducts = await prisma.product.findMany({
    where: { vendorCompanyId: companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const vendorProductIds = vendorProducts.map((product) => product.id);

  const [
    purchaseItemCount,
    sellerRelationshipCount,
    vehicleSellerCount,
    purchaseSellerCount,
    sellerContractCount,
  ] = await Promise.all([
    vendorProductIds.length
      ? prisma.purchaseItem.count({
          where: { productId: { in: vendorProductIds } },
        })
      : Promise.resolve(0),
    prisma.productSeller.count({
      where: { sellerCompanyId: companyId },
    }),
    prisma.purchasingVehicleSeller.count({
      where: { sellerCompanyId: companyId },
    }),
    prisma.purchase.count({
      where: { sellerCompanyId: companyId },
    }),
    prisma.contract.count({
      where: { sellerCompanyId: companyId },
    }),
  ]);

  if (purchaseItemCount > 0) {
    throw new FieldValidationError(
      "Vendor cannot be deleted while purchases reference its catalog products.",
      {
        id: [
          "Remove or reassign dependent purchase items before deleting this vendor.",
        ],
      }
    );
  }

  if (
    sellerRelationshipCount > 0 ||
    vehicleSellerCount > 0 ||
    purchaseSellerCount > 0 ||
    sellerContractCount > 0
  ) {
    throw new FieldValidationError(
      "Vendor cannot be deleted while it is acting as a seller in transactional records.",
      {
        id: [
          "Remove seller, purchasing agreement, purchase, or seller-side contract dependencies first.",
        ],
      }
    );
  }

  await prisma.$transaction(async (tx) => {
    if (vendorProductIds.length) {
      await tx.product.deleteMany({
        where: { id: { in: vendorProductIds } },
      });
    }

    await tx.company.delete({
      where: { id: companyId },
    });
  });

  return companyId;
}

const capabilitySchema = z.object({
  id: optionalId,
  name: requiredString,
  description: optionalString,
  active: z.boolean().default(true),
});

export async function saveCapability(input: unknown) {
  const data = parse(capabilitySchema, input);
  const prisma = getPrisma();

  const duplicate = await prisma.capability.findFirst({
    where: { name: data.name, id: data.id ? { not: data.id } : undefined },
  });
  if (duplicate) {
    throw new FieldValidationError("Capability name must be unique.", {
      name: ["A capability with this name already exists."],
    });
  }

  const capability = data.id
    ? await prisma.capability.update({ where: { id: data.id }, data })
    : await prisma.capability.create({ data });

  return capability.id;
}

const productSchema = z.object({
  id: optionalId,
  vendorCompanyId: idSchema,
  name: requiredString,
  offeringType: z.enum(productOfferingTypes),
  productCategory: z.enum(productCategories),
  description: optionalString,
  capabilityIds: z.array(idSchema).default([]),
  active: z.boolean().default(true),
});

export async function saveProduct(input: unknown) {
  const data = parse(productSchema, input);
  const prisma = getPrisma();
  const legacyVendor = await ensureLegacyVendor(prisma, data.vendorCompanyId);

  const duplicate = await prisma.product.findFirst({
    where: {
      vendorId: legacyVendor.id,
      name: data.name,
      id: data.id ? { not: data.id } : undefined,
    },
  });
  if (duplicate) {
    throw new FieldValidationError(
      "Product name must be unique within vendor.",
      {
        name: ["This vendor already has a product or service with that name."],
      }
    );
  }

  const product = data.id
    ? await prisma.product.update({
        where: { id: data.id },
        data: {
          vendorId: legacyVendor.id,
          vendorCompanyId: data.vendorCompanyId,
          name: data.name,
          offeringType: data.offeringType,
          productCategory: data.productCategory,
          description: data.description,
          active: data.active,
        },
      })
    : await prisma.product.create({
        data: {
          vendorId: legacyVendor.id,
          vendorCompanyId: data.vendorCompanyId,
          name: data.name,
          offeringType: data.offeringType,
          productCategory: data.productCategory,
          description: data.description,
          active: data.active,
          capabilities: capabilityWrites(data.capabilityIds),
        },
      });

  if (data.id) {
    await replaceCapabilityLinks(
      prisma,
      "product",
      product.id,
      data.capabilityIds
    );
  }

  return product.id;
}

const moduleSchema = z.object({
  id: optionalId,
  productId: idSchema,
  name: requiredString,
  description: optionalString,
  componentType: z.enum(productComponentTypes).default("MODULE"),
  sku: optionalString,
  licenseMetric: z.enum(licenseMetrics).optional(),
  separatelyPurchasable: z.boolean().default(false),
  separatelyRenewable: z.boolean().default(false),
  purpose: optionalString,
  lifecycleStatus: z.enum(catalogLifecycleStatuses).default("ACTIVE"),
  planningEstimate: decimal.default(0),
  capabilityIds: z.array(idSchema).default([]),
  active: z.boolean().default(true),
});

export async function saveProductModule(input: unknown) {
  const data = parse(moduleSchema, input);
  const prisma = getPrisma();

  const product = await prisma.product.findFirst({
    where: { id: data.productId, active: true },
  });
  if (!product) {
    throw new FieldValidationError("Parent product is required.", {
      productId: ["Select an active product."],
    });
  }

  const duplicate = await prisma.productModule.findFirst({
    where: {
      productId: data.productId,
      name: data.name,
      id: data.id ? { not: data.id } : undefined,
    },
  });
  if (duplicate) {
    throw new FieldValidationError(
      "Product Component name must be unique within product.",
      {
        name: ["This product already has a Product Component with that name."],
      }
    );
  }

  const productModule = data.id
    ? await prisma.productModule.update({
        where: { id: data.id },
        data: {
          productId: data.productId,
          name: data.name,
          description: data.description,
          componentType: data.componentType,
          sku: data.sku,
          licenseMetric: data.licenseMetric,
          separatelyPurchasable: data.separatelyPurchasable,
          separatelyRenewable: data.separatelyRenewable,
          purpose: data.purpose,
          lifecycleStatus: data.lifecycleStatus,
          planningEstimate: toDecimalInput(data.planningEstimate),
          active: data.active,
        },
      })
    : await prisma.productModule.create({
        data: {
          productId: data.productId,
          name: data.name,
          description: data.description,
          componentType: data.componentType,
          sku: data.sku,
          licenseMetric: data.licenseMetric,
          separatelyPurchasable: data.separatelyPurchasable,
          separatelyRenewable: data.separatelyRenewable,
          purpose: data.purpose,
          lifecycleStatus: data.lifecycleStatus,
          planningEstimate: toDecimalInput(data.planningEstimate),
          active: data.active,
          capabilities: capabilityWrites(data.capabilityIds),
        },
      });

  if (data.id) {
    await replaceCapabilityLinks(
      prisma,
      "module",
      productModule.id,
      data.capabilityIds
    );
  }

  return productModule.id;
}

export const saveProductComponent = saveProductModule;

const featureSchema = z.object({
  id: optionalId,
  productId: idSchema,
  moduleId: optionalId,
  relatedCapabilityId: optionalId,
  name: requiredString,
  description: optionalString,
  strategicImportance: z.enum(strategicValues).optional(),
  notesText: optionalString,
  capabilityIds: z.array(idSchema).default([]),
  active: z.boolean().default(true),
});

export async function saveProductFeature(input: unknown) {
  const data = parse(featureSchema, input);
  const prisma = getPrisma();

  if (data.moduleId) {
    const productModule = await prisma.productModule.findFirst({
      where: { id: data.moduleId, productId: data.productId },
    });
    if (!productModule) {
      throw new FieldValidationError(
        "Product Component does not belong to product.",
        {
          moduleId: ["Select a Product Component under the selected product."],
        }
      );
    }
  }

  if (data.relatedCapabilityId) {
    const capability = await prisma.capability.findFirst({
      where: { id: data.relatedCapabilityId, active: true },
    });
    if (!capability) {
      throw new FieldValidationError("Related capability is invalid.", {
        relatedCapabilityId: ["Select an active capability."],
      });
    }
  }

  const duplicate = await prisma.productFeature.findFirst({
    where: {
      productId: data.productId,
      moduleId: data.moduleId ?? null,
      name: data.name,
      id: data.id ? { not: data.id } : undefined,
    },
  });
  if (duplicate) {
    throw new FieldValidationError(
      "Function name must be unique for this scope.",
      {
        name: [
          "A Function with this name already exists for the selected product or Product Component.",
        ],
      }
    );
  }

  const feature = data.id
    ? await prisma.productFeature.update({
        where: { id: data.id },
        data: {
          productId: data.productId,
          moduleId: data.moduleId,
          relatedCapabilityId: data.relatedCapabilityId,
          name: data.name,
          description: data.description,
          strategicImportance: data.strategicImportance,
          notesText: data.notesText,
          active: data.active,
        },
      })
    : await prisma.productFeature.create({
        data: {
          productId: data.productId,
          moduleId: data.moduleId,
          relatedCapabilityId: data.relatedCapabilityId,
          name: data.name,
          description: data.description,
          strategicImportance: data.strategicImportance,
          notesText: data.notesText,
          active: data.active,
          capabilities: capabilityWrites(data.capabilityIds),
        },
      });

  if (data.id) {
    await replaceCapabilityLinks(
      prisma,
      "feature",
      feature.id,
      data.capabilityIds
    );
  }

  return feature.id;
}

export const saveProductFunction = saveProductFeature;

const productSellerSchema = z.object({
  id: optionalId,
  productId: idSchema,
  sellerCompanyId: idSchema,
  relationshipType: z.enum(sellerRelationshipTypes),
  preferred: z.boolean().default(false),
  sellerSku: optionalString,
  active: z.boolean().default(true),
});

export async function saveProductSeller(input: unknown) {
  const data = parse(productSellerSchema, input);
  const prisma = getPrisma();
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
    include: { vendorCompany: true },
  });

  if (!product) {
    throw new FieldValidationError("Product is required.", {
      productId: ["Select a product."],
    });
  }

  const seller = await prisma.company.findUnique({
    where: { id: data.sellerCompanyId },
    include: { roles: true },
  });
  const roles = seller?.roles.map((role) => role.role) ?? [];
  const requiredRole =
    data.relationshipType === "DIRECT_VENDOR"
      ? "VENDOR"
      : data.relationshipType === "SERVICE_PROVIDER"
        ? "SERVICE_PROVIDER"
        : data.relationshipType === "RESELLER" ||
            data.relationshipType === "MARKETPLACE"
          ? "RESELLER"
          : undefined;

  if (!seller?.active || (requiredRole && !roles.includes(requiredRole))) {
    throw new FieldValidationError("Seller role is incompatible.", {
      sellerCompanyId: ["Seller company does not have the required role."],
    });
  }

  if (
    data.relationshipType === "DIRECT_VENDOR" &&
    product.vendorCompanyId &&
    product.vendorCompanyId !== data.sellerCompanyId
  ) {
    throw new FieldValidationError(
      "Direct seller must be the product vendor.",
      {
        sellerCompanyId: [
          "Select the product vendor for direct-vendor relationships.",
        ],
      }
    );
  }

  const duplicate = await prisma.productSeller.findFirst({
    where: {
      productId: data.productId,
      sellerCompanyId: data.sellerCompanyId,
      id: data.id ? { not: data.id } : undefined,
    },
  });
  if (duplicate) {
    throw new FieldValidationError("Seller relationship already exists.", {
      sellerCompanyId: [
        "This product already has a relationship with that seller.",
      ],
    });
  }

  const relationship = data.id
    ? await prisma.productSeller.update({ where: { id: data.id }, data })
    : await prisma.productSeller.create({ data });

  return relationship.id;
}

const vehicleSchema = z.object({
  id: optionalId,
  name: requiredString,
  contractNumber: optionalString,
  issuingOrganization: optionalString,
  startsOn: optionalDate,
  endsOn: optionalDate,
  notesText: optionalString,
  active: z.boolean().default(true),
});

export async function savePurchasingVehicle(input: unknown) {
  const data = parse(vehicleSchema, input);
  assertDateOrder(data.startsOn, data.endsOn);
  const prisma = getPrisma();
  const vehicle = data.id
    ? await prisma.purchasingVehicle.update({ where: { id: data.id }, data })
    : await prisma.purchasingVehicle.create({ data });

  return vehicle.id;
}

const agreementSchema = z.object({
  id: optionalId,
  purchasingVehicleId: idSchema,
  sellerCompanyId: idSchema,
  sellerAwardNumber: optionalString,
  title: optionalString,
  startsOn: optionalDate,
  endsOn: optionalDate,
  notesText: optionalString,
  productIds: z.array(idSchema).default([]),
  active: z.boolean().default(true),
});

export async function savePurchasingAgreement(input: unknown) {
  const data = parse(agreementSchema, input);
  assertDateOrder(data.startsOn, data.endsOn);
  const prisma = getPrisma();
  const seller = await prisma.company.findFirst({
    where: {
      id: data.sellerCompanyId,
      active: true,
      roles: {
        some: { role: { in: ["RESELLER", "SERVICE_PROVIDER", "VENDOR"] } },
      },
    },
  });
  if (!seller) {
    throw new FieldValidationError("Seller is not eligible for agreements.", {
      sellerCompanyId: [
        "Select an active vendor, reseller, or service provider.",
      ],
    });
  }

  const agreement = data.id
    ? await prisma.purchasingVehicleSeller.update({
        where: { id: data.id },
        data: {
          purchasingVehicleId: data.purchasingVehicleId,
          sellerCompanyId: data.sellerCompanyId,
          sellerAwardNumber: data.sellerAwardNumber,
          title: data.title,
          startsOn: data.startsOn,
          endsOn: data.endsOn,
          notesText: data.notesText,
          active: data.active,
        },
      })
    : await prisma.purchasingVehicleSeller.create({
        data: {
          purchasingVehicleId: data.purchasingVehicleId,
          sellerCompanyId: data.sellerCompanyId,
          sellerAwardNumber: data.sellerAwardNumber,
          title: data.title,
          startsOn: data.startsOn,
          endsOn: data.endsOn,
          notesText: data.notesText,
          active: data.active,
        },
      });

  await prisma.purchasingVehicleProductEligibility.deleteMany({
    where: { purchasingVehicleSellerId: agreement.id },
  });
  if (data.productIds.length) {
    await prisma.purchasingVehicleProductEligibility.createMany({
      data: data.productIds.map((productId) => ({
        purchasingVehicleSellerId: agreement.id,
        productId,
        startsOn: data.startsOn,
        endsOn: data.endsOn,
        active: data.active,
      })),
    });
  }

  return agreement.id;
}

export async function setActiveRecord(
  kind:
    | "company"
    | "product"
    | "module"
    | "feature"
    | "capability"
    | "seller"
    | "vehicle"
    | "agreement",
  id: string,
  active: boolean
) {
  const prisma = getPrisma();
  const data = { active };

  if (kind === "company") return prisma.company.update({ where: { id }, data });
  if (kind === "product") return prisma.product.update({ where: { id }, data });
  if (kind === "module")
    return prisma.productModule.update({ where: { id }, data });
  if (kind === "feature")
    return prisma.productFeature.update({ where: { id }, data });
  if (kind === "capability")
    return prisma.capability.update({ where: { id }, data });
  if (kind === "seller")
    return prisma.productSeller.update({ where: { id }, data });
  if (kind === "vehicle")
    return prisma.purchasingVehicle.update({ where: { id }, data });
  return prisma.purchasingVehicleSeller.update({ where: { id }, data });
}

export async function getPurchasePageData() {
  const prisma = getPrisma();
  const [
    companies,
    products,
    modules,
    features,
    productSellers,
    agreements,
    fiscalYears,
    contracts,
    purchaseRequests,
    budgetAnnualFinancials,
    purchases,
  ] = await Promise.all([
    prisma.company.findMany({
      orderBy: { name: "asc" },
      include: { roles: true },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: { vendorCompany: true },
    }),
    prisma.productModule.findMany({ orderBy: { name: "asc" } }),
    prisma.productFeature.findMany({ orderBy: { name: "asc" } }),
    prisma.productSeller.findMany({
      where: { active: true },
      orderBy: [{ preferred: "desc" }, { createdAt: "desc" }],
      include: { seller: { include: { roles: true } }, product: true },
    }),
    prisma.purchasingVehicleSeller.findMany({
      where: { active: true },
      orderBy: [{ endsOn: "asc" }, { createdAt: "desc" }],
      include: {
        purchasingVehicle: true,
        seller: true,
        productEligibility: true,
      },
    }),
    prisma.fiscalYear.findMany({ orderBy: { startsOn: "desc" } }),
    prisma.contract.findMany({ orderBy: { title: "asc" } }),
    prisma.purchaseRequest.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.budgetAnnualFinancial.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        budgetPlan: true,
        scenario: true,
        fiscalYear: true,
        account: true,
        budgetItem: true,
        purchaseBudgetAllocations: true,
      },
    }),
    prisma.purchase.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        fiscalYear: true,
        sellerCompany: true,
        contract: true,
        purchasingVehicle: true,
        purchasingAgreement: { include: { purchasingVehicle: true } },
        purchaseRequest: true,
        items: {
          include: {
            product: { include: { vendorCompany: true } },
            productModule: true,
            features: { include: { feature: true } },
            budgetAllocations: {
              include: {
                fiscalYear: true,
                budgetAnnualFinancial: {
                  include: {
                    account: true,
                    budgetItem: true,
                    budgetPlan: true,
                    scenario: true,
                  },
                },
              },
            },
            deployments: {
              include: {
                usageMeasurements: { orderBy: { measuredAt: "desc" } },
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    companies,
    products,
    modules,
    features,
    productSellers,
    agreements,
    fiscalYears,
    contracts,
    purchaseRequests,
    budgetAnnualFinancials,
    purchases,
  };
}

const purchaseItemShape = {
  productId: idSchema,
  productModuleId: optionalId,
  featureIds: z.array(idSchema).default([]),
  description: optionalString,
  quantity: optionalDecimal,
  quantityType: z.enum(licenseMetrics).optional(),
  unitCost: optionalDecimal,
  recurringCost: optionalDecimal,
  implementationCost: optionalDecimal,
  licenseStartsOn: optionalDate,
  licenseEndsOn: optionalDate,
};

const purchaseSchema = z.object({
  title: requiredString,
  fiscalYearId: idSchema,
  sellerCompanyId: idSchema,
  contractId: optionalId,
  purchasingAgreementId: optionalId,
  purchaseRequestId: optionalId,
  status: z.enum(purchaseStatuses),
  currencyCode: z.string().trim().min(3).max(3).default("USD"),
  startsOn: optionalDate,
  endsOn: optionalDate,
  renewalDate: optionalDate,
  notesText: optionalString,
  item: z.object(purchaseItemShape),
});

const itemSchema = z.object({
  purchaseId: idSchema,
  ...purchaseItemShape,
});

async function validatePurchaseItemSelection(
  prisma: PrismaClientLike,
  productId: string,
  moduleId: string | undefined,
  featureIds: string[]
) {
  if (moduleId) {
    const productModule = await prisma.productModule.findFirst({
      where: { id: moduleId, productId },
    });
    if (!productModule) {
      throw new FieldValidationError(
        "Module does not belong to selected product.",
        {
          productModuleId: ["Choose a module under the selected product."],
        }
      );
    }
  }

  if (featureIds.length) {
    const count = await prisma.productFeature.count({
      where: {
        id: { in: featureIds },
        productId,
        moduleId: moduleId ? moduleId : undefined,
      },
    });
    if (count !== featureIds.length) {
      throw new FieldValidationError("Feature selection is incompatible.", {
        featureIds: [
          "Selected features must belong to the selected product and module.",
        ],
      });
    }
  }
}

function calculateLineTotal(input: {
  quantity?: number;
  unitCost?: number;
  recurringCost?: number;
  implementationCost?: number;
}) {
  const calculated = (input.quantity ?? 0) * (input.unitCost ?? 0);
  return (
    calculated + (input.recurringCost ?? 0) + (input.implementationCost ?? 0)
  );
}

async function assertSellerAgreement(
  prisma: PrismaClientLike,
  sellerCompanyId: string,
  productId: string,
  agreementId?: string
) {
  const productSeller = await prisma.productSeller.findFirst({
    where: { productId, sellerCompanyId, active: true },
  });
  if (!productSeller) {
    throw new FieldValidationError("Seller is not eligible for this product.", {
      sellerCompanyId: [
        "Select a seller relationship for the selected product.",
      ],
    });
  }

  if (agreementId) {
    const now = new Date();
    const agreement = await prisma.purchasingVehicleSeller.findFirst({
      where: {
        id: agreementId,
        sellerCompanyId,
        active: true,
        OR: [{ endsOn: null }, { endsOn: { gte: now } }],
        productEligibility: {
          some: {
            active: true,
            OR: [{ productId }, { productId: null }],
          },
        },
      },
    });
    if (!agreement) {
      throw new FieldValidationError(
        "Purchasing agreement is not applicable.",
        {
          purchasingAgreementId: [
            "Select an active agreement for the seller and product.",
          ],
        }
      );
    }
  }
}

export async function createPurchase(input: unknown) {
  const data = parse(purchaseSchema, input);
  assertDateOrder(data.startsOn, data.endsOn);
  assertDateOrder(data.item.licenseStartsOn, data.item.licenseEndsOn);

  const prisma = getPrisma();
  await validatePurchaseItemSelection(
    prisma,
    data.item.productId,
    data.item.productModuleId,
    data.item.featureIds
  );
  await assertSellerAgreement(
    prisma,
    data.sellerCompanyId,
    data.item.productId,
    data.purchasingAgreementId
  );

  const lineTotal = calculateLineTotal(data.item);
  const agreement = data.purchasingAgreementId
    ? await prisma.purchasingVehicleSeller.findUnique({
        where: { id: data.purchasingAgreementId },
      })
    : null;

  const purchase = await prisma.purchase.create({
    data: {
      title: data.title,
      fiscalYearId: data.fiscalYearId,
      sellerCompanyId: data.sellerCompanyId,
      contractId: data.contractId,
      purchasingAgreementId: data.purchasingAgreementId,
      purchasingVehicleId: agreement?.purchasingVehicleId,
      purchaseRequestId: data.purchaseRequestId,
      status: data.status,
      currencyCode: data.currencyCode,
      totalAmount: String(lineTotal),
      startsOn: data.startsOn,
      endsOn: data.endsOn,
      renewalDate: data.renewalDate,
      notesText: data.notesText,
      items: {
        create: {
          productId: data.item.productId,
          productModuleId: data.item.productModuleId,
          description: data.item.description,
          quantity: toDecimalInput(data.item.quantity),
          quantityType: data.item.quantityType,
          unitCost: toDecimalInput(data.item.unitCost),
          recurringCost: toDecimalInput(data.item.recurringCost),
          implementationCost: toDecimalInput(data.item.implementationCost),
          totalCost: String(lineTotal),
          licenseStartsOn: data.item.licenseStartsOn,
          licenseEndsOn: data.item.licenseEndsOn,
          features: {
            create: data.item.featureIds.map((featureId) => ({ featureId })),
          },
        },
      },
    },
  });

  return purchase.id;
}

export async function addPurchaseItem(input: unknown) {
  const data = parse(itemSchema, input);
  assertDateOrder(data.licenseStartsOn, data.licenseEndsOn);
  const prisma = getPrisma();
  const purchase = await prisma.purchase.findUnique({
    where: { id: data.purchaseId },
  });
  if (!purchase) {
    throw new FieldValidationError("Purchase is required.", {
      purchaseId: ["Select a purchase."],
    });
  }
  await validatePurchaseItemSelection(
    prisma,
    data.productId,
    data.productModuleId,
    data.featureIds
  );
  if (purchase.sellerCompanyId) {
    await assertSellerAgreement(
      prisma,
      purchase.sellerCompanyId,
      data.productId,
      purchase.purchasingAgreementId ?? undefined
    );
  }

  const lineTotal = calculateLineTotal(data);
  const item = await prisma.purchaseItem.create({
    data: {
      purchaseId: data.purchaseId,
      productId: data.productId,
      productModuleId: data.productModuleId,
      description: data.description,
      quantity: toDecimalInput(data.quantity),
      quantityType: data.quantityType,
      unitCost: toDecimalInput(data.unitCost),
      recurringCost: toDecimalInput(data.recurringCost),
      implementationCost: toDecimalInput(data.implementationCost),
      totalCost: String(lineTotal),
      licenseStartsOn: data.licenseStartsOn,
      licenseEndsOn: data.licenseEndsOn,
      features: { create: data.featureIds.map((featureId) => ({ featureId })) },
    },
  });

  const total = await prisma.purchaseItem.aggregate({
    where: { purchaseId: data.purchaseId },
    _sum: { totalCost: true },
  });
  await prisma.purchase.update({
    where: { id: data.purchaseId },
    data: { totalAmount: total._sum.totalCost ?? "0" },
  });

  return item.id;
}

const allocationSchema = z.object({
  purchaseId: idSchema,
  purchaseItemId: optionalId,
  budgetAnnualFinancialId: idSchema,
  allocatedAmount: decimal,
  notesText: optionalString,
});

export async function addBudgetAllocation(input: unknown) {
  const data = parse(allocationSchema, input);
  const prisma = getPrisma();
  const annual = await prisma.budgetAnnualFinancial.findUnique({
    where: { id: data.budgetAnnualFinancialId },
    include: { fiscalYear: true, budgetItem: true },
  });
  if (!annual) {
    throw new FieldValidationError("Budget row is required.", {
      budgetAnnualFinancialId: ["Select an annual financial record."],
    });
  }

  const existing = await prisma.purchaseBudgetAllocation.aggregate({
    where: { budgetAnnualFinancialId: data.budgetAnnualFinancialId },
    _sum: { allocatedAmount: true },
  });
  const remaining =
    Number(annual.approvedAmount) - Number(existing._sum.allocatedAmount ?? 0);
  if (data.allocatedAmount > remaining && Number(annual.approvedAmount) > 0) {
    throw new FieldValidationError("Allocation exceeds remaining amount.", {
      allocatedAmount: [
        "Allocation is greater than the budget row remaining amount.",
      ],
    });
  }

  const allocation = await prisma.purchaseBudgetAllocation.create({
    data: {
      purchaseId: data.purchaseId,
      purchaseItemId: data.purchaseItemId,
      fiscalYearId: annual.fiscalYearId,
      budgetItemId: annual.budgetItemId,
      budgetAnnualFinancialId: annual.id,
      allocatedAmount: String(data.allocatedAmount),
      notesText: data.notesText,
    },
  });

  return allocation.id;
}

const deploymentSchema = z.object({
  purchaseItemId: idSchema,
  scopeName: requiredString,
  environment: optionalString,
  department: optionalString,
  status: z.enum(deploymentStatuses),
  deploymentPercent: z.coerce.number().min(0).max(100),
  targetPopulation: z.coerce.number().int().min(0).optional(),
  deployedPopulation: z.coerce.number().int().min(0).optional(),
  adoptionLevel: z.enum(adoptionLevels).optional(),
  targetDate: optionalDate,
  completedDate: optionalDate,
  blockers: optionalString,
  expectedOutcome: optionalString,
  realizedOutcome: optionalString,
  valueNarrative: optionalString,
});

export async function addDeployment(input: unknown) {
  const data = parse(deploymentSchema, input);
  assertDateOrder(data.targetDate, data.completedDate);
  const prisma = getPrisma();
  const duplicate = await prisma.deployment.findFirst({
    where: { purchaseItemId: data.purchaseItemId, scopeName: data.scopeName },
  });
  if (duplicate) {
    throw new FieldValidationError(
      "Deployment scope must be unique per item.",
      {
        scopeName: ["This purchase item already has that deployment scope."],
      }
    );
  }
  const deployment = await prisma.deployment.create({
    data: {
      ...data,
      deploymentPercent: String(data.deploymentPercent),
    },
  });
  return deployment.id;
}

const usageSchema = z.object({
  deploymentId: idSchema,
  measuredAt: z
    .string()
    .trim()
    .min(1, "Required")
    .transform((value) => new Date(`${value}T00:00:00.000Z`)),
  licensedCount: z.coerce.number().int().min(0).optional(),
  deployedCount: z.coerce.number().int().min(0).optional(),
  activeUsageCount: z.coerce.number().int().min(0).optional(),
  utilizationPercent: z.coerce.number().min(0).max(100).optional(),
  source: optionalString,
  notesText: optionalString,
});

export async function addUsageMeasurement(input: unknown) {
  const data = parse(usageSchema, input);
  const prisma = getPrisma();
  const duplicate = await prisma.usageMeasurement.findFirst({
    where: { deploymentId: data.deploymentId, measuredAt: data.measuredAt },
  });
  if (duplicate) {
    throw new FieldValidationError("Measurement date already exists.", {
      measuredAt: ["Add a different date to preserve usage history."],
    });
  }
  const measurement = await prisma.usageMeasurement.create({
    data: {
      ...data,
      utilizationPercent:
        data.utilizationPercent === undefined
          ? undefined
          : String(data.utilizationPercent),
    },
  });
  return measurement.id;
}
