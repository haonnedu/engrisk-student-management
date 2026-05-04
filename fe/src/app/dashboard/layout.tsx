"use client";

import React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="w-full">
        <div className="mx-auto w-full max-w-screen-2xl space-y-4 sm:space-y-5 min-w-0">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}
