"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { EnrollmentDialog } from "@/components/enrollments/EnrollmentDialog";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Enrollment } from "@/hooks/useEnrollments";

export function buildEnrollmentColumns(
  handleDelete: (id: string) => void
): ColumnDef<Enrollment>[] {
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
      header: "Class",
      accessorFn: (row) => row.section?.name || "-",
      id: "className",
      cell: (info) => (
        <div>
          <div className="font-medium">{info.getValue() as string}</div>
          <div className="text-sm text-muted-foreground">
            {info.row.original.section?.code || "-"}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (info) => {
        const status = info.getValue() as string;
        const variant =
          status === "ENROLLED"
            ? "default"
            : status === "COMPLETED"
            ? "secondary"
            : status === "DROPPED"
            ? "destructive"
            : "outline";

        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      header: "Enrolled At",
      accessorKey: "enrolledAt",
      cell: (info) => {
        const date = new Date(info.getValue() as string);
        return (
          <span className="text-sm">{date.toLocaleDateString("vi-VN")}</span>
        );
      },
    },
    {
      header: "Completed At",
      accessorKey: "completedAt",
      cell: (info) => {
        const date = info.getValue() as string;
        return (
          <span className="text-sm">
            {date ? new Date(date).toLocaleDateString("vi-VN") : "-"}
          </span>
        );
      },
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
                <EnrollmentDialog
                  mode="edit"
                  enrollment={row.original}
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
                  <AlertDialogTitle>Delete enrollment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the enrollment.
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
