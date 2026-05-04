"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useNavigation } from "@/hooks/useNavigation";
import { useTranslations } from "@/hooks/useTranslations";
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  Users,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { Chart } from "./Chart";
import { QuickActions } from "./QuickActions";
import { StatsCard } from "./StatsCard";
import { RecentActivities, type Activity } from "./RecentActivities";

// ── Mock recent activities ──────────────────────────────────────────────────
const recentActivities: Activity[] = [
  {
    id: 1,
    action: "New enrollment",
    detail: "Nguyen Van A → ENG101 – Beginner",
    time: "2m ago",
    type: "enrollment",
  },
  {
    id: 2,
    action: "Grades submitted",
    detail: "Ms. Jenny · Class A Mid-term",
    time: "1h ago",
    type: "grade",
  },
  {
    id: 3,
    action: "Attendance marked",
    detail: "Class B · ENG102 – 18/20 present",
    time: "2h ago",
    type: "attendance",
  },
  {
    id: 4,
    action: "New class created",
    detail: "Advanced Speaking · Mon & Wed 18:00",
    time: "3h ago",
    type: "class",
  },
  {
    id: 5,
    action: "Grade updated",
    detail: "Tran Thi B · Final exam score revised",
    time: "5h ago",
    type: "grade",
  },
  {
    id: 6,
    action: "New enrollment",
    detail: "Le Van C → ENG201 – Intermediate",
    time: "Yesterday",
    type: "enrollment",
  },
];

// ── Upcoming events ─────────────────────────────────────────────────────────
const EVENT_CONFIG = [
  {
    eventKey: "finalExam",
    dateKey: "finalExamDate",
    badgeKey: "examBadge",
    dotClass: "bg-red-500",
    badgeClass:
      "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  },
  {
    eventKey: "gradeDeadline",
    dateKey: "gradeDeadlineDate",
    badgeKey: "deadlineBadge",
    dotClass: "bg-amber-500",
    badgeClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  },
  {
    eventKey: "newSemester",
    dateKey: "newSemesterDate",
    badgeKey: "eventBadge",
    dotClass: "bg-emerald-500",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
];

export function Dashboard() {
  const { isNavigating, navigate } = useNavigation();
  const { t, locale } = useTranslations("dashboard");

  const stats = {
    totalStudents: 156,
    activeCourses: 8,
    totalClasses: 12,
    pendingGrades: 23,
  };

  const today = new Date().toLocaleDateString(
    locale === "vi" ? "vi-VN" : "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="space-y-5">
      {/* ── Welcome Banner ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-lg">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white" />
          <div className="absolute -bottom-12 -left-4 h-48 w-48 rounded-full bg-white" />
          <div className="absolute top-1/2 right-24 h-24 w-24 rounded-full bg-white" />
        </div>

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-200" />
              <span className="text-sm font-medium text-blue-200">
                {t("portalName")}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("welcomeBack")} 👋
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-blue-100">
              <CalendarDays className="h-3.5 w-3.5" />
              {today}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => navigate("/dashboard/courses")}
              disabled={isNavigating}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm"
            >
              {isNavigating ? (
                <Spinner className="h-4 w-4 mr-1.5" />
              ) : (
                <BookOpen className="h-4 w-4 mr-1.5" />
              )}
              {t("viewCourses")}
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/dashboard/grades/classes")}
              disabled={isNavigating}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm"
            >
              {isNavigating ? (
                <Spinner className="h-4 w-4 mr-1.5" />
              ) : (
                <BarChart3 className="h-4 w-4 mr-1.5" />
              )}
              {t("manageGrades")}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stats Row ────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t("stats.totalStudents")}
          value={stats.totalStudents}
          description={t("stats.totalStudentsDesc")}
          icon={Users}
          colorScheme="blue"
          trend={{ value: t("stats.trendStudents"), isPositive: true }}
        />
        <StatsCard
          title={t("stats.activeCourses")}
          value={stats.activeCourses}
          description={t("stats.activeCoursesDesc")}
          icon={BookOpen}
          colorScheme="green"
          trend={{ value: t("stats.trendCourses"), isPositive: true }}
        />
        <StatsCard
          title={t("stats.totalClasses")}
          value={stats.totalClasses}
          description={t("stats.totalClassesDesc")}
          icon={GraduationCap}
          colorScheme="purple"
          trend={{ value: t("stats.trendClasses"), isPositive: true }}
        />
        <StatsCard
          title={t("stats.pendingGrades")}
          value={stats.pendingGrades}
          description={t("stats.pendingGradesDesc")}
          icon={BarChart3}
          colorScheme="amber"
        />
      </div>

      {/* ── Chart + Quick Actions ─────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <Chart />
        </div>
        <div className="lg:col-span-3">
          <QuickActions />
        </div>
      </div>

      {/* ── Events + Recent Activity ──────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Upcoming Events */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-3">
            <div className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  {t("events.title")}
                </CardTitle>
                <CardDescription className="mt-1">
                  {t("events.description")}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground shrink-0">
                {t("events.viewAll")}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {EVENT_CONFIG.map((ev) => (
              <div
                key={ev.eventKey}
                className="flex items-center gap-3 rounded-xl border p-3 hover:bg-accent/50 transition-colors duration-150"
              >
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${ev.dotClass}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {t(`events.${ev.eventKey}`)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(`events.${ev.dateKey}`)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${ev.badgeClass}`}
                >
                  {t(`events.${ev.badgeKey}`)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="lg:col-span-3">
          <RecentActivities activities={recentActivities} />
        </div>
      </div>
    </div>
  );
}
