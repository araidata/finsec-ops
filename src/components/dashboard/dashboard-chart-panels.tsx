"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  DashboardForecastPoint,
  DashboardSpendCategory,
} from "@/lib/server/dashboard-service";

const ForecastTrendChart = dynamic(
  () =>
    import("@/components/dashboard/financial-charts").then(
      (module) => module.ForecastTrendChart
    ),
  {
    ssr: false,
    loading: () => (
      <div
        aria-label="Loading forecast chart"
        className="h-[250px] w-full animate-pulse rounded-md bg-secondary/30"
      />
    ),
  }
);

type ForecastChartMode = "fiscal" | "budget" | "forecast";

export function SpendByCategoryPanel({
  data,
}: {
  data: DashboardSpendCategory[];
}) {
  const [view, setView] = useState<"top" | "all">("top");
  const visibleData = view === "top" ? data.slice(0, 6) : data;

  return (
    <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
      <CardHeader className="border-b border-border/70 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Spend by Category</CardTitle>
            <CardDescription>
              Year-to-date allocation by portfolio area.
            </CardDescription>
          </div>
          <label className="sr-only" htmlFor="dashboard-spend-view">
            Spend category view
          </label>
          <select
            id="dashboard-spend-view"
            aria-label="Spend category view"
            value={view}
            onChange={(event) => setView(event.target.value as "top" | "all")}
            className="h-9 rounded-md border border-border/80 bg-secondary/50 px-3 text-xs font-medium text-slate-200 outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="top">Top Categories</option>
            <option value="all">All Categories</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <SpendByCategoryChart data={visibleData} />
      </CardContent>
    </Card>
  );
}

export function ForecastTrendPanel({
  data,
}: {
  data: DashboardForecastPoint[];
}) {
  const [view, setView] = useState<ForecastChartMode>("fiscal");
  const description =
    view === "fiscal"
      ? "Actuals, forecast, budget, and committed totals by fiscal year."
      : view === "budget"
        ? "Actual versus approved budget by fiscal year."
        : "Forecast versus committed totals by fiscal year.";

  return (
    <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
      <CardHeader className="border-b border-border/70 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Forecast Trend</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <label className="sr-only" htmlFor="dashboard-forecast-view">
            Forecast chart view
          </label>
          <select
            id="dashboard-forecast-view"
            aria-label="Forecast chart view"
            value={view}
            onChange={(event) =>
              setView(event.target.value as ForecastChartMode)
            }
            className="h-9 rounded-md border border-border/80 bg-secondary/50 px-3 text-xs font-medium text-slate-200 outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="fiscal">Fiscal Years</option>
            <option value="budget">Budget vs Actual</option>
            <option value="forecast">Forecast vs Committed</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <ForecastTrendChart data={data} mode={view} />
      </CardContent>
    </Card>
  );
}

function SpendByCategoryChart({ data }: { data: DashboardSpendCategory[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <div className="flex items-center justify-center">
        <div className="relative flex size-52 items-center justify-center rounded-full bg-[conic-gradient(#22c7d9_0_34%,#3b82f6_34%_57%,#f59e0b_57%_75%,#10b981_75%_89%,#8b5cf6_89%_96%,#64748b_96%_100%)] shadow-[0_0_40px_rgba(34,199,217,0.08)]">
          <div className="absolute inset-8 rounded-full bg-card" />
          <div className="relative text-center">
            <p className="font-mono text-2xl font-semibold text-slate-50">
              {data
                .reduce((sum, item) => sum + item.spend, 0)
                .toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Total Spend</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-3">
        {data.length ? (
          data.map((item) => (
            <div
              key={item.category}
              className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 text-sm"
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-muted-foreground">{item.category}</span>
              <span className="font-mono text-slate-200">
                {item.spend.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })}
              </span>
              <span className="w-10 text-right font-mono text-muted-foreground">
                {item.share}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No financial category data is available for this context.
          </p>
        )}
      </div>
    </div>
  );
}
