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
import {
    BarChart3,
    BookOpen,
    GraduationCap,
    Users
} from "lucide-react";
import { Chart } from "./Chart";
import { QuickActions } from "./QuickActions";
import { StatsCard } from "./StatsCard";

export function Dashboard() {
  const { isNavigating, navigate } = useNavigation();

  // Mock data - sẽ thay thế bằng API thực tế sau
  const stats = {
    totalStudents: 156,
    activeCourses: 8,
    totalClasses: 12,
    pendingGrades: 23,
    recentEnrollments: 5,
    upcomingExams: 3,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to EngRisk Student Management System
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/courses")}
            disabled={isNavigating}
          >
            {isNavigating ? (
              <Spinner className="h-4 w-4 mr-2" />
            ) : (
              <BookOpen className="h-4 w-4 mr-2" />
            )}
            View Courses
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/grades/classes")}
            disabled={isNavigating}
          >
            {isNavigating ? (
              <Spinner className="h-4 w-4 mr-2" />
            ) : (
              <BarChart3 className="h-4 w-4 mr-2" />
            )}
            Manage Grades
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={stats.totalStudents}
          description="+12% from last month"
          icon={Users}
          trend={{ value: "12%", isPositive: true }}
        />
        <StatsCard
          title="Active Courses"
          value={stats.activeCourses}
          description="+2 new this month"
          icon={BookOpen}
          trend={{ value: "2", isPositive: true }}
        />
        <StatsCard
          title="Total Classes"
          value={stats.totalClasses}
          description="+1 new this week"
          icon={GraduationCap}
          trend={{ value: "1", isPositive: true }}
        />
        <StatsCard
          title="Pending Grades"
          value={stats.pendingGrades}
          description="Need attention"
          icon={BarChart3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart */}
        <div className="col-span-4">
          <Chart />
        </div>

        {/* Quick Actions */}
        <div className="col-span-3">
          <QuickActions />
        </div>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Important dates and deadlines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Final Exam - ENG101</p>
                <p className="text-sm text-muted-foreground">
                  December 15, 2024
                </p>
              </div>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Grade Submission Deadline</p>
                <p className="text-sm text-muted-foreground">
                  December 20, 2024
                </p>
              </div>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New Semester Starts</p>
                <p className="text-sm text-muted-foreground">January 8, 2025</p>
              </div>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
