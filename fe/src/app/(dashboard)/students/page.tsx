"use client";
import * as React from "react";
import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StudentsTable } from "@/components/students/StudentsTable";
import { StudentsToolbar } from "@/components/students/StudentsToolbar";
import { buildStudentColumns } from "@/components/students/columns";
import {
  useStudents,
  useDeleteStudent,
  type Student,
} from "@/hooks/useStudents";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export default function StudentsPage() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: studentsData, isLoading, error } = useStudents(page, limit);
  const deleteStudentMutation = useDeleteStudent();

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      deleteStudentMutation.mutate(id, {
        onSuccess: () => {
          toast.success("Student deleted successfully!");
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to delete student"
          );
        },
      });
    }
  };

  const columns = useMemo<ColumnDef<Student>[]>(
    () => buildStudentColumns(handleDelete),
    [handleDelete]
  );

  const table = useReactTable({
    data: studentsData?.data || [],
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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
      <div className="flex items-center justify-center h-64 text-red-500">
        Error loading students
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StudentsToolbar value={globalFilter ?? ""} onChange={setGlobalFilter} />

      <StudentsTable table={table as any} columns={columns} />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {studentsData?.meta.page || 1} of{" "}
          {studentsData?.meta.totalPages || 1} pages
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
            disabled={page >= (studentsData?.meta.totalPages || 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
