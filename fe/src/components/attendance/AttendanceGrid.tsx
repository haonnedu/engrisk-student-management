"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import type { Attendance } from "@/hooks/useAttendance";
import { useState } from "react";

type AttendanceGridProps = {
  attendanceData: Attendance[];
  onStatusChange: (studentId: string, date: string, status: string) => void;
  onNoteChange: (studentId: string, date: string, note: string) => void;
};

const statusIcons = {
  PRESENT: <CheckCircle className="h-4 w-4 text-green-600" />,
  ABSENT: <XCircle className="h-4 w-4 text-red-600" />,
  LATE: <Clock className="h-4 w-4 text-yellow-600" />,
  EXCUSED: <AlertCircle className="h-4 w-4 text-blue-600" />,
};

const statusColors = {
  PRESENT: "bg-green-100 text-green-800",
  ABSENT: "bg-red-100 text-red-800",
  LATE: "bg-yellow-100 text-yellow-800",
  EXCUSED: "bg-blue-100 text-blue-800",
};

export function AttendanceGrid({
  attendanceData,
  onStatusChange,
  onNoteChange,
}: AttendanceGridProps) {
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState("");

  // Group attendance by student and date
  const groupedData = attendanceData.reduce((acc, attendance) => {
    if (!acc[attendance.studentId]) {
      acc[attendance.studentId] = {
        student: attendance.student,
        dates: {},
      };
    }
    acc[attendance.studentId].dates[attendance.date] = attendance;
    return acc;
  }, {} as Record<string, { student: any; dates: Record<string, Attendance> }>);

  // Get unique dates
  const dates = Array.from(new Set(attendanceData.map((a) => a.date))).sort();

  const handleNoteEdit = (
    studentId: string,
    date: string,
    currentNote: string
  ) => {
    setEditingNote(`${studentId}-${date}`);
    setNoteValue(currentNote || "");
  };

  const handleNoteSave = (studentId: string, date: string) => {
    onNoteChange(studentId, date, noteValue);
    setEditingNote(null);
    setNoteValue("");
  };

  const handleNoteCancel = () => {
    setEditingNote(null);
    setNoteValue("");
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <div className="min-w-full">
        {/* Header */}
        <div className="grid grid-cols-12 gap-1 bg-muted/50 p-2 text-sm font-medium">
          <div className="col-span-3">Student</div>
          {dates.map((date) => (
            <div key={date} className="text-center">
              {new Date(date).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
              })}
            </div>
          ))}
        </div>

        {/* Rows */}
        {Object.entries(groupedData).map(
          ([studentId, { student, dates: studentDates }]) => (
            <div
              key={studentId}
              className="grid grid-cols-12 gap-1 p-2 border-b last:border-b-0"
            >
              <div className="col-span-3">
                <div className="font-medium">
                  {student?.firstName} {student?.lastName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {student?.studentId}
                </div>
              </div>

              {dates.map((date) => {
                const attendance = studentDates[date];
                const isEditingNote = editingNote === `${studentId}-${date}`;

                return (
                  <div key={date} className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      {attendance ? statusIcons[attendance.status] : null}
                      <Select
                        value={attendance?.status || "PRESENT"}
                        onValueChange={(status) =>
                          onStatusChange(studentId, date, status)
                        }
                      >
                        <SelectTrigger className="h-8 w-16 text-xs">
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

                    {/* Note */}
                    <div className="w-full">
                      {isEditingNote ? (
                        <div className="flex gap-1">
                          <Input
                            value={noteValue}
                            onChange={(e) => setNoteValue(e.target.value)}
                            className="h-6 text-xs"
                            placeholder="Note"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-1"
                            onClick={() => handleNoteSave(studentId, date)}
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-1"
                            onClick={handleNoteCancel}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="h-6 text-xs cursor-pointer hover:bg-muted rounded px-1 flex items-center"
                          onClick={() =>
                            handleNoteEdit(
                              studentId,
                              date,
                              attendance?.note || ""
                            )
                          }
                          title={attendance?.note || "Click to add note"}
                        >
                          {attendance?.note || "..."}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
