"use client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClasses, type ClassSection } from "@/hooks/useClasses";
import { Calendar, Download } from "lucide-react";

export function AttendanceToolbar({
  sectionId,
  onSectionChange,
  month,
  year,
  onMonthChange,
  onYearChange,
  onGenerateAttendance,
  onExportAttendance,
}: {
  sectionId: string;
  onSectionChange: (v: string) => void;
  month: string;
  year: string;
  onMonthChange: (v: string) => void;
  onYearChange: (v: string) => void;
  onGenerateAttendance: () => void;
  onExportAttendance: () => void;
}) {
  const { data: classesData } = useClasses(1, 100);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December",
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Title row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Attendance</h1>

        {/* Action buttons – right side on sm+ */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateAttendance}
            disabled={!sectionId || !month || !year}
            className="gap-2 flex-1 sm:flex-none"
          >
            <Calendar className="h-4 w-4" />
            <span>Generate</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportAttendance}
            disabled={!sectionId}
            className="gap-2 flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Class select – full width on xs, auto on sm+ */}
        <Select value={sectionId} onValueChange={onSectionChange}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            {classesData?.data?.map((classItem: ClassSection) => (
              <SelectItem key={classItem.id} value={classItem.id}>
                {classItem.name} ({classItem.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Month */}
        <Select value={month} onValueChange={onMonthChange}>
          <SelectTrigger className="flex-1 sm:w-32 sm:flex-none">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((monthName, index) => (
              <SelectItem
                key={index + 1}
                value={(index + 1).toString().padStart(2, "0")}
              >
                {monthName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Year */}
        <Select value={year} onValueChange={onYearChange}>
          <SelectTrigger className="w-24 shrink-0">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((yearValue) => (
              <SelectItem key={yearValue} value={yearValue.toString()}>
                {yearValue}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
