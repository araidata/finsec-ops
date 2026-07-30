import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSettingsPageData } from "@/lib/server/settings-service";

const prismaMock = vi.hoisted(() => ({
  organizationSettings: { findFirst: vi.fn() },
  fiscalYear: { findMany: vi.fn() },
  department: { findMany: vi.fn() },
  teamMember: { findMany: vi.fn(), count: vi.fn() },
  budgetAccount: { findMany: vi.fn(), count: vi.fn() },
  budgetCategory: { findMany: vi.fn(), count: vi.fn() },
  expenseTypeOption: { findMany: vi.fn() },
  purchasingVehicle: { findMany: vi.fn() },
  paymentFrequencyOption: { findMany: vi.fn() },
  licenseMetricOption: { findMany: vi.fn() },
  deploymentEnvironment: { findMany: vi.fn() },
  renewalPriorityOption: { findMany: vi.fn() },
  renewalDecisionReason: { findMany: vi.fn() },
}));

vi.mock("@/lib/server/prisma", () => ({ getPrisma: () => prismaMock }));

describe("settings section reads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.organizationSettings.findFirst.mockResolvedValue(null);
    prismaMock.fiscalYear.findMany.mockResolvedValue([]);
    prismaMock.department.findMany.mockResolvedValue([]);
    prismaMock.teamMember.findMany.mockResolvedValue([]);
    prismaMock.teamMember.count.mockResolvedValue(0);
    prismaMock.budgetAccount.findMany.mockResolvedValue([]);
    prismaMock.budgetAccount.count.mockResolvedValue(0);
    prismaMock.budgetCategory.findMany.mockResolvedValue([]);
    prismaMock.budgetCategory.count.mockResolvedValue(0);
    prismaMock.expenseTypeOption.findMany.mockResolvedValue([]);
    prismaMock.purchasingVehicle.findMany.mockResolvedValue([]);
    prismaMock.paymentFrequencyOption.findMany.mockResolvedValue([]);
    prismaMock.licenseMetricOption.findMany.mockResolvedValue([]);
    prismaMock.deploymentEnvironment.findMany.mockResolvedValue([]);
    prismaMock.renewalPriorityOption.findMany.mockResolvedValue([]);
    prismaMock.renewalDecisionReason.findMany.mockResolvedValue([]);
  });

  it("loads only the active organization section dependencies", async () => {
    const result = await getSettingsPageData({ section: "organization" });

    expect(prismaMock.organizationSettings.findFirst).toHaveBeenCalledOnce();
    expect(prismaMock.fiscalYear.findMany).toHaveBeenCalledOnce();
    expect(prismaMock.teamMember.findMany).not.toHaveBeenCalled();
    expect(prismaMock.budgetAccount.findMany).not.toHaveBeenCalled();
    expect(result.activeSection).toBe("organization");
  });

  it("bounds and counts the Team Member administrative grid in SQL", async () => {
    prismaMock.teamMember.count.mockResolvedValue(245);
    const result = await getSettingsPageData({
      section: "team-members",
      page: 2,
      pageSize: 500,
    });

    expect(prismaMock.teamMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 100, take: 100 })
    );
    expect(prismaMock.teamMember.count).toHaveBeenCalledOnce();
    expect(prismaMock.organizationSettings.findFirst).not.toHaveBeenCalled();
    expect(result.pagination.teamMemberPages).toBe(3);
  });
});
