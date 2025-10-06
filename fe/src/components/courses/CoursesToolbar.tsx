"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CourseDialog } from "@/components/courses/CourseDialog";
import { Plus } from "lucide-react";

export function CoursesToolbar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-semibold">English Courses</h1>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search courses..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-56"
        />
        <CourseDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          }
        />
      </div>
    </div>
  );
}
