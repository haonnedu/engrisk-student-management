"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "@/hooks/useTranslations";

const RAW_DATA = [
  { monthKey: "jul", students: 140, enrollments: 25, courses: 7 },
  { monthKey: "aug", students: 145, enrollments: 18, courses: 8 },
  { monthKey: "sep", students: 150, enrollments: 22, courses: 8 },
  { monthKey: "oct", students: 152, enrollments: 15, courses: 9 },
  { monthKey: "nov", students: 154, enrollments: 20, courses: 9 },
  { monthKey: "dec", students: 156, enrollments: 12, courses: 8 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-card shadow-lg p-3 text-sm min-w-[140px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-medium text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Chart() {
  const { t } = useTranslations("dashboard.chart");

  const data = RAW_DATA.map((d) => ({
    month: t(`months.${d.monthKey}`),
    [t("students")]: d.students,
    [t("enrollments")]: d.enrollments,
  }));

  const studentKey = t("students");
  const enrollmentKey = t("enrollments");

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradStudents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradEnrollments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
              iconType="circle"
              iconSize={8}
            />

            <Area
              type="monotone"
              dataKey={studentKey}
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#gradStudents)"
              dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
            />
            <Area
              type="monotone"
              dataKey={enrollmentKey}
              stroke="#8b5cf6"
              strokeWidth={2.5}
              fill="url(#gradEnrollments)"
              dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
