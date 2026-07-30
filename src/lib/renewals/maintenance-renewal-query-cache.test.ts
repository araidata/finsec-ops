import { describe, expect, it, vi } from "vitest";

import {
  createMaintenanceRenewalHydrationState,
  invalidateMaintenanceRenewalRegisters,
} from "@/lib/renewals/maintenance-renewal-query-cache";

describe("maintenance renewal query cache", () => {
  it("hydrates the normalized register key with server data", () => {
    const data = { renewals: [], pagination: { page: 1 } };
    const state = createMaintenanceRenewalHydrationState(
      { departmentId: "department-1" },
      data
    );

    expect(state.queries).toHaveLength(1);
    expect(state.queries[0]?.queryKey).toEqual([
      "maintenance-renewals",
      "register",
      expect.objectContaining({
        departmentId: "department-1",
        page: 1,
        pageSize: 50,
      }),
    ]);
    expect(state.queries[0]?.state.data).toEqual(data);
  });

  it("invalidates only maintenance renewal register variants", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);

    await invalidateMaintenanceRenewalRegisters({ invalidateQueries });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["maintenance-renewals", "register"],
    });
  });
});
