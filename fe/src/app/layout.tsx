import { Providers } from "@/components/providers/Providers";
import { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EngRisk Student Management",
  description: "Student Management System",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
