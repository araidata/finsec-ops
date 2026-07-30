import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/renewals/route";
import { listMaintenanceRenewals } from "@/lib/server/maintenance-renewal-service";
import { resolveGlobalContext } from "@/lib/server/global-context";

vi.mock("@/lib/server/global-context", () => ({
  resolveGlobalContext: vi.fn(),
}));

vi.mock("@/lib/server/maintenance-renewal-service", () => ({
  listMaintenanceRenewals: vi.fn(),
}));

describe("maintenance renewals route handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveGlobalContext).mockResolvedValue({
      options: {
        departments: [],
        fiscalYears: [],
        defaultFiscalYearId: "fy-2027",
      },
      selection: {
        departmentId: "department-1",
        fiscalYearId: "fy-2027",
      },
      serviceSelection: {
        departmentId: "department-1",
        fiscalYearId: "fy-2027",
      },
    } as Awaited<ReturnType<typeof resolveGlobalContext>>);
    vi.mocked(listMaintenanceRenewals).mockResolvedValue({
      renewals: [],
      pagination: {
        page: 2,
        pageSize: 100,
        totalCount: 0,
        totalPages: 1,
      },
      query: {
        search: "security",
        status: "",
        ownerId: "",
        vendorId: "",
        resellerId: "",
        coOpAgreement: "",
        windowDays: null,
        sort: "renewalDateAsc",
      },
    });
  });

  it("resolves scope and caps the requested page size", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/renewals?department=department-1&fy=fy-2027&q=security&page=2&pageSize=500"
      )
    );

    expect(resolveGlobalContext).toHaveBeenCalledWith({
      departmentId: "department-1",
      fiscalYearId: "fy-2027",
    });
    expect(listMaintenanceRenewals).toHaveBeenCalledWith(
      expect.objectContaining({
        departmentId: "department-1",
        fiscalYearId: "fy-2027",
        search: "security",
        page: 2,
        pageSize: 100,
      })
    );
    expect(response.status).toBe(200);
  });

  it("returns a safe error response", async () => {
    vi.mocked(resolveGlobalContext).mockRejectedValueOnce(
      new Error("private database detail")
    );

    const response = await GET(new Request("http://localhost/api/renewals"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      message: "Maintenance renewals could not be loaded.",
    });
  });

});
