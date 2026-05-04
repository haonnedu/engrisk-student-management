"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useClasses, type ClassSection } from "@/hooks/useClasses";
import { useCourses, type Course } from "@/hooks/useCourses";
import { useSectionGradeTypes } from "@/hooks/useSectionGradeTypes";
import { useLevelUpClass, type LevelUpResult } from "@/hooks/useEnrollments";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  SkipForward,
  XCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type LevelUpClassDialogProps = {
  sourceClass: ClassSection;
  trigger?: React.ReactNode;
};

export function LevelUpClassDialog({ sourceClass, trigger }: LevelUpClassDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"configure" | "results">("configure");

  const [targetCourseId, setTargetCourseId] = useState("");
  const [targetSectionId, setTargetSectionId] = useState("");

  const { data: coursesData } = useCourses(1, 100);
  const { data: classesData } = useClasses(1, 100);
  const { data: targetGradeTypes } = useSectionGradeTypes(targetSectionId);

  const [result, setResult] = useState<LevelUpResult | null>(null);
  const levelUpMutation = useLevelUpClass();

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("configure");
      setTargetCourseId("");
      setTargetSectionId("");
      setResult(null);
    }
  }, [open]);

  // Reset target section when target course changes
  useEffect(() => {
    setTargetSectionId("");
  }, [targetCourseId]);

  // Filter out the source course and filter sections by selected target course
  const availableCourses = useMemo(
    () => coursesData?.data?.filter((c: Course) => c.id !== sourceClass.courseId) ?? [],
    [coursesData?.data, sourceClass.courseId]
  );

  const targetSections = useMemo(
    () =>
      classesData?.data?.filter(
        (s: ClassSection) =>
          s.courseId === targetCourseId && s.id !== sourceClass.id
      ) ?? [],
    [classesData?.data, targetCourseId, sourceClass.id]
  );

  const activeTargetGradeTypes = targetGradeTypes?.filter((gt) => gt.isActiveInSection) ?? [];
  const targetHasGradeTypes = targetSectionId && activeTargetGradeTypes.length > 0;

  const canSubmit =
    targetCourseId && targetSectionId && targetHasGradeTypes && !levelUpMutation.isPending;

  const enrolledCount = sourceClass.enrollments?.length ?? 0;

  const handleSubmit = async () => {
    try {
      const res = await levelUpMutation.mutateAsync({
        sourceSectionId: sourceClass.id,
        targetCourseId,
        targetSectionId,
      });
      setResult(res);
      setStep("results");

      if (res.failed === 0) {
        toast.success(`${res.succeeded} student${res.succeeded !== 1 ? "s" : ""} leveled up successfully!`);
      } else if (res.succeeded === 0) {
        toast.error(`All ${res.failed} students failed to level up.`);
      } else {
        toast.warning(`${res.succeeded} succeeded, ${res.failed} failed.`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to level up class.");
    }
  };

  const targetSectionName =
    classesData?.data?.find((s: ClassSection) => s.id === targetSectionId)?.name ?? "";
  const targetCourseName =
    coursesData?.data?.find((c: Course) => c.id === targetCourseId)?.title ?? "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Level Up Class
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Level Up Class
          </DialogTitle>
          <DialogDescription>
            {step === "configure"
              ? "Move all enrolled students to a new course and class."
              : "Review the results below."}
          </DialogDescription>
        </DialogHeader>

        {step === "configure" ? (
          <div className="flex flex-col gap-0">
            {/* Source class info */}
            <div className="px-6 py-4 bg-muted/20 border-b">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Source Class
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{sourceClass.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {sourceClass.course?.title ?? "No course"} · {sourceClass.code}
                  </p>
                </div>
                <Badge variant="secondary">{enrolledCount} students</Badge>
              </div>
            </div>

            {/* Arrow indicator */}
            <div className="flex justify-center py-2 bg-muted/10 border-b">
              <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
            </div>

            {/* Target selectors */}
            <div className="px-6 py-4 space-y-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Target
              </p>

              <div className="grid gap-1.5">
                <Label>
                  Course <span className="text-destructive">*</span>
                </Label>
                <Select value={targetCourseId} onValueChange={setTargetCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target course" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses.length === 0 ? (
                      <SelectItem value="__empty__" disabled>
                        No other courses available
                      </SelectItem>
                    ) : (
                      availableCourses.map((course: Course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title} ({course.courseCode})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label>
                  Class <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={targetSectionId}
                  onValueChange={setTargetSectionId}
                  disabled={!targetCourseId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        targetCourseId ? "Select target class" : "Select course first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {targetSections.length === 0 ? (
                      <SelectItem value="__empty__" disabled>
                        No classes for this course
                      </SelectItem>
                    ) : (
                      targetSections.map((s: ClassSection) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Grade type warning */}
              {targetSectionId && targetGradeTypes !== undefined && (
                <div
                  className={cn(
                    "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
                    targetHasGradeTypes
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                  )}
                >
                  {targetHasGradeTypes ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  )}
                  <span>
                    {targetHasGradeTypes
                      ? `${activeTargetGradeTypes.length} grade type${activeTargetGradeTypes.length !== 1 ? "s" : ""} configured — ready to enroll.`
                      : "This class has no grade types configured. Please set up grade types before leveling up."}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Results step */
          <div className="flex flex-col">
            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-4 px-6 py-3 border-b bg-muted/20">
              {result && result.succeeded > 0 && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {result.succeeded} succeeded
                </div>
              )}
              {result && result.skipped > 0 && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <SkipForward className="h-4 w-4" />
                    {result.skipped} skipped
                  </div>
                </>
              )}
              {result && result.failed > 0 && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                    <XCircle className="h-4 w-4" />
                    {result.failed} failed
                  </div>
                </>
              )}
            </div>

            {/* Per-student results */}
            <div className="overflow-y-auto px-6 py-3 space-y-2" style={{ maxHeight: 340 }}>
              {result?.details.map((r, i) => {
                const name = r.student.engName
                  ? `${r.student.engName} · ${r.student.firstName} ${r.student.lastName}`
                  : `${r.student.firstName} ${r.student.lastName}`;
                return (
                  <div
                    key={r.student.id ?? i}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm",
                      r.status === "success"
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
                        : r.status === "skipped"
                        ? "border-border bg-muted/30"
                        : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                    )}
                  >
                    {r.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    ) : r.status === "skipped" ? (
                      <SkipForward className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{name}</p>
                      {r.reason && (
                        <p className="text-xs text-muted-foreground mt-0.5">{r.reason}</p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium shrink-0 mt-0.5",
                        r.status === "success"
                          ? "text-emerald-700 dark:text-emerald-300"
                          : r.status === "skipped"
                          ? "text-muted-foreground"
                          : "text-destructive"
                      )}
                    >
                      {r.status === "success"
                        ? "Leveled up"
                        : r.status === "skipped"
                        ? "Skipped"
                        : "Failed"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t">
          {step === "configure" ? (
            <>
              <div className="text-xs text-muted-foreground">
                {!targetCourseId && "Select a course to continue."}
                {targetCourseId && !targetSectionId && "Select a class to continue."}
                {targetSectionId && !targetHasGradeTypes && "Class needs grade types."}
                {canSubmit && (
                  <span>
                    {enrolledCount} student{enrolledCount !== 1 ? "s" : ""} will move to{" "}
                    <strong>{targetCourseName}</strong> — {targetSectionName}.
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!canSubmit} className="min-w-28">
                  {levelUpMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Level Up
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div />
              <Button onClick={() => setOpen(false)}>Done</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
