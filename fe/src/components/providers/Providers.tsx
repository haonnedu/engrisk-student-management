"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { QueryProvider } from "./QueryProvider";
import { ToastProvider } from "./ToastProvider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <QueryProvider>
          {children}
          <ToastProvider />
        </QueryProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
