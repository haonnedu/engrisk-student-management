"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClassDialog } from "@/components/classes/ClassDialog";

export function ClassesToolbar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-semibold">Classes</h1>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search classes..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full sm:w-52"
        />
        <ClassDialog />
      </div>
    </div>
  );
}
