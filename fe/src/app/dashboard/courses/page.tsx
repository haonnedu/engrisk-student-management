"use client";
import * as React from "react";
import { useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { CoursesTable } from "@/components/courses/CoursesTable";
import { CoursesToolbar } from "@/components/courses/CoursesToolbar";
import { buildCourseColumns } from "@/components/courses/columns";
import { useCourses, useDeleteCourse, type Course } from "@/hooks/useCourses";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function CoursesPage() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const {
    data: coursesData,
    isLoading,
    error,
  } = useCourses(page, limit, globalFilter);
  const deleteCourseMutation = useDeleteCourse();

  const handleDelete = (id: string) => {
    deleteCourseMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Course deleted successfully!");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to delete course");
      },
    });
  };

  const columns = useMemo<ColumnDef<Course>[]>(
    () => buildCourseColumns(handleDelete),
    [handleDelete]
  );

  const table = useReactTable({
    data: coursesData?.data || [],
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

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
        Error loading courses
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CoursesToolbar value={globalFilter ?? ""} onChange={setGlobalFilter} />

      <CoursesTable table={table as any} columns={columns} />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {page} of {Math.ceil((coursesData?.meta?.total || 0) / limit)}{" "}
          pages
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={
              page >= Math.ceil((coursesData?.meta?.total || 0) / limit)
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
