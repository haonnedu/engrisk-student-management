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

// Menu item type
type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

// Menu group type
type MenuGroup = {
  title: string;
  items: MenuItem[];
  defaultOpen?: boolean;
};

// Menu groups organized by entity type
const menuGroups: MenuGroup[] = [
  {
    title: "Student",
    items: [
      {
        title: "Students",
        url: "/students",
        icon: Users,
      },
      {
        title: "Enrollments",
        url: "/enrollments",
        icon: UserPlus,
      },
    ],
    defaultOpen: true,
  },
  {
    title: "Course",
    items: [
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
    ],
    defaultOpen: true,
  },
  {
    title: "Grade",
    items: [
      {
        title: "Grades",
        url: "/grades/classes",
        icon: GraduationCap,
      },
      {
        title: "Grade Types",
        url: "/grade-types",
        icon: BarChart3,
      },
    ],
    defaultOpen: true,
  },
  {
    title: "Teacher",
    items: [
      {
        title: "Teachers",
        url: "/teachers",
        icon: UserCircle2,
      },
      {
        title: "Timesheets",
        url: "/timesheets",
        icon: Clock,
      },
    ],
    defaultOpen: true,
  },
];

// Standalone menu items
const standaloneItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Attendance",
    url: "/attendance",
    icon: UserCheck,
  },
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
                    <a href={item.url}>
                      <item.icon />
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
                      <SidebarMenuButton>
                        <ChevronDown
                          className={cn(
                            "transition-transform duration-200",
                            openGroups[group.title] && "rotate-180"
                          )}
                        />
                        <span>{group.title}</span>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {group.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <a href={item.url}>
                                <item.icon />
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
