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
import { AlertDialogConfirm } from "@/components/ui/alert-dialog-confirm";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, BarChart3, Edit, FileText, Video, Image as ImageIcon, Eye } from "lucide-react";
import { useStudents } from "@/hooks/useStudents";
import { useClass } from "@/hooks/useClasses";
import { useGradesByClass } from "@/hooks/useGrades";
import {
  useHomework,
  useCreateHomework,
  useUpdateHomework,
  useDeleteHomework,
  useCreateHomeworkBulk,
} from "@/hooks/useHomework";
import { useHomeworkSubmissions } from "@/hooks/useHomeworkSubmissions";
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

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

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

// Component to view homework submission files
function HomeworkFilesViewer({ homeworkId, studentId }: { homeworkId: string; studentId: string }) {
  const { data: submissions } = useHomeworkSubmissions(homeworkId, studentId);
  const submission = submissions?.[0];
  const files = submission?.files || [];
  const [open, setOpen] = useState(false);

  if (files.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
        title={`View ${files.length} uploaded file${files.length > 1 ? 's' : ''}`}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Uploaded Files</DialogTitle>
            <DialogDescription>
              Files submitted for this homework assignment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {files.map((file) => {
              const isVideo = file.mimeType?.startsWith('video/');
              const isImage = file.mimeType?.startsWith('image/');
              const fileSize = file.fileSize 
                ? `${(file.fileSize / 1024 / 1024).toFixed(2)} MB`
                : 'Unknown size';
              
              // Create view URL from downloadUrl or googleDriveFileId
              const viewUrl = file.downloadUrl 
                ? file.downloadUrl 
                : file.googleDriveFileId 
                  ? `https://drive.google.com/file/d/${file.googleDriveFileId}/view`
                  : file.fileName
                    ? `https://drive.google.com/file/d/${file.fileName}/view`
                    : null;
              
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isVideo ? (
                      <Video className="h-5 w-5 text-red-500 flex-shrink-0" />
                    ) : isImage ? (
                      <ImageIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.originalFileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fileSize}
                      </p>
                    </div>
                  </div>
                  {viewUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="flex-shrink-0"
                      title="View file"
                    >
                      <a
                        href={viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        View
                      </a>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          {submission?.comment && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">Student Comment:</p>
              <p className="text-sm text-muted-foreground">{submission.comment}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

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
  const [cancelDialog, setCancelDialog] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkTitle, setBulkTitle] = useState<string>("");
  const [bulkDescription, setBulkDescription] = useState<string>("");
  const [bulkMaxPoints, setBulkMaxPoints] = useState<number>(100);
  const [bulkDueDate, setBulkDueDate] = useState<string>(getTodayDate());
  const [bulkPointsByStudent, setBulkPointsByStudent] = useState<Record<string, number>>({});

  const getStudentDisplayName = (student: any): string => {
    if (!student) return "";
    if (student.engName && student.engName.trim()) {
      return student.engName.trim();
    }
    const parts = [student.firstName, student.lastName].filter(Boolean);
    return parts.join(" ").trim();
  };

  const getStudentInitials = (student: any): string => {
    const displayName = getStudentDisplayName(student);
    if (!displayName) return "";
    const words = displayName.split(/\s+/).filter(Boolean);
    if (words.length === 0) return "";
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return `${words[0][0] ?? ""}${words[words.length - 1][0] ?? ""}`.toUpperCase();
  };

  // Helper function to format date consistently (avoid hydration mismatch)
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to format date for display (consistent format)
  const formatDateDisplay = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  // Helper function to parse date string to Date object safely
  const parseDateString = (dateString: string | null | undefined): Date | undefined => {
    if (!dateString || dateString === '') return undefined;
    
    // Try parsing as YYYY-MM-DD format first
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // month is 0-indexed
      const day = parseInt(parts[2], 10);
      
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    // Fallback to standard Date parsing
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return undefined;
  };

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
  // Use a high limit to get all records
  const { data: homeworkData, refetch: refetchHomework } = useHomework(
    classId,
    undefined, // Don't filter by student initially
    1,
    1000 // Increased limit to ensure all records are fetched
  );
  const createHomeworkMutation = useCreateHomework();
  const createHomeworkBulk = useCreateHomeworkBulk();
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
    if (selectedStudent && selectedStudent !== "all") {
      return homeworkRecords.filter(
        (record) => record.studentId === selectedStudent
      );
    }
    return homeworkRecords;
  }, [homeworkRecords, selectedStudent]);

  // Auto-select student when dialog opens (only if studentId is provided)
  useEffect(() => {
    if (open && studentId) {
      setSelectedStudent(studentId);
    } else if (open && !studentId) {
      // If no specific student, show all students
      setSelectedStudent("all");
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
        studentName: `${student.firstName} ${student.lastName}${student.engName ? ` (${student.engName})` : ''}`,
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
      
      // Wait for refetch to complete before updating grade
      await refetchHomework();
      await refetchGrades();

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
    // Ensure dueDate is in valid format or empty string
    const dueDate = homework.dueDate && parseDateString(homework.dueDate) 
      ? homework.dueDate 
      : "";
    setValue("dueDate", dueDate);
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
        setCancelDialog(true);
      } else {
        handleCancelConfirm();
      }
    }
  };

  // Bulk submit handler
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!bulkTitle) {
        toast.error("Title is required");
        return;
      }
      const items = Object.entries(bulkPointsByStudent)
        .filter(([, val]) => val !== undefined && val !== null && !isNaN(Number(val)))
        .map(([sid, p]) => ({ studentId: sid, points: Number(p) }));
      if (items.length === 0) {
        toast.error("Please enter points for at least one student");
        return;
      }
      await createHomeworkBulk.mutateAsync({
        sectionId: classId,
        title: bulkTitle,
        description: bulkDescription || undefined,
        maxPoints: bulkMaxPoints,
        dueDate: bulkDueDate || undefined,
        items,
      });
      toast.success("Bulk homework created successfully!");
      await refetchHomework();
      await refetchGrades();
      for (const it of items) {
        // eslint-disable-next-line no-await-in-loop
        await updateHWGradeInTable(it.studentId);
      }
      // reset
      setBulkTitle("");
      setBulkDescription("");
      setBulkMaxPoints(100);
      setBulkDueDate(getTodayDate());
      setBulkPointsByStudent({});
      setBulkMode(false);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      toast.error(errorMessage);
    }
  };

  const handleCancelConfirm = () => {
    setEditingHomework(null);
    reset({
      points: 0,
      maxPoints: 100,
      dueDate: new Date().toISOString().split("T")[0],
    });
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
        await api.patch(`/grades/${hwGradeRecord.id}`, {
          grade: Math.round(averageScore * 10) / 10,
        });
      }
    } catch (error) {
      // Error updating HW grade - silently fail
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
      }
    } catch (error) {
      // Error setting HW grade to 0 - silently fail
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
    <>
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent 
        className="max-w-[98vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[1400px] max-h-[95vh] overflow-y-auto p-4 sm:p-6"
        suppressHydrationWarning
      >
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-base sm:text-lg">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="break-words">Homework Management</span>
            </div>
            <span className="text-sm sm:text-base text-muted-foreground sm:ml-2">- {className}</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Manage homework assignments and view performance analytics
          </DialogDescription>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-4">
            <div className="flex-1 w-full">
              <Label htmlFor="studentFilter" className="text-xs sm:text-sm">Filter by Student</Label>
              <Select
                value={selectedStudent}
                onValueChange={setSelectedStudent}
              >
                <SelectTrigger className="w-full h-9 sm:h-10">
                  <SelectValue placeholder="All students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students</SelectItem>
                  {enrolledStudents.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <div className="font-medium">
                          {student.firstName} {student.lastName}
                          {student.engName && (
                            <span className="text-slate-500 ml-1">({student.engName})</span>
                          )}
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
            <div className="flex-none">
              <Button
                type="button"
                variant={bulkMode ? "default" : "secondary"}
                size="sm"
                onClick={() => setBulkMode((v) => !v)}
                className="w-full sm:w-auto"
              >
                {bulkMode ? "Single entry" : "Class list entry"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Chart Section */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
              <span className="block sm:inline">
                {selectedStudent && selectedStudent !== "all"
                  ? "Homework Points Chart"
                  : "Student Performance Chart"}
              </span>
              {selectedStudent && selectedStudent !== "all" && (() => {
                const student = enrolledStudents.find((s: any) => s.id === selectedStudent);
                return (
                  <span className="block sm:inline text-xs sm:text-sm font-normal text-muted-foreground sm:ml-2 mt-1 sm:mt-0">
                    - {student?.firstName} {student?.lastName}
                    {student?.engName && (
                      <span className="ml-1">({student.engName})</span>
                    )}
                  </span>
                );
              })()}
            </h3>
            <div className="h-48 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fontSize: 12 }}
                    width={40}
                  />
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
                    contentStyle={{ fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="point"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ fill: "#8884d8", strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bulk Add (Class List) */}
          {bulkMode && (
            <div className="border rounded-lg p-4 sm:p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold">Bulk add homework (by class)</h3>
              </div>
              <form onSubmit={handleBulkSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Title *</Label>
                    <Input
                      value={bulkTitle}
                      onChange={(e) => setBulkTitle(e.target.value)}
                      placeholder="e.g., Workbook Unit 3"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Max Points</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={bulkMaxPoints}
                      onChange={(e) => setBulkMaxPoints(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={bulkDueDate}
                      onChange={(e) => setBulkDueDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    value={bulkDescription}
                    onChange={(e) => setBulkDescription(e.target.value)}
                    rows={3}
                    placeholder="Optional description"
                  />
                </div>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="w-36">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrolledStudents.map((s: any) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {s.firstName} {s.lastName}
                                {s.engName && (
                                  <span className="text-slate-500 ml-1">({s.engName})</span>
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">{s.studentId}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step="0.5"
                              value={
                                typeof bulkPointsByStudent[s.id] === "number"
                                  ? String(bulkPointsByStudent[s.id])
                                  : ""
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                setBulkPointsByStudent((prev) => ({
                                  ...prev,
                                  [s.id]:
                                    val === "" ? (undefined as unknown as number) : Number(val),
                                }));
                              }}
                              placeholder=""
                              className="h-9"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit">Save Bulk Homework</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBulkMode(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Add Homework Form */}
          <div className="border rounded-lg p-4 sm:p-6 bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  editingHomework ? "bg-orange-100" : "bg-blue-100"
                }`}
              >
                {editingHomework ? (
                  <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
                ) : (
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                )}
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 flex-1">
                {editingHomework
                  ? "Edit Homework Record"
                  : "Add Homework Record"}
              </h3>
              {editingHomework && (
                <span className="text-xs sm:text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded flex-shrink-0">
                  Editing
                </span>
              )}
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
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
                              {student.engName && (
                                <span className="text-slate-500 ml-1">({student.engName})</span>
                              )}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  value={parseDateString(watch("dueDate"))}
                  onChange={(date) => {
                    if (date && !isNaN(date.getTime())) {
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
              <div className="bg-white rounded-lg p-3 sm:p-4 border border-slate-200">
                <h4 className="text-xs sm:text-sm font-medium text-slate-700 mb-3 sm:mb-4">
                  Scoring
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                {editingHomework && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="h-10 sm:h-11 px-4 sm:px-6 w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  className={`h-10 sm:h-11 px-6 sm:px-8 font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto ${
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
                      <span className="hidden sm:inline">{editingHomework ? "Updating..." : "Adding..."}</span>
                      <span className="sm:hidden">{editingHomework ? "Update..." : "Add..."}</span>
                    </>
                  ) : (
                    <>
                      {editingHomework ? (
                        <Edit className="mr-2 h-4 w-4" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">{editingHomework ? "Update Record" : "Add Record"}</span>
                      <span className="sm:hidden">{editingHomework ? "Update" : "Add"}</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Homework Records Table */}
          <div className="border rounded-lg">
            <div className="p-3 sm:p-4 border-b">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <h3 className="text-base sm:text-lg font-semibold">Homework Records</h3>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  <span className="block sm:inline">Showing {filteredRecords.length} of {homeworkRecords.length} records</span>
                  {selectedStudent && selectedStudent !== "all" && (
                    <span className="block sm:inline sm:ml-2 text-blue-600">
                      (filtered by student)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto -mx-1 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px] sm:min-w-[150px]">Student</TableHead>
                    <TableHead className="min-w-[150px] sm:min-w-[200px]">Homework</TableHead>
                    <TableHead className="min-w-[80px]">Score</TableHead>
                    <TableHead className="min-w-[100px]">Date</TableHead>
                    <TableHead className="min-w-[100px]">Actions</TableHead>
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
                            <div 
                              className="font-medium truncate max-w-[100px] sm:max-w-[150px]" 
                              title={`${record.student?.firstName} ${record.student?.lastName}${record.student?.engName ? ` (${record.student?.engName})` : ''}`}
                            >
                              {record.student?.firstName}{" "}
                              {record.student?.lastName}
                              {record.student?.engName && (
                                <span className="text-slate-500 ml-1">({record.student?.engName})</span>
                              )}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground truncate max-w-[100px] sm:max-w-[150px]">
                              {record.student?.studentId}
                            </div>
                            <div 
                              className="text-xs text-slate-500 mt-1 truncate max-w-[100px] sm:max-w-[150px]"
                              title={`${record.section?.name} - ${record.section?.code}`}
                            >
                              {record.section?.name} - {record.section?.code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div 
                              className="font-medium truncate max-w-[120px] sm:max-w-[200px]" 
                              title={record.title}
                            >
                              {record.title}
                            </div>
                            <div 
                              className="text-xs sm:text-sm text-muted-foreground truncate max-w-[120px] sm:max-w-[200px]" 
                              title={record.description}
                            >
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
                        <TableCell className="text-xs sm:text-sm" suppressHydrationWarning>
                          {formatDateDisplay(record.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 flex-wrap">
                            <HomeworkFilesViewer homeworkId={record.id} studentId={record.studentId} />
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
            <div className="p-3 sm:p-4 border-b">
              <h3 className="text-base sm:text-lg font-semibold">Student Averages</h3>
            </div>
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {(selectedStudent && selectedStudent !== "all"
                  ? studentAverages.filter(
                      (s: any) => s.studentId === selectedStudent
                    )
                  : studentAverages
                ).map((student: any) => (
                  <div
                    key={student.studentId}
                    className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="font-medium text-sm sm:text-base truncate">{student.studentName}</div>
                      <div className="text-xs text-slate-500 truncate">
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
                      className="flex-shrink-0"
                    >
                      {student.average}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Current Grade: <span className="font-medium">{currentGrade}</span>
            </div>
            <div className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto h-10 sm:h-11 px-6"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Cancel Edit Confirmation Dialog */}
    <AlertDialogConfirm
      open={cancelDialog}
      onOpenChange={setCancelDialog}
      onConfirm={handleCancelConfirm}
      title="Unsaved Changes"
      description="You have unsaved changes. Are you sure you want to cancel?"
      confirmText="Discard Changes"
      cancelText="Keep Editing"
      variant="destructive"
    />
    </>
  );
}
