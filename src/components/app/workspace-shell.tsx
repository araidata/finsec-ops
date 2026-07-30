"use client";

import { Bell, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { AppNavigationSidebar } from "@/components/app/app-navigation-sidebar";
import { ContextIndicator, GlobalContextSelectors, useGlobalContext } from "@/components/app/global-context-provider";
import { HeaderSearch } from "@/components/app/header-search";
import { Button } from "@/components/ui/button";
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
  const context = useGlobalContext();
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
              <HeaderSearch />
              <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.9)]" />
                  <ContextIndicator />
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
                  <p className="mt-1 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-cyan-300/80">
                    {context.departmentLabel} · {context.fiscalYearLabel}
                  </p>
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
