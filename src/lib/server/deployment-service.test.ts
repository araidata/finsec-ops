import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEPLOYMENT_SOURCE_OPTION_LIMIT,
  DEPLOYMENT_USAGE_HISTORY_LIMIT,
  getDeploymentPageData,
} from "@/lib/server/deployment-service";

const prismaMock = vi.hoisted(() => ({
  deployment: { findMany: vi.fn() },
  contract: { findMany: vi.fn() },
  maintenanceRenewalLineItem: { findMany: vi.fn() },
  department: { findMany: vi.fn() },
  teamMember: { findMany: vi.fn() },
  deploymentEnvironment: { findMany: vi.fn() },
  fiscalYear: { findUnique: vi.fn(), findMany: vi.fn() },
}));

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => prismaMock,
}));

describe("getDeploymentPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.deployment.findMany.mockResolvedValue([]);
    prismaMock.maintenanceRenewalLineItem.findMany.mockResolvedValue([]);
    prismaMock.department.findMany.mockResolvedValue([]);
    prismaMock.teamMember.findMany.mockResolvedValue([]);
    prismaMock.deploymentEnvironment.findMany.mockResolvedValue([]);
    prismaMock.fiscalYear.findUnique.mockResolvedValue({
      startsOn: new Date("2026-07-01T00:00:00.000Z"),
      endsOn: new Date("2027-06-30T00:00:00.000Z"),
    });
  });

  it("removes the unused Contract read and bounds optional history and sources", async () => {
    const data = await getDeploymentPageData({
      departmentId: "department-1",
      fiscalYearId: "fy-2027",
    });

    expect(prismaMock.contract.findMany).not.toHaveBeenCalled();
    expect(prismaMock.fiscalYear.findMany).not.toHaveBeenCalled();
    expect(prismaMock.fiscalYear.findUnique).toHaveBeenCalledWith({
      where: { id: "fy-2027" },
      select: { startsOn: true, endsOn: true },
    });
    expect(prismaMock.deployment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { departmentId: "department-1" },
        select: expect.objectContaining({
          usageMeasurements: expect.objectContaining({
            take: DEPLOYMENT_USAGE_HISTORY_LIMIT,
          }),
          maintenanceRenewalLineItem: expect.objectContaining({
            select: expect.objectContaining({
              maintenanceRenewal: expect.any(Object),
            }),
          }),
        }),
      })
    );
    expect(prismaMock.maintenanceRenewalLineItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          maintenanceRenewal: {
            departmentId: "department-1",
            fiscalYearId: "fy-2027",
          },
        },
        take: DEPLOYMENT_SOURCE_OPTION_LIMIT,
      })
    );
    expect(data).not.toHaveProperty("contracts");
  });

  it("skips the Fiscal Year read when all years are selected", async () => {
    await getDeploymentPageData({});

    expect(prismaMock.fiscalYear.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.deployment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    );
  });
});
