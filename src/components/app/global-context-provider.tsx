"use client";

import { ChevronDown } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  ALL_DEPARTMENTS,
  ALL_FISCAL_YEARS,
  type GlobalContextOptions,
} from "@/lib/server/global-context";

type ContextValue = GlobalContextOptions & {
  departmentId: string;
  fiscalYearId: string;
  departmentLabel: string;
  fiscalYearLabel: string;
};

const GlobalContext = createContext<ContextValue | null>(null);

export function GlobalContextProvider({
  options,
  children,
}: {
  options: GlobalContextOptions;
  children: ReactNode;
}) {
  const [selection, setSelection] = useState({ departmentId: ALL_DEPARTMENTS, fiscalYearId: ALL_FISCAL_YEARS });
  useEffect(() => {
    const readSelection = () => {
      const params = new URLSearchParams(window.location.search);
      setSelection({
        departmentId: params.get("department") ?? ALL_DEPARTMENTS,
        fiscalYearId: params.get("fy") ?? options.defaultFiscalYearId ?? ALL_FISCAL_YEARS,
      });
    };
    readSelection();
    window.addEventListener("popstate", readSelection);
    return () => window.removeEventListener("popstate", readSelection);
  }, [options.defaultFiscalYearId]);
  const departmentId = selection.departmentId;
  const fiscalYearId = selection.fiscalYearId;
  const value = useMemo<ContextValue>(() => {
    const department = options.departments.find((item) => item.id === departmentId);
    const fiscalYear = options.fiscalYears.find((item) => item.id === fiscalYearId);
    return {
      ...options,
      departmentId,
      fiscalYearId,
      departmentLabel: department?.name ?? "All Departments",
      fiscalYearLabel: fiscalYear?.label ?? "All Fiscal Years",
    };
  }, [departmentId, fiscalYearId, options]);

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
}

export function useGlobalContext() {
  const value = useContext(GlobalContext);
  return value ?? {
    departments: [],
    fiscalYears: [],
    defaultFiscalYearId: null,
    departmentId: ALL_DEPARTMENTS,
    fiscalYearId: ALL_FISCAL_YEARS,
    departmentLabel: "All Departments",
    fiscalYearLabel: "All Fiscal Years",
  };
}

function ContextSelect({
  value,
  onChange,
  children,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`relative inline-flex ${className ?? ""}`}>
      <select
        aria-label="Global context"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 appearance-none rounded-md border border-border/80 bg-secondary/50 py-1 pl-3 pr-8 text-sm text-slate-200 outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2" />
    </label>
  );
}

export function GlobalContextSelectors() {
  const context = useGlobalContext();
  function updateContext(key: "department" | "fy", value: string) {
    const params = new URLSearchParams(window.location.search);
    if ((key === "department" && value === ALL_DEPARTMENTS) || (key === "fy" && value === ALL_FISCAL_YEARS)) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    window.location.assign(`${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="hidden items-center gap-2 md:flex">
      <ContextSelect value={context.departmentId} onChange={(value) => updateContext("department", value)} className="min-w-44">
        <option value={ALL_DEPARTMENTS}>All Departments</option>
        {context.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
      </ContextSelect>
      <ContextSelect value={context.fiscalYearId} onChange={(value) => updateContext("fy", value)}>
        <option value={ALL_FISCAL_YEARS}>All Fiscal Years</option>
        {context.fiscalYears.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}
      </ContextSelect>
    </div>
  );
}

export function ContextIndicator() {
  const context = useGlobalContext();
  return <span className="text-xs text-muted-foreground">{context.departmentLabel} · {context.fiscalYearLabel}</span>;
}
