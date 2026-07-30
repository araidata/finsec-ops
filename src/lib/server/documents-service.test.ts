import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getDocumentsPageData,
  searchDocumentLinkTargets,
} from "@/lib/server/documents-service";

const prismaMock = vi.hoisted(() => ({
  fiscalYear: { findUnique: vi.fn() },
  document: { count: vi.fn(), findMany: vi.fn() },
  activityLog: { count: vi.fn(), findMany: vi.fn() },
  contract: { findMany: vi.fn() },
  maintenanceRenewal: { findMany: vi.fn() },
  company: { findMany: vi.fn() },
  product: { findMany: vi.fn() },
}));

vi.mock("@/lib/server/prisma", () => ({ getPrisma: () => prismaMock }));

describe("documents read contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.fiscalYear.findUnique.mockResolvedValue({
      startsOn: new Date("2026-07-01T00:00:00.000Z"),
      endsOn: new Date("2027-06-30T00:00:00.000Z"),
    });
    prismaMock.document.count.mockResolvedValue(125);
    prismaMock.document.findMany.mockResolvedValue([]);
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
