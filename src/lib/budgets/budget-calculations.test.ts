import { describe, expect, it } from "vitest";

import {
  calculateAccountRollups,
  calculateBudgetToActualVariance,
  calculateBudgetTotals,
  calculateConferenceLineTotal,
  calculateCostAvoidance,
  calculateForecastToApprovedVariance,
  calculateHardwareLineTotal,
  calculateItemHistory,
  calculateMembershipLineTotal,
  calculateNoticeDate,
  calculatePersonnelLineTotal,
  calculateProfessionalServicesLineTotal,
  calculateRenewalExposureByWindow,
  calculateRenewalIncrease,
  calculateRenewalPercentageIncrease,
  calculateRenewalSavings,
  calculateSoftwareLineTotal,
  calculateTrainingLineTotal,
  calculateTravelLineTotal,
  cents,
  dollarChange,
  formatCurrencyFromCents,
  percentageChange,
} from "@/lib/budgets/budget-calculations";
import { budgetWorkspaceData } from "@/lib/budgets/budget-data";

describe("Phase 4.5 budget calculations", () => {
  it("calculates worksheet-specific totals", () => {
    expect(
      calculateSoftwareLineTotal({
        proposedAmountCents: cents(1750),
      })
    ).toBe(cents(1750));
    expect(
      calculateTrainingLineTotal({
        quantity: 12,
        costCents: cents(5559),
      })
    ).toBe(cents(66708));
    expect(
      calculateConferenceLineTotal({
        attendees: 3,
        registrationFeeCents: cents(2195),
      })
    ).toBe(cents(6585));
    expect(
      calculateTravelLineTotal({
        airfareCents: cents(500),
        hotelCents: cents(800),
        perDiemCents: cents(200),
        luggageCents: cents(50),
        parkingCents: cents(40),
        taxiUberCents: cents(120),
      })
    ).toBe(cents(1710));
    expect(
      calculateProfessionalServicesLineTotal({
        amount: 160,
        rateCents: cents(125),
      })
    ).toBe(cents(20000));
    expect(
      calculateHardwareLineTotal({
        quantity: 2,
        unitCostCents: cents(57500),
        installationCents: cents(12500),
        maintenanceCents: cents(11000),
      })
    ).toBe(cents(138500));
    expect(
      calculateMembershipLineTotal({
        annualFeeCents: cents(3000),
      })
    ).toBe(cents(3000));
    expect(
      calculatePersonnelLineTotal({
        positionCount: 1,
        salaryCents: cents(145000),
        benefitsCents: cents(40000),
      })
    ).toBe(cents(185000));
  });

  it("calculates changes, percentage changes, savings, cost avoidance, and variances safely", () => {
    expect(dollarChange(cents(100), cents(125))).toBe(cents(25));
    expect(percentageChange(cents(100), cents(125))).toBe(25);
    expect(percentageChange(0, cents(125))).toBeNull();
    expect(percentageChange(0, 0)).toBe(0);
    expect(
      calculateRenewalSavings({
        renewalQuoteCents: cents(125),
        negotiatedCostCents: cents(100),
      })
    ).toBe(cents(25));
    expect(calculateCostAvoidance(cents(500), cents(150))).toBe(cents(350));
    expect(calculateBudgetToActualVariance(cents(500), cents(425))).toBe(
      cents(75)
    );
    expect(calculateForecastToApprovedVariance(cents(525), cents(500))).toBe(
      cents(25)
    );
  });

  it("formats US currency with dollars, separators, and cents", () => {
    expect(formatCurrencyFromCents(cents(187740))).toBe("$187,740.00");
    expect(formatCurrencyFromCents(cents(1285000))).toBe("$1,285,000.00");
  });

  it("rolls up accounts and fiscal-year totals from supporting schedules", () => {
    const fy2027Annuals = budgetWorkspaceData.annualFinancials.filter(
      (line) => line.fiscalYear === "FY2027"
    );
    const rollups = calculateAccountRollups(
      budgetWorkspaceData.accounts,
      fy2027Annuals
    );
    const software = rollups.find((rollup) => rollup.accountCode === "62094");
    const maintenance = rollups.find(
      (rollup) => rollup.accountCode === "63256"
    );
    const conferences = rollups.find(
      (rollup) => rollup.accountCode === "62050"
    );
    const travel = rollups.find((rollup) => rollup.accountCode === "62026");
    const totals = calculateBudgetTotals(
      fy2027Annuals,
      budgetWorkspaceData.savingsRecords
    );

    expect(software?.proposedCents).toBeGreaterThan(cents(1900000));
    expect(maintenance?.proposedCents).toBe(cents(285000));
    expect(conferences?.proposedCents).toBeGreaterThan(0);
    expect(travel?.proposedCents).toBeGreaterThan(0);
    expect(totals.totalProposedCents).toBeGreaterThan(
      totals.totalCurrentApprovedCents
    );
    expect(totals.grossSavingsCents).toBeGreaterThan(cents(100000));
    expect(totals.totalCostAvoidanceCents).toBe(cents(140000));
  });

  it("calculates renewal increase, percent increase, savings, notice date, and exposure windows", () => {
    const renewal = budgetWorkspaceData.maintenanceRenewals.find(
      (candidate) => candidate.id === "renewal-onetrust"
    );

    expect(renewal).toBeDefined();
    expect(calculateRenewalIncrease(renewal!)).toBe(cents(17900));
    expect(calculateRenewalPercentageIncrease(renewal!)).toBeCloseTo(9.179, 2);
    expect(calculateRenewalSavings(renewal!)).toBe(cents(25160));
    expect(calculateNoticeDate("2027-01-15", 180)).toBe("2026-07-19");
    expect(
      calculateRenewalExposureByWindow(
        budgetWorkspaceData.maintenanceRenewals,
        new Date("2026-07-10T00:00:00.000Z")
      )[4].exposureCents
    ).toBeGreaterThan(0);
  });

  it("keeps budget history available without scenario roll-forward behavior", () => {
    expect(
      calculateItemHistory(
        "item-onetrust",
        budgetWorkspaceData.annualFinancials
      )
    ).toHaveLength(3);
  });
});
