import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MaintenanceRenewalHistory } from "@/components/renewals/maintenance-renewal-detail-tabs";

describe("maintenance renewal deferred detail tabs", () => {
  it("renders selected-record history with resolved reference labels", () => {
    render(
      <MaintenanceRenewalHistory
        renewal={{ decisionHistory: [] }}
        activities={[
          {
            id: "activity-1",
            fieldName: "vendorCompanyId",
            previousValue: "vendor-1",
            newValue: "vendor-2",
            occurredAt: "2026-07-29T12:00:00.000Z",
          },
        ]}
        data={{
          companies: [
            { id: "vendor-1", name: "Old Vendor" },
            { id: "vendor-2", name: "New Vendor" },
          ],
          products: [],
          teamMembers: [],
        }}
      />
    );

    expect(
      screen.getByText(
        "Vendor Company Id changed from Old Vendor to New Vendor"
      )
    ).toBeInTheDocument();
  });
});
