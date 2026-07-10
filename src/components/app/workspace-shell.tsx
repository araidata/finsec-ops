"use client";

import {
  Bell,
  ChevronDown,
  Menu,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { navigationItems } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

type WorkspaceShellProps = {
  title: string;
  description: string;
  actionLabel: string;
  children: ReactNode;
};

export function WorkspaceShell({
  title,
  description,
  actionLabel,
  children,
}: WorkspaceShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fin-grid flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar/95 lg:flex lg:flex-col">
          <div className="flex h-[61px] items-center gap-3 border-b border-sidebar-border px-4">
            <div className="flex size-9 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
              <ShieldCheck aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none text-slate-100">
                finsec-ops
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Cyber Financial Operations
              </p>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === pathname;

              return (
                <a
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                    active &&
                      "border border-cyan-400/10 bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <Icon aria-hidden="true" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
          <div className="border-t border-sidebar-border p-4">
            <div className="rounded-lg border border-border/70 bg-secondary/40 p-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Phase
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-100">
                Phase 2-4 workspace
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Static management UI with reviewed model extensions.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex min-h-[61px] items-center gap-3 border-b border-border/80 bg-background/95 px-4 backdrop-blur md:px-6">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              aria-label="Open navigation"
            >
              <Menu />
            </Button>
            <div className="mr-auto lg:hidden">
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
              FY 2027
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
            <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              <Plus data-icon="inline-start" />
              {actionLabel}
            </Button>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 md:gap-5 md:p-6">
            <section className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-normal text-slate-50 md:text-3xl">
                {title}
              </h1>
              <p className="max-w-3xl text-sm text-muted-foreground">
                {description}
              </p>
            </section>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
