"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/Sidebar";
import { ParentSidebar } from "@/components/layout/ParentSidebar";
import { TeacherSidebar } from "@/components/layout/TeacherSidebar";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Check if current route is an auth route (login or register)
  const isAuthRoute =
    pathname?.startsWith("/login") || pathname?.startsWith("/register");

  // Check if current route is a parent route
  const isParentRoute = pathname?.startsWith("/parent");
  // Teacher portal routes (not /teachers which is admin page for managing teachers)
  const isTeacherRoute = pathname === "/teacher" || pathname?.startsWith("/teacher/");

  // Redirect to login if not authenticated and not on auth route
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isAuthRoute) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, isAuthRoute, router]);

  // Redirect based on user role
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !isAuthRoute) {
      const currentPath = pathname || "/";
      
      // Students can only access parent portal
      if (user.role === "STUDENT") {
        if (!isParentRoute) {
          router.push("/parent/grades");
        }
      }
      // Teachers have access to both teacher portal and admin features
      // Only redirect if they're on a student-only route
      else if (user.role === "TEACHER") {
        if (isParentRoute) {
          router.push("/teacher/dashboard");
        }
      }
      // Admins and Super Admins have access to everything except student portal
      else if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
        if (isParentRoute) {
          router.push("/");
        }
      }
    }
  }, [isLoading, isAuthenticated, user, isParentRoute, isTeacherRoute, isAuthRoute, router, pathname]);

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

  // For parent routes, render with parent sidebar
  if (isParentRoute && user?.role === "STUDENT") {
    return (
      <SidebarProvider>
        <ParentSidebar />
        <SidebarInset>
          {/* HEADER */}
          <header className="sticky top-0 z-40 h-14 shrink-0 border-b bg-background/80 backdrop-blur w-full">
            <Navbar />
          </header>

          {/* MAIN */}
          <main className="flex-1 p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Teachers always use Teacher Sidebar (for both /teacher/* and admin routes)
  if (user?.role === "TEACHER") {
    return (
      <SidebarProvider>
        <TeacherSidebar />
        <SidebarInset>
          {/* HEADER */}
          <header className="sticky top-0 z-40 h-14 shrink-0 border-b bg-background/80 backdrop-blur w-full">
            <Navbar />
          </header>

          {/* MAIN */}
          <main className="flex-1 p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // For teacher portal routes accessed by Admin/Super Admin
  if (isTeacherRoute && (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN")) {
    return (
      <SidebarProvider>
        <TeacherSidebar />
        <SidebarInset>
          {/* HEADER */}
          <header className="sticky top-0 z-40 h-14 shrink-0 border-b bg-background/80 backdrop-blur w-full">
            <Navbar />
          </header>

          {/* MAIN */}
          <main className="flex-1 p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // For all other routes (Admin/Super Admin on admin routes), render with admin sidebar
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
