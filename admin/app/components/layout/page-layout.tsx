"use client";

import { ReactNode } from "react";
import { SidebarInset, SidebarTrigger } from "@/app/components/ui/sidebar";
import { Separator } from "@/app/components/ui/separator";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function PageLayout({
  children,
  title,
  description,
  actions,
}: PageLayoutProps) {
  return (
    <SidebarInset>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1 md:hidden" />
        <Separator orientation="vertical" className="mr-2 h-4 md:hidden" />

        {title && (
          <div className="flex flex-1 items-center gap-2">
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
        )}

        {actions && <div className="ml-auto">{actions}</div>}
      </header>

      {/* Page Content */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        {description && <p className="text-muted-foreground">{description}</p>}

        <div className="flex-1">{children}</div>
      </div>
    </SidebarInset>
  );
}
