"use client";

import {
  Clock,
  LayoutDashboard,
  Users,
  BookMarked,
  BookOpen,
  GraduationCap,
  UserCheck,
  ClipboardList,
  BarChart3,
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
} from "@/components/ui/sidebar";
import { useTranslations } from "@/hooks/useTranslations";

const ICON_COLORS: Record<string, string> = {
  "text-sky-400": "#38bdf8",
  "text-amber-400": "#fbbf24",
  "text-emerald-400": "#34d399",
  "text-teal-400": "#2dd4bf",
  "text-violet-400": "#a78bfa",
  "text-purple-400": "#c084fc",
  "text-orange-400": "#fb923c",
  "text-green-400": "#4ade80",
};

export function TeacherSidebar() {
  const { t } = useTranslations("nav");

  const teacherItems = [
    { title: t("items.overview"), url: "/teacher/dashboard", icon: LayoutDashboard, iconColor: "text-sky-400" },
    { title: t("items.myTimesheets"), url: "/teacher/timesheets", icon: Clock, iconColor: "text-amber-400" },
  ];

  const adminItems = [
    { title: t("items.students"), url: "/dashboard/students", icon: Users, iconColor: "text-emerald-400" },
    { title: t("items.enrollments"), url: "/dashboard/enrollments", icon: ClipboardList, iconColor: "text-teal-400" },
    { title: t("items.courses"), url: "/dashboard/courses", icon: BookMarked, iconColor: "text-violet-400" },
    { title: t("items.classes"), url: "/dashboard/classes", icon: BookOpen, iconColor: "text-purple-400" },
    { title: t("items.grades"), url: "/dashboard/grades/classes", icon: GraduationCap, iconColor: "text-amber-400" },
    { title: t("items.attendance"), url: "/dashboard/attendance", icon: UserCheck, iconColor: "text-green-400" },
    { title: t("items.gradeTypes"), url: "/dashboard/grade-types", icon: BarChart3, iconColor: "text-orange-400" },
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
            <p className="font-bold text-white text-sm">{t("appName")}</p>
            <p className="text-xs text-blue-200/70">{t("taglines.teacher")}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 text-xs uppercase tracking-widest px-3">
            {t("groups.teacher")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {teacherItems.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 text-xs uppercase tracking-widest px-3">
            {t("groups.management")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
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
    </Sidebar>
  );
}
