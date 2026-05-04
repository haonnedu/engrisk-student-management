"use client";

import {
  BarChart3,
  BookMarked,
  BookOpen,
  ChevronDown,
  Clock,
  GraduationCap,
  Home,
  UserCheck,
  UserCircle2,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";

const ICON_COLORS: Record<string, string> = {
  "text-sky-400": "#38bdf8",
  "text-green-400": "#4ade80",
  "text-emerald-400": "#34d399",
  "text-teal-400": "#2dd4bf",
  "text-violet-400": "#a78bfa",
  "text-purple-400": "#c084fc",
  "text-amber-400": "#fbbf24",
  "text-orange-400": "#fb923c",
  "text-rose-400": "#fb7185",
  "text-pink-400": "#f472b6",
};

type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor?: string;
};

type MenuGroup = {
  id: string;
  title: string;
  items: MenuItem[];
  groupIconColor?: string;
};

export function AppSidebar() {
  const { t } = useTranslations("nav");

  const menuGroups: MenuGroup[] = [
    {
      id: "student",
      title: t("groups.student"),
      groupIconColor: "text-emerald-400",
      items: [
        { title: t("items.students"), url: "/dashboard/students", icon: Users, iconColor: "text-emerald-400" },
        { title: t("items.enrollments"), url: "/dashboard/enrollments", icon: UserPlus, iconColor: "text-teal-400" },
      ],
    },
    {
      id: "course",
      title: t("groups.course"),
      groupIconColor: "text-violet-400",
      items: [
        { title: t("items.courses"), url: "/dashboard/courses", icon: BookMarked, iconColor: "text-violet-400" },
        { title: t("items.classes"), url: "/dashboard/classes", icon: BookOpen, iconColor: "text-purple-400" },
      ],
    },
    {
      id: "grade",
      title: t("groups.grade"),
      groupIconColor: "text-amber-400",
      items: [
        { title: t("items.grades"), url: "/dashboard/grades/classes", icon: GraduationCap, iconColor: "text-amber-400" },
        { title: t("items.gradeTypes"), url: "/dashboard/grade-types", icon: BarChart3, iconColor: "text-orange-400" },
      ],
    },
    {
      id: "teacher",
      title: t("groups.teacher"),
      groupIconColor: "text-rose-400",
      items: [
        { title: t("items.teachers"), url: "/dashboard/teachers", icon: UserCircle2, iconColor: "text-rose-400" },
        { title: t("items.timesheets"), url: "/dashboard/timesheets", icon: Clock, iconColor: "text-pink-400" },
      ],
    },
  ];

  const standaloneItems: MenuItem[] = [
    { title: t("items.dashboard"), url: "/dashboard", icon: Home, iconColor: "text-sky-400" },
    { title: t("items.attendance"), url: "/dashboard/attendance", icon: UserCheck, iconColor: "text-green-400" },
  ];

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    student: true,
    course: true,
    grade: true,
    teacher: true,
  });

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
            <p className="text-xs text-blue-200/70">{t("taglines.admin")}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 text-xs uppercase tracking-widest px-3">
            {t("groups.navigation")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Standalone items */}
              {standaloneItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className="[&>svg]:shrink-0">
                      <item.icon
                        className="size-4"
                        style={item.iconColor ? { color: ICON_COLORS[item.iconColor] } : undefined}
                      />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Grouped items with collapsible */}
              {menuGroups.map((group) => (
                <Collapsible
                  key={group.id}
                  open={openGroups[group.id]}
                  onOpenChange={() => toggleGroup(group.id)}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="[&>svg]:shrink-0">
                        <ChevronDown
                          className={cn(
                            "size-4 transition-transform duration-200",
                            openGroups[group.id] && "rotate-180"
                          )}
                          style={
                            group.groupIconColor
                              ? { color: ICON_COLORS[group.groupIconColor] }
                              : undefined
                          }
                        />
                        <span>{group.title}</span>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {group.items.map((item) => (
                          <SidebarMenuSubItem key={item.url}>
                            <SidebarMenuSubButton asChild>
                              <Link href={item.url} className="[&>svg]:shrink-0">
                                <item.icon
                                  className="size-4"
                                  style={item.iconColor ? { color: ICON_COLORS[item.iconColor] } : undefined}
                                />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
