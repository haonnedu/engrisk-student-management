"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateStudent,
  useUpdateStudent,
  type Student,
} from "@/hooks/useStudents";
import * as React from "react";
import type { CreateStudentDto } from "@/types";
import { useState } from "react";
import { toast } from "sonner";

const studentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  engName: z.string().min(1, "English name is required"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .transform((str) => {
      // Convert date string to ISO-8601 format
      const date = new Date(str);
      return date.toISOString();
    }),
  phone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  classSchool: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "SUSPENDED"]).optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

type StudentDialogProps = {
  mode?: "create" | "edit";
  student?: Student;
  trigger?: React.ReactNode;
  onSaved?: () => void;
};

export function StudentDialog({
  mode = "create",
  student,
  trigger,
  onSaved,
}: StudentDialogProps) {
  const [open, setOpen] = useState(false);

  const toInputDate = (isoOrDate: string) => {
    const d = new Date(isoOrDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const defaultValues: Partial<StudentFormValues> =
    mode === "edit" && student
      ? {
          firstName: student.firstName,
          lastName: student.lastName,
          engName: (student as any).engName,
          dateOfBirth: toInputDate(student.dateOfBirth),
          phone: student.phone ?? "",
          address: student.address ?? "",
          emergencyContact: student.emergencyContact ?? "",
          classSchool: (student as any).classSchool ?? "",
          status: student.status ?? "ACTIVE",
        }
      : { status: "ACTIVE", engName: "" };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: defaultValues as StudentFormValues,
  });

  const createStudentMutation = useCreateStudent();
  const updateStudentMutation = useUpdateStudent();

  // Reset form with selected student when opening edit dialog
  React.useEffect(() => {
    if (open && mode === "edit" && student) {
      reset(defaultValues as StudentFormValues);
    }
  }, [open, mode, student, reset]);

  function onSubmit(values: StudentFormValues) {
    if (mode === "edit" && student) {
      updateStudentMutation.mutate(
        { id: student.id, data: values as Partial<CreateStudentDto> },
        {
          onSuccess: () => {
            toast.success("Student updated successfully!");
            setOpen(false);
            onSaved?.();
          },
          onError: (error: any) => {
            toast.error(
              error.response?.data?.message || "Failed to update student"
            );
          },
        }
      );
      return;
    }

    createStudentMutation.mutate(values as CreateStudentDto, {
      onSuccess: () => {
        toast.success("Student created successfully!");
        reset();
        setOpen(false);
        onSaved?.();
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to create student"
        );
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Add new</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit student" : "Add new student"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the student information below."
              : "Fill the student information below."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && (
                <p className="text-sm text-red-500">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && (
                <p className="text-sm text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="engName">English name</Label>
            <Input
              id="engName"
              {...register("engName")}
              placeholder="John Doe"
            />
            {errors.engName && (
              <p className="text-sm text-red-500">{errors.engName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <DatePicker
                value={
                  watch("dateOfBirth")
                    ? new Date(watch("dateOfBirth"))
                    : undefined
                }
                onChange={(date) => {
                  if (date) {
                    setValue("dateOfBirth", date.toISOString().split("T")[0]);
                  }
                }}
                placeholder="Select date of birth"
                className="h-9"
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-red-500">
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="classSchool">Class - School</Label>
            <Input
              id="classSchool"
              {...register("classSchool")}
              placeholder="e.g., 12A1 - THPT Nguyen Du"
            />
            {errors.classSchool && (
              <p className="text-sm text-red-500">
                {errors.classSchool.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="emergencyContact">Emergency contact</Label>
              <Input
                id="emergencyContact"
                {...register("emergencyContact")}
                placeholder="Name - Phone"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="h-9 rounded-md border px-3 text-sm"
                {...register("status")}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="GRADUATED">GRADUATED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={
                createStudentMutation.isPending ||
                updateStudentMutation.isPending
              }
            >
              {createStudentMutation.isPending ||
              updateStudentMutation.isPending
                ? "Saving..."
                : mode === "edit"
                ? "Update"
                : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
