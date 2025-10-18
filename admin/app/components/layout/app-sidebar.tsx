"use client";

import * as React from "react";
import {
  LayoutDashboard,
  LayoutList,
  NotebookText,
  Calendar,
  Video,
  Receipt,
  UserCheck,
  Clock,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/app/components/ui/sidebar";
import Logout from "./sidebar/logout";
import { usePathname, useRouter } from "next/navigation";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const goTo = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    router.push(url);
  };
  return (
    <Sidebar collapsible="offcanvas" {...props} className="bg-slate-50">
      <SidebarHeader className="pt-5 bg-slate-50 ">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <span className="text-base font-semibold">Malika Lkhabir</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-slate-50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className={`truncate font-medium flex items-center cursor-pointer ${
                pathname === "/"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : ""
              }`}
              onClick={(e) => goTo(e, "/")}
            >
              <LayoutDashboard />
              Tableau de Bord
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className={`truncate font-medium flex items-center cursor-pointer ${
                pathname === "/clients"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : ""
              }`}
              onClick={(e) => goTo(e, "/clients")}
            >
              <LayoutList />
              Clients
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className={`truncate font-medium flex items-center cursor-pointer ${
                pathname === "/calendar"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : ""
              }`}
              onClick={(e) => goTo(e, "/calendar")}
            >
              <Calendar />
              Calendrier
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className={`truncate font-medium flex items-center cursor-pointer ${
                pathname === "/availability"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : ""
              }`}
              onClick={(e) => goTo(e, "/availability")}
            >
              <Clock />
              Disponibilité
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className={`truncate font-medium flex items-center cursor-pointer ${
                pathname === "/meeting-room"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : ""
              }`}
              onClick={(e) => goTo(e, "/meeting-room")}
            >
              <Video />
              Salle de Réunion
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className={`truncate font-medium flex items-center cursor-pointer ${
                pathname === "/notes"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : ""
              }`}
              onClick={(e) => goTo(e, "/notes")}
            >
              <NotebookText />
              Notes
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className={`truncate font-medium flex items-center cursor-pointer ${
                pathname === "/invoices"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : ""
              }`}
              onClick={(e) => goTo(e, "/invoices")}
            >
              <Receipt />
              Factures
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className={`truncate font-medium flex items-center cursor-pointer ${
                pathname === "/approvals"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : ""
              }`}
              onClick={(e) => goTo(e, "/approvals")}
            >
              <UserCheck />
              Approbations
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="bg-slate-50">
        <Logout />
      </SidebarFooter>
    </Sidebar>
  );
}
