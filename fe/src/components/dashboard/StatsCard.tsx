import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type ColorScheme = "blue" | "green" | "purple" | "amber";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  colorScheme?: ColorScheme;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const colorMap: Record<
  ColorScheme,
  { iconBg: string; iconColor: string; accent: string }
> = {
  blue: {
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    accent: "border-l-blue-500",
  },
  green: {
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    accent: "border-l-emerald-500",
  },
  purple: {
    iconBg: "bg-violet-50 dark:bg-violet-950/40",
    iconColor: "text-violet-600 dark:text-violet-400",
    accent: "border-l-violet-500",
  },
  amber: {
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    accent: "border-l-amber-500",
  },
};

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  colorScheme = "blue",
  trend,
}: StatsCardProps) {
  const colors = colorMap[colorScheme];

  return (
    <Card
      className={cn(
        "border-l-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5",
        colors.accent
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">
              {title}
            </p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  trend.isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {trend.isPositive ? "+" : ""}
                  {trend.value}
                </span>
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-xl shrink-0", colors.iconBg)}>
            <Icon className={cn("h-6 w-6", colors.iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
