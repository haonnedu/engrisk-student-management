"use client";

import {
  Clock,
  LayoutDashboard,
  Home,
  Users,
  BookMarked,
  BookOpen,
  GraduationCap,
  UserCheck,
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

// Teacher-specific items
const teacherItems = [
  {
    title: "Dashboard",
    url: "/teacher/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Timesheets",
    url: "/teacher/timesheets",
    icon: Clock,
  },
];

// Admin features that teachers can access
const adminItems = [
  {
    title: "Students",
    url: "/students",
    icon: Users,
  },
  {
    title: "Courses",
    url: "/courses",
    icon: BookMarked,
  },
  {
    title: "Classes",
    url: "/classes",
    icon: BookOpen,
  },
  {
    title: "Grades",
    url: "/grades/classes",
    icon: GraduationCap,
  },
  {
    title: "Attendance",
    url: "/attendance",
    icon: UserCheck,
  },
];

export function TeacherSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        {/* Teacher-specific section */}
        <SidebarGroup>
          <SidebarGroupLabel>Teacher</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {teacherItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin features section */}
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
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

