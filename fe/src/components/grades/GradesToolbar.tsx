"use client";
import { Input } from "@/components/ui/input";
import { GradeDialog } from "@/components/grades/GradeDialog";

export function GradesToolbar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-semibold">Grades</h1>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search grades..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-56"
        />
        <GradeDialog />
      </div>
    </div>
  );
}
