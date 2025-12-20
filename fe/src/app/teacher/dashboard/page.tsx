"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMyTimesheets } from "@/hooks/useTimesheets";
import { Spinner } from "@/components/ui/spinner";
import { Clock, Users, GraduationCap, Calendar } from "lucide-react";
import Link from "next/link";

export default function TeacherDashboardPage() {
  const { data: timesheetsData, isLoading } = useMyTimesheets(1, 5);

  // Calculate stats
  const stats = {
    pending: timesheetsData?.data.filter(t => t.status === "SUBMITTED").length || 0,
    approved: timesheetsData?.data.filter(t => t.status === "APPROVED").length || 0,
    draft: timesheetsData?.data.filter(t => t.status === "DRAFT").length || 0,
    total: timesheetsData?.meta.total || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your teaching activities.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Timesheets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All time records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">
              Not submitted yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Waiting for review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              Successfully approved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Timesheets</CardTitle>
            <CardDescription>Manage your working hours</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/teacher/timesheets">
              <Button className="w-full">
                <Clock className="mr-2 h-4 w-4" />
                View Timesheets
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>View and manage students</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/students">
              <Button className="w-full" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                View Students
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grades</CardTitle>
            <CardDescription>Enter and manage grades</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/grades/classes">
              <Button className="w-full" variant="outline">
                <GraduationCap className="mr-2 h-4 w-4" />
                Manage Grades
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Timesheets */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Timesheets</CardTitle>
          <CardDescription>Your latest time entries</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : timesheetsData?.data && timesheetsData.data.length > 0 ? (
            <div className="space-y-4">
              {timesheetsData.data.slice(0, 5).map((timesheet) => (
                <div
                  key={timesheet.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {new Date(timesheet.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {timesheet.hoursWorked}h {timesheet.minutesWorked}m
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                        timesheet.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : timesheet.status === "SUBMITTED"
                          ? "bg-blue-100 text-blue-800"
                          : timesheet.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {timesheet.status}
                    </span>
                  </div>
                </div>
              ))}
              <Link href="/teacher/timesheets">
                <Button variant="link" className="w-full">
                  View All Timesheets →
                </Button>
              </Link>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No timesheets found. Create your first timesheet!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

