import { describe, expect, it } from "vitest";

import {
  applyInflation,
  rollForwardBudget,
} from "@/lib/budgets/budget-roll-forward";
import {
  calculateAccountRollups,
  calculateBudgetToActualVariance,
  calculateBudgetTotals,
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
  percentageChange,
} from "@/lib/budgets/budget-calculations";
import { budgetWorkspaceData } from "@/lib/budgets/budget-data";

describe("Phase 4.5 budget calculations", () => {
  it("calculates software, training, travel, professional services, hardware, dues, and personnel totals", () => {
    expect(
      calculateSoftwareLineTotal({
        quantity: 10,
        unitCostCents: cents(100),
        oneTimeAmountCents: cents(250),
        recurringAmountCents: cents(500),
      })
    ).toBe(cents(1750));
    expect(
      calculateTrainingLineTotal({
        attendees: 12,
        costPerPersonCents: cents(5559),
      })
    ).toBe(cents(66708));
    expect(
      calculateTravelLineTotal({
        attendees: 2,
        registrationCents: cents(1000),
        airfareCents: cents(500),
        hotelCents: cents(800),
        perDiemCents: cents(200),
        luggageCents: cents(50),
        parkingCents: cents(40),
        groundCents: cents(120),
        miscellaneousCents: cents(90),
      })
    ).toBe(cents(5600));
    expect(
      calculateProfessionalServicesLineTotal({
        quantityOrHours: 1,
        rateCents: cents(20000),
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
        memberCount: 3,
        costPerMemberCents: cents(1000),
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
    expect(calculateRenewalSavings({ renewalQuoteCents: cents(125), negotiatedCostCents: cents(100) })).toBe(cents(25));
    expect(calculateCostAvoidance(cents(500), cents(150))).toBe(cents(350));
    expect(calculateBudgetToActualVariance(cents(500), cents(425))).toBe(cents(75));
    expect(calculateForecastToApprovedVariance(cents(525), cents(500))).toBe(cents(25));
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
    const maintenance = rollups.find((rollup) => rollup.accountCode === "63256");
    const totals = calculateBudgetTotals(
      fy2027Annuals,
      budgetWorkspaceData.savingsRecords
    );

    expect(software?.proposedCents).toBeGreaterThan(cents(2000000));
    expect(maintenance?.proposedCents).toBe(cents(285000));
    expect(totals.totalProposedCents).toBeGreaterThan(totals.totalCurrentApprovedCents);
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

  it("supports roll-forward with inflation, renewal quotes, and historical comparisons", () => {
    const targetPlan = budgetWorkspaceData.plans.find(
      (plan) => plan.id === "plan-fy-2027"
    );
    const targetScenario = budgetWorkspaceData.scenarios.find(
      (scenario) => scenario.id === "scenario-fy-2027-initial"
    );

    expect(targetPlan).toBeDefined();
    expect(targetScenario).toBeDefined();
    expect(applyInflation(cents(100000), 4)).toBe(cents(104000));

    const result = rollForwardBudget(
      budgetWorkspaceData.annualFinancials,
      budgetWorkspaceData.maintenanceRenewals,
      {
        sourceFiscalYear: "FY2026",
        targetPlan: targetPlan!,
        targetScenario: targetScenario!,
        defaultInflationPercent: 4,
        excludeRetired: true,
        carryForwardRenewalQuotes: true,
      }
    );

    expect(result.annualFinancials.length).toBeGreaterThan(0);
    expect(result.annualFinancials[0].reviewState).toBe("Needs Review");
    expect(
      calculateItemHistory("item-onetrust", budgetWorkspaceData.annualFinancials)
    ).toHaveLength(3);
  });
});
