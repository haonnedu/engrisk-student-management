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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateClass,
  useUpdateClass,
  type ClassSection,
} from "@/hooks/useClasses";
import { useCourses, type Course } from "@/hooks/useCourses";
import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";

const CLASS_COLOR_PRESETS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#8b5cf6", "#ec4899", "#64748b", "#0ea5e9",
];

const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  code: z.string().min(1, "Class code is required"),
  color: z.string().optional(),
  timeDescription: z.string().optional(),
  day1: z.number().min(0).max(6).optional(),
  day2: z.number().min(0).max(6).optional(),
  teacherName: z.string().optional(),
  book: z.string().optional(),
  courseId: z.string().min(1, "Course is required"),
});

type ClassFormValues = z.infer<typeof classSchema>;

type ClassDialogProps = {
  mode?: "create" | "edit";
  classSection?: ClassSection;
  trigger?: React.ReactNode;
  onSaved?: () => void;
};

export function ClassDialog({
  mode = "create",
  classSection,
  trigger,
  onSaved,
}: ClassDialogProps) {
  const [open, setOpen] = useState(false);

  const defaultValues: Partial<ClassFormValues> =
    mode === "edit" && classSection
      ? {
          name: classSection.name,
          code: classSection.code,
          color: classSection.color ?? undefined,
          timeDescription: classSection.timeDescription ?? "",
          day1: classSection.day1 ?? undefined,
          day2: classSection.day2 ?? undefined,
          teacherName: classSection.teacherName ?? "",
          book: classSection.book ?? "",
          courseId: classSection.courseId ?? "",
        }
      : {
          courseId: "",
        };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: defaultValues as ClassFormValues,
  });

  const createClassMutation = useCreateClass();
  const updateClassMutation = useUpdateClass();
  const { data: coursesData } = useCourses(1, 100);

  // Reset form with selected class when opening edit dialog
  React.useEffect(() => {
    if (open && mode === "edit" && classSection) {
      reset(defaultValues as ClassFormValues);
    }
  }, [open, mode, classSection, reset]);

  function onSubmit(values: ClassFormValues) {
    if (mode === "edit" && classSection) {
      updateClassMutation.mutate(
        { id: classSection.id, data: values as Partial<ClassSection> },
        {
          onSuccess: () => {
            toast.success("Class updated successfully!");
            setOpen(false);
            onSaved?.();
          },
          onError: (error: any) => {
            toast.error(
              error.response?.data?.message || "Failed to update class"
            );
          },
        }
      );
      return;
    }

    createClassMutation.mutate(values as Partial<ClassSection>, {
      onSuccess: () => {
        toast.success("Class created successfully!");
        reset();
        setOpen(false);
        onSaved?.();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to create class");
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
            {mode === "edit" ? "Edit class" : "Add new class"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the class information below."
              : "Fill the class information below."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="courseId">Course</Label>
            <Select
              value={watch("courseId") || ""}
              onValueChange={(value) => setValue("courseId", value)}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <SelectTrigger className="w-full truncate">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                </TooltipTrigger>
                {watch("courseId") && (
                  <TooltipContent>
                    {(() => {
                      const course = coursesData?.data?.find(
                        (c: Course) => c.id === watch("courseId")
                      );
                      return course ? `${course.title} (${course.courseCode})` : "";
                    })()}
                  </TooltipContent>
                )}
              </Tooltip>
              <SelectContent>
                {coursesData?.data?.map((course: Course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title} ({course.courseCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.courseId && (
              <p className="text-sm text-red-500">{errors.courseId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Class Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="code">Class Code</Label>
              <Input id="code" {...register("code")} />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap items-center gap-2">
              {CLASS_COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring ${
                    watch("color") === hex
                      ? "border-foreground ring-2 ring-offset-2 ring-foreground/30"
                      : "border-muted-foreground/30"
                  }`}
                  style={{ backgroundColor: hex }}
                  title={hex}
                  onClick={() => setValue("color", hex)}
                />
              ))}
              <input
                type="color"
                className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0"
                value={watch("color") || "#3b82f6"}
                onChange={(e) => setValue("color", e.target.value)}
                title="Custom color"
              />
              {watch("color") && (
                <span className="text-xs text-muted-foreground">
                  {watch("color")}
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="timeDescription">Schedule</Label>
            <Input
              id="timeDescription"
              {...register("timeDescription")}
              placeholder="Tuesday & Thursday (7.00-8.15 pm)"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="day1">Day 1</Label>
              <Select
                value={
                  watch("day1") !== null && watch("day1") !== undefined
                    ? String(watch("day1"))
                    : "none"
                }
                onValueChange={(value) =>
                  setValue("day1", value === "none" ? undefined : Number(value))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select day</SelectItem>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
              {errors.day1 && (
                <p className="text-sm text-red-500">{errors.day1.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="day2">Day 2</Label>
              <Select
                value={
                  watch("day2") !== null && watch("day2") !== undefined
                    ? String(watch("day2"))
                    : "none"
                }
                onValueChange={(value) =>
                  setValue("day2", value === "none" ? undefined : Number(value))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select day</SelectItem>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
              {errors.day2 && (
                <p className="text-sm text-red-500">{errors.day2.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="teacherName">Teacher</Label>
              <Input id="teacherName" {...register("teacherName")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="book">Book</Label>
              <Input id="book" {...register("book")} />
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
                createClassMutation.isPending || updateClassMutation.isPending
              }
            >
              {createClassMutation.isPending || updateClassMutation.isPending
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
