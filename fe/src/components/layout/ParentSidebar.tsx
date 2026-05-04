"use client";

import {
  GraduationCap,
  UserCircle,
  KeyRound,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslations } from "@/hooks/useTranslations";

const ICON_COLORS: Record<string, string> = {
  "text-amber-400": "#fbbf24",
  "text-blue-400": "#60a5fa",
  "text-emerald-400": "#34d399",
  "text-rose-400": "#fb7185",
};

export function ParentSidebar() {
  const { t: tParent } = useTranslations("parent.nav");
  const { t: tNav } = useTranslations("nav");

  const items = [
    {
      title: tParent("myGrades"),
      url: "/parent/grades",
      icon: GraduationCap,
      iconColor: "text-amber-400",
    },
    {
      title: tNav("items.homework"),
      url: "/parent/homework",
      icon: BookOpen,
      iconColor: "text-blue-400",
    },
    {
      title: tParent("myProfile"),
      url: "/parent/profile",
      icon: UserCircle,
      iconColor: "text-emerald-400",
    },
    {
      title: tParent("changePassword"),
      url: "/parent/change-password",
      icon: KeyRound,
      iconColor: "text-rose-400",
    },
  ];

  return (
    <Sidebar>
      {/* Branding header */}
      <SidebarHeader className="border-b border-white/10 pb-4 pt-5 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm shrink-0">
            <GraduationCap className="h-5 w-5 text-blue-200" />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-white text-sm">{tNav("appName")}</p>
            <p className="text-xs text-blue-200/70">{tNav("taglines.student")}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 text-xs uppercase tracking-widest px-3">
            {tNav("groups.student")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className="[&>svg]:shrink-0">
                      <item.icon
                        className="size-4"
                        style={{ color: ICON_COLORS[item.iconColor] }}
                      />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 pt-2">
        <div className="px-4 pb-2">
          <LanguageSwitcher variant="sidebar" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
