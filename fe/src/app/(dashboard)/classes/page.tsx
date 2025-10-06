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
import { ClassesTable } from "@/components/classes/ClassesTable";
import { ClassesToolbar } from "@/components/classes/ClassesToolbar";
import { buildClassColumns } from "@/components/classes/columns";
import {
  useClasses,
  useDeleteClass,
  type ClassSection,
} from "@/hooks/useClasses";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ClassesPage() {
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const {
    data: classesData,
    isLoading,
    error,
    refetch,
  } = useClasses(page, limit, globalFilter);
  const deleteClassMutation = useDeleteClass();

  const handleDelete = (id: string) => {
    deleteClassMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Class deleted successfully!");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to delete class");
      },
    });
  };

  const columns = useMemo<ColumnDef<ClassSection>[]>(
    () => buildClassColumns(handleDelete, router),
    [handleDelete, router]
  );

  const table = useReactTable({
    data: classesData?.data || [],
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
      <div className="flex h-64 items-center justify-center text-red-500">
        Error loading classes
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ClassesToolbar value={globalFilter ?? ""} onChange={setGlobalFilter} />
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <ClassesTable table={table as any} columns={columns} />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {classesData?.meta.page || 1} of{" "}
          {classesData?.meta.totalPages || 1} pages
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
            disabled={page >= (classesData?.meta.totalPages || 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
