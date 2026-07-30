import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  saveCompanyAction,
  saveProductAction,
  setActiveAction,
} from "@/app/products/actions";
import { emptyActionResult } from "@/lib/server/action-result";

const cacheMock = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const catalogServiceMock = vi.hoisted(() => ({
  deleteVendorCompany: vi.fn(),
  saveCapability: vi.fn(),
  saveCompany: vi.fn(),
  saveProduct: vi.fn(),
  saveProductComponent: vi.fn(),
  saveProductFunction: vi.fn(),
  saveProductSeller: vi.fn(),
  savePurchasingAgreement: vi.fn(),
  savePurchasingVehicle: vi.fn(),
  saveResellerCompany: vi.fn(),
  saveVendorCompany: vi.fn(),
  setActiveRecord: vi.fn(),
}));

vi.mock("next/cache", () => cacheMock);
vi.mock("@/lib/server/catalog-service", () => catalogServiceMock);

describe("Product Catalog actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalidates Product Catalog and the company-reference tag for a company save", async () => {
    catalogServiceMock.saveCompany.mockResolvedValue("company-1");
    const formData = new FormData();
    formData.set("name", "Example");

    const result = await saveCompanyAction(emptyActionResult, formData);

    expect(result.ok).toBe(true);
    expect(cacheMock.revalidatePath.mock.calls).toEqual([["/products"]]);
    expect(cacheMock.revalidateTag).toHaveBeenCalledWith(
      "reference:companies",
      "max"
    );
  });

  it("does not invalidate company references for a Product save", async () => {
    catalogServiceMock.saveProduct.mockResolvedValue("product-1");
    const formData = new FormData();

    const result = await saveProductAction(emptyActionResult, formData);

    expect(result.ok).toBe(true);
    expect(cacheMock.revalidatePath.mock.calls).toEqual([["/products"]]);
    expect(cacheMock.revalidateTag).not.toHaveBeenCalled();
  });

  it("invalidates company references only when active Company state changes", async () => {
    catalogServiceMock.setActiveRecord.mockResolvedValue(undefined);
    const companyData = new FormData();
    companyData.set("kind", "company");
    companyData.set("id", "company-1");
    companyData.set("active", "false");

    await setActiveAction(companyData);

    expect(cacheMock.revalidateTag).toHaveBeenCalledWith(
      "reference:companies",
      "max"
    );

    vi.clearAllMocks();
    const productData = new FormData();
    productData.set("kind", "product");
    productData.set("id", "product-1");
    productData.set("active", "false");

    await setActiveAction(productData);

    expect(cacheMock.revalidateTag).not.toHaveBeenCalled();
  });
});
