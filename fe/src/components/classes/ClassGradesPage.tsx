"use client";
import * as React from "react";
import { useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { flexRender } from "@tanstack/react-table";
import { ClassGradeDialog } from "@/components/classes/ClassGradeDialog";
import { useGrades, useDeleteGrade, type Grade } from "@/hooks/useGrades";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ClassGradesPageProps = {
  sectionId: string;
  className?: string;
};

function buildClassGradeColumns(
  handleDelete: (id: string) => void,
  sectionId: string
): ColumnDef<Grade>[] {
  return [
    {
      header: "Student",
      accessorFn: (row) =>
        `${row.student?.firstName || ""} ${row.student?.lastName || ""}`,
      id: "studentName",
      cell: (info) => (
        <div>
          <div className="font-medium">{info.getValue() as string}</div>
          <div className="text-sm text-muted-foreground">
            {info.row.original.student?.studentId || "-"}
          </div>
        </div>
      ),
    },
    {
      header: "Course",
      accessorFn: (row) => row.course?.title || "-",
      id: "courseName",
      cell: (info) => (
        <div>
          <div className="font-medium">{info.getValue() as string}</div>
          <div className="text-sm text-muted-foreground">
            {info.row.original.course?.courseCode || "-"}
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      accessorKey: "gradeType",
      cell: (info) => {
        const type = info.getValue() as string;
        const variant =
          type === "FINAL"
            ? "default"
            : type === "MIDTERM"
            ? "secondary"
            : "outline";

        return <Badge variant={variant}>{type}</Badge>;
      },
    },
    {
      header: "Score",
      accessorKey: "grade",
      cell: (info) => {
        const grade = info.getValue() as number;
        const color =
          grade >= 80
            ? "text-green-600"
            : grade >= 60
            ? "text-yellow-600"
            : "text-red-600";

        return <div className={`font-medium ${color}`}>{grade}</div>;
      },
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: (info) => (
        <span className="text-sm">{(info.getValue() as string) || "-"}</span>
      ),
    },
    {
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
              <div>
                <ClassGradeDialog
                  mode="edit"
                  grade={row.original}
                  sectionId={sectionId}
                  trigger={
                    <button className="flex w-full items-center">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </button>
                  }
                />
              </div>
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-red-600"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete grade?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the grade.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => handleDelete(row.original.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

export function ClassGradesPage({
  sectionId,
  className,
}: ClassGradesPageProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const {
    data: gradesData,
    isLoading,
    error,
  } = useGrades(page, limit, globalFilter);
  const deleteGradeMutation = useDeleteGrade();

  const handleDelete = (id: string) => {
    deleteGradeMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Grade deleted successfully!");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to delete grade");
      },
    });
  };

  const columns = useMemo<ColumnDef<Grade>[]>(
    () => buildClassGradeColumns(handleDelete, sectionId),
    [handleDelete, sectionId]
  );

  const table = useReactTable({
    data: gradesData?.data || [],
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
        Error loading grades
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Class Grades</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search grades..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-56"
          />
          <ClassGradeDialog
            sectionId={sectionId}
            trigger={<Button>Add Grade</Button>}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No grades found for this class.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {page} of {Math.ceil((gradesData?.meta?.total || 0) / limit)}{" "}
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
            disabled={page >= Math.ceil((gradesData?.meta?.total || 0) / limit)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
