import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEPLOYMENT_SOURCE_OPTION_LIMIT,
  getDeploymentDetail,
  getDeploymentEditorOptions,
  addDeploymentUsageMeasurement,
  listDeployments,
  listDeploymentUsageMeasurements,
  saveDeployment,
} from "@/lib/server/deployment-service";

const authorizationMock = vi.hoisted(() => ({
  requirePermission: vi.fn(),
}));

const prismaMock = vi.hoisted(() => ({
  deployment: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
  },
  usageMeasurement: { findMany: vi.fn(), findFirst: vi.fn() },
  maintenanceRenewalLineItem: { findMany: vi.fn(), findFirst: vi.fn() },
  department: { findMany: vi.fn(), findUnique: vi.fn() },
  teamMember: { findMany: vi.fn(), findUnique: vi.fn() },
  company: { findMany: vi.fn() },
  product: { findMany: vi.fn() },
  deploymentEnvironment: { findMany: vi.fn() },
  fiscalYear: { findUnique: vi.fn() },
  activityLog: { create: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => prismaMock,
}));
vi.mock("@/lib/server/authorization", () => ({
  requirePermission: authorizationMock.requirePermission,
}));

describe("Deployment bounded read contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authorizationMock.requirePermission.mockResolvedValue({ actorId: null });
    prismaMock.deployment.findMany.mockResolvedValue([]);
    prismaMock.deployment.findFirst.mockResolvedValue(null);
    prismaMock.deployment.count.mockResolvedValue(0);
    prismaMock.deployment.aggregate.mockResolvedValue({
      _avg: { utilizationPercent: null },
    });
    prismaMock.usageMeasurement.findMany.mockResolvedValue([]);
    prismaMock.maintenanceRenewalLineItem.findMany.mockResolvedValue([]);
    prismaMock.department.findMany.mockResolvedValue([]);
    prismaMock.teamMember.findMany.mockResolvedValue([]);
    prismaMock.company.findMany.mockResolvedValue([]);
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.deploymentEnvironment.findMany.mockResolvedValue([]);
    prismaMock.fiscalYear.findUnique.mockResolvedValue({
      startsOn: new Date("2026-07-01T00:00:00.000Z"),
      endsOn: new Date("2027-06-30T00:00:00.000Z"),
    });
  });

  it("stops a Usage Measurement mutation when Deployment authorization is denied", async () => {
    prismaMock.deployment.findUnique.mockResolvedValue({
      id: "ae2e27e8-3104-458c-92a9-a275c3121f66",
      departmentId: "department-1",
    });
    authorizationMock.requirePermission.mockRejectedValue(
      new Error("Permission denied")
    );

    await expect(
      addDeploymentUsageMeasurement({
        deploymentId: "ae2e27e8-3104-458c-92a9-a275c3121f66",
        measuredAt: "2026-07-29",
      })
    ).rejects.toThrow("Permission denied");

    expect(authorizationMock.requirePermission).toHaveBeenCalledWith({
      permission: "deployment.write",
      departmentId: "department-1",
    });
    expect(prismaMock.usageMeasurement.findFirst).not.toHaveBeenCalled();
  });

  it("rejects a stale authoritative Deployment overwrite", async () => {
    const deploymentId = "ae2e27e8-3104-458c-92a9-a275c3121f66";
    const departmentId = "ff643938-b867-407d-a730-66a6f16492ae";
    const renewalId = "5b6d10e0-71dc-4f62-bf88-05d0e102a79d";
    const lineId = "884096d0-26f8-4eec-8fea-b956d66394bc";
    const expectedUpdatedAt = "2026-07-29T12:00:00.000Z";
    prismaMock.deployment.findUnique.mockResolvedValue({
      id: deploymentId,
      departmentId,
      updatedAt: new Date(expectedUpdatedAt),
    });
    prismaMock.maintenanceRenewalLineItem.findFirst.mockResolvedValue({
      id: lineId,
      maintenanceRenewalId: renewalId,
      currentQuantity: 100,
      maintenanceRenewal: { departmentId },
      product: { id: "product-1" },
    });
    prismaMock.department.findUnique.mockResolvedValue({
      id: departmentId,
      name: "Security",
    });
    prismaMock.deployment.findFirst.mockResolvedValue(null);
    prismaMock.deployment.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
        callback(prismaMock)
    );

    await expect(
      saveDeployment({
        id: deploymentId,
        expectedUpdatedAt,
        maintenanceRenewalId: renewalId,
        maintenanceRenewalLineItemId: lineId,
        scopeName: "Endpoint",
        departmentId,
        status: "ACTIVE",
        deploymentPercent: "50",
      })
    ).rejects.toThrow("changed while you were editing");

    expect(prismaMock.deployment.updateMany).toHaveBeenCalledWith({
      where: {
        id: deploymentId,
        updatedAt: new Date(expectedUpdatedAt),
      },
      data: expect.any(Object),
    });
    expect(prismaMock.activityLog.create).not.toHaveBeenCalled();
  });

  it("pushes context, filters, stable order, and the 100-row maximum to PostgreSQL", async () => {
    await listDeployments(
      {
        departmentId: "department-1",
        fiscalYearId: "fy-2027",
      },
      {
        search: "endpoint",
        ownerTeamMemberId: "owner-1",
        status: "ACTIVE",
        sortBy: "scopeName",
        sortDirection: "asc",
        pageSize: 500,
      }
    );

    expect(prismaMock.fiscalYear.findUnique).toHaveBeenCalledWith({
      where: { id: "fy-2027" },
      select: { startsOn: true, endsOn: true },
    });
    expect(prismaMock.deployment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 101,
        orderBy: [{ scopeName: "asc" }, { id: "asc" }],
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              departmentId: "department-1",
              OR: expect.any(Array),
            }),
            { ownerTeamMemberId: "owner-1" },
            { status: "ACTIVE" },
          ]),
        }),
      })
    );
    const query = prismaMock.deployment.findMany.mock.calls[0]?.[0];
    expect(query.select.usageMeasurements).toBeUndefined();
    expect(query.select.contractLineItem.select.contract.select).toEqual(
      expect.objectContaining({ id: true, title: true })
    );
  });

  it("keeps selected detail separate from Usage Measurement history", async () => {
    await getDeploymentDetail("deployment-1", {
      departmentId: "department-1",
    });

    expect(prismaMock.deployment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [{ id: "deployment-1" }, { departmentId: "department-1" }],
        },
      })
    );
    const query = prismaMock.deployment.findFirst.mock.calls[0]?.[0];
    expect(query.select.usageMeasurements).toBeUndefined();
  });

  it("pages selected Usage Measurement history independently", async () => {
    await listDeploymentUsageMeasurements(
      "deployment-1",
      "measurement-50",
      500
    );

    expect(prismaMock.usageMeasurement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deploymentId: "deployment-1" },
        orderBy: [{ measuredAt: "desc" }, { id: "desc" }],
        cursor: { id: "measurement-50" },
        skip: 1,
        take: 101,
      })
    );
  });

  it("bounds editor sources and applies both Department and Fiscal Year", async () => {
    await getDeploymentEditorOptions({
      departmentId: "department-1",
      fiscalYearId: "fy-2027",
    });

    expect(prismaMock.maintenanceRenewalLineItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          maintenanceRenewal: {
            departmentId: "department-1",
            fiscalYearId: "fy-2027",
          },
        },
        take: DEPLOYMENT_SOURCE_OPTION_LIMIT,
        select: expect.not.objectContaining({ deployments: expect.anything() }),
      })
    );
    expect(prismaMock.department.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
    expect(prismaMock.teamMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
    expect(prismaMock.deploymentEnvironment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });
});
