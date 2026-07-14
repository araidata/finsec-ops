"use client";

import { Bell, ChevronDown, Plus, Search } from "lucide-react";
import type { ReactNode } from "react";

import { AppNavigationSidebar } from "@/components/app/app-navigation-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type WorkspaceShellProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  titleActions?: ReactNode;
  children: ReactNode;
};

export function WorkspaceShell({
  title,
  description,
  actionLabel,
  titleActions,
  children,
}: WorkspaceShellProps) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <SidebarProvider defaultOpen>
        <div className="fin-grid flex min-h-screen w-full">
          <AppNavigationSidebar
            phaseTitle="Phase 4.5"
            phaseDescription="Core budget and maintenance renewal workspace."
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
                All Departments
                <ChevronDown data-icon="inline-end" />
              </Button>
              <Button
                variant="outline"
                className="hidden border-border/80 bg-secondary/50 font-mono text-slate-200 hover:bg-secondary sm:flex"
              >
                Current Fiscal Year
                <ChevronDown data-icon="inline-end" />
              </Button>
              <div className="relative ml-auto hidden w-full max-w-sm md:block">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  aria-label="Search"
                  placeholder="Search vendors, contracts, products..."
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
              {actionLabel ? (
                <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                  <Plus data-icon="inline-start" />
                  {actionLabel}
                </Button>
              ) : null}
            </header>

            <div className="flex w-full min-w-0 flex-1 flex-col gap-3 p-3 md:p-4">
              <section className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="whitespace-nowrap text-2xl font-semibold tracking-normal text-slate-50">
                    {title}
                  </h1>
                  {description ? (
                    <p className="max-w-3xl text-xs text-muted-foreground">
                      {description}
                    </p>
                  ) : null}
                </div>
                {titleActions ? (
                  <div className="shrink-0">{titleActions}</div>
                ) : null}
              </section>
              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
