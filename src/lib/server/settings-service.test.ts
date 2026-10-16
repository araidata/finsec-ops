import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getSettingsPageData,
  saveBudgetAccount,
  saveDepartment,
  saveFiscalYear,
  settingsOptionSets,
} from "@/lib/server/settings-service";

const authorizationMock = vi.hoisted(() => ({
  requirePermission: vi.fn(),
}));

const prismaMock = vi.hoisted(() => ({
  organizationSettings: { findFirst: vi.fn() },
  fiscalYear: { findMany: vi.fn() },
  department: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
  },
  teamMember: { findMany: vi.fn(), count: vi.fn() },
  budgetAccount: {
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
  },
  budgetCategory: { findMany: vi.fn(), count: vi.fn() },
  expenseTypeOption: { findMany: vi.fn() },
  purchasingVehicle: { findMany: vi.fn() },
  paymentFrequencyOption: { findMany: vi.fn() },
  licenseMetricOption: { findMany: vi.fn() },
  deploymentEnvironment: { findMany: vi.fn() },
  renewalPriorityOption: { findMany: vi.fn() },
  renewalDecisionReason: { findMany: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({ getPrisma: () => prismaMock }));
vi.mock("@/lib/server/authorization", () => ({
  requirePermission: authorizationMock.requirePermission,
}));

describe("settings section reads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authorizationMock.requirePermission.mockResolvedValue({ actorId: null });
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

  it("offers separate Travel and Conferences financial-account worksheets", () => {
    expect(settingsOptionSets.budgetWorksheets).toContain("TRAVEL");
    expect(settingsOptionSets.budgetWorksheets).toContain("CONFERENCES");
    expect(settingsOptionSets.budgetWorksheets).not.toContain(
      "TRAVEL_CONFERENCES"
    );
  });

  it.each([
    ["62026", "TRAVEL"],
    ["62050", "CONFERENCES"],
    ["custom", "CONFERENCES"],
  ])(
    "normalizes legacy account %s to %s when reading Finance",
    async (code, worksheet) => {
      prismaMock.budgetAccount.findMany.mockResolvedValue([
        { id: "account-1", code, defaultWorksheet: "TRAVEL_CONFERENCES" },
      ]);

      const result = await getSettingsPageData({ section: "finance" });

      expect(result.budgetAccounts).toEqual([
        { id: "account-1", code, defaultWorksheet: worksheet },
      ]);
    }
  );

  it.each(["TRAVEL", "CONFERENCES"])(
    "saves a financial account assigned to %s",
    async (defaultWorksheet) => {
      prismaMock.budgetAccount.create.mockResolvedValue({ id: "account-1" });

      await expect(
        saveBudgetAccount({
          code: "custom",
          name: "Custom account",
          defaultWorksheet,
        })
      ).resolves.toBe("account-1");

      expect(prismaMock.budgetAccount.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ defaultWorksheet }),
      });
    }
  );

  it("rejects the legacy combined worksheet on new financial-account saves", async () => {
    await expect(
      saveBudgetAccount({
        code: "62026",
        name: "Travel",
        defaultWorksheet: "TRAVEL_CONFERENCES",
      })
    ).rejects.toThrow();
    expect(prismaMock.budgetAccount.create).not.toHaveBeenCalled();
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

  it("does not mutate a Department when settings authorization is denied", async () => {
    prismaMock.department.findUnique.mockResolvedValue({ id: "department-1" });
    authorizationMock.requirePermission.mockRejectedValue(
      new Error("Permission denied")
    );

    await expect(
      saveDepartment({
        id: "9c01dc54-75a7-4c8f-aac1-e3cf998d44d4",
        name: "Security",
        active: true,
      })
    ).rejects.toThrow("Permission denied");

    expect(authorizationMock.requirePermission).toHaveBeenCalledWith({
      permission: "settings.write",
      departmentId: "department-1",
    });
    expect(prismaMock.department.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

describe("fiscal year saves", () => {
  const yearId = "9c01dc54-75a7-4c8f-aac1-e3cf998d44d4";
  type ExistingYear = {
    id: string;
    label: string;
    startsOn: Date;
    endsOn: Date;
    active: boolean;
  };
  let existingYears: ExistingYear[];
  const tx = {
    fiscalYear: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    organizationSettings: { updateMany: vi.fn() },
    activityLog: { create: vi.fn() },
  };
  const input = {
    label: "FY2025",
    startsOn: "2024-10-01",
    endsOn: "2025-09-30",
    status: "OPEN",
    active: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    existingYears = [];
    authorizationMock.requirePermission.mockResolvedValue({ actorId: null });
    prismaMock.$transaction.mockImplementation(
      async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)
    );
    tx.fiscalYear.findFirst.mockImplementation(
      async ({
        where,
      }: {
        where: {
          id?: { not: string };
          active?: boolean;
          startsOn: { lte: Date };
          endsOn: { gte: Date };
        };
      }) =>
        existingYears.find(
          (year) =>
            year.id !== where.id?.not &&
            (where.active === undefined || year.active === where.active) &&
            year.startsOn <= where.startsOn.lte &&
            year.endsOn >= where.endsOn.gte
        ) ?? null
    );
    tx.fiscalYear.create.mockImplementation(async ({ data }) => ({
      ...data,
      id: yearId,
    }));
    tx.fiscalYear.update.mockImplementation(async ({ data }) => ({
      ...data,
      id: yearId,
    }));
  });

  it("saves October through September when an inactive legacy year overlaps", async () => {
    existingYears.push({
      id: "legacy",
      label: "FY2026",
      startsOn: new Date("2025-07-01"),
      endsOn: new Date("2026-06-30"),
      active: false,
    });
    await expect(saveFiscalYear(input)).resolves.toBe(yearId);
    expect(tx.fiscalYear.create).toHaveBeenCalledOnce();
    expect(prismaMock.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });

  it.each([
    ["2025-09-30", "2026-09-29", false],
    ["2025-10-01", "2026-09-30", true],
  ])(
    "checks inclusive end boundaries against a year starting %s",
    async (startsOn, endsOn, allowed) => {
      existingYears.push({
        id: "next",
        label: "FY2026",
        startsOn: new Date(startsOn),
        endsOn: new Date(endsOn),
        active: true,
      });
      if (allowed) {
        await expect(saveFiscalYear(input)).resolves.toBe(yearId);
      } else {
        await expect(saveFiscalYear(input)).rejects.toThrow(
          "Active fiscal years cannot overlap."
        );
        expect(tx.fiscalYear.create).not.toHaveBeenCalled();
        expect(tx.activityLog.create).not.toHaveBeenCalled();
      }
    }
  );

  it("allows editing an active year without overlapping itself", async () => {
    existingYears.push({
      id: yearId,
      label: input.label,
      startsOn: new Date(input.startsOn),
      endsOn: new Date(input.endsOn),
      active: true,
    });
    await expect(saveFiscalYear({ ...input, id: yearId })).resolves.toBe(
      yearId
    );
    expect(tx.fiscalYear.update).toHaveBeenCalledOnce();
  });

  it("allows retaining inactive overlapping history without checking overlap", async () => {
    await expect(
      saveFiscalYear({ ...input, id: yearId, active: false })
    ).resolves.toBe(yearId);
    expect(tx.fiscalYear.findFirst).not.toHaveBeenCalled();
  });

  it("rejects reactivating a year that overlaps another active year", async () => {
    existingYears.push({
      id: "other",
      label: "FY2025",
      startsOn: new Date(input.startsOn),
      endsOn: new Date(input.endsOn),
      active: true,
    });
    await expect(saveFiscalYear({ ...input, id: yearId })).rejects.toThrow(
      "Active fiscal years cannot overlap."
    );
    expect(tx.fiscalYear.update).not.toHaveBeenCalled();
  });

  it.each([
    { startsOn: "invalid" },
    { endsOn: "invalid" },
    { startsOn: "2024-02-30" },
    { endsOn: "09/30/2025" },
    { startsOn: "2025-09-30", endsOn: "2025-09-30" },
    { startsOn: "2025-10-01", endsOn: "2025-09-30" },
  ])(
    "rejects invalid date ranges before starting a transaction: %j",
    async (dates) => {
      await expect(saveFiscalYear({ ...input, ...dates })).rejects.toThrow();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    }
  );

  it("reports a concurrent range change as a retryable validation error", async () => {
    prismaMock.$transaction.mockRejectedValueOnce({ code: "P2034" });
    await expect(saveFiscalYear(input)).rejects.toThrow(
      "Fiscal years changed while saving. Refresh and retry."
    );
    expect(tx.fiscalYear.create).not.toHaveBeenCalled();
  });
});
