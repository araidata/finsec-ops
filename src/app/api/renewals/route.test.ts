import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/renewals/route";
import { listMaintenanceRenewals } from "@/lib/server/maintenance-renewal-service";
import { resolveGlobalContext } from "@/lib/server/global-context";
import {
  getCurrentPrincipal,
  principalHasDepartmentAccess,
  principalHasPermission,
} from "@/lib/server/authorization";

vi.mock("@/lib/server/global-context", () => ({
  resolveGlobalContext: vi.fn(),
}));

vi.mock("@/lib/server/authorization", () => ({
  getCurrentPrincipal: vi.fn().mockResolvedValue({
    userId: "user-1",
    role: "PLATFORM_ADMIN",
    departmentIds: [],
    crossDepartment: true,
  }),
  principalHasDepartmentAccess: vi.fn().mockReturnValue(true),
  principalHasPermission: vi.fn().mockReturnValue(true),
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

  it("returns 401 before resolving data without an active principal", async () => {
    vi.mocked(getCurrentPrincipal).mockResolvedValueOnce(null);

    const response = await GET(new Request("http://localhost/api/renewals"));

    expect(response.status).toBe(401);
    expect(resolveGlobalContext).not.toHaveBeenCalled();
  });

  it("returns 403 when the principal lacks Renewal permission", async () => {
    vi.mocked(principalHasPermission).mockReturnValueOnce(false);

    const response = await GET(new Request("http://localhost/api/renewals"));

    expect(response.status).toBe(403);
    expect(resolveGlobalContext).not.toHaveBeenCalled();
  });

  it("returns 403 before the list read for an unauthorized Department", async () => {
    vi.mocked(principalHasDepartmentAccess).mockReturnValueOnce(false);

    const response = await GET(
      new Request("http://localhost/api/renewals?department=department-1")
    );

    expect(response.status).toBe(403);
    expect(listMaintenanceRenewals).not.toHaveBeenCalled();
  });
});
