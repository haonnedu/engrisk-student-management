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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateEnrollment,
  useUpdateEnrollment,
  type Enrollment,
} from "@/hooks/useEnrollments";
import { useClasses } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import { useCourses, type Course } from "@/hooks/useCourses";
import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

const enrollmentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  courseId: z.string().min(1, "Course is required"),
  sectionId: z.string().optional(),
  status: z.enum(["ENROLLED", "COMPLETED", "DROPPED", "FAILED"]).optional(),
});

type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;

type EnrollmentDialogProps = {
  mode?: "create" | "edit";
  enrollment?: Enrollment;
  trigger?: React.ReactNode;
  onSaved?: () => void;
};

export function EnrollmentDialog({
  mode = "create",
  enrollment,
  trigger,
  onSaved,
}: EnrollmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [studentFilter, setStudentFilter] = useState("");

  const defaultValues: Partial<EnrollmentFormValues> =
    mode === "edit" && enrollment
      ? {
          studentId: enrollment.studentId,
          courseId: enrollment.courseId,
          sectionId: enrollment.sectionId || "none",
          status: enrollment.status,
        }
      : {
          status: "ENROLLED",
          sectionId: "none",
        };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: defaultValues as EnrollmentFormValues,
  });

  const createEnrollmentMutation = useCreateEnrollment();
  const updateEnrollmentMutation = useUpdateEnrollment();
  const { data: classesData } = useClasses(1, 100);
  const { data: studentsData } = useStudents(1, 100);
  const { data: coursesData } = useCourses(1, 100);

  const watchedCourseId = watch("courseId");

  // Reset form with selected enrollment when opening edit dialog
  useEffect(() => {
    if (open && mode === "edit" && enrollment) {
      reset(defaultValues as EnrollmentFormValues);
    }
  }, [open, mode, enrollment, reset]);

  // Filter sections based on selected course
  const filteredSections =
    classesData?.data?.filter(
      (section: any) => section.courseId === watchedCourseId
    ) || [];

  // Filter students based on search input
  const filteredStudents = useMemo(() => {
    if (!studentsData?.data) return [];
    if (!studentFilter.trim()) return studentsData.data;
    
    const filterLower = studentFilter.toLowerCase();
    return studentsData.data.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const studentId = student.studentId?.toLowerCase() || "";
      return fullName.includes(filterLower) || studentId.includes(filterLower);
    });
  }, [studentsData?.data, studentFilter]);

  function onSubmit(values: EnrollmentFormValues) {
    // Convert "none" to undefined for API
    const submitData = {
      ...values,
      sectionId: values.sectionId === "none" ? undefined : values.sectionId,
    };

    if (mode === "edit" && enrollment) {
      updateEnrollmentMutation.mutate(
        { id: enrollment.id, data: submitData as Partial<Enrollment> },
        {
          onSuccess: () => {
            toast.success("Enrollment updated successfully!");
            setOpen(false);
            onSaved?.();
          },
          onError: (error: any) => {
            toast.error(
              error.response?.data?.message || "Failed to update enrollment"
            );
          },
        }
      );
      return;
    }

    createEnrollmentMutation.mutate(submitData, {
      onSuccess: () => {
        toast.success("Enrollment created successfully!");
        reset();
        setOpen(false);
        onSaved?.();
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to create enrollment"
        );
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Enroll Student</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit enrollment" : "Enroll student"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the enrollment information below."
              : "Enroll a student in a course or class."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="studentId">Student</Label>
              <Select
                value={watch("studentId") || ""}
                onValueChange={(value) => setValue("studentId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <div className="p-2">
                    <Input
                      placeholder="Search students..."
                      value={studentFilter}
                      onChange={(e) => setStudentFilter(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-8"
                    />
                  </div>
                  {filteredStudents.length === 0 ? (
                    <SelectItem value="no-results" disabled>
                      No students found
                    </SelectItem>
                  ) : (
                    filteredStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} (
                        {student.studentId})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.studentId && (
                <p className="text-sm text-red-500">
                  {errors.studentId.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="courseId">Course</Label>
              <Select
                value={watch("courseId") || ""}
                onValueChange={(value) => {
                  setValue("courseId", value);
                  setValue("sectionId", "none"); // Reset section when course changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {coursesData?.data?.map((course: Course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title} ({course.courseCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.courseId && (
                <p className="text-sm text-red-500">
                  {errors.courseId.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="sectionId">Class (Optional)</Label>
            <Select
              value={watch("sectionId") || "none"}
              onValueChange={(value) => setValue("sectionId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No class</SelectItem>
                {filteredSections.map((section: any) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name} ({section.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="status">Status</Label>
            <Select
              value={watch("status") || "ENROLLED"}
              onValueChange={(value) => setValue("status", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENROLLED">Enrolled</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="DROPPED">Dropped</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status.message}</p>
            )}
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
                createEnrollmentMutation.isPending ||
                updateEnrollmentMutation.isPending
              }
            >
              {createEnrollmentMutation.isPending ||
              updateEnrollmentMutation.isPending
                ? "Saving..."
                : mode === "edit"
                ? "Update"
                : "Enroll"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
