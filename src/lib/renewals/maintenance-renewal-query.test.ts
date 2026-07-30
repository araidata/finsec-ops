import { describe, expect, it } from "vitest";

import {
  maintenanceRenewalQueryKeys,
  maintenanceRenewalRegisterSearchParams,
} from "@/lib/renewals/maintenance-renewal-query";

describe("maintenance renewal register query contract", () => {
  it("builds stable keys independent of omitted defaults", () => {
    expect(maintenanceRenewalQueryKeys.register({})).toEqual(
      maintenanceRenewalQueryKeys.register({
        sort: "renewalDateAsc",
        page: 1,
        pageSize: 50,
      })
    );
  });

  it("serializes scoped server controls for the route-handler query", () => {
    const params = maintenanceRenewalRegisterSearchParams({
      departmentId: "department-1",
      fiscalYearId: "fy-2027",
      search: "security",
      status: "PLANNING",
      page: 2,
      pageSize: 100,
    });

    expect(params.get("department")).toBe("department-1");
    expect(params.get("fy")).toBe("fy-2027");
    expect(params.get("q")).toBe("security");
    expect(params.get("status")).toBe("PLANNING");
    expect(params.get("page")).toBe("2");
    expect(params.get("pageSize")).toBe("100");
  });
});
