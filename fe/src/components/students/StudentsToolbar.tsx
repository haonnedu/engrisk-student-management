"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StudentDialog } from "@/components/students/StudentDialog";

export function StudentsToolbar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-semibold">Students</h1>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search students..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-56"
        />
        <StudentDialog />
      </div>
    </div>
  );
}
