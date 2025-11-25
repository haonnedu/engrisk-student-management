"use client";
import { useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EnrollmentDialog } from "@/components/enrollments/EnrollmentDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClasses } from "@/hooks/useClasses";

export function EnrollmentsToolbar({
  value,
  onChange,
  sectionId,
  onSectionChange,
}: {
  value: string;
  onChange: (v: string) => void;
  sectionId?: string;
  onSectionChange: (v: string) => void;
}) {
  const { data: classesData } = useClasses(1, 100);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const classesList = useMemo(
    () => classesData?.data || [],
    [classesData?.data]
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-semibold">Enrollments</h1>
      <div className="flex items-center gap-2">
        <Select value={sectionId || "all"} onValueChange={onSectionChange}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classesList.map((classItem) => (
              <SelectItem key={classItem.id} value={classItem.id}>
                {classItem.name} ({classItem.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          key="enrollment-search-input"
          placeholder="Search enrollments..."
          value={value}
          onChange={handleInputChange}
          className="w-56"
        />
        <EnrollmentDialog />
      </div>
    </div>
  );
}
