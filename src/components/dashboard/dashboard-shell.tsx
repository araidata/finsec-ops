"use client";

import { useState } from "react";

import {
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  CalendarClock,
  CircleDollarSign,
  FileBarChart,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";

import { AppNavigationSidebar } from "@/components/app/app-navigation-sidebar";
import { ContextIndicator, GlobalContextSelectors } from "@/components/app/global-context-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ForecastTrendChart,
  type ForecastChartMode,
  SpendByCategoryChart,
} from "@/components/dashboard/financial-charts";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ProcurementQueue } from "@/components/dashboard/procurement-queue";
import { RenewalsTable } from "@/components/dashboard/renewals-table";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { moduleIcon, portfolioIcon } from "@/lib/dashboard-data";
import type { DashboardPageData } from "@/lib/server/dashboard-service";

const PortfolioIcon = portfolioIcon;
const ModuleIcon = moduleIcon;
const ReceiptIcon = ClipboardList;

export function DashboardShell({ data }: { data: DashboardPageData }) {
  const [categoryView, setCategoryView] = useState<"top" | "all">("top");
  const [forecastView, setForecastView] = useState<ForecastChartMode>("fiscal");
  const dashboardMetricCards = [
        { label: "Budget Utilization", value: data.metrics.budgetUtilization, detail: data.metrics.budgetDetail, trend: "Actual spend against approved plan", accent: "teal" as const, display: "ring" as const, icon: CircleDollarSign },
        { label: "Renewal Exposure", value: data.metrics.renewalExposure, detail: data.metrics.renewalDetail, trend: "Selected fiscal-year exposure", accent: "amber" as const, display: "ring" as const, icon: CalendarClock },
        { label: "Forecast Variance", value: data.metrics.forecastVariance, detail: data.metrics.forecastDetail, trend: "Forecast compared with approved", accent: "blue" as const, display: "bar" as const, icon: TrendingUp },
        { label: "Contract Spend", value: data.metrics.contractSpend, detail: data.metrics.contractDetail, trend: "Active commitments in context", accent: "green" as const, display: "bar" as const, icon: BriefcaseBusiness },
        {
          label: "Deployment Progress",
          value: data.metrics.deploymentProgress,
          detail: data.metrics.deploymentDetail,
          trend: "Context-aware delivery status",
          accent: "blue" as const,
          display: "bar" as const,
          icon: ClipboardList,
        },
      ];
  const visibleSpendData = categoryView === "top" ? data.spendByCategory.slice(0, 6) : data.spendByCategory;
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <SidebarProvider defaultOpen>
        <div className="fin-grid flex min-h-screen w-full">
          <AppNavigationSidebar />

          <SidebarInset className="min-w-0">
            <header className="sticky top-0 z-20 flex min-h-[61px] items-center gap-3 border-b border-border/80 bg-background/95 px-4 backdrop-blur md:px-6">
              <SidebarTrigger
                aria-label="Toggle navigation"
                className="border border-border/80 bg-secondary/50 text-slate-200 hover:bg-secondary hover:text-slate-100"
              />
              <div className="mr-auto md:hidden">
                <p className="text-sm font-semibold leading-none text-slate-100">
                  finsec-ops
                </p>
                <p className="mt-1 text-[0.68rem] text-muted-foreground">
                Financial Operations
                </p>
              </div>
              <GlobalContextSelectors />
              <div className="relative ml-auto hidden w-full max-w-sm md:block">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  aria-label="Search"
                  placeholder="Search vendors, contracts, renewals..."
                  className="h-9 border-border/80 bg-secondary/45 pl-8 text-sm"
                />
              </div>
              <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.9)]" />
                  <ContextIndicator />
              </div>
              <Button variant="outline" size="icon-sm" aria-label="Alerts">
                <Bell />
              </Button>
              <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                <Plus data-icon="inline-start" />
                New Forecast
              </Button>
            </header>

            <div className="flex w-full min-w-0 flex-1 flex-col gap-4 p-4 md:gap-5 md:p-6">
              <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-normal text-slate-50 md:text-3xl">
                    Financial Operations Command
                  </h1>
                  <p className="mt-1 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-cyan-300/80">
                    <ContextIndicator />
                  </p>
                  <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                    Departmental spend planning, renewal visibility, and
                    executive reporting.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-border/80">
                    <FileBarChart data-icon="inline-start" />
                    Decision Brief
                  </Button>
                  <Button variant="secondary">Export</Button>
                </div>
              </section>

              <section className="grid gap-4 xl:grid-cols-[minmax(300px,1.5fr)_repeat(5,minmax(150px,1fr))]">
                <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
                  <CardContent className="flex h-full flex-col justify-between gap-5 p-5">
                    <div className="flex gap-4">
                      <div className="hidden size-16 shrink-0 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 sm:flex">
                        <PortfolioIcon aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-xl font-semibold text-slate-50">
                            {data.contextDepartment}
                          </p>
                          <span className="text-xs font-medium text-cyan-300">
                            Edit
                          </span>
                        </div>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                          Financial operations reporting for the selected department and fiscal-year context.
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid gap-3 sm:grid-cols-4">
                      {[{ label: "Planning scope", value: data.contextDepartment }, { label: "Fiscal year", value: data.contextFiscalYear }, { label: "Budget rows", value: data.metrics.budgetDetail }, { label: "Renewals", value: data.metrics.renewalDetail }].map((highlight) => (
                        <div key={highlight.label}>
                          <p className="text-xs text-muted-foreground">
                            {highlight.label}
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-100">
                            {highlight.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                {dashboardMetricCards.map((metric) => (
                  <MetricCard key={metric.label} {...metric} />
                ))}
              </section>

              <section className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
                <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
                  <CardHeader className="border-b border-border/70 pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle>Spend by Category</CardTitle>
                        <CardDescription>
                          Year-to-date allocation by portfolio area.
                        </CardDescription>
                      </div>
                      <label className="sr-only" htmlFor="dashboard-spend-view">Spend category view</label>
                      <select id="dashboard-spend-view" aria-label="Spend category view" value={categoryView} onChange={(event) => setCategoryView(event.target.value as "top" | "all")} className="h-9 rounded-md border border-border/80 bg-secondary/50 px-3 text-xs font-medium text-slate-200 outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring">
                        <option value="top">Top Categories</option>
                        <option value="all">All Categories</option>
                      </select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SpendByCategoryChart data={visibleSpendData} />
                  </CardContent>
                </Card>

                <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
                  <CardHeader className="border-b border-border/70 pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle>Forecast Trend</CardTitle>
                        <CardDescription>
                          {forecastView === "fiscal" ? "Actuals, forecast, budget, and committed totals by fiscal year." : forecastView === "budget" ? "Actual versus approved budget by fiscal year." : "Forecast versus committed totals by fiscal year."}
                        </CardDescription>
                      </div>
                      <label className="sr-only" htmlFor="dashboard-forecast-view">Forecast chart view</label>
                      <select id="dashboard-forecast-view" aria-label="Forecast chart view" value={forecastView} onChange={(event) => setForecastView(event.target.value as ForecastChartMode)} className="h-9 rounded-md border border-border/80 bg-secondary/50 px-3 text-xs font-medium text-slate-200 outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring">
                        <option value="fiscal">Fiscal Years</option>
                        <option value="budget">Budget vs Actual</option>
                        <option value="forecast">Forecast vs Committed</option>
                      </select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ForecastTrendChart data={data.forecastTrend} mode={forecastView} />
                  </CardContent>
                </Card>
              </section>

              <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
                  <CardHeader className="border-b border-border/70 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>Upcoming Renewals</CardTitle>
                        <CardDescription>
                          Showing {data.renewals.length} upcoming renewals in context.
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-blue-400/20 bg-blue-400/10 px-3 py-2 text-xs text-blue-200">
                        <ModuleIcon aria-hidden="true" />
                        Fiscal-year view
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <RenewalsTable renewals={data.renewals} />
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-4">
                  <ProcurementQueue items={data.procurementQueue} />
                  <Card className="rounded-lg border-border/80 bg-card/90 shadow-none">
                    <CardHeader className="border-b border-border/70 pb-4">
                      <CardTitle className="text-base">
                        Reporting Readiness
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex size-16 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 font-mono text-lg text-cyan-200">
                          {data.reportingReadiness.percentage}%
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-100">
                            Department assignment coverage
                          </p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {data.reportingReadiness.detail}.
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ReceiptIcon aria-hidden="true" />
                        Live read-only dashboard coverage
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {data.isAllDepartments ? (
                <section>
                  <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
                    <CardHeader className="border-b border-border/70 pb-4">
                      <CardTitle>Department Comparison</CardTitle>
                      <CardDescription>Organization-wide financial posture by department.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-sm">
                          <thead><tr className="border-b border-border/70 bg-secondary/60 text-left text-xs text-muted-foreground"><th className="px-4 py-3">Department</th><th className="px-4 py-3 text-right">Approved</th><th className="px-4 py-3 text-right">Forecast variance</th><th className="px-4 py-3 text-right">Renewal exposure</th><th className="px-4 py-3 text-right">Contract spend</th><th className="px-4 py-3 text-right">Deployment</th></tr></thead>
                          <tbody>{data.departmentComparison.length ? data.departmentComparison.map((row) => <tr key={row.id ?? "unassigned"} className="border-b border-border/60"><td className="px-4 py-3 font-medium text-slate-100">{row.name}</td><td className="px-4 py-3 text-right font-mono">{row.approved.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}</td><td className={`px-4 py-3 text-right font-mono ${row.forecastVariance > 0 ? "text-red-300" : "text-emerald-300"}`}>{row.forecastVariance.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}</td><td className="px-4 py-3 text-right font-mono">{row.renewalExposure.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}</td><td className="px-4 py-3 text-right font-mono">{row.contractSpend.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}</td><td className="px-4 py-3 text-right font-mono">{row.deploymentProgress}%</td></tr>) : <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No department financial records are available.</td></tr>}</tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              ) : null}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
