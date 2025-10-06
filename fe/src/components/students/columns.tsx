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
import { StudentDialog } from "@/components/students/StudentDialog";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Student } from "@/hooks/useStudents";

export function buildStudentColumns(
  handleDelete: (id: string) => void
): ColumnDef<Student>[] {
  return [
    {
      header: "Student ID",
      accessorKey: "studentId",
      cell: (info) => (
        <span className="font-mono text-sm">{info.getValue() as string}</span>
      ),
    },
    {
      header: "Name",
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      id: "name",
      cell: (info) => (
        <div>
          <div className="font-medium">{info.getValue() as string}</div>
          <div className="text-sm text-muted-foreground">
            {info.row.original.user?.email ||
              info.row.original.user?.phone ||
              "-"}
          </div>
        </div>
      ),
    },
    {
      header: "English Name",
      accessorKey: "engName",
      cell: (info) => (
        <span className="text-sm">{(info.getValue() as string) || "-"}</span>
      ),
    },
    {
      header: "Date of Birth",
      accessorKey: "dateOfBirth",
      cell: (info) => {
        const date = new Date(info.getValue() as string);
        return (
          <span className="text-sm">{date.toLocaleDateString("vi-VN")}</span>
        );
      },
    },
    {
      header: "Phone",
      accessorKey: "phone",
      cell: (info) => (
        <span className="text-sm">{(info.getValue() as string) || "-"}</span>
      ),
    },
    {
      header: "Address",
      accessorKey: "address",
      cell: (info) => (
        <span className="text-sm">{(info.getValue() as string) || "-"}</span>
      ),
    },
    {
      header: "Emergency Contact",
      accessorKey: "emergencyContact",
      cell: (info) => (
        <span className="text-sm">{(info.getValue() as string) || "-"}</span>
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
            : status === "GRADUATED"
            ? "outline"
            : "destructive";

        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      header: "Enrollment Date",
      accessorKey: "enrollmentDate",
      cell: (info) => {
        const date = new Date(info.getValue() as string);
        return (
          <span className="text-sm">{date.toLocaleDateString("vi-VN")}</span>
        );
      },
    },
    {
      header: "Created At",
      accessorKey: "createdAt",
      cell: (info) => {
        const date = new Date(info.getValue() as string);
        return <span className="text-sm">{date.toLocaleString("vi-VN")}</span>;
      },
    },
    {
      header: "Updated At",
      accessorKey: "updatedAt",
      cell: (info) => {
        const date = new Date(info.getValue() as string);
        return <span className="text-sm">{date.toLocaleString("vi-VN")}</span>;
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
                <StudentDialog
                  mode="edit"
                  student={row.original}
                  trigger={
                    <button className="flex w-full items-center">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </button>
                  }
                  onSaved={undefined}
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
                  <AlertDialogTitle>Delete student?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the student.
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
