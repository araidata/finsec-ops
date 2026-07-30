import { describe, expect, it } from "vitest";

import {
  ALL_DEPARTMENTS,
  ALL_FISCAL_YEARS,
  normalizeContextSelection,
  toServiceContextSelection,
  type GlobalContextOptions,
} from "@/lib/global-context";

const options: GlobalContextOptions = {
  departments: [
    { id: "department-security", name: "Security" },
    { id: "department-infrastructure", name: "Infrastructure" },
  ],
  fiscalYears: [
    { id: "fy-2027", label: "FY2027", isCurrent: true },
    { id: "fy-2026", label: "FY2026", isCurrent: false },
  ],
  defaultFiscalYearId: "fy-2027",
};

describe("global context normalization", () => {
  it("uses the configured fiscal year immediately when the URL omits it", () => {
    const selection = normalizeContextSelection(options, {});

    expect(selection).toEqual({
      departmentId: ALL_DEPARTMENTS,
      fiscalYearId: "fy-2027",
    });
    expect(toServiceContextSelection(selection)).toEqual({
      departmentId: undefined,
      fiscalYearId: "fy-2027",
    });
  });

  it("preserves an explicit all selection instead of applying the default year", () => {
    const selection = normalizeContextSelection(options, {
      departmentId: ALL_DEPARTMENTS,
      fiscalYearId: ALL_FISCAL_YEARS,
    });

    expect(selection).toEqual({
      departmentId: ALL_DEPARTMENTS,
      fiscalYearId: ALL_FISCAL_YEARS,
    });
    expect(toServiceContextSelection(selection)).toEqual({
      departmentId: undefined,
      fiscalYearId: undefined,
    });
  });

  it("keeps active requested values", () => {
    expect(
      normalizeContextSelection(options, {
        departmentId: "department-security",
        fiscalYearId: "fy-2026",
      })
    ).toEqual({
      departmentId: "department-security",
      fiscalYearId: "fy-2026",
    });
  });

  it("normalizes invalid or inactive values to safe active scope", () => {
    expect(
      normalizeContextSelection(options, {
        departmentId: "inactive-department",
        fiscalYearId: "inactive-fiscal-year",
      })
    ).toEqual({
      departmentId: ALL_DEPARTMENTS,
      fiscalYearId: "fy-2027",
    });
  });

  it("falls back to all years when no active default is available", () => {
    expect(
      normalizeContextSelection(
        {
          departments: [],
          fiscalYears: [],
          defaultFiscalYearId: null,
        },
        {}
      )
    ).toEqual({
      departmentId: ALL_DEPARTMENTS,
      fiscalYearId: ALL_FISCAL_YEARS,
    });
  });
});
