"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Check if current route is an auth route (login or register)
  const isAuthRoute =
    pathname?.startsWith("/login") || pathname?.startsWith("/register");

  // Redirect to login if not authenticated and not on auth route
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isAuthRoute) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, isAuthRoute, router]);

  // If it's an auth route, render children directly without sidebar
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // If not authenticated, don't render anything (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // For all other routes (including root dashboard), render with sidebar
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
