"use client";

import React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Layout for all dashboard pages: full-width within content area, consistent spacing
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="w-full">
        {/* Page container */}
        <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-4">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}
