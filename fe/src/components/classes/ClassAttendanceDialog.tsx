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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSetAttendance, useGenerateAttendance } from "@/hooks/useAttendance";
import { useStudents } from "@/hooks/useStudents";
import * as React from "react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const attendanceSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  date: z.date(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  note: z.string().optional(),
});

type AttendanceFormValues = z.infer<typeof attendanceSchema>;

type ClassAttendanceDialogProps = {
  mode?: "create" | "edit";
  sectionId: string;
  trigger?: React.ReactNode;
  onSaved?: () => void;
};

export function ClassAttendanceDialog({
  mode = "create",
  sectionId,
  trigger,
  onSaved,
}: ClassAttendanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());

  const defaultValues: Partial<AttendanceFormValues> = {
    studentId: "",
    date: new Date(),
    status: "PRESENT",
    note: "",
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: defaultValues as AttendanceFormValues,
  });

  const setAttendanceMutation = useSetAttendance();
  const generateAttendanceMutation = useGenerateAttendance();
  const { data: studentsData } = useStudents(1, 100);

  // Filter students enrolled in this section
  const enrolledStudents =
    studentsData?.data?.filter((student) =>
      student.enrollments?.some(
        (enrollment) => enrollment.sectionId === sectionId
      )
    ) || [];

  // Reset form when opening dialog
  useEffect(() => {
    if (open) {
      reset(defaultValues as AttendanceFormValues);
      setDate(new Date());
    }
  }, [open, reset]);

  function onSubmit(values: AttendanceFormValues) {
    if (!date) {
      toast.error("Please select a date");
      return;
    }

    const submitData = {
      sectionId,
      studentId: values.studentId,
      date: date.toISOString().split("T")[0],
      status: values.status,
      note: values.note,
    };

    setAttendanceMutation.mutate(submitData, {
      onSuccess: () => {
        toast.success("Attendance recorded successfully!");
        setOpen(false);
        onSaved?.();
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to record attendance"
        );
      },
    });
  }

  const handleGenerateAttendance = () => {
    if (!date) {
      toast.error("Please select a date");
      return;
    }

    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 7); // Generate for 1 week

    generateAttendanceMutation.mutate(
      {
        sectionId,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
      {
        onSuccess: () => {
          toast.success("Attendance generated for the week!");
          setOpen(false);
          onSaved?.();
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to generate attendance"
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Manage Attendance</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Class Attendance Management</DialogTitle>
          <DialogDescription>
            Record attendance for students in this class or generate attendance
            records.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Generate Attendance Section */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium">Generate Attendance Records</h4>
            <div className="grid gap-2">
              <Label>Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button
              onClick={handleGenerateAttendance}
              disabled={generateAttendanceMutation.isPending}
              className="w-full"
            >
              {generateAttendanceMutation.isPending
                ? "Generating..."
                : "Generate Week Attendance"}
            </Button>
          </div>

          {/* Individual Attendance Section */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium">Record Individual Attendance</h4>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="studentId">Student</Label>
                <select
                  {...register("studentId")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select student</option>
                  {enrolledStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} (
                      {student.studentId})
                    </option>
                  ))}
                </select>
                {errors.studentId && (
                  <p className="text-sm text-red-500">
                    {errors.studentId.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="status">Status</Label>
                  <select
                    {...register("status")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LATE">Late</option>
                    <option value="EXCUSED">Excused</option>
                  </select>
                  {errors.status && (
                    <p className="text-sm text-red-500">
                      {errors.status.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="note">Note (Optional)</Label>
                  <Input
                    id="note"
                    placeholder="Attendance note..."
                    {...register("note")}
                  />
                  {errors.note && (
                    <p className="text-sm text-red-500">
                      {errors.note.message}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={setAttendanceMutation.isPending}
                className="w-full"
              >
                {setAttendanceMutation.isPending
                  ? "Recording..."
                  : "Record Attendance"}
              </Button>
            </form>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
