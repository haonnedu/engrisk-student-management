"use client";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, BarChart3, Edit } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";
import { useClass } from "@/hooks/useClasses";
import { useGradesByClass } from "@/hooks/useGrades";
import {
  useHomework,
  useCreateHomework,
  useUpdateHomework,
  useDeleteHomework,
} from "@/hooks/useHomework";
import { api } from "@/lib/api";
import type {
  Homework,
  CreateHomeworkDto,
  UpdateHomeworkDto,
} from "@/lib/api-types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const homeworkSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  points: z
    .number()
    .min(0, "Points must be at least 0")
    .max(100, "Points must not exceed 100"),
  maxPoints: z
    .number()
    .min(1, "Max points must be at least 1")
    .max(100, "Max points must not exceed 100"),
  dueDate: z.string().optional(),
});

type HomeworkFormValues = z.infer<typeof homeworkSchema>;

type HomeworkDialogProps = {
  classId: string;
  className: string;
  currentGrade: number;
  onGradeUpdate?: () => void;
  trigger: React.ReactNode;
  studentId?: string;
};

export function HomeworkDialog({
  classId,
  className,
  currentGrade,
  onGradeUpdate,
  trigger,
  studentId,
}: HomeworkDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HomeworkFormValues>({
    resolver: zodResolver(homeworkSchema),
    defaultValues: {
      points: 0,
      maxPoints: 100,
      dueDate: getTodayDate(), // Today's date
    },
  });

  const { data: studentsData } = useStudents(1, 100);
  const { data: classData } = useClass(classId);
  const { data: gradesData, refetch: refetchGrades } = useGradesByClass(
    classId,
    1,
    100
  );

  // Homework hooks - fetch all homework for the class first
  const { data: homeworkData, refetch: refetchHomework } = useHomework(
    classId,
    undefined, // Don't filter by student initially
    1,
    100
  );
  const createHomeworkMutation = useCreateHomework();
  const updateHomeworkMutation = useUpdateHomework();
  const deleteHomeworkMutation = useDeleteHomework();

  // Get students enrolled in this class
  const enrolledStudents = useMemo(() => {
    return (
      gradesData?.data
        ?.map((grade: any) => grade.student)
        .filter(
          (student: any, index: number, self: any[]) =>
            index === self.findIndex((s: any) => s.id === student.id)
        ) || []
    );
  }, [gradesData?.data]);

  // Get homework records from API
  const homeworkRecords = homeworkData?.data || [];

  // Filter records by selected student on frontend
  const filteredRecords = useMemo(() => {
    console.log("Filtering homework records:", {
      selectedStudent,
      totalRecords: homeworkRecords.length,
      records: homeworkRecords.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        title: r.title,
      })),
    });

    if (selectedStudent && selectedStudent !== "all") {
      const filtered = homeworkRecords.filter(
        (record) => record.studentId === selectedStudent
      );
      console.log("Filtered records:", filtered.length);
      return filtered;
    }
    console.log("Showing all records:", homeworkRecords.length);
    return homeworkRecords;
  }, [homeworkRecords, selectedStudent]);

  // Auto-select student when dialog opens
  useEffect(() => {
    if (open && studentId) {
      console.log("Auto-selecting student:", studentId);
      setSelectedStudent(studentId);
    }
  }, [open, studentId]);

  // Update HW grades when dialog opens
  useEffect(() => {
    if (open) {
      // Update HW grades for all students when dialog opens
      const updateAllHWGrades = async () => {
        const allStudents = enrolledStudents;
        for (const student of allStudents) {
          await updateHWGradeInTable(student.id);
        }
      };
      updateAllHWGrades();
    }
  }, [open, enrolledStudents]);

  // Auto-select student in form when filter changes
  useEffect(() => {
    if (selectedStudent && selectedStudent !== "all") {
      setValue("studentId", selectedStudent);
    }
  }, [selectedStudent, setValue]);

  // Debug selectedStudent changes
  useEffect(() => {
    console.log("Selected student changed:", selectedStudent);
  }, [selectedStudent]);

  // Calculate average homework grade for each student
  const studentAverages = useMemo(() => {
    return enrolledStudents.map((student: any) => {
      const studentRecords = homeworkRecords.filter(
        (record) => record.studentId === student.id
      );
      const average =
        studentRecords.length > 0
          ? studentRecords.reduce(
              (sum: number, record: any) =>
                sum + (record.points / record.maxPoints) * 100,
              0
            ) / studentRecords.length
          : 0;
      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        average: Math.round(average * 10) / 10,
      };
    });
  }, [enrolledStudents, homeworkRecords]);

  // Prepare chart data - show individual homework points for selected student
  const chartData = useMemo(() => {
    if (selectedStudent && selectedStudent !== "all") {
      const studentRecords = filteredRecords.filter(
        (record) => record.studentId === selectedStudent
      );
      return studentRecords.map((record, index) => ({
        name: `HW ${index + 1}`,
        point: (record.points / record.maxPoints) * 100,
        description: record.description,
      }));
    }
    // For all students, show average points
    return studentAverages.map((student: any, index: number) => ({
      name: student.studentName.split(" ").pop(), // Last name only
      point: student.average,
    }));
  }, [filteredRecords, selectedStudent, studentAverages]);

  const onSubmit = async (values: HomeworkFormValues) => {
    try {
      const homeworkData: CreateHomeworkDto = {
        studentId: values.studentId,
        sectionId: classId,
        title: values.title,
        description: values.description,
        points: values.points,
        maxPoints: values.maxPoints,
        dueDate: values.dueDate,
      };

      if (editingHomework) {
        await updateHomeworkMutation.mutateAsync({
          id: editingHomework.id,
          data: homeworkData,
        });
        toast.success("Homework updated successfully!");
        setEditingHomework(null);
      } else {
        await createHomeworkMutation.mutateAsync(homeworkData);
        toast.success("Homework created successfully!");
      }

      const currentStudentId = values.studentId;
      reset({
        studentId: currentStudentId,
        title: "",
        description: "",
        points: 0,
        maxPoints: 100,
        dueDate: getTodayDate(), // Today's date
      });
      setEditingHomework(null);
      refetchHomework();
      refetchGrades();

      // Update HW grade in the main grades table
      await updateHWGradeInTable(values.studentId);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      toast.error(errorMessage);
    }
  };

  const handleEditHomework = (homework: Homework) => {
    setEditingHomework(homework);
    setValue("studentId", homework.studentId);
    setValue("title", homework.title);
    setValue("description", homework.description);
    setValue("points", homework.points);
    setValue("maxPoints", homework.maxPoints);
    setValue("dueDate", homework.dueDate || "");
  };

  const handleCancelEdit = () => {
    if (editingHomework) {
      const hasChanges =
        watch("title") !== editingHomework.title ||
        watch("description") !== editingHomework.description ||
        watch("points") !== editingHomework.points ||
        watch("maxPoints") !== editingHomework.maxPoints ||
        watch("dueDate") !== (editingHomework.dueDate || "");

      if (hasChanges) {
        if (
          confirm("You have unsaved changes. Are you sure you want to cancel?")
        ) {
          setEditingHomework(null);
          reset({
            points: 0,
            maxPoints: 100,
            dueDate: new Date().toISOString().split("T")[0], // Today's date
          });
        }
      } else {
        setEditingHomework(null);
        reset({
          points: 0,
          maxPoints: 100,
          dueDate: new Date().toISOString().split("T")[0], // Today's date
        });
      }
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      await deleteHomeworkMutation.mutateAsync(id);
      toast.success("Homework deleted successfully!");
      refetchHomework();
      refetchGrades();

      // Update HW grade in the main grades table
      const deletedHomework = homeworkRecords.find((hw) => hw.id === id);
      if (deletedHomework) {
        await updateHWGradeInTable(deletedHomework.studentId);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      toast.error(errorMessage);
    }
  };

  // Function to update HW grade in the main grades table
  const updateHWGradeInTable = async (studentId: string) => {
    try {
      // Get fresh homework data for the student
      const studentHomeworkResponse = await api.get(
        `/homework?studentId=${studentId}&sectionId=${classId}&limit=100`
      );
      const studentHomeworkRecords = studentHomeworkResponse.data.data || [];

      if (studentHomeworkRecords.length === 0) {
        // If no homework records, set HW grade to 0
        await updateHWGradeToZero(studentId);
        return;
      }

      // Calculate average homework score for the student
      const averageScore =
        studentHomeworkRecords.reduce(
          (sum: number, record: any) =>
            sum + (record.points / record.maxPoints) * 100,
          0
        ) / studentHomeworkRecords.length;

      // Find the student's HW grade record
      const hwGradeRecord = gradesData?.data?.find(
        (grade: any) =>
          grade.studentId === studentId && grade.gradeType?.code === "HW"
      );

      if (hwGradeRecord) {
        // Update existing HW grade
        const response = await api.patch(`/grades/${hwGradeRecord.id}`, {
          grade: Math.round(averageScore * 10) / 10,
        });

        console.log("Updated HW grade:", response.data);
      }
    } catch (error) {
      console.error("Error updating HW grade:", error);
    }
  };

  // Function to set HW grade to 0 when no homework records
  const updateHWGradeToZero = async (studentId: string) => {
    try {
      const hwGradeRecord = gradesData?.data?.find(
        (grade: any) =>
          grade.studentId === studentId && grade.gradeType?.code === "HW"
      );

      if (hwGradeRecord) {
        await api.patch(`/grades/${hwGradeRecord.id}`, {
          grade: 0,
        });
        console.log("Set HW grade to 0 for student:", studentId);
      }
    } catch (error) {
      console.error("Error setting HW grade to 0:", error);
    }
  };

  // Handle dialog close with refresh
  const handleDialogClose = (open: boolean) => {
    setOpen(open);
    if (!open) {
      // Refresh grades when dialog closes
      refetchGrades();
      // Call parent callback to refresh grades table
      onGradeUpdate?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[98vw] min-w-[1400px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Homework Management - {className}
          </DialogTitle>
          <DialogDescription>
            Manage homework assignments and view performance analytics
          </DialogDescription>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1">
              <Label htmlFor="studentFilter">Filter by Student</Label>
              <Select
                value={selectedStudent}
                onValueChange={setSelectedStudent}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="All students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students</SelectItem>
                  {enrolledStudents.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      <div className="flex items-center gap-2">
                        <div>
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-xs text-slate-500">
                          ({student.studentId}) • {classData?.name} -{" "}
                          {classData?.code}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Chart Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              {selectedStudent && selectedStudent !== "all"
                ? "Homework Points Chart"
                : "Student Performance Chart"}
              {selectedStudent && selectedStudent !== "all" && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  -{" "}
                  {
                    enrolledStudents.find((s: any) => s.id === selectedStudent)
                      ?.firstName
                  }{" "}
                  {
                    enrolledStudents.find((s: any) => s.id === selectedStudent)
                      ?.lastName
                  }
                </span>
              )}
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => [
                      `${value}${
                        selectedStudent && selectedStudent !== "all"
                          ? " points"
                          : "%"
                      }`,
                      selectedStudent && selectedStudent !== "all"
                        ? "Point"
                        : "Average",
                    ]}
                    labelFormatter={(label, props: any) =>
                      selectedStudent && selectedStudent !== "all"
                        ? `Homework: ${label}`
                        : `Student: ${label}`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="point"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Add Homework Form */}
          <div className="border rounded-lg p-6 bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="flex items-center gap-2 mb-6">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  editingHomework ? "bg-orange-100" : "bg-blue-100"
                }`}
              >
                {editingHomework ? (
                  <Edit className="w-4 h-4 text-orange-600" />
                ) : (
                  <Plus className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                {editingHomework
                  ? "Edit Homework Record"
                  : "Add Homework Record"}
              </h3>
              {editingHomework && (
                <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  Editing
                </span>
              )}
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Student Selection */}
              <div className="space-y-2">
                <Label
                  htmlFor="studentId"
                  className="text-sm font-medium text-slate-700"
                >
                  Student *
                  {selectedStudent && selectedStudent !== "all" && (
                    <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Filtered
                    </span>
                  )}
                </Label>
                <Select
                  value={watch("studentId") || ""}
                  onValueChange={(value) => setValue("studentId", value)}
                  disabled={!!(selectedStudent && selectedStudent !== "all")}
                >
                  <SelectTrigger
                    className={`h-11 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 ${
                      selectedStudent && selectedStudent !== "all"
                        ? "bg-slate-50 text-slate-500 cursor-not-allowed"
                        : "bg-white"
                    }`}
                  >
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-lg">
                    {(selectedStudent && selectedStudent !== "all"
                      ? enrolledStudents.filter(
                          (s: any) => s.id === selectedStudent
                        )
                      : enrolledStudents
                    ).map((student: any) => (
                      <SelectItem
                        key={student.id}
                        value={student.id}
                        className="hover:bg-slate-50 focus:bg-slate-50"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-medium text-slate-600">
                            {student.firstName[0]}
                            {student.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {student.studentId} • {classData?.name} -{" "}
                              {classData?.code}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.studentId && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.studentId.message}
                  </p>
                )}
              </div>

              {/* Homework Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="title"
                    className="text-sm font-medium text-slate-700"
                  >
                    Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Grammar Exercise 1"
                    {...register("title")}
                    className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="text-sm font-medium text-slate-700"
                  >
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="e.g., Complete exercises 1-10"
                    {...register("description")}
                    className="min-h-[44px] bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 resize-none"
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label
                  htmlFor="dueDate"
                  className="text-sm font-medium text-slate-700"
                >
                  Due Date (Optional)
                </Label>
                <DatePicker
                  value={
                    watch("dueDate") && watch("dueDate") !== ""
                      ? (() => {
                          const dateStr = watch("dueDate")!;
                          const [year, month, day] = dateStr.split('-').map(Number);
                          return new Date(year, month - 1, day);
                        })()
                      : undefined
                  }
                  onChange={(date) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, "0");
                      const day = String(date.getDate()).padStart(2, "0");
                      setValue("dueDate", `${year}-${month}-${day}`);
                    } else {
                      setValue("dueDate", "");
                    }
                  }}
                  placeholder="Select due date"
                  className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                />
                <p className="text-xs text-slate-500">
                  Default: Today ({getTodayDate()})
                </p>
                {errors.dueDate && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.dueDate.message}
                  </p>
                )}
              </div>

              {/* Points Section */}
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <h4 className="text-sm font-medium text-slate-700 mb-4">
                  Scoring
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="points"
                      className="text-sm font-medium text-slate-700"
                    >
                      Points Earned (0-100)
                    </Label>
                    <div className="relative">
                      <Input
                        id="points"
                        type="number"
                        min="0"
                        max="100"
                        {...register("points", { valueAsNumber: true })}
                        className="h-11 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 pr-8"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        pts
                      </div>
                    </div>
                    {errors.points && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {errors.points.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="maxPoints"
                      className="text-sm font-medium text-slate-700"
                    >
                      Max Points (1-100)
                    </Label>
                    <div className="relative">
                      <Input
                        id="maxPoints"
                        type="number"
                        min="1"
                        max="100"
                        {...register("maxPoints", { valueAsNumber: true })}
                        className="h-11 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 pr-8"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        pts
                      </div>
                    </div>
                    {errors.maxPoints && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {errors.maxPoints.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Score Preview */}
                {watch("points") !== undefined &&
                  watch("maxPoints") !== undefined && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Score Preview:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">
                            {watch("points") || 0}/{watch("maxPoints") || 100}
                          </span>
                          <span className="text-slate-500">
                            (
                            {Math.round(
                              ((watch("points") || 0) /
                                (watch("maxPoints") || 100)) *
                                100
                            )}
                            %)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                {editingHomework && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="h-11 px-6"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  className={`h-11 px-8 font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl ${
                    editingHomework
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  disabled={
                    createHomeworkMutation.isPending ||
                    updateHomeworkMutation.isPending
                  }
                >
                  {createHomeworkMutation.isPending ||
                  updateHomeworkMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {editingHomework ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    <>
                      {editingHomework ? (
                        <Edit className="mr-2 h-4 w-4" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      {editingHomework ? "Update Record" : "Add Record"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Homework Records Table */}
          <div className="border rounded-lg">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Homework Records</h3>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredRecords.length} of {homeworkRecords.length}{" "}
                  records
                  {selectedStudent && selectedStudent !== "all" && (
                    <span className="ml-2 text-blue-600">
                      (filtered by student)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Homework</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {selectedStudent && selectedStudent !== "all"
                            ? "No homework records found for selected student"
                            : "No homework records found"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow
                        key={record.id}
                        className={
                          editingHomework?.id === record.id
                            ? "bg-orange-50 border-orange-200"
                            : ""
                        }
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {record.student?.firstName}{" "}
                              {record.student?.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {record.student?.studentId}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {record.section?.name} - {record.section?.code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{record.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {record.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <Badge
                              variant={
                                (record.points / record.maxPoints) * 100 >= 80
                                  ? "default"
                                  : (record.points / record.maxPoints) * 100 >=
                                    60
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {record.points}/{record.maxPoints}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {Math.round(
                                (record.points / record.maxPoints) * 100
                              )}
                              %
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(record.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditHomework(record)}
                              className={`h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 ${
                                editingHomework &&
                                editingHomework.id !== record.id
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              disabled={
                                !!(
                                  editingHomework &&
                                  editingHomework.id !== record.id
                                )
                              }
                              title={
                                editingHomework &&
                                editingHomework.id !== record.id
                                  ? "Finish editing current homework first"
                                  : "Edit homework"
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteRecord(record.id)}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                              title="Delete homework"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Student Averages */}
          <div className="border rounded-lg">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Student Averages</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(selectedStudent && selectedStudent !== "all"
                  ? studentAverages.filter(
                      (s: any) => s.studentId === selectedStudent
                    )
                  : studentAverages
                ).map((student: any) => (
                  <div
                    key={student.studentId}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <div className="font-medium">{student.studentName}</div>
                      <div className="text-xs text-slate-500">
                        {classData?.name} - {classData?.code}
                      </div>
                    </div>
                    <Badge
                      variant={
                        student.average >= 80
                          ? "default"
                          : student.average >= 60
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {student.average}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Current Grade: <span className="font-medium">{currentGrade}</span>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
