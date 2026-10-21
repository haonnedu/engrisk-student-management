"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useClass } from "@/hooks/useClasses";
import { type Grade, useGradesByClass } from "@/hooks/useGrades";
import { useActiveGradeTypes } from "@/hooks/useGradeTypes";
import {
  type SectionGradeType,
  useSectionGradeTypes,
} from "@/hooks/useSectionGradeTypes";
import type { GradeType } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { ArrowLeft, Download, Search, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  EditableGradeCell,
  isUngraded,
  scoreTone,
} from "@/components/grades/EditableGradeCell";
import { HomeworkGradeCell } from "@/components/grades/HomeworkGradeCell";
import { SectionGradeTypesDialog } from "@/components/grades/SectionGradeTypesDialog";
import { StudentGradeChartDialog } from "@/components/grades/StudentGradeChartDialog";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { toast } from "sonner";

type StudentInfo = NonNullable<Grade["student"]>;
type ClassGrade = Grade & {
  gradeType?: GradeType;
  gradeTypeId?: string;
  student: StudentInfo;
};

type Level = "Distinction" | "Credit" | "Pass" | "Not pass" | "Not graded";

type StudentGradeSummary = {
  student: StudentInfo;
  grades: ClassGrade[];
  /** Mean of graded cells only, or null when nothing has been graded yet. */
  average: number | null;
  gradedCount: number;
  level: Level;
};

const PAGE_SIZES = [10, 20, 50] as const;

const getStudentGradeForType = (grades: ClassGrade[], gradeType: GradeType) =>
  grades.find(
    (g) =>
      g.gradeType?.id === gradeType.id ||
      g.gradeTypeId === gradeType.id ||
      (g.gradeType && g.gradeType.code === gradeType.code)
  );

const getLevel = (average: number | null): Level => {
  if (average === null) return "Not graded";
  if (average >= 80) return "Distinction";
  if (average >= 70) return "Credit";
  if (average >= 50) return "Pass";
  return "Not pass";
};

const LEVEL_STYLES: Record<Level, string> = {
  Distinction:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Credit:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  Pass: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  "Not pass":
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  "Not graded": "border-dashed text-muted-foreground",
};

