"use client";
import * as React from "react";
import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useClass } from "@/hooks/useClasses";
import { useGrades, useGradesByClass } from "@/hooks/useGrades";
import { useActiveGradeTypes } from "@/hooks/useGradeTypes";
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

export default function ClassGradesPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [search, setSearch] = useState("");
  const [gradeTypeFilter, setGradeTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const { data: classData } = useClass(classId);
  const {
    data: gradesData,
    isLoading,
    error,
    refetch,
  } = useGradesByClass(classId, page, pageSize);
  const { data: activeGradeTypes } = useActiveGradeTypes();

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
        warnings: string[];
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
          warnings: [],
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

      // Determine grade level
      if (studentData.average >= 8.5) {
        studentData.gradeLevel = "Excellent";
      } else if (studentData.average >= 7.0) {
        studentData.gradeLevel = "Good";
      } else if (studentData.average >= 5.5) {
        studentData.gradeLevel = "Average";
      } else {
        studentData.gradeLevel = "Needs Improvement";
      }

      // Generate warnings
      studentData.grades.forEach((grade: any) => {
        if (grade.grade < 5) {
          studentData.warnings.push(`${grade.gradeType}: ${grade.grade}`);
        }
      });
    });

    return grouped;
  }, [classGrades]);

  // Filter by grade type
  const filteredStudents = useMemo(() => {
    let filtered = Object.values(studentGrades);

    if (gradeTypeFilter !== "all") {
      filtered = filtered.filter((studentData) =>
        studentData.grades.some(
          (grade) => grade.gradeType?.id === gradeTypeFilter
        )
      );
    }

    return filtered;
  }, [studentGrades, gradeTypeFilter]);

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

  // Get grade types from database, ordered by sortOrder
  const gradeTypes: GradeType[] = activeGradeTypes || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/grades/classes")}
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
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

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
                  <TableHead className="w-12">No</TableHead>
                  <TableHead className="min-w-[150px]">Name</TableHead>
                  <TableHead className="min-w-[120px]">English Name</TableHead>
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
                    Warnings
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((studentData, index) => (
                  <TableRow key={studentData.student.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
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
                    <TableCell>{studentData.student.engName || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{classInfo.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          studentData.average >= 8.5
                            ? "default"
                            : studentData.average >= 7.0
                            ? "secondary"
                            : studentData.average >= 5.5
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {studentData.average.toFixed(1)}
                      </Badge>
                    </TableCell>
                    {gradeTypes.map((gradeType) => {
                      const grade = studentData.grades.find(
                        (g) => g.gradeType?.id === gradeType.id
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
                      {studentData.warnings.length > 0 ? (
                        <Badge variant="destructive" className="text-xs">
                          {studentData.warnings.length} warning
                          {studentData.warnings.length > 1 ? "s" : ""}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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
