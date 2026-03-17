"use client";
import * as React from "react";
import { useMemo, useState, useCallback } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
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
import { AlertDialogConfirm } from "@/components/ui/alert-dialog-confirm";

// Debounce search để tránh gọi API mỗi lần gõ
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function StudentsPage() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 1000);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: studentsData, isLoading, error } = useStudents(page, limit, undefined, debouncedSearch);
  const deleteStudentMutation = useDeleteStudent();

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);
  
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; studentId: string }>({
    open: false,
    studentId: "",
  });

  const handleDeleteClick = (id: string) => {
    setDeleteDialog({ open: true, studentId: id });
  };

  const handleDeleteConfirm = () => {
    deleteStudentMutation.mutate(deleteDialog.studentId, {
      onSuccess: () => {
        toast.success("Student deleted successfully!");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to delete student"
        );
      },
    });
  };

  const columns = useMemo<ColumnDef<Student>[]>(
    () => buildStudentColumns(handleDeleteClick),
    [handleDeleteClick]
  );

  const table = useReactTable({
    data: studentsData?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
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
    <div className="space-y-4 w-full min-w-0">
      <StudentsToolbar value={searchInput} onChange={setSearchInput} />

      <div className="rounded-md border overflow-hidden w-full max-w-full min-w-0">
        <div className="overflow-x-scroll overflow-y-auto max-h-[calc(100vh-16rem)] w-full max-w-full min-w-0">
          <StudentsTable table={table as any} columns={columns} />
        </div>
      </div>

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

      {/* Delete Confirmation Dialog */}
      <AlertDialogConfirm
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={handleDeleteConfirm}
        title="Delete Student"
        description="Are you sure you want to delete this student? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
