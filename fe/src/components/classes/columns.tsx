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
import { ClassDialog } from "@/components/classes/ClassDialog";
import { ClassGradeDialog } from "@/components/classes/ClassGradeDialog";
import { ClassAttendanceDialog } from "@/components/classes/ClassAttendanceDialog";
import { SectionGradeTypesDialog } from "@/components/grades/SectionGradeTypesDialog";
import { Edit, MoreHorizontal, Trash2, Users, BookOpen, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import type { ClassSection } from "@/hooks/useClasses";

export function buildClassColumns(
  handleDelete: (id: string) => void,
  router?: any
): ColumnDef<ClassSection>[] {
  return [
    {
      header: "Class Code",
      accessorKey: "code",
      cell: (info) => (
        <span className="font-mono text-sm">{info.getValue() as string}</span>
      ),
    },
    {
      header: "Class Name",
      accessorKey: "name",
      cell: (info) => (
        <div>
          <div className="font-medium">{info.getValue() as string}</div>
          <div className="text-sm text-muted-foreground">
            {info.row.original.course?.title || "No course assigned"}
          </div>
        </div>
      ),
    },
    {
      header: "Schedule",
      accessorKey: "timeDescription",
      cell: (info) => (
        <span className="text-sm">{(info.getValue() as string) || "-"}</span>
      ),
    },
    {
      header: "Days",
      accessorFn: (row) => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const day1 =
          row.day1 !== null && row.day1 !== undefined ? days[row.day1] : "";
        const day2 =
          row.day2 !== null && row.day2 !== undefined ? days[row.day2] : "";
        return [day1, day2].filter(Boolean).join(" & ");
      },
      id: "days",
      cell: (info) => (
        <span className="text-sm">{(info.getValue() as string) || "-"}</span>
      ),
    },
    {
      header: "Teacher",
      accessorKey: "teacherName",
      cell: (info) => (
        <span className="text-sm">{(info.getValue() as string) || "-"}</span>
      ),
    },
    {
      header: "Book",
      accessorKey: "book",
      cell: (info) => (
        <span className="text-sm">{(info.getValue() as string) || "-"}</span>
      ),
    },
    {
      header: "Students",
      accessorFn: (row) => row.enrollments?.length || 0,
      id: "studentCount",
      cell: (info) => (
        <Badge variant="secondary">
          <Users className="mr-1 h-3 w-3" />
          {info.getValue() as number}
        </Badge>
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
                <ClassDialog
                  mode="edit"
                  classSection={row.original}
                  trigger={
                    <button className="flex w-full items-center">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </button>
                  }
                />
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router?.push(`/dashboard/classes/${row.original.id}/grades`)}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Grades
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router?.push(`/dashboard/classes/${row.original.id}/attendance`)
              }
            >
              <Users className="mr-2 h-4 w-4" />
              Attendance
            </DropdownMenuItem>
            <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
              <div>
                <SectionGradeTypesDialog
                  sectionId={row.original.id}
                  sectionName={row.original.name}
                  trigger={
                    <button className="flex w-full items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Grade Types
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
                  <AlertDialogTitle>Delete class?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the class.
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
