"use client";

import { PanelLeftClose, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";

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

export function AppNavigationSidebar() {
  const pathname = usePathname();
  const searchParams =
    typeof window === "undefined"
      ? new URLSearchParams()
      : new URLSearchParams(window.location.search);
  const currentTab = searchParams.get("tab");
  const { toggleSidebar } = useSidebar();

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
              Financial Operations
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
            const navigationParams = new URLSearchParams(itemQuery);
            searchParams.forEach((value, key) => {
              if (key !== "tab" && !navigationParams.has(key)) navigationParams.set(key, value);
            });
            const navigationHref =
              item.href === "#"
                ? item.href
                : `${itemPath}${navigationParams.toString() ? `?${navigationParams.toString()}` : ""}`;
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
                    <a href={navigationHref}>
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
