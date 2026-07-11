"use server";

import { revalidatePath } from "next/cache";

import {
  type ActionResult,
  validationFailure,
} from "@/lib/server/action-result";
import {
  saveCapability,
  saveCompany,
  saveProduct,
  saveProductComponent,
  saveProductFunction,
  saveProductSeller,
  savePurchasingAgreement,
  savePurchasingVehicle,
  saveResellerCompany,
  saveVendorCompany,
  setActiveRecord,
} from "@/lib/server/catalog-service";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value === "none" ? "" : value;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function list(formData: FormData, key: string) {
  return formData.getAll(key).map(String).filter(Boolean);
}

async function action<T>(
  callback: () => Promise<T>,
  message: string
): Promise<ActionResult> {
  try {
    await callback();
    revalidatePath("/products");
    revalidatePath("/purchases");
    return { ok: true, message };
  } catch (error) {
    return validationFailure(error);
  }
}

export async function saveCompanyAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveCompany({
        id: optionalText(formData, "id"),
        name: text(formData, "name"),
        legalName: text(formData, "legalName"),
        website: text(formData, "website"),
        contactEmail: text(formData, "contactEmail"),
        roles: list(formData, "roles"),
        active: checked(formData, "active"),
      }),
    "Company saved."
  );
}

export async function saveVendorAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveVendorCompany({
        id: optionalText(formData, "id"),
        name: text(formData, "name"),
        legalName: text(formData, "legalName"),
        website: text(formData, "website"),
        contactEmail: text(formData, "contactEmail"),
        active: checked(formData, "active"),
      }),
    "Vendor saved."
  );
}

export async function saveResellerAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveResellerCompany({
        id: optionalText(formData, "id"),
        name: text(formData, "name"),
        legalName: text(formData, "legalName"),
        website: text(formData, "website"),
        contactEmail: text(formData, "contactEmail"),
        active: checked(formData, "active"),
      }),
    "Reseller saved."
  );
}

export async function saveCapabilityAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveCapability({
        id: optionalText(formData, "id"),
        name: text(formData, "name"),
        description: text(formData, "description"),
        active: checked(formData, "active"),
      }),
    "Capability saved."
  );
}

export async function saveProductAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveProduct({
        id: optionalText(formData, "id"),
        vendorCompanyId: text(formData, "vendorCompanyId"),
        name: text(formData, "name"),
        offeringType: text(formData, "offeringType"),
        productCategory: text(formData, "productCategory"),
        description: text(formData, "description"),
        capabilityIds: list(formData, "capabilityIds"),
        active: checked(formData, "active"),
      }),
    "Product saved."
  );
}

export async function saveModuleAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveProductComponent({
        id: optionalText(formData, "id"),
        productId: text(formData, "productId"),
        name: text(formData, "name"),
        description: text(formData, "description"),
        componentType: text(formData, "componentType"),
        sku: text(formData, "sku"),
        licenseMetric: optionalText(formData, "licenseMetric") || undefined,
        separatelyPurchasable: checked(formData, "separatelyPurchasable"),
        separatelyRenewable: checked(formData, "separatelyRenewable"),
        purpose: text(formData, "purpose"),
        lifecycleStatus: text(formData, "lifecycleStatus"),
        planningEstimate: text(formData, "planningEstimate") || "0",
        capabilityIds: list(formData, "capabilityIds"),
        active: checked(formData, "active"),
      }),
    "Product Component saved."
  );
}

export async function saveFeatureAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveProductFunction({
        id: optionalText(formData, "id"),
        productId: text(formData, "productId"),
        moduleId: optionalText(formData, "moduleId"),
        relatedCapabilityId:
          optionalText(formData, "relatedCapabilityId") || undefined,
        name: text(formData, "name"),
        description: text(formData, "description"),
        strategicImportance:
          optionalText(formData, "strategicImportance") || undefined,
        notesText: text(formData, "notesText"),
        capabilityIds: list(formData, "capabilityIds"),
        active: checked(formData, "active"),
      }),
    "Function saved."
  );
}

export async function saveSellerAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      saveProductSeller({
        id: optionalText(formData, "id"),
        productId: text(formData, "productId"),
        sellerCompanyId: text(formData, "sellerCompanyId"),
        relationshipType: text(formData, "relationshipType"),
        preferred: checked(formData, "preferred"),
        sellerSku: text(formData, "sellerSku"),
        active: checked(formData, "active"),
      }),
    "Seller relationship saved."
  );
}

export async function saveVehicleAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      savePurchasingVehicle({
        id: optionalText(formData, "id"),
        name: text(formData, "name"),
        contractNumber: text(formData, "contractNumber"),
        issuingOrganization: text(formData, "issuingOrganization"),
        startsOn: text(formData, "startsOn"),
        endsOn: text(formData, "endsOn"),
        notesText: text(formData, "notesText"),
        active: checked(formData, "active"),
      }),
    "Purchasing vehicle saved."
  );
}

export async function saveAgreementAction(
  _prev: ActionResult,
  formData: FormData
) {
  return action(
    () =>
      savePurchasingAgreement({
        id: optionalText(formData, "id"),
        purchasingVehicleId: text(formData, "purchasingVehicleId"),
        sellerCompanyId: text(formData, "sellerCompanyId"),
        sellerAwardNumber: text(formData, "sellerAwardNumber"),
        title: text(formData, "title"),
        startsOn: text(formData, "startsOn"),
        endsOn: text(formData, "endsOn"),
        notesText: text(formData, "notesText"),
        productIds: list(formData, "productIds"),
        active: checked(formData, "active"),
      }),
    "Purchasing agreement saved."
  );
}

export async function setActiveAction(formData: FormData) {
  await setActiveRecord(
    text(formData, "kind") as Parameters<typeof setActiveRecord>[0],
    text(formData, "id"),
    text(formData, "active") === "true"
  );
  revalidatePath("/products");
  revalidatePath("/purchases");
}
