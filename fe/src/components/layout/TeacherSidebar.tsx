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

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Màu icon (giống admin) — dùng inline style để ghi đè sidebar
const ICON_COLORS: Record<string, string> = {
  "text-sky-500": "#0ea5e9",
  "text-amber-500": "#f59e0b",
  "text-emerald-500": "#10b981",
  "text-teal-500": "#14b8a6",
  "text-violet-500": "#8b5cf6",
  "text-purple-500": "#a855f7",
  "text-rose-500": "#f43f5e",
  "text-orange-500": "#f97316",
  "text-green-500": "#22c55e",
};

// Teacher-specific items
const teacherItems = [
  { title: "Dashboard", url: "/teacher/dashboard", icon: LayoutDashboard, iconColor: "text-sky-500" },
  { title: "My Timesheets", url: "/teacher/timesheets", icon: Clock, iconColor: "text-amber-500" },
];

// Admin features that teachers can access
const adminItems = [
  { title: "Students", url: "/dashboard/students", icon: Users, iconColor: "text-emerald-500" },
  { title: "Enrollments", url: "/dashboard/enrollments", icon: ClipboardList, iconColor: "text-teal-500" },
  { title: "Courses", url: "/dashboard/courses", icon: BookMarked, iconColor: "text-violet-500" },
  { title: "Classes", url: "/dashboard/classes", icon: BookOpen, iconColor: "text-purple-500" },
  { title: "Grades", url: "/dashboard/grades/classes", icon: GraduationCap, iconColor: "text-amber-500" },
  { title: "Attendance", url: "/dashboard/attendance", icon: UserCheck, iconColor: "text-green-500" },
  { title: "Grade Types", url: "/dashboard/grade-types", icon: BarChart3, iconColor: "text-orange-500" },
];

export function TeacherSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Teacher</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {teacherItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="[&>svg]:shrink-0">
                      <item.icon
                        className="size-4"
                        style={{ color: ICON_COLORS[item.iconColor] ?? "#22c55e" }}
                      />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="[&>svg]:shrink-0">
                      <item.icon
                        className="size-4"
                        style={{ color: ICON_COLORS[item.iconColor] ?? "#22c55e" }}
                      />
                      <span>{item.title}</span>
                    </a>
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
