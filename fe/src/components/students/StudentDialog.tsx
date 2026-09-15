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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClasses, type ClassSection } from "@/hooks/useClasses";
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
  birthYear: z
    .string()
    .min(1, "Birth year is required")
    .regex(/^\d{4}$/, "Enter a 4-digit year")
    .refine(
      (y) => {
        const n = Number(y);
        return n >= 1900 && n <= new Date().getFullYear();
      },
      { message: "Invalid birth year" }
    ),
  phone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  classSchool: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "SUSPENDED"]).optional(),
  // Create mode only: enroll the new student into this class right away
  sectionId: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

type StudentDialogProps = {
  mode?: "create" | "edit";
  student?: Student;
  trigger?: React.ReactNode;
  onSaved?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function StudentDialog({
  mode = "create",
  student,
  trigger,
  onSaved,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: StudentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  // Existing records keep their full date; the form only exposes the year.
  const toYear = (isoOrDate: string) => {
    const d = new Date(isoOrDate);
    return Number.isNaN(d.getTime()) ? "" : String(d.getUTCFullYear());
  };

  // Build the dateOfBirth payload from the entered year.
  // In edit mode, keep the original date untouched if the year did not change.
  const toDateOfBirth = (year: string) => {
    if (mode === "edit" && student?.dateOfBirth && toYear(student.dateOfBirth) === year) {
      return student.dateOfBirth;
    }
    return `${year}-01-01T00:00:00.000Z`;
  };

  const defaultValues: Partial<StudentFormValues> =
    mode === "edit" && student
      ? {
          firstName: student.firstName,
          lastName: student.lastName,
          engName: (student as any).engName,
          birthYear: toYear(student.dateOfBirth),
          phone: student.phone ?? "",
          address: student.address ?? "",
          emergencyContact: student.emergencyContact ?? "",
          classSchool: (student as any).classSchool ?? "",
          status: student.status ?? "ACTIVE",
        }
      : { status: "ACTIVE", engName: "", sectionId: "" };

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

  // Classes are only selectable when creating a student
  const { data: classesData } = useClasses(1, 200);
  const classes: ClassSection[] = React.useMemo(() => {
    const list = classesData?.data ?? classesData ?? [];
    return Array.isArray(list) ? list : [];
  }, [classesData]);
  const selectedSectionId = watch("sectionId");

  // Reset form with selected student when opening edit dialog
  React.useEffect(() => {
    if (open && mode === "edit" && student) {
      reset(defaultValues as StudentFormValues);
    }
  }, [open, mode, student, reset]);

  function onSubmit(formValues: StudentFormValues) {
    const { birthYear, sectionId, ...rest } = formValues;
    const values = { ...rest, dateOfBirth: toDateOfBirth(birthYear) };

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

    const payload: CreateStudentDto = {
      ...(values as CreateStudentDto),
      ...(sectionId ? { sectionId } : {}),
    };

    createStudentMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(
          sectionId
            ? "Student created and added to class!"
            : "Student created successfully!"
        );
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

  const isControlled = controlledOpen !== undefined;
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ?? <Button variant="outline">Add new</Button>}
        </DialogTrigger>
      )}
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
              <Label htmlFor="firstName">
                First name <span className="text-red-500">*</span>
              </Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && (
                <p className="text-sm text-red-500">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="lastName">
                Last name <span className="text-red-500">*</span>
              </Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && (
                <p className="text-sm text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="engName">
              English name <span className="text-red-500">*</span>
            </Label>
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
              <Label htmlFor="birthYear">
                Birth year <span className="text-red-500">*</span>
              </Label>
              <Input
                id="birthYear"
                type="number"
                inputMode="numeric"
                min={1900}
                max={new Date().getFullYear()}
                placeholder="e.g., 2015"
                {...register("birthYear")}
              />
              {errors.birthYear && (
                <p className="text-sm text-red-500">
                  {errors.birthYear.message}
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

          {mode === "create" && (
            <div className="grid gap-1.5">
              <Label htmlFor="sectionId">Enroll in class</Label>
              <Select
                value={selectedSectionId || ""}
                onValueChange={(value) =>
                  setValue("sectionId", value === "__none__" ? "" : value)
                }
              >
                <SelectTrigger id="sectionId" className="w-full truncate">
                  <SelectValue placeholder="Optional - select a class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No class</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.code})
                      {c.course?.title ? ` - ${c.course.title}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The student will be enrolled in the class&apos;s course
                automatically.
              </p>
            </div>
          )}

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
