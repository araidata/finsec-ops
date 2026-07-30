import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDashboardPageData } from "@/lib/server/dashboard-service";

const prismaMock = vi.hoisted(() => ({
  fiscalYear: { findFirst: vi.fn() },
  department: { findFirst: vi.fn() },
  maintenanceRenewal: {
    aggregate: vi.fn(),
    findMany: vi.fn(),
  },
  contract: { aggregate: vi.fn() },
  deployment: { aggregate: vi.fn() },
  purchaseRequest: { findMany: vi.fn() },
  $queryRaw: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache:
    (callback: (...args: unknown[]) => unknown) =>
    (...args: unknown[]) =>
      callback(...args),
}));

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => prismaMock,
  hasDatabaseUrl: () => true,
}));

function setAggregateDefaults() {
  prismaMock.maintenanceRenewal.aggregate.mockResolvedValue({
    _sum: { approvedAmount: 0 },
    _count: { _all: 0, departmentId: 0 },
  });
  prismaMock.contract.aggregate.mockResolvedValue({
    _sum: { annualValue: 0 },
    _count: { _all: 0, departmentId: 0 },
  });
  prismaMock.deployment.aggregate.mockResolvedValue({
    _avg: { deploymentPercent: 0 },
    _count: { _all: 0, departmentId: 0 },
  });
  prismaMock.maintenanceRenewal.findMany.mockResolvedValue([]);
  prismaMock.purchaseRequest.findMany.mockResolvedValue([]);
}

describe("getDashboardPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAggregateDefaults();
    prismaMock.fiscalYear.findFirst.mockResolvedValue({
      id: "fy-2026",
      label: "FY 2026",
      startsOn: new Date("2025-10-01T00:00:00.000Z"),
      endsOn: new Date("2026-09-30T00:00:00.000Z"),
    });
    prismaMock.department.findFirst.mockResolvedValue({
      id: "security",
      name: "Information Security",
    });
  });

  it("applies validated Department/Fiscal Year scope before bounded list reads", async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([
        {
          approved: 100,
          actual: 50,
          forecast: 90,
          assignedRecords: 2,
          totalRecords: 3,
        },
      ])
      .mockResolvedValueOnce([{ category: "Software", spend: 50 }])
      .mockResolvedValueOnce([
        {
          fiscalYear: "FY 2027",
          startsOn: new Date("2026-10-01T00:00:00.000Z"),
          actual: 20,
          forecast: 30,
          budget: 40,
          committed: 10,
        },
        {
          fiscalYear: "FY 2026",
          startsOn: new Date("2025-10-01T00:00:00.000Z"),
          actual: 50,
          forecast: 90,
          budget: 100,
          committed: 25,
        },
      ]);
    prismaMock.maintenanceRenewal.aggregate.mockResolvedValue({
      _sum: { approvedAmount: 30 },
      _count: { _all: 2, departmentId: 1 },
    });
    prismaMock.contract.aggregate.mockResolvedValue({
      _sum: { annualValue: 40 },
      _count: { _all: 1, departmentId: 1 },
    });
    prismaMock.deployment.aggregate.mockResolvedValue({
      _avg: { deploymentPercent: 80 },
      _count: { _all: 1, departmentId: 0 },
    });

    const data = await getDashboardPageData(
      { departmentId: "security", fiscalYearId: "fy-2026" },
      { renewalLimit: 500, procurementLimit: 500 }
    );

    expect(prismaMock.maintenanceRenewal.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          fiscalYearId: "fy-2026",
          departmentId: "security",
        },
      })
    );
    expect(prismaMock.contract.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          departmentId: "security",
          OR: expect.any(Array),
        }),
      })
    );
    expect(prismaMock.deployment.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          departmentId: "security",
          OR: expect.any(Array),
        }),
      })
    );
    expect(prismaMock.maintenanceRenewal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          fiscalYearId: "fy-2026",
          departmentId: "security",
          renewalDate: { gte: expect.any(Date) },
        }),
        orderBy: [{ renewalDate: "asc" }, { id: "asc" }],
        take: 20,
        select: expect.objectContaining({ id: true, approvedAmount: true }),
      })
    );
    expect(prismaMock.purchaseRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          fiscalYearId: "fy-2026",
          OR: expect.arrayContaining([
            { contract: { departmentId: "security" } },
          ]),
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 20,
      })
    );
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(3);
    expect(data.contextDepartment).toBe("Information Security");
    expect(data.contextFiscalYear).toBe("FY 2026");
    expect(data.forecastTrend.map((point) => point.fiscalYear)).toEqual([
      "FY 2026",
      "FY 2027",
    ]);
    expect(data.reportingReadiness).toEqual({
      percentage: 57,
      assignedRecords: 4,
      totalRecords: 7,
      detail: "4 of 7 scoped records have a department",
    });
  });

  it("maps database aggregates and bounded queues to serializable DTOs", async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([
        {
          approved: { toString: () => "200" },
          actual: { toString: () => "100" },
          forecast: { toString: () => "250" },
          assignedRecords: 1,
          totalRecords: 1,
        },
      ])
      .mockResolvedValueOnce([
        { category: "Software", spend: { toString: () => "75" } },
        { category: "Services", spend: { toString: () => "25" } },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: null,
          name: "Unassigned",
          approved: { toString: () => "25" },
          forecastVariance: { toString: () => "5" },
          renewalExposure: { toString: () => "10" },
          contractSpend: { toString: () => "20" },
          deploymentProgress: 60,
        },
      ]);
    prismaMock.maintenanceRenewal.findMany.mockResolvedValue([
      {
        id: "renewal-1",
        productOrService: "Service",
        renewalOwner: "Owner",
        renewalDate: new Date("2026-06-01T00:00:00.000Z"),
        approvedAmount: { toString: () => "30" },
        riskStatus: "AT_RISK",
        vendorCompany: { name: "Vendor" },
        product: null,
        ownerTeamMember: null,
        departmentRef: null,
      },
    ]);
    prismaMock.purchaseRequest.findMany.mockResolvedValue([
      {
        id: "request-1",
        title: "Request",
        requestAmount: 0,
        approvedAmount: 45,
        status: "APPROVED",
        vendorCompany: null,
        owner: null,
        contract: null,
        maintenanceRenewal: null,
        budgetLineItems: [],
      },
    ]);

    const data = await getDashboardPageData();

    expect(data.metrics).toMatchObject({
      budgetUtilization: "50%",
      forecastVariance: "$50",
    });
    expect(data.spendByCategory).toEqual([
      expect.objectContaining({
        category: "Software",
        spend: 75,
        share: "75%",
      }),
      expect.objectContaining({
        category: "Services",
        spend: 25,
        share: "25%",
      }),
    ]);
    expect(data.renewals[0]).toMatchObject({
      id: "renewal-1",
      amount: 30,
      status: "At Risk",
    });
    expect(data.procurementQueue[0]).toMatchObject({
      id: "request-1",
      amount: 45,
      department: "Unassigned",
    });
    expect(data.departmentComparison[0]).toEqual({
      id: null,
      name: "Unassigned",
      approved: 25,
      forecastVariance: 5,
      renewalExposure: 10,
      contractSpend: 20,
      deploymentProgress: 60,
    });
  });

  it("rejects unavailable context before running reporting queries", async () => {
    prismaMock.department.findFirst.mockResolvedValue(null);

    await expect(
      getDashboardPageData({ departmentId: "missing" })
    ).rejects.toThrow("Selected Department is not available.");

    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    expect(prismaMock.maintenanceRenewal.aggregate).not.toHaveBeenCalled();
  });
});
