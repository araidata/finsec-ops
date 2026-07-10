import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ActiveBadge,
  EmptyState,
  MultiSelect,
  SelectBox,
} from "@/components/catalog/relational-controls";

describe("relational catalog controls", () => {
  it("keeps inactive historical options readable", () => {
    render(
      <SelectBox
        label="Seller"
        name="seller"
        options={[
          { id: "active", label: "Active Seller", active: true },
          { id: "inactive", label: "Old Seller", active: false },
        ]}
        defaultValue="inactive"
      />
    );

    expect(
      screen.getByRole("option", { name: /Old Seller/ })
    ).toHaveTextContent("inactive");
  });

  it("renders multi-select relationship options", () => {
    render(
      <MultiSelect
        label="Capabilities"
        name="capabilityIds"
        options={[
          { id: "iam", label: "IAM" },
          { id: "dlp", label: "DLP" },
        ]}
        defaultValues={["iam"]}
      />
    );

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "IAM" })).toBeInTheDocument();
  });

  it("renders reusable state components", () => {
    render(
      <>
        <ActiveBadge active={false} />
        <EmptyState>No records yet.</EmptyState>
      </>
    );

    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.getByText("No records yet.")).toBeInTheDocument();
  });
});
