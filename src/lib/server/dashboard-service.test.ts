import { describe, expect, it } from "vitest";

import { aggregateDepartmentComparison } from "@/lib/server/dashboard-service";

describe("aggregateDepartmentComparison", () => {
  it("keeps department totals separate and labels unassigned records", () => {
    const rows = aggregateDepartmentComparison({
      departments: [
        { id: "security", name: "Information Security" },
        { id: "it", name: "IT Operations" },
      ],
      annuals: [
        { departmentId: "security", approved: 100, forecast: 120 },
        { departmentId: "it", approved: 50, forecast: 45 },
        { departmentId: null, approved: 10, forecast: 10 },
      ],
      renewals: [
        { departmentId: "security", amount: 25 },
        { departmentId: null, amount: 5 },
      ],
      contracts: [{ departmentId: "it", annualValue: 80 }],
      deployments: [
        { departmentId: "security", progress: 60 },
        { departmentId: "security", progress: 80 },
        { departmentId: "it", progress: 40 },
      ],
    });

    expect(rows).toEqual([
      expect.objectContaining({ name: "Information Security", approved: 100, forecastVariance: 20, renewalExposure: 25, deploymentProgress: 70 }),
      expect.objectContaining({ name: "IT Operations", approved: 50, forecastVariance: -5, contractSpend: 80, deploymentProgress: 40 }),
      expect.objectContaining({ name: "Unassigned", approved: 10, renewalExposure: 5 }),
    ]);
  });

  it("does not create empty department rows", () => {
    expect(aggregateDepartmentComparison({ departments: [{ id: "security", name: "Information Security" }], annuals: [], renewals: [], contracts: [], deployments: [] })).toEqual([]);
  });
});
