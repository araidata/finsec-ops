import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResellerWorkspace } from "@/components/catalog/product-catalog-workspace";

vi.mock("@/app/products/actions", () => ({
  deleteVendorAction: vi.fn(),
  saveFeatureAction: vi.fn(),
  saveModuleAction: vi.fn(),
  saveProductAction: vi.fn(),
  saveResellerAction: vi.fn(),
  saveVendorAction: vi.fn(),
}));

describe("ResellerWorkspace", () => {
  it("preserves the server page order and delegates controlled list changes", () => {
    const onSearchChange = vi.fn();
    const onSortChange = vi.fn();
    const onPageChange = vi.fn();

    render(
      <ResellerWorkspace
        resellers={[
          {
            id: "reseller-z",
            name: "Zulu Reseller",
            legalName: null,
            website: null,
            contactEmail: null,
            active: true,
          },
          {
            id: "reseller-a",
            name: "Alpha Reseller",
            legalName: null,
            website: null,
            contactEmail: null,
            active: false,
          },
        ]}
        search=""
        status="all"
        sort="name-asc"
        pagination={{
          page: 2,
          pageSize: 2,
          total: 6,
          pageCount: 3,
          hasPreviousPage: true,
          hasNextPage: true,
        }}
        onSearchChange={onSearchChange}
        onStatusChange={vi.fn()}
        onSortChange={onSortChange}
        onPageChange={onPageChange}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Zulu Reseller");
    expect(rows[2]).toHaveTextContent("Alpha Reseller");

    fireEvent.change(screen.getByLabelText("Search resellers"), {
      target: { value: "alpha" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Name / }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(onSearchChange).toHaveBeenCalledWith("alpha");
    expect(onSortChange).toHaveBeenCalledWith("name-desc");
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
