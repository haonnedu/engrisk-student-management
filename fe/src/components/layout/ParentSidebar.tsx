"use client";

import {
  GraduationCap,
  UserCircle,
  KeyRound,
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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslations } from "@/hooks/useTranslations";

export function ParentSidebar() {
  const { t } = useTranslations('parent.nav');

  const items = [
    {
      title: t('myGrades'),
      url: "/parent/grades",
      icon: GraduationCap,
    },
    {
      title: t('myProfile'),
      url: "/parent/profile",
      icon: UserCircle,
    },
    {
      title: t('changePassword'),
      url: "/parent/change-password",
      icon: KeyRound,
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Parent Portal</SidebarGroupLabel>
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
      <SidebarFooter>
        <div className="p-4">
          <LanguageSwitcher />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

