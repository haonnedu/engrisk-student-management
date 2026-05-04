"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { useCourses, type Course } from "@/hooks/useCourses";
import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Debounce ──────────────────────────────────────────────────────────────────
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

// ── Inline checkbox button (no Radix dep) ─────────────────────────────────────
function Checkbox({
  checked,
  indeterminate = false,
  onToggle,
  stopClick = false,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onToggle: () => void;
  stopClick?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (stopClick) e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "h-4 w-4 shrink-0 rounded-sm border transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        checked || indeterminate
          ? "bg-primary border-primary text-primary-foreground"
          : "border-input bg-background hover:border-primary/60"
      )}
    >
      {indeterminate ? (
        <span className="flex items-center justify-center text-primary-foreground leading-none text-[11px] font-bold">
          −
        </span>
      ) : checked ? (
        <svg viewBox="0 0 12 12" fill="none" className="w-full h-full p-0.5">
          <path
            d="M2 6l3 3 5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </button>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────
type EnrollStatus = "ENROLLED" | "COMPLETED" | "DROPPED" | "FAILED";

interface BulkResult {
  studentId: string;
  studentName: string;
  success: boolean;
  error?: string;
}

interface BulkEnrollDialogProps {
  trigger?: React.ReactNode;
  onDone?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────
export function BulkEnrollDialog({ trigger, onDone }: BulkEnrollDialogProps) {
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"select" | "results">("select");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchQuery, 400);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Enrollment options
  const [courseId, setCourseId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [enrollStatus, setEnrollStatus] = useState<EnrollStatus>("ENROLLED");

  // Submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<BulkResult[]>([]);

  // Data
  const { data: studentsData, isLoading: isStudentsLoading } = useStudents(
    page,
    15,
    statusFilter === "all" ? undefined : statusFilter,
    debouncedSearch || undefined
  );
  const { data: coursesData } = useCourses(1, 100);
  const { data: classesData } = useClasses(1, 100);

  const filteredSections = useMemo(
    () => classesData?.data?.filter((s: any) => s.courseId === courseId) ?? [],
    [classesData?.data, courseId]
  );

  const students: any[] = studentsData?.data ?? [];
  const totalPages: number = studentsData?.meta?.totalPages ?? 1;
  const totalStudents: number = studentsData?.meta?.total ?? students.length;

  useEffect(() => { setSectionId("none"); }, [courseId]);

  useEffect(() => {
    if (!open) {
      setStep("select");
      setSearchQuery("");
      setStatusFilter("all");
      setPage(1);
      setSelectedIds(new Set());
      setCourseId("");
      setSectionId("");
      setEnrollStatus("ENROLLED");
      setIsSubmitting(false);
      setResults([]);
    }
  }, [open]);

  // ── Selection ────────────────────────────────────────────────────────────────
  const currentPageIds = useMemo(() => students.map((s) => s.id as string), [students]);
  const allPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));
  const somePageSelected = currentPageIds.some((id) => selectedIds.has(id)) && !allPageSelected;

  const toggleStudent = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAllPage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) currentPageIds.forEach((id) => next.delete(id));
      else currentPageIds.forEach((id) => next.add(id));
      return next;
    });
  }, [allPageSelected, currentPageIds]);

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!courseId || !sectionId || selectedIds.size === 0) return;

    const nameLookup: Record<string, string> = {};
    students.forEach((s) => {
      nameLookup[s.id] = s.engName
        ? `${s.engName} (${s.firstName} ${s.lastName})`
        : `${s.firstName} ${s.lastName}`;
    });

    setIsSubmitting(true);

    const payload = [...selectedIds].map((studentId) => ({
      studentId,
      courseId,
      sectionId,
      status: enrollStatus,
    }));

    const settled = await Promise.allSettled(
      payload.map((data) => api.post("/enrollments", data))
    );

    const bulkResults: BulkResult[] = settled.map((result, i) => {
      const sid = payload[i].studentId;
      const name = nameLookup[sid] ?? sid;
      if (result.status === "fulfilled") return { studentId: sid, studentName: name, success: true };
      const err = (result.reason as any)?.response?.data?.message ?? (result.reason as any)?.message ?? "Unknown error";
      return { studentId: sid, studentName: name, success: false, error: err };
    });

    const successCount = bulkResults.filter((r) => r.success).length;
    const failCount = bulkResults.length - successCount;

    queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    queryClient.invalidateQueries({ queryKey: ["classes"] });

    if (failCount === 0) toast.success(`${successCount} student${successCount !== 1 ? "s" : ""} enrolled successfully!`);
    else if (successCount === 0) toast.error(`All ${failCount} enrollments failed.`);
    else toast.warning(`${successCount} enrolled, ${failCount} failed.`);

    setResults(bulkResults);
    setIsSubmitting(false);
    setStep("results");
    onDone?.();
  };

  const canSubmit = selectedIds.size > 0 && courseId.length > 0 && sectionId.length > 0 && !isSubmitting;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Bulk Enroll
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl w-full p-0 gap-0">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Bulk Enroll Students
          </DialogTitle>
          <DialogDescription>
            {step === "select"
              ? "Choose a course, filter and select students, then enroll them all at once."
              : "Review the enrollment results below."}
          </DialogDescription>
        </DialogHeader>

        {step === "select" ? (
          <div className="flex flex-col">
            {/* ── Enrollment options bar ────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-6 py-4 border-b bg-muted/20">
              <div className="grid gap-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Course <span className="text-destructive">*</span>
                </Label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger className="h-9">
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
              </div>

              <div className="grid gap-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Class <span className="text-destructive">*</span>
                </Label>
                <Select value={sectionId} onValueChange={setSectionId} disabled={!courseId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={courseId ? "Select class" : "Select course first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSections.length === 0 && (
                      <SelectItem value="__empty__" disabled>
                        No classes for this course
                      </SelectItem>
                    )}
                    {filteredSections.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Status
                </Label>
                <Select value={enrollStatus} onValueChange={(v) => setEnrollStatus(v as EnrollStatus)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENROLLED">Enrolled</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="DROPPED">Dropped</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Search + filter ───────────────────────────────────────── */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by name or student ID..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {selectedIds.size > 0 && (
                <Badge variant="default" className="shrink-0 rounded-full">
                  {selectedIds.size} selected
                </Badge>
              )}
            </div>

            {/* ── Column header ─────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/20 text-xs font-medium text-muted-foreground">
              <Checkbox
                checked={allPageSelected}
                indeterminate={somePageSelected}
                onToggle={toggleAllPage}
                ariaLabel="Toggle all on this page"
              />
              <span className="flex-1">Student</span>
              <span className="w-36 text-right shrink-0">Student ID</span>
            </div>

            {/* ── Student rows ──────────────────────────────────────────── */}
            <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
              {isStudentsLoading ? (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-10">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading students...
                </div>
              ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground py-10">
                  <Users className="h-7 w-7 opacity-25" />
                  No students found
                </div>
              ) : (
                <div className="divide-y">
                  {students.map((student) => {
                    const isSelected = selectedIds.has(student.id);
                    const displayName = student.engName
                      ? `${student.engName} · ${student.firstName} ${student.lastName}`
                      : `${student.firstName} ${student.lastName}`;
                    return (
                      <div
                        key={student.id}
                        onClick={() => toggleStudent(student.id)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 cursor-pointer select-none transition-colors duration-100",
                          "hover:bg-accent/60",
                          isSelected && "bg-primary/5 hover:bg-primary/8"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onToggle={() => toggleStudent(student.id)}
                          stopClick
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{displayName}</p>
                          {student.user?.email && (
                            <p className="text-xs text-muted-foreground truncate">
                              {student.user.email}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground w-36 text-right shrink-0 font-mono truncate">
                          {student.studentId || "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Pagination ────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/10 text-xs text-muted-foreground">
              <span>
                Page {page} of {totalPages}
                {totalStudents > 0 && <> · <strong className="text-foreground">{totalStudents}</strong> total</>}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-6 w-6 p-0">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="h-6 w-6 p-0">
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Results ──────────────────────────────────────────────────── */
          <div className="flex flex-col">
            <div className="flex items-center gap-4 px-6 py-3 border-b bg-muted/20">
              <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {results.filter((r) => r.success).length} succeeded
              </div>
              {results.some((r) => !r.success) && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {results.filter((r) => !r.success).length} failed
                  </div>
                </>
              )}
            </div>
            <div className="overflow-y-auto px-6 py-3 space-y-2" style={{ maxHeight: 380 }}>
              {results.map((r) => (
                <div
                  key={r.studentId}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm",
                    r.success
                      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
                      : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                  )}
                >
                  {r.success
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    : <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{r.studentName}</p>
                    {!r.success && r.error && (
                      <p className="text-xs text-destructive mt-0.5">{r.error}</p>
                    )}
                  </div>
                  <span className={cn("text-xs font-medium shrink-0 mt-0.5", r.success ? "text-emerald-700 dark:text-emerald-300" : "text-destructive")}>
                    {r.success ? "Enrolled" : "Failed"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          {step === "select" ? (
            <>
              {/* Left: validation hints */}
              <div className="flex flex-col gap-0.5">
                {!courseId && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Select a course to continue
                  </p>
                )}
                {courseId && !sectionId && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Select a class to continue
                  </p>
                )}
                {courseId && sectionId && selectedIds.size === 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> No students selected
                  </p>
                )}
              </div>
              {/* Right: actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!canSubmit} className="min-w-36">
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enrolling...</>
                  ) : (
                    <><UserPlus className="h-4 w-4 mr-2" />
                      Enroll {selectedIds.size > 0 ? `${selectedIds.size} ` : ""}Student{selectedIds.size !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setStep("select"); setSelectedIds(new Set()); setResults([]); }}>
                  Enroll More
                </Button>
                <Button onClick={() => setOpen(false)}>Done</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
