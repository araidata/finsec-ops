import { beforeEach, describe, expect, it, vi } from "vitest";

import { reassignDepartment } from "@/lib/server/department-reassignment-service";

const transactionClient = vi.hoisted(() => ({
  budgetItem: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  contract: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  maintenanceRenewal: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  activityLog: {
    createMany: vi.fn(),
  },
}));

const prismaMock = vi.hoisted(() => ({
  department: {
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  getPrisma: () => prismaMock,
}));

vi.mock("@/lib/server/authorization", () => ({
  requirePermission: vi.fn().mockResolvedValue({ actorId: null }),
}));

describe("department reassignment service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.department.findUnique.mockResolvedValue({
      id: "department-2",
      name: "Infrastructure",
      active: true,
    });
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback(transactionClient)
    );
    transactionClient.contract.updateMany.mockResolvedValue({ count: 2 });
    transactionClient.activityLog.createMany.mockResolvedValue({ count: 2 });
  });

  it("moves a contract batch with one set-based write and one audit write", async () => {
    transactionClient.contract.findMany.mockResolvedValue([
      {
        id: "contract-1",
        department: { name: "Security" },
        _count: { maintenanceRenewals: 1, budgetItems: 0, documents: 0 },
      },
      {
        id: "contract-2",
        department: { name: "Security" },
        _count: { maintenanceRenewals: 0, budgetItems: 1, documents: 1 },
      },
    ]);

    await expect(
      reassignDepartment({
        entityType: "contract",
        entityIds: ["contract-1", "contract-2"],
        departmentId: "department-2",
      })
    ).resolves.toMatchObject({
      moved: 2,
      departmentName: "Infrastructure",
    });

    expect(transactionClient.contract.updateMany).toHaveBeenCalledOnce();
    expect(transactionClient.contract.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["contract-1", "contract-2"] } },
      data: { departmentId: "department-2" },
    });
    expect(transactionClient.activityLog.createMany).toHaveBeenCalledOnce();
  });

  it("rolls back before audit creation when the selected set changed", async () => {
    transactionClient.contract.findMany.mockResolvedValue([
      {
        id: "contract-1",
        department: { name: "Security" },
        _count: { maintenanceRenewals: 0, budgetItems: 0, documents: 0 },
      },
    ]);

    await expect(
      reassignDepartment({
        entityType: "contract",
        entityIds: ["contract-1", "contract-missing"],
        departmentId: "department-2",
      })
    ).rejects.toMatchObject({
      message: "Some selected records no longer exist.",
    });
    expect(transactionClient.contract.updateMany).not.toHaveBeenCalled();
    expect(transactionClient.activityLog.createMany).not.toHaveBeenCalled();
  });
});
