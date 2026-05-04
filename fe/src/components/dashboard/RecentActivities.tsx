"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";
import { GraduationCap, BarChart3, UserCheck, BookOpen } from "lucide-react";

type ActivityType = "enrollment" | "grade" | "attendance" | "class";

export interface Activity {
  id: number;
  action: string;
  detail: string;
  time: string;
  type: ActivityType;
}

const TYPE_CONFIG: Record<
  ActivityType,
  { icon: React.ElementType; bg: string; color: string }
> = {
  enrollment: {
    icon: GraduationCap,
    bg: "bg-blue-50 dark:bg-blue-950/40",
    color: "text-blue-600 dark:text-blue-400",
  },
  grade: {
    icon: BarChart3,
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  attendance: {
    icon: UserCheck,
    bg: "bg-amber-50 dark:bg-amber-950/40",
    color: "text-amber-600 dark:text-amber-400",
  },
  class: {
    icon: BookOpen,
    bg: "bg-violet-50 dark:bg-violet-950/40",
    color: "text-violet-600 dark:text-violet-400",
  },
};

interface RecentActivitiesProps {
  activities: Activity[];
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  const { t } = useTranslations("dashboard.chart");

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle>{t("activityTitle")}</CardTitle>
        <CardDescription>{t("activityDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="space-y-1">
          {activities.map((activity, idx) => {
            const cfg = TYPE_CONFIG[activity.type];
            const Icon = cfg.icon;
            return (
              <div
                key={activity.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl p-3 transition-colors duration-150",
                  "hover:bg-accent/60"
                )}
              >
                {/* Icon */}
                <div className={cn("p-2 rounded-lg shrink-0", cfg.bg)}>
                  <Icon className={cn("h-4 w-4", cfg.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug truncate">
                    {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {activity.detail}
                  </p>
                </div>

                {/* Time */}
                <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                  {activity.time}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
