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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateGrade, useUpdateGrade, type Grade } from "@/hooks/useGrades";
import { useStudents } from "@/hooks/useStudents";
import { useCourses, type Course } from "@/hooks/useCourses";
import * as React from "react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const gradeSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  courseId: z.string().min(1, "Course is required"),
  grade: z
    .number()
    .min(0, "Grade must be non-negative")
    .max(100, "Grade must not be greater than 100"),
  gradeType: z.enum([
    "ASSIGNMENT",
    "QUIZ",
    "EXAM",
    "FINAL",
    "HW",
    "SP",
    "PP",
    "TEST_1L",
    "TEST_1RW",
    "TEST_2L",
    "TEST_2RW",
    "TEST_3L",
    "TEST_3RW",
  ]),
  comments: z.string().optional(),
});

type GradeFormValues = z.infer<typeof gradeSchema>;

type GradeDialogProps = {
  mode?: "create" | "edit";
  grade?: Grade;
  trigger?: React.ReactNode;
  onSaved?: () => void;
};

export function GradeDialog({
  mode = "create",
  grade,
  trigger,
  onSaved,
}: GradeDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  const defaultValues: Partial<GradeFormValues> =
    mode === "edit" && grade
      ? {
          studentId: grade.studentId,
          courseId: grade.courseId,
          grade: grade.grade,
          gradeType: grade.gradeType,
          comments: grade.comments || "",
        }
      : {
          grade: 0,
          gradeType: "HW",
        };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GradeFormValues>({
    resolver: zodResolver(gradeSchema),
    defaultValues: defaultValues as GradeFormValues,
  });

  const createGradeMutation = useCreateGrade();
  const updateGradeMutation = useUpdateGrade();
  const { data: studentsData } = useStudents(1, 100);
  const { data: coursesData } = useCourses(1, 100);

  // Reset form with selected grade when opening edit dialog
  useEffect(() => {
    if (open && mode === "edit" && grade) {
      reset(defaultValues as GradeFormValues);
      setSelectedCourse(grade.courseId);
    }
  }, [open, mode, grade, reset]);

  function onSubmit(values: GradeFormValues) {
    const submitData = {
      ...values,
    };

    if (mode === "edit" && grade) {
      updateGradeMutation.mutate(
        { id: grade.id, data: submitData as Partial<Grade> },
        {
          onSuccess: () => {
            toast.success("Grade updated successfully!");
            setOpen(false);
            onSaved?.();
          },
          onError: (error: any) => {
            toast.error(
              error.response?.data?.message || "Failed to update grade"
            );
          },
        }
      );
      return;
    }

    createGradeMutation.mutate(submitData, {
      onSuccess: () => {
        toast.success("Grade created successfully!");
        reset();
        setOpen(false);
        onSaved?.();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to create grade");
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
            {mode === "edit" ? "Edit grade" : "Add new grade"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the grade information below."
              : "Fill the grade information below."}
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
                <SelectTrigger className="w-full truncate">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {studentsData?.data?.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} (
                      {student.studentId})
                    </SelectItem>
                  ))}
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
                onValueChange={(value) => setValue("courseId", value)}
              >
                <SelectTrigger className="w-full truncate">
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="gradeType">Type</Label>
              <Select
                value={watch("gradeType") || "HW"}
                onValueChange={(value) => setValue("gradeType", value as any)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HW">Homework</SelectItem>
                  <SelectItem value="SP">Speaking</SelectItem>
                  <SelectItem value="PP">Participation/Project</SelectItem>
                  <SelectItem value="TEST_1L">Test 1 Listening</SelectItem>
                  <SelectItem value="TEST_1RW">
                    Test 1 Reading/Writing
                  </SelectItem>
                  <SelectItem value="TEST_2L">Test 2 Listening</SelectItem>
                  <SelectItem value="TEST_2RW">
                    Test 2 Reading/Writing
                  </SelectItem>
                  <SelectItem value="TEST_3L">Test 3 Listening</SelectItem>
                  <SelectItem value="TEST_3RW">
                    Test 3 Reading/Writing
                  </SelectItem>
                  <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                  <SelectItem value="QUIZ">Quiz</SelectItem>
                  <SelectItem value="EXAM">Exam</SelectItem>
                  <SelectItem value="FINAL">Final</SelectItem>
                </SelectContent>
              </Select>
              {errors.gradeType && (
                <p className="text-sm text-red-500">
                  {errors.gradeType.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="grade">Grade (0-100)</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max="100"
                {...register("grade", { valueAsNumber: true })}
              />
              {errors.grade && (
                <p className="text-sm text-red-500">{errors.grade.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="comments">Comments</Label>
            <Input
              id="comments"
              {...register("comments")}
              placeholder="Grade comments (optional)"
            />
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
                createGradeMutation.isPending || updateGradeMutation.isPending
              }
            >
              {createGradeMutation.isPending || updateGradeMutation.isPending
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
