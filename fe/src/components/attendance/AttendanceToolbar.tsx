"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClasses, type ClassSection } from "@/hooks/useClasses";
import { useState } from "react";
import { Calendar, Download, Upload } from "lucide-react";

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
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-semibold">Attendance</h1>
      <div className="flex items-center gap-2">
        <Select value={sectionId} onValueChange={onSectionChange}>
          <SelectTrigger className="w-56">
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

        <Select value={month} onValueChange={onMonthChange}>
          <SelectTrigger className="w-32">
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

        <Select value={year} onValueChange={onYearChange}>
          <SelectTrigger className="w-24">
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

        <Button
          variant="outline"
          size="sm"
          onClick={onGenerateAttendance}
          disabled={!sectionId || !month || !year}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Generate
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onExportAttendance}
          disabled={!sectionId}
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
