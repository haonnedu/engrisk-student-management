"use client";
import * as React from "react";
import { useState } from "react";
import { AttendanceGrid } from "@/components/attendance/AttendanceGrid";
import { AttendanceToolbar } from "@/components/attendance/AttendanceToolbar";
import {
  useAttendance,
  useSetAttendance,
  useGenerateAttendance,
  useBulkUpdateAttendance,
  type Attendance,
} from "@/hooks/useAttendance";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

export default function AttendancePage() {
  const [sectionId, setSectionId] = useState<string>("");
  const [month, setMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, "0")
  );
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const monthYear = `${year}-${month}`;
  const {
    data: attendanceData,
    isLoading,
    error,
    refetch,
  } = useAttendance(sectionId, monthYear);

  const setAttendanceMutation = useSetAttendance();
  const generateAttendanceMutation = useGenerateAttendance();
  const bulkUpdateMutation = useBulkUpdateAttendance();

  const handleStatusChange = (
    studentId: string,
    date: string,
    status: string
  ) => {
    if (!sectionId) return;

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
    if (!sectionId) return;

    // Find the current attendance record to get the existing status
    const currentAttendance = attendanceData?.find(
      (attendance: Attendance) =>
        attendance.studentId === studentId && attendance.date === date
    );

    setAttendanceMutation.mutate(
      {
        sectionId,
        studentId,
        date,
        status: currentAttendance?.status || "PRESENT",
        note,
      },
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

  const handleGenerateAttendance = () => {
    if (!sectionId || !startDate || !endDate) {
      toast.error("Please select class and date range");
      return;
    }

    generateAttendanceMutation.mutate(
      { sectionId, startDate, endDate },
      {
        onSuccess: () => {
          toast.success("Attendance generated successfully!");
          setGenerateDialogOpen(false);
          refetch(); // Refresh data after generation
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to generate attendance"
          );
        },
      }
    );
  };

  const handleExportAttendance = () => {
    if (!attendanceData || !sectionId) {
      toast.error("No attendance data to export");
      return;
    }

    // Simple CSV export
    const csvContent = [
      ["Student ID", "Student Name", "Date", "Status", "Note"],
      ...attendanceData.map((attendance: Attendance) => [
        attendance.student?.studentId || "",
        `${attendance.student?.firstName || ""} ${
          attendance.student?.lastName || ""
        }`,
        attendance.date,
        attendance.status,
        attendance.note || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${sectionId}-${month}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Attendance exported successfully!");
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error) {
    console.error("Attendance error:", error);
    return (
      <div className="flex h-64 items-center justify-center text-red-500">
        Error loading attendance data: {error.message}
      </div>
    );
  }

  if (!sectionId) {
    return (
      <div className="space-y-4">
        <AttendanceToolbar
          sectionId={sectionId}
          onSectionChange={setSectionId}
          month={month}
          year={year}
          onMonthChange={setMonth}
          onYearChange={setYear}
          onGenerateAttendance={() => setGenerateDialogOpen(true)}
          onExportAttendance={handleExportAttendance}
        />
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <div className="mb-4 text-6xl">📚</div>
          <h3 className="mb-2 text-lg font-semibold">No Class Selected</h3>
          <p className="text-muted-foreground">
            Please select a class from the dropdown above to view and manage
            attendance
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AttendanceToolbar
        sectionId={sectionId}
        onSectionChange={setSectionId}
        month={month}
        year={year}
        onMonthChange={setMonth}
        onYearChange={setYear}
        onGenerateAttendance={() => setGenerateDialogOpen(true)}
        onExportAttendance={handleExportAttendance}
      />

      {attendanceData && attendanceData.length > 0 ? (
        <AttendanceGrid
          attendanceData={attendanceData}
          onStatusChange={handleStatusChange}
          onNoteChange={handleNoteChange}
        />
      ) : (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <div className="mb-4 text-6xl">📅</div>
          <h3 className="mb-2 text-lg font-semibold">No Attendance Data</h3>
          <p className="mb-4 text-muted-foreground">
            No attendance records found for the selected class and month.
          </p>
          <Button onClick={() => setGenerateDialogOpen(true)} className="mt-2">
            <Calendar className="mr-2 h-4 w-4" />
            Generate Attendance
          </Button>
        </div>
      )}

      {/* Generate Attendance Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Generate Attendance</DialogTitle>
            <DialogDescription>
              Generate attendance records for the selected date range.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateAttendance}
              disabled={generateAttendanceMutation.isPending}
            >
              {generateAttendanceMutation.isPending
                ? "Generating..."
                : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
