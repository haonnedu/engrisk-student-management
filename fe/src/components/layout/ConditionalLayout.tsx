"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Check if current route is an auth route
  const isAuthRoute =
    pathname?.startsWith("/login") || pathname?.startsWith("/register");

  // If it's an auth route, render children directly without sidebar
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // For all other routes, render with sidebar
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* HEADER: KHÔNG giãn, cao 56px */}
        <header className="sticky top-0 z-40 h-14 shrink-0 border-b bg-background/80 backdrop-blur w-full">
          {/* trigger + navbar */}
          <Navbar />
        </header>

        {/* MAIN: phần hiển thị children */}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
