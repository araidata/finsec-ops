"use client";

import { PanelLeftClose, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { navigationItems } from "@/lib/dashboard-data";

export function AppNavigationSidebar({
  phaseTitle,
  phaseDescription,
}: {
  phaseTitle: string;
  phaseDescription: string;
}) {
  const pathname = usePathname();
  const [currentTab, setCurrentTab] = useState<string | null>(null);
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    setCurrentTab(new URLSearchParams(window.location.search).get("tab"));
  }, [pathname]);

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex h-[37px] items-center gap-3">
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
      </SidebarHeader>
      <SidebarContent className="px-3 py-3">
        <SidebarMenu>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const itemPath = item.href.split("?")[0];
            const itemQuery = item.href.split("?")[1] ?? "";
            const itemTab = new URLSearchParams(itemQuery).get("tab");
            const active =
              itemPath === pathname &&
              (itemTab
                ? currentTab === itemTab
                : itemPath === "/products"
                  ? currentTab !== "vendors"
                  : true);

            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  isActive={active}
                  render={
                    <a href={item.href}>
                      <Icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </a>
                  }
                />
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="rounded-lg border border-border/70 bg-secondary/40 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Phase
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-100">
            {phaseTitle}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {phaseDescription}
          </p>
        </div>
        <Button
          variant="ghost"
          className="justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={toggleSidebar}
        >
          <PanelLeftClose data-icon="inline-start" />
          Minimize menu
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
