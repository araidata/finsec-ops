import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getDocumentsPageData,
  deleteDocument,
  searchDocumentLinkTargets,
} from "@/lib/server/documents-service";

const authorizationMock = vi.hoisted(() => ({
  requirePermission: vi.fn(),
}));

const prismaMock = vi.hoisted(() => ({
  fiscalYear: { findUnique: vi.fn() },
  document: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
  activityLog: { count: vi.fn(), findMany: vi.fn() },
  contract: { findMany: vi.fn() },
  maintenanceRenewal: { findMany: vi.fn() },
  company: { findMany: vi.fn() },
  product: { findMany: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({ getPrisma: () => prismaMock }));
vi.mock("@/lib/server/authorization", () => ({
  requirePermission: authorizationMock.requirePermission,
}));

describe("documents read contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authorizationMock.requirePermission.mockResolvedValue({ actorId: null });
    prismaMock.fiscalYear.findUnique.mockResolvedValue({
      startsOn: new Date("2026-07-01T00:00:00.000Z"),
      endsOn: new Date("2027-06-30T00:00:00.000Z"),
    });
    prismaMock.document.count.mockResolvedValue(125);
    prismaMock.document.findMany.mockResolvedValue([]);
  });

  it("does not delete a scoped Document when authorization is denied", async () => {
    prismaMock.document.findUnique.mockResolvedValue({
      id: "ae2e27e8-3104-458c-92a9-a275c3121f66",
      title: "Contract",
      contract: { departmentId: "department-1" },
      maintenanceRenewal: null,
    });
    authorizationMock.requirePermission.mockRejectedValue(
      new Error("Permission denied")
    );

    await expect(
      deleteDocument("ae2e27e8-3104-458c-92a9-a275c3121f66")
    ).rejects.toThrow("Permission denied");

    expect(authorizationMock.requirePermission).toHaveBeenCalledWith({
      permission: "documents.write",
      departmentId: "department-1",
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("applies context and caps the server document page at 100 rows", async () => {
    const result = await getDocumentsPageData({
      departmentId: "department-1",
      fiscalYearId: "fy-2027",
      search: "contract",
      page: 2,
      pageSize: 500,
    });

    expect(prismaMock.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 100,
        take: 100,
        where: expect.objectContaining({ AND: expect.any(Array) }),
      })
    );
    expect(prismaMock.activityLog.findMany).not.toHaveBeenCalled();
    expect(prismaMock.company.findMany).not.toHaveBeenCalled();
    expect(result.pagination).toEqual({
      page: 2,
      pageSize: 100,
      totalCount: 125,
      totalPages: 2,
    });
  });

  it("bounds scoped link-target searches to 50 records", async () => {
    prismaMock.maintenanceRenewal.findMany.mockResolvedValue([]);
    await searchDocumentLinkTargets({
      entityType: "maintenanceRenewal",
      departmentId: "department-1",
      fiscalYearId: "fy-2027",
      search: "security",
    });

    expect(prismaMock.maintenanceRenewal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
        where: expect.objectContaining({
          departmentId: "department-1",
          fiscalYearId: "fy-2027",
        }),
      })
    );
  });
});
