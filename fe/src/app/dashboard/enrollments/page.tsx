"use client";
import * as React from "react";
import { useMemo, useState, useCallback, useEffect } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { EnrollmentsTable } from "@/components/enrollments/EnrollmentsTable";
import { EnrollmentsToolbar } from "@/components/enrollments/EnrollmentsToolbar";
import { buildEnrollmentColumns } from "@/components/enrollments/columns";
import {
  useEnrollments,
  useDeleteEnrollment,
  type Enrollment,
} from "@/hooks/useEnrollments";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function EnrollmentsPage() {
  // Local state for input (updates immediately)
  const [searchInput, setSearchInput] = useState("");
  // Debounced state for query (updates after user stops typing)
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sectionId, setSectionId] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset to page 1 when search changes
    }, 1000); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFilterChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handleSectionChange = useCallback((value: string) => {
    setSectionId(value);
    setPage(1); // Reset to page 1 when section changes
  }, []);

  const {
    data: enrollmentsData,
    isLoading,
    error,
  } = useEnrollments(
    page,
    limit,
    debouncedSearch, // Use debounced value for query
    sectionId === "all" ? undefined : sectionId
  );
  const deleteEnrollmentMutation = useDeleteEnrollment();

  const handleDeleteCallback = useCallback(
    (id: string) => {
      deleteEnrollmentMutation.mutate(id, {
        onSuccess: () => {
          toast.success("Enrollment deleted successfully!");
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to delete enrollment"
          );
        },
      });
    },
    [deleteEnrollmentMutation]
  );

  const columns = useMemo<ColumnDef<Enrollment>[]>(
    () => buildEnrollmentColumns(handleDeleteCallback),
    [handleDeleteCallback]
  );

  const table = useReactTable({
    data: enrollmentsData?.data || [],
    columns,
    state: { globalFilter: debouncedSearch },
    onGlobalFilterChange: setDebouncedSearch,
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
        Error loading enrollments
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EnrollmentsToolbar
        value={searchInput}
        onChange={handleFilterChange}
        sectionId={sectionId}
        onSectionChange={handleSectionChange}
      />

      <EnrollmentsTable table={table as any} columns={columns} />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {page} of{" "}
          {Math.ceil((enrollmentsData?.meta?.total || 0) / limit)} pages
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
              page >= Math.ceil((enrollmentsData?.meta?.total || 0) / limit)
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
