import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/Sidebar";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <QueryProvider>
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
            <ToastProvider />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
