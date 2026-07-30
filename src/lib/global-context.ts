export const ALL_DEPARTMENTS = "all";
export const ALL_FISCAL_YEARS = "all";

export type GlobalContextOptions = {
  departments: Array<{ id: string; name: string }>;
  fiscalYears: Array<{ id: string; label: string; isCurrent: boolean }>;
  defaultFiscalYearId: string | null;
};

export type GlobalContextInput = {
  departmentId?: string;
  fiscalYearId?: string;
};

export type GlobalContextSelection = {
  departmentId: string;
  fiscalYearId: string;
};

export function normalizeContextSelection(
  options: GlobalContextOptions,
  input: GlobalContextInput
): GlobalContextSelection {
  const requestedDepartment = options.departments.find(
    (department) => department.id === input.departmentId
  );
  const departmentId = requestedDepartment?.id ?? ALL_DEPARTMENTS;

  if (input.fiscalYearId === ALL_FISCAL_YEARS) {
    return { departmentId, fiscalYearId: ALL_FISCAL_YEARS };
  }

  const requestedFiscalYear = options.fiscalYears.find(
    (year) => year.id === input.fiscalYearId
  );
  const defaultFiscalYear = options.fiscalYears.find(
    (year) => year.id === options.defaultFiscalYearId
  );

  return {
    departmentId,
    fiscalYearId:
      requestedFiscalYear?.id ?? defaultFiscalYear?.id ?? ALL_FISCAL_YEARS,
  };
}

export function toServiceContextSelection(
  selection: GlobalContextSelection
): GlobalContextInput {
  return {
    departmentId:
      selection.departmentId === ALL_DEPARTMENTS
        ? undefined
        : selection.departmentId,
    fiscalYearId:
      selection.fiscalYearId === ALL_FISCAL_YEARS
        ? undefined
        : selection.fiscalYearId,
  };
}
