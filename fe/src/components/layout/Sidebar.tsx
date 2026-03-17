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

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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

// Map Tailwind color name → CSS value (để icon con không bị sidebar override)
const ICON_COLORS: Record<string, string> = {
  "text-sky-500": "#0ea5e9",
  "text-green-500": "#22c55e",
  "text-emerald-500": "#10b981",
  "text-teal-500": "#14b8a6",
  "text-violet-500": "#8b5cf6",
  "text-purple-500": "#a855f7",
  "text-amber-500": "#f59e0b",
  "text-orange-500": "#f97316",
  "text-rose-500": "#f43f5e",
  "text-pink-500": "#ec4899",
};

// Menu item type
type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor?: string; // key trong ICON_COLORS hoặc Tailwind class
};

// Menu group type
type MenuGroup = {
  title: string;
  items: MenuItem[];
  defaultOpen?: boolean;
  groupIconColor?: string; // màu cho chevron header nhóm
};

// Menu groups organized by entity type
const menuGroups: MenuGroup[] = [
  {
    title: "Student",
    groupIconColor: "text-emerald-500",
    items: [
      { title: "Students", url: "/dashboard/students", icon: Users, iconColor: "text-emerald-500" },
      { title: "Enrollments", url: "/dashboard/enrollments", icon: UserPlus, iconColor: "text-teal-500" },
    ],
    defaultOpen: true,
  },
  {
    title: "Course",
    groupIconColor: "text-violet-500",
    items: [
      { title: "Courses", url: "/dashboard/courses", icon: BookMarked, iconColor: "text-violet-500" },
      { title: "Classes", url: "/dashboard/classes", icon: BookOpen, iconColor: "text-purple-500" },
    ],
    defaultOpen: true,
  },
  {
    title: "Grade",
    groupIconColor: "text-amber-500",
    items: [
      { title: "Grades", url: "/dashboard/grades/classes", icon: GraduationCap, iconColor: "text-amber-500" },
      { title: "Grade Types", url: "/dashboard/grade-types", icon: BarChart3, iconColor: "text-orange-500" },
    ],
    defaultOpen: true,
  },
  {
    title: "Teacher",
    groupIconColor: "text-rose-500",
    items: [
      { title: "Teachers", url: "/dashboard/teachers", icon: UserCircle2, iconColor: "text-rose-500" },
      { title: "Timesheets", url: "/dashboard/timesheets", icon: Clock, iconColor: "text-pink-500" },
    ],
    defaultOpen: true,
  },
];

// Standalone menu items
const standaloneItems: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home, iconColor: "text-sky-500" },
  { title: "Attendance", url: "/dashboard/attendance", icon: UserCheck, iconColor: "text-green-500" },
];

export function AppSidebar() {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    menuGroups.forEach((group) => {
      initialState[group.title] = group.defaultOpen ?? true;
    });
    return initialState;
  });

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Standalone items */}
              {standaloneItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="[&>svg]:shrink-0">
                      <item.icon
                        className="size-4"
                        style={item.iconColor ? { color: ICON_COLORS[item.iconColor] ?? item.iconColor } : undefined}
                      />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Grouped items with collapsible */}
              {menuGroups.map((group) => (
                <Collapsible
                  key={group.title}
                  open={openGroups[group.title]}
                  onOpenChange={() => toggleGroup(group.title)}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="[&>svg]:shrink-0">
                        <ChevronDown
                          className={cn(
                            "size-4 transition-transform duration-200",
                            openGroups[group.title] && "rotate-180"
                          )}
                          style={group.groupIconColor ? { color: ICON_COLORS[group.groupIconColor] ?? undefined } : undefined}
                        />
                        <span>{group.title}</span>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {group.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <a href={item.url} className="[&>svg]:shrink-0">
                                <item.icon
                                  className="size-4"
                                  style={item.iconColor ? { color: ICON_COLORS[item.iconColor] ?? item.iconColor } : undefined}
                                />
                                <span>{item.title}</span>
                              </a>
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
