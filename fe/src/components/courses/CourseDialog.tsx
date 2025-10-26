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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateCourse,
  useUpdateCourse,
  type Course,
} from "@/hooks/useCourses";
import * as React from "react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const courseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  courseCode: z.string().min(1, "Course code is required"),
  description: z.string().optional(),
  credits: z.number().min(1, "Credits must be at least 1"),
  duration: z.number().min(1, "Duration must be at least 1 week"),
  maxStudents: z.number().min(1, "Max students must be at least 1"),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
});

type CourseFormValues = z.infer<typeof courseSchema>;

type CourseDialogProps = {
  mode?: "create" | "edit";
  course?: Course;
  trigger?: React.ReactNode;
  onSaved?: () => void;
};

export function CourseDialog({
  mode = "create",
  course,
  trigger,
  onSaved,
}: CourseDialogProps) {
  const [open, setOpen] = useState(false);

  const defaultValues: Partial<CourseFormValues> =
    mode === "edit" && course
      ? {
          title: course.title,
          courseCode: course.courseCode,
          description: course.description || "",
          credits: course.credits,
          duration: course.duration,
          maxStudents: course.maxStudents,
          status: course.status,
        }
      : {
          title: "",
          courseCode: "",
          description: "",
          credits: 1,
          duration: 8,
          maxStudents: 20,
          status: "ACTIVE",
        };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: defaultValues as CourseFormValues,
  });

  const createCourseMutation = useCreateCourse();
  const updateCourseMutation = useUpdateCourse();

  // Reset form with selected course when opening edit dialog
  useEffect(() => {
    if (open && mode === "edit" && course) {
      reset(defaultValues as CourseFormValues);
    }
  }, [open, mode, course, reset]);

  function onSubmit(values: CourseFormValues) {
    if (mode === "edit" && course) {
      updateCourseMutation.mutate(
        { id: course.id, data: values },
        {
          onSuccess: () => {
            toast.success("Course updated successfully!");
            setOpen(false);
            onSaved?.();
          },
          onError: (error: any) => {
            toast.error(
              error.response?.data?.message || "Failed to update course"
            );
          },
        }
      );
      return;
    }

    createCourseMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Course created successfully!");
        reset();
        setOpen(false);
        onSaved?.();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to create course");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Add Course</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit course" : "Add new course"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the course information below."
              : "Add a new English course to the system."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                placeholder="e.g., English for Beginners"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="courseCode">Course Code</Label>
              <Input
                id="courseCode"
                placeholder="e.g., ENG101"
                {...register("courseCode")}
              />
              {errors.courseCode && (
                <p className="text-sm text-red-500">
                  {errors.courseCode.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Course description..."
              {...register("description")}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                min="1"
                {...register("credits", { valueAsNumber: true })}
              />
              {errors.credits && (
                <p className="text-sm text-red-500">{errors.credits.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="duration">Duration (weeks)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                {...register("duration", { valueAsNumber: true })}
              />
              {errors.duration && (
                <p className="text-sm text-red-500">
                  {errors.duration.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="maxStudents">Max Students</Label>
              <Input
                id="maxStudents"
                type="number"
                min="1"
                {...register("maxStudents", { valueAsNumber: true })}
              />
              {errors.maxStudents && (
                <p className="text-sm text-red-500">
                  {errors.maxStudents.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="status">Status</Label>
            <Select
              value={watch("status") || "ACTIVE"}
              onValueChange={(value) => setValue("status", value as any)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
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
                createCourseMutation.isPending || updateCourseMutation.isPending
              }
            >
              {createCourseMutation.isPending || updateCourseMutation.isPending
                ? "Saving..."
                : mode === "edit"
                ? "Update"
                : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
