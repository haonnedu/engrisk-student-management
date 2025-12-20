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
import { CourseDialog } from "@/components/courses/CourseDialog";
import { Edit, MoreHorizontal, Trash2, BookOpen } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Course } from "@/hooks/useCourses";

export function buildCourseColumns(
  handleDelete: (id: string) => void
): ColumnDef<Course>[] {
  return [
    {
      header: "Course",
      accessorFn: (row) => row.title,
      id: "title",
      cell: (info) => (
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{info.getValue() as string}</div>
            <div className="text-sm text-muted-foreground">
              {info.row.original.courseCode}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Description",
      accessorKey: "description",
      cell: (info) => {
        const description = info.getValue() as string;
        return (
          <div className="max-w-[300px] truncate text-sm text-muted-foreground">
            {description || "No description"}
          </div>
        );
      },
    },
    {
      header: "Details",
      accessorFn: (row) =>
        `${row.credits} credits • ${row.duration} weeks • Max ${row.maxStudents}`,
      id: "details",
      cell: (info) => (
        <div className="space-y-1">
          <Badge variant="secondary">{info.row.original.credits} credits</Badge>
          <div className="text-xs text-muted-foreground">
            {info.row.original.duration} weeks • Max{" "}
            {info.row.original.maxStudents}
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
          status === "ACTIVE"
            ? "default"
            : status === "INACTIVE"
            ? "secondary"
            : "outline";

        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      header: "Created",
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
            <button 
              type="button"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
              <div>
                <CourseDialog
                  mode="edit"
                  course={row.original}
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
                  <AlertDialogTitle>Delete course?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the course and all associated data.
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
