import {
  Calendar,
  Home,
  Users,
  Search,
  Settings,
  BookOpen,
  GraduationCap,
  UserCheck,
  UserPlus,
  BookMarked,
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

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
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
  {
    title: "Enrollments",
    url: "/enrollments",
    icon: UserPlus,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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
