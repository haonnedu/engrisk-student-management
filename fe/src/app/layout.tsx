"use client";

import { Providers } from "@/components/providers/Providers";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
