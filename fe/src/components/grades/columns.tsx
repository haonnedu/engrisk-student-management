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
import { GradeDialog } from "@/components/grades/GradeDialog";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Grade } from "@/hooks/useGrades";

export function buildGradeColumns(
  handleDelete: (id: string) => void
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
            ? "destructive"
            : type === "EXAM"
            ? "default"
            : type === "QUIZ"
            ? "secondary"
            : "outline";

        return <Badge variant={variant}>{type}</Badge>;
      },
    },
    {
      header: "Grade",
      accessorKey: "grade",
      cell: (info) => {
        const grade = info.getValue() as number;
        const color =
          grade >= 80
            ? "text-green-600"
            : grade >= 60
            ? "text-yellow-600"
            : "text-red-600";

        return (
          <div className="text-right">
            <div className={`font-medium ${color}`}>{grade}/100</div>
            <div className="text-sm text-muted-foreground">
              {grade >= 80
                ? "Excellent"
                : grade >= 60
                ? "Good"
                : "Needs Improvement"}
            </div>
          </div>
        );
      },
    },
    {
      header: "Comments",
      accessorKey: "comments",
      cell: (info) => (
        <span className="text-sm">{(info.getValue() as string) || "-"}</span>
      ),
    },
    {
      header: "Created At",
      accessorKey: "createdAt",
      cell: (info) => {
        const date = new Date(info.getValue() as string);
        return (
          <span className="text-sm">{date.toLocaleDateString("vi-VN")}</span>
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
                <GradeDialog
                  mode="edit"
                  grade={row.original}
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
