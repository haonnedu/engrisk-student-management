"use client";
import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ClassAttendanceDialog } from "@/components/classes/ClassAttendanceDialog";
import { useAttendance, useSetAttendance } from "@/hooks/useAttendance";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Calendar, CheckCircle, XCircle, Clock, UserCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ClassAttendancePageProps = {
  sectionId: string;
  className?: string;
};

export function ClassAttendancePage({
  sectionId,
  className,
}: ClassAttendancePageProps) {
  const [month, setMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );
  const [globalFilter, setGlobalFilter] = useState("");

  const {
    data: attendanceData,
    isLoading,
    error,
  } = useAttendance(sectionId, month);
  const setAttendanceMutation = useSetAttendance();

  const handleStatusChange = (
    studentId: string,
    date: string,
    status: string
  ) => {
    setAttendanceMutation.mutate(
      { sectionId, studentId, date, status },
      {
        onSuccess: () => {
          toast.success("Attendance updated");
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to update attendance"
          );
        },
      }
    );
  };

  const handleNoteChange = (studentId: string, date: string, note: string) => {
    setAttendanceMutation.mutate(
      { sectionId, studentId, date, status: "PRESENT", note },
      {
        onSuccess: () => {
          toast.success("Note updated");
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || "Failed to update note");
        },
      }
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "ABSENT":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "LATE":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "EXCUSED":
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant =
      status === "PRESENT"
        ? "default"
        : status === "ABSENT"
        ? "destructive"
        : status === "LATE"
        ? "secondary"
        : "outline";

    return <Badge variant={variant}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500">
        Error loading attendance
      </div>
    );
  }

  // Group attendance by student
  const groupedAttendance =
    attendanceData?.reduce((acc: Record<string, { student: any; records: any[] }>, record: any) => {
      const studentId = record.studentId;
      if (!acc[studentId]) {
        acc[studentId] = {
          student: record.student,
          records: [],
        };
      }
      acc[studentId].records.push(record);
      return acc;
    }, {} as Record<string, { student: any; records: any[] }>) || {};

  // Get unique dates
  const dates = Array.from(
    new Set(attendanceData?.map((record: any) => record.date) || [])
  ).sort();

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Class Attendance</h1>
        <div className="flex items-center gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date(2024, i);
                const monthStr = date.toISOString().substring(0, 7);
                return (
                  <SelectItem key={monthStr} value={monthStr}>
                    {date.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search students..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-56"
          />
          <ClassAttendanceDialog
            sectionId={sectionId}
            trigger={<Button>Manage Attendance</Button>}
          />
        </div>
      </div>

      {attendanceData && attendanceData.length > 0 ? (
        <div className="rounded-md border overflow-x-auto">
          <div className="min-w-full">
            {/* Header with dates */}
            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(120px,1fr))] gap-2 p-4 border-b bg-muted/50">
              <div className="font-medium">Student</div>
              {dates.map((date) => (
                <div key={date as string} className="text-center font-medium text-sm">
                  {new Date(date as string).getDate()}
                </div>
              ))}
            </div>

            {/* Student rows */}
            {(
              Object.values(groupedAttendance) as Array<{
                student: any;
                records: any[];
              }>
            )
              .filter(({ student }) =>
                globalFilter
                  ? `${student?.firstName || ""} ${student?.lastName || ""}`
                      .toLowerCase()
                      .includes(globalFilter.toLowerCase())
                  : true
              )
              .map(({ student, records }) => (
                <div
                  key={student?.id}
                  className="grid grid-cols-[200px_repeat(auto-fit,minmax(120px,1fr))] gap-2 p-4 border-b hover:bg-muted/50"
                >
                  <div>
                    <div className="font-medium">
                      {student?.firstName} {student?.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {student?.studentId}
                    </div>
                  </div>
                  {dates.map((date) => {
                    const record = records.find((r) => r.date === date);
                    return (
                      <div
                        key={date as string}
                        className="flex flex-col items-center gap-1"
                      >
                        {record ? (
                          <>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(record.status)}
                              <Select
                                value={record.status}
                                onValueChange={(status) =>
                                  handleStatusChange(student.id, date as string, status)
                                }
                              >
                                <SelectTrigger className="h-8 w-20 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PRESENT">P</SelectItem>
                                  <SelectItem value="ABSENT">A</SelectItem>
                                  <SelectItem value="LATE">L</SelectItem>
                                  <SelectItem value="EXCUSED">E</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {record.note && (
                              <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                                {record.note}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-400">-</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          No attendance data found for this month. Generate attendance records
          first.
        </div>
      )}
    </div>
  );
}
