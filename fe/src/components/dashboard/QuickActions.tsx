"use client";

import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigation } from "@/hooks/useNavigation";
import { useTranslations } from "@/hooks/useTranslations";
import {
  Users,
  BookOpen,
  BarChart3,
  Calendar,
  FileText,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const actionIcons = [
  {
    key: "viewCourses",
    href: "/dashboard/courses",
    icon: BookOpen,
    iconBg: "bg-violet-50 dark:bg-violet-950/40",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    key: "gradeManagement",
    href: "/dashboard/grades/classes",
    icon: BarChart3,
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "takeAttendance",
    href: "/dashboard/attendance",
    icon: Calendar,
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "manageEnrollments",
    href: "/dashboard/enrollments",
    icon: FileText,
    iconBg: "bg-sky-50 dark:bg-sky-950/40",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  {
    key: "addStudent",
    href: "/dashboard/students",
    icon: Plus,
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "viewTeachers",
    href: "/dashboard/teachers",
    icon: Users,
    iconBg: "bg-rose-50 dark:bg-rose-950/40",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
] as const;

export function QuickActions() {
  const { isNavigating, navigate } = useNavigation();
  const { t } = useTranslations("dashboard.quickActions");

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2">
          {actionIcons.map((action) => {
            const Icon = action.icon;
            const titleKey = action.key as string;
            const descKey = `${titleKey}Desc`;
            return (
              <button
                key={action.key}
                onClick={() => navigate(action.href)}
                disabled={isNavigating}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border p-3 text-left",
                  "transition-all duration-200 hover:shadow-sm hover:border-primary/30 hover:bg-accent/50",
                  "disabled:pointer-events-none disabled:opacity-50"
                )}
              >
                <div className={cn("p-2 rounded-lg", action.iconBg)}>
                  {isNavigating ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Icon className={cn("h-4 w-4", action.iconColor)} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">
                    {t(titleKey)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    {t(descKey)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
