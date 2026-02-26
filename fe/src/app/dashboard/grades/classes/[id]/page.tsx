"use client";
import * as React from "react";
import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useClass } from "@/hooks/useClasses";
import { useGrades, useGradesByClass } from "@/hooks/useGrades";
import { useActiveGradeTypes } from "@/hooks/useGradeTypes";
import { useSectionGradeTypes } from "@/hooks/useSectionGradeTypes";
import type { GradeType } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Download } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { EditableGradeCell } from "@/components/grades/EditableGradeCell";
import { HomeworkGradeCell } from "@/components/grades/HomeworkGradeCell";
import { SectionGradeTypesDialog } from "@/components/grades/SectionGradeTypesDialog";
import { StudentGradeChartDialog } from "@/components/grades/StudentGradeChartDialog";
import api from "@/lib/api";
import { toast } from "sonner";

export default function ClassGradesPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [search, setSearch] = useState("");
  const [gradeTypeFilter, setGradeTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [isExporting, setIsExporting] = useState(false);

  const { data: classData } = useClass(classId);
  const {
    data: gradesData,
    isLoading,
    error,
    refetch,
  } = useGradesByClass(classId, page, pageSize);
  const { data: sectionGradeTypes } = useSectionGradeTypes(classId);
  const { data: activeGradeTypes } = useActiveGradeTypes();

  // Get grade types for this section, or fallback to all active grade types
  // This must be before any early returns to maintain hook order
  const gradeTypes: GradeType[] = useMemo(() => {
    if (sectionGradeTypes && sectionGradeTypes.length > 0) {
      // Use section-specific grade types, filter active ones and sort by sortOrderInSection
      return sectionGradeTypes
        .filter((gt: any) => gt.isActiveInSection !== false)
        .sort((a: any, b: any) => a.sortOrderInSection - b.sortOrderInSection);
    }
    // Fallback to all active grade types if section has no specific configuration
    return activeGradeTypes?.sort((a, b) => a.sortOrder - b.sortOrder) || [];
  }, [sectionGradeTypes, activeGradeTypes]);

  const totalStudents = gradesData?.meta?.total || 0;
  const totalPages = gradesData?.meta?.totalPages || 0;

  const classInfo = classData;
  const classGrades = gradesData?.data || [];

  // Group grades by student
  const studentGrades = useMemo(() => {
    const grouped: Record<
      string,
      {
        student: any;
        grades: any[];
        average: number;
        gradeLevel: string;
      }
    > = {};


    classGrades.forEach((grade: any) => {
      const studentId = grade.studentId;
      if (!grouped[studentId]) {
        grouped[studentId] = {
          student: grade.student,
          grades: [],
          average: 0,
          gradeLevel: "",
        };
      }
      grouped[studentId].grades.push(grade);
    });

    // Calculate averages and grade levels
    Object.values(grouped).forEach((studentData) => {
      const scores = studentData.grades.map((g) => g.grade);
      studentData.average =
        scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : 0;

      // Determine grade level (based on 100-point scale)
      if (studentData.average >= 85) {
        studentData.gradeLevel = "Excellent";
      } else if (studentData.average >= 70) {
        studentData.gradeLevel = "Good";
      } else if (studentData.average >= 55) {
        studentData.gradeLevel = "Average";
      } else {
        studentData.gradeLevel = "Needs Improvement";
      }
    });

    return grouped;
  }, [classGrades]);

  // Filter by grade type and search, then sort by student name for consistent ordering
  const filteredStudents = useMemo(() => {
    let filtered = Object.values(studentGrades);

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((studentData) => {
        const firstName = studentData.student?.firstName || "";
        const lastName = studentData.student?.lastName || "";
        const engName = studentData.student?.engName || "";
        const studentId = studentData.student?.studentId || "";
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        return (
          fullName.includes(searchLower) ||
          engName.toLowerCase().includes(searchLower) ||
          studentId.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filter by grade type
    if (gradeTypeFilter !== "all") {
      filtered = filtered.filter((studentData) =>
        studentData.grades.some(
          (grade) => grade.gradeType?.id === gradeTypeFilter
        )
      );
    }

    // Sort by student name (firstName + lastName) to maintain consistent order
    // This prevents rows from jumping around when grades are updated
    filtered.sort((a, b) => {
      const nameA = `${a.student?.firstName || ""} ${a.student?.lastName || ""}`.trim().toLowerCase();
      const nameB = `${b.student?.firstName || ""} ${b.student?.lastName || ""}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return filtered;
  }, [studentGrades, gradeTypeFilter, search]);

  // Export grades to Excel
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const response = await api.get(`/grades/export/${classId}`, {
        responseType: "blob",
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `grades-${classInfo?.code || classId}-${timestamp}.xlsx`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Grades exported successfully!");
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.response?.data?.message || "Failed to export grades");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500">
        Error loading grades
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Class not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {classInfo.color && (
          <div
            className="h-2 w-full shrink-0"
            style={{ backgroundColor: classInfo.color }}
            aria-hidden
          />
        )}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/grades/classes")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Classes
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{classInfo.name}</h1>
              <p className="text-muted-foreground">
                {classInfo.code} •{" "}
                {classInfo.course?.title || "No course assigned"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SectionGradeTypesDialog
            sectionId={classId}
            sectionName={classInfo.name}
          />
          <Button variant="outline" onClick={handleExportExcel} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export Excel"}
          </Button>
        </div>
        </div>
      </div>

      {/* Info banner if using default grade types */}
      {(!sectionGradeTypes || sectionGradeTypes.length === 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-800">
              This section is using all active grade types.{" "}
              <span className="font-medium">
                Configure specific grade types for this section
              </span>{" "}
              to customize which types are available.
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={gradeTypeFilter} onValueChange={setGradeTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by grade type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grade Types</SelectItem>
            {gradeTypes.map((gradeType) => (
              <SelectItem key={gradeType.id} value={gradeType.id}>
                {gradeType.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grades Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 sticky left-0 z-10 bg-background">No</TableHead>
                  <TableHead className="min-w-[150px] sticky left-[33px] z-10 bg-background">Name</TableHead>
                  <TableHead className="min-w-[120px] sticky left-[182px] z-10 bg-background">English Name</TableHead>
                  <TableHead className="min-w-[100px]">Class</TableHead>
                  <TableHead className="min-w-[80px]">Grade</TableHead>
                  {gradeTypes.map((gradeType) => (
                    <TableHead
                      key={gradeType.id}
                      className="min-w-[80px] text-center"
                    >
                      {gradeType.name}
                    </TableHead>
                  ))}
                  <TableHead className="min-w-[80px] text-center">
                    Average
                  </TableHead>
                  <TableHead className="min-w-[120px] text-center">
                    Grade Level
                  </TableHead>
                  <TableHead className="min-w-[100px] text-center">
                    Chart
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((studentData, index) => (
                  <TableRow key={studentData.student.id}>
                    <TableCell className="font-medium sticky left-0 z-10 bg-background">{index + 1}</TableCell>
                    <TableCell className="sticky left-[33px] z-10 bg-background">
                      <div>
                        <div className="font-medium">
                          {studentData.student.firstName}{" "}
                          {studentData.student.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {studentData.student.studentId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="sticky left-[182px] z-10 bg-background">{studentData.student.engName || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{classInfo.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          studentData.average >= 85
                            ? "default"
                            : studentData.average >= 70
                            ? "secondary"
                            : studentData.average >= 55
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {studentData.average.toFixed(1)}
                      </Badge>
                    </TableCell>
                    {gradeTypes.map((gradeType) => {
                      // Try multiple ways to match grade with gradeType
                      const grade = studentData.grades.find(
                        (g) => 
                          g.gradeType?.id === gradeType.id || 
                          g.gradeTypeId === gradeType.id ||
                          (g.gradeType && g.gradeType.code === gradeType.code)
                      );
                      return (
                        <TableCell key={gradeType.id} className="text-center">
                          {grade ? (
                            gradeType.code === "HW" ? (
                              <HomeworkGradeCell
                                grade={grade}
                                classId={classId}
                                className={classInfo.name}
                                onUpdate={refetch}
                              />
                            ) : (
                              <EditableGradeCell
                                grade={grade}
                                onUpdate={refetch}
                              />
                            )
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-medium">
                      {studentData.average.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          studentData.gradeLevel === "Excellent"
                            ? "default"
                            : studentData.gradeLevel === "Good"
                            ? "secondary"
                            : studentData.gradeLevel === "Average"
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {studentData.gradeLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <StudentGradeChartDialog
                        student={studentData.student}
                        grades={studentData.grades}
                        gradeTypes={gradeTypes}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {filteredStudents.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <div className="mb-4 text-6xl">📊</div>
          <h3 className="mb-2 text-lg font-semibold">No Grades Found</h3>
          <p className="text-muted-foreground">
            {search || gradeTypeFilter !== "all"
              ? "No students match your search criteria"
              : "No grades have been recorded for this class yet"}
          </p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Showing {(page - 1) * pageSize + 1} to{" "}
          {Math.min(page * pageSize, totalStudents)} of {totalStudents} students
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((prev) => Math.min(totalPages || 1, prev + 1))
            }
            disabled={page === (totalPages || 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
