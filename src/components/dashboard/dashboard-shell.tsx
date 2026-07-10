"use client";

import { Bell, ChevronDown, FileBarChart, Plus, Search } from "lucide-react";

import { AppNavigationSidebar } from "@/components/app/app-navigation-sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  ForecastTrendChart,
  SpendByCategoryChart,
} from "@/components/dashboard/financial-charts";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ProcurementQueue } from "@/components/dashboard/procurement-queue";
import { RenewalsTable } from "@/components/dashboard/renewals-table";
import {
  metricCards,
  moduleIcon,
  portfolioHighlights,
  portfolioIcon,
  receiptIcon,
} from "@/lib/dashboard-data";

const PortfolioIcon = portfolioIcon;
const ModuleIcon = moduleIcon;
const ReceiptIcon = receiptIcon;

export function DashboardShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SidebarProvider defaultOpen>
        <div className="fin-grid flex min-h-screen">
          <AppNavigationSidebar
            phaseTitle="Foundation only"
            phaseDescription="Static UI shell. No auth, CRUD, models, or calculations."
          />

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
                Cyber Financial Operations
              </p>
            </div>
            <Button
              variant="outline"
              className="hidden min-w-48 justify-between border-border/80 bg-secondary/50 text-slate-200 hover:bg-secondary md:flex"
            >
              Acme Corp
              <ChevronDown data-icon="inline-end" />
            </Button>
            <Button
              variant="outline"
              className="hidden border-border/80 bg-secondary/50 font-mono text-slate-200 hover:bg-secondary sm:flex"
            >
              FY 2026
              <ChevronDown data-icon="inline-end" />
            </Button>
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
              Planning Workspace
            </div>
            <Button variant="outline" size="icon-sm" aria-label="Alerts">
              <Bell />
            </Button>
            <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              <Plus data-icon="inline-start" />
              New Forecast
            </Button>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-5 md:p-6">
            <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-normal text-slate-50 md:text-3xl">
                  Financial Operations Command
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  Cybersecurity spend planning, renewal visibility, and
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

            <section className="grid gap-4 xl:grid-cols-[minmax(360px,1.75fr)_repeat(4,minmax(170px,1fr))]">
              <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
                <CardContent className="flex h-full flex-col justify-between gap-5 p-5">
                  <div className="flex gap-4">
                    <div className="hidden size-16 shrink-0 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 sm:flex">
                      <PortfolioIcon aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-xl font-semibold text-slate-50">
                          Acme Corp
                        </p>
                        <span className="text-xs font-medium text-cyan-300">
                          Edit
                        </span>
                      </div>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                        Global enterprise with shared core infrastructure,
                        digital platforms, and business-critical applications.
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-3 sm:grid-cols-4">
                    {portfolioHighlights.map((highlight) => (
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
              {metricCards.map((metric) => (
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
                        FY 2026 year-to-date allocation by portfolio area.
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      Top Categories
                      <ChevronDown data-icon="inline-end" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <SpendByCategoryChart />
                </CardContent>
              </Card>

              <Card className="rounded-lg border-border/80 bg-card/95 shadow-none">
                <CardHeader className="border-b border-border/70 pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>Forecast Trend</CardTitle>
                      <CardDescription>
                        Actuals, forecast, and budget view for FY 2026.
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      Monthly
                      <ChevronDown data-icon="inline-end" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ForecastTrendChart />
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
                        Showing 1 to 5 of 21 renewals.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-blue-400/20 bg-blue-400/10 px-3 py-2 text-xs text-blue-200">
                      <ModuleIcon aria-hidden="true" />
                      120-day view
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <RenewalsTable />
                </CardContent>
              </Card>

              <div className="flex flex-col gap-4">
                <ProcurementQueue />
                <Card className="rounded-lg border-border/80 bg-card/90 shadow-none">
                  <CardHeader className="border-b border-border/70 pb-4">
                    <CardTitle className="text-base">
                      Reporting Readiness
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex size-16 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 font-mono text-lg text-cyan-200">
                        0%
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-100">
                          Data model pending
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Phase 1 will define reviewed PostgreSQL entities
                          before any reporting is wired.
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ReceiptIcon aria-hidden="true" />
                      Visual placeholder only
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
