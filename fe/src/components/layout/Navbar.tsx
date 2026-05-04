"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GraduationCap, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";
import { LanguageSwitcher } from "./LanguageSwitcher";

function getInitials(email?: string, phone?: string): string {
  if (email) {
    const name = email.split("@")[0];
    const parts = name.split(/[._-]/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (phone) return phone.slice(-2);
  return "U";
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-violet-600",
  ADMIN: "bg-blue-600",
  TEACHER: "bg-emerald-600",
  STUDENT: "bg-amber-500",
};

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useTranslations("auth");

  const initials = getInitials(user?.email, user?.phone);
  const avatarBg = roleColors[user?.role ?? ""] ?? "bg-slate-500";
  const roleLabel = user?.role ? t(`roles.${user.role}`) : "";

  return (
    <div className="mx-auto flex h-14 w-full items-center justify-between px-4 gap-3">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
            <GraduationCap className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-base hidden sm:block bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            Ms. Jenny
          </span>
        </Link>
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher variant="navbar" />

        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5",
                  "hover:bg-accent transition-colors duration-150 outline-none"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shrink-0",
                    avatarBg
                  )}
                >
                  {initials}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {user?.email ?? user?.phone}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {roleLabel}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center gap-3 p-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                    avatarBg
                  )}
                >
                  {initials}
                </div>
                <div className="flex flex-col leading-tight min-w-0">
                  <p className="font-medium text-sm truncate">
                    {user?.email ?? user?.phone}
                  </p>
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t("logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/login">
            <Button variant="default" size="sm">
              {t("login")}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