function LevelBadge({ level }: { level: Level }) {
  return (
    <Badge variant="outline" className={cn("font-medium", LEVEL_STYLES[level])}>
      {level}
    </Badge>
  );
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

export default function ClassGradesPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 400);
  const [focusedTypeId, setFocusedTypeId] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const { data: classData } = useClass(classId);
  const {
    data: gradesData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGradesByClass(classId, page, pageSize, search);
  const { data: sectionGradeTypes } = useSectionGradeTypes(classId);
  const { data: activeGradeTypes } = useActiveGradeTypes();

  // Grade types for this section, or every active grade type as a fallback.
  const gradeTypes: GradeType[] = useMemo(() => {
    if (sectionGradeTypes && sectionGradeTypes.length > 0) {
      return sectionGradeTypes
        .filter((gt: SectionGradeType) => gt.isActiveInSection !== false)
        .sort(
          (a: SectionGradeType, b: SectionGradeType) =>
            a.sortOrderInSection - b.sortOrderInSection
        );
    }
    return activeGradeTypes?.sort((a, b) => a.sortOrder - b.sortOrder) || [];
  }, [sectionGradeTypes, activeGradeTypes]);

  // Columns actually rendered: all, or just the one the teacher focused on.
  const visibleTypes = useMemo(
    () =>
      focusedTypeId === "all"
        ? gradeTypes
        : gradeTypes.filter((gt) => gt.id === focusedTypeId),
    [gradeTypes, focusedTypeId]
  );

  const totalStudents = gradesData?.meta?.total || 0;
  const totalPages = gradesData?.meta?.totalPages || 0;
  const classInfo = classData;

  // Group grades by student and compute the average over graded cells only.
  const students: StudentGradeSummary[] = useMemo(() => {
    const grouped: Record<string, StudentGradeSummary> = {};
    const classGrades: ClassGrade[] = gradesData?.data || [];

    classGrades.forEach((grade) => {
      const id = grade.studentId;
      if (!grouped[id]) {
        grouped[id] = {
          student: grade.student,
          grades: [],
          average: null,
          gradedCount: 0,
          level: "Not graded",
        };
      }
      grouped[id].grades.push(grade);
    });

    Object.values(grouped).forEach((s) => {
      const graded = gradeTypes
        .map((gt) => getStudentGradeForType(s.grades, gt))
        .filter((g): g is ClassGrade => !!g && !isUngraded(g));
      s.gradedCount = graded.length;
      s.average = mean(graded.map((g) => g.grade));
      s.level = getLevel(s.average);
    });

    // Stable name order so rows do not jump around after an edit.
    return Object.values(grouped).sort((a, b) => {
      const nameA = `${a.student?.firstName || ""} ${a.student?.lastName || ""}`
        .trim()
        .toLowerCase();
      const nameB = `${b.student?.firstName || ""} ${b.student?.lastName || ""}`
        .trim()
        .toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [gradesData?.data, gradeTypes]);

  // Class-level numbers for the summary strip and the footer row.
  const summary = useMemo(() => {
    const averages = students
      .map((s) => s.average)
      .filter((a): a is number => a !== null);
    const levels: Record<Level, number> = {
      Distinction: 0,
      Credit: 0,
      Pass: 0,
      "Not pass": 0,
      "Not graded": 0,
    };
    students.forEach((s) => (levels[s.level] += 1));

    const columnAverages = new Map<string, number | null>();
    gradeTypes.forEach((gt) => {
      const scores = students
        .map((s) => getStudentGradeForType(s.grades, gt))
        .filter((g): g is ClassGrade => !!g && !isUngraded(g))
        .map((g) => g.grade);
      columnAverages.set(gt.id, mean(scores));
    });

    return { classAverage: mean(averages), levels, columnAverages };
  }, [students, gradeTypes]);

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
      link.setAttribute(
        "download",
        `grades-${classInfo?.code || classId}-${timestamp}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Grades exported successfully!");
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error("Export error:", error);
      toast.error(
        axiosError.response?.data?.message || "Failed to export grades"
      );
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

  const fmt = (n: number | null) => (n === null ? "—" : n.toFixed(1));
  const pageHint = totalPages > 1 ? ` · page ${page}` : "";
  const stickyBase = "bg-card sm:sticky sm:border-r sm:border-border";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="overflow-hidden rounded-lg border bg-card">
        {classInfo.color && (
          <div
            className="h-2 w-full shrink-0"
            style={{ backgroundColor: classInfo.color }}
            aria-hidden
          />
        )}
        <div className="flex flex-wrap items-start justify-between gap-3 p-4">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/grades/classes")}
              className="mt-0.5 shrink-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Back to Classes</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">{classInfo.name}</h1>
              <p className="text-sm text-muted-foreground">
                {classInfo.code} •{" "}
                {classInfo.course?.title || "No course assigned"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SectionGradeTypesDialog
              sectionId={classId}
              sectionName={classInfo.name}
            />
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={isExporting}
            >
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">
                {isExporting ? "Exporting..." : "Export Excel"}
              </span>
              <span className="sm:hidden">{isExporting ? "..." : "Export"}</span>
            </Button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-2 divide-x divide-border border-t sm:grid-cols-4">
          <div className="px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Students
            </div>
            <div className="text-lg font-semibold tabular-nums">
              {totalStudents}
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Class average{pageHint}
            </div>
            <div
              className={cn(
                "text-lg font-semibold tabular-nums",
                summary.classAverage !== null && scoreTone(summary.classAverage)
              )}
            >
              {fmt(summary.classAverage)}
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Grade columns
            </div>
            <div className="text-lg font-semibold tabular-nums">
              {gradeTypes.length}
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Levels{pageHint}
            </div>
            <div className="mt-1 flex flex-wrap gap-1 text-xs">
              {(["Distinction", "Credit", "Pass", "Not pass"] as Level[]).map(
                (lvl) => (
                  <span
                    key={lvl}
                    className={cn(
                      "rounded-md border px-1.5 py-0.5 tabular-nums",
                      LEVEL_STYLES[lvl]
                    )}
                    title={lvl}
                  >
                    {summary.levels[lvl]} {lvl}
                  </span>
                )
              )}
              {summary.levels["Not graded"] > 0 && (
                <span className="rounded-md border border-dashed px-1.5 py-0.5 text-muted-foreground">
                  {summary.levels["Not graded"]} not graded
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info banner if using default grade types */}
      {(!sectionGradeTypes || sectionGradeTypes.length === 0) && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
          <span className="text-sm text-blue-800 dark:text-blue-200">
            This section is using all active grade types.{" "}
            <span className="font-medium">
              Configure specific grade types for this section
            </span>{" "}
            to customize which types are available.
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, English name or student ID"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 pr-8"
          />
          {searchInput && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={focusedTypeId} onValueChange={setFocusedTypeId}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Columns" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All columns</SelectItem>
            {gradeTypes.map((gradeType) => (
              <SelectItem key={gradeType.id} value={gradeType.id}>
                Only {gradeType.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          {isFetching && <Spinner className="size-4" />}
          <span className="hidden sm:inline">Rows</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className="h-9 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grades table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 z-[50] w-10 border-r border-border bg-card">
                  No
                </TableHead>
                <TableHead
                  className={cn(
                    stickyBase,
                    "min-w-[160px] sm:left-[41px] sm:z-[50]"
                  )}
                >
                  Student
                </TableHead>
                <TableHead
                  className={cn(
                    stickyBase,
                    "min-w-[110px] sm:left-[201px] sm:z-[50]"
                  )}
                >
                  Eng name
                </TableHead>
                <TableHead className="min-w-[110px]">Level</TableHead>
                <TableHead className="min-w-[80px] text-center">Avg</TableHead>
                {visibleTypes.map((gradeType) => (
                  <TableHead
                    key={gradeType.id}
                    className="min-w-[84px] text-center whitespace-nowrap"
                  >
                    {gradeType.name}
                  </TableHead>
                ))}
                <TableHead className="w-14 text-center">Chart</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s, index) => (
                <TableRow key={s.student.id} className="group">
                  <TableCell className="sticky left-0 z-[40] border-r border-border bg-card font-medium tabular-nums text-muted-foreground group-hover:bg-muted/50">
                    {(page - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell
                    className={cn(
                      stickyBase,
                      "sm:left-[41px] sm:z-[40] group-hover:bg-muted/50"
                    )}
                  >
                    <div className="font-medium leading-tight">
                      {s.student.firstName} {s.student.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.student.studentId}
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      stickyBase,
                      "sm:left-[201px] sm:z-[40] group-hover:bg-muted/50"
                    )}
                  >
                    {s.student.engName || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <LevelBadge level={s.level} />
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-center font-semibold tabular-nums",
                      s.average === null
                        ? "text-muted-foreground"
                        : scoreTone(s.average)
                    )}
                    title={`${s.gradedCount} of ${gradeTypes.length} columns graded`}
                  >
                    {fmt(s.average)}
                  </TableCell>
                  {visibleTypes.map((gradeType) => {
                    const grade = getStudentGradeForType(s.grades, gradeType);
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
                              label={gradeType.name}
                              onUpdate={refetch}
                            />
                          )
                        ) : (
                          <span
                            className="text-muted-foreground"
                            title="No grade record for this column yet. Re-save the enrollment to create it."
                          >
                            -
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center">
                    <StudentGradeChartDialog
                      student={s.student}
                      grades={s.grades}
                      gradeTypes={gradeTypes}
                      classInfo={classInfo}
                    />
                  </TableCell>
                </TableRow>
              ))}

              {students.length > 0 && (
                <TableRow className="border-t-2 bg-muted/30 hover:bg-muted/30">
                  <TableCell className="sticky left-0 z-[40] border-r border-border bg-card" />
                  <TableCell
                    className={cn(
                      stickyBase,
                      "sm:left-[41px] sm:z-[40] text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    )}
                  >
                    Class average{pageHint}
                  </TableCell>
                  <TableCell className={cn(stickyBase, "sm:left-[201px] sm:z-[40]")} />
                  <TableCell />
                  <TableCell
                    className={cn(
                      "text-center font-semibold tabular-nums",
                      summary.classAverage === null
                        ? "text-muted-foreground"
                        : scoreTone(summary.classAverage)
                    )}
                  >
                    {fmt(summary.classAverage)}
                  </TableCell>
                  {visibleTypes.map((gt) => {
                    const avg = summary.columnAverages.get(gt.id) ?? null;
                    return (
                      <TableCell
                        key={gt.id}
                        className={cn(
                          "text-center text-sm font-medium tabular-nums",
                          avg === null ? "text-muted-foreground" : scoreTone(avg)
                        )}
                      >
                        {fmt(avg)}
                      </TableCell>
                    );
                  })}
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {students.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <div className="mb-4 text-6xl">📊</div>
          <h3 className="mb-2 text-lg font-semibold">No students found</h3>
          <p className="text-muted-foreground">
            {search
              ? "No enrolled students match your search"
              : "No students are currently enrolled in this class"}
          </p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-2">
        <div className="text-sm text-muted-foreground">
          {totalStudents === 0
            ? "No students"
            : `Showing ${(page - 1) * pageSize + 1} to ${Math.min(
                page * pageSize,
                totalStudents
              )} of ${totalStudents} students`}
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
          <span className="text-sm tabular-nums">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((prev) => Math.min(totalPages || 1, prev + 1))
            }
            disabled={page >= (totalPages || 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
