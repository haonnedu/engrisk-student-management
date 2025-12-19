"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { QueryProvider } from "./QueryProvider";
import { ToastProvider } from "./ToastProvider";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <QueryProvider>
          <ConditionalLayout>{children}</ConditionalLayout>
          <ToastProvider />
        </QueryProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}

