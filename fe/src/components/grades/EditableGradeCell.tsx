"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, X, MessageSquare } from "lucide-react";
import { useUpdateGrade } from "@/hooks/useGrades";
import { cn } from "@/lib/utils";
import { AxiosError } from "axios";
import { toast } from "sonner";

interface EditableGradeCellProps {
  grade: {
    id: string;
    grade: number;
    gradeType: string;
    studentId: string;
    courseId: string;
    comments?: string;
  };
  /** Shown in the editor popover so the teacher knows which column they edit. */
  label?: string;
  onUpdate: () => void;
}

/** Rows created automatically when a student is enrolled carry this comment. */
export const isAutoComment = (comments?: string) =>
  !!comments && comments.startsWith("Auto-generated");

/** A score of 0 on an auto-generated row means "not graded yet". */
export const isUngraded = (grade: { grade: number; comments?: string }) =>
  grade.grade === 0 && isAutoComment(grade.comments);

/** Scores are 0-100. Thresholds match the Distinction / Credit / Pass labels. */
export const scoreTone = (score: number) =>
  score >= 80
    ? "text-emerald-600 dark:text-emerald-400"
    : score >= 70
    ? "text-blue-600 dark:text-blue-400"
    : score >= 50
    ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";

export function EditableGradeCell({ grade, label, onUpdate }: EditableGradeCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(grade.grade.toString());
  const [comments, setComments] = useState(
    isAutoComment(grade.comments) ? "" : grade.comments || ""
  );
  const [isLoading, setIsLoading] = useState(false);

  const updateGradeMutation = useUpdateGrade();
  const ungraded = isUngraded(grade);
  const hasRealComment = !!grade.comments && !isAutoComment(grade.comments);

  const handleSave = async () => {
    const newGrade = parseFloat(value);

    if (isNaN(newGrade) || newGrade < 0 || newGrade > 100) {
      toast.error("Grade must be between 0 and 100");
      return;
    }

    setIsLoading(true);
    try {
      await updateGradeMutation.mutateAsync({
        id: grade.id,
        // Always send a string so the "Auto-generated" placeholder is cleared
        // once the teacher has actually graded the cell.
        data: { grade: newGrade, comments },
      });
      setIsEditing(false);
      onUpdate();
      toast.success("Grade updated");
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || "Failed to update grade"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(grade.grade.toString());
    setComments(isAutoComment(grade.comments) ? "" : grade.comments || "");
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const display = (
    <button
      type="button"
      className={cn(
        "group relative inline-flex h-8 min-w-[2.75rem] items-center justify-center rounded-md px-2 text-sm tabular-nums",
        "transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        ungraded
          ? "text-muted-foreground/60 border border-dashed border-border"
          : cn("font-medium", scoreTone(grade.grade))
      )}
      title={
        ungraded
          ? "Not graded yet. Click to enter a score."
          : hasRealComment
          ? `Comment: ${grade.comments}`
          : "Click to edit"
      }
    >
      {ungraded ? "·" : grade.grade}
      {hasRealComment && (
        <MessageSquare className="absolute -right-1 -top-1 h-3 w-3 text-primary opacity-80" />
      )}
    </button>
  );

  return (
    <Popover
      open={isEditing}
      onOpenChange={(open) => (open ? setIsEditing(true) : handleCancel())}
    >
      <PopoverTrigger asChild>{display}</PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="center">
        <div className="space-y-3">
          {label && (
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Score (0-100)
            </label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyPress}
              onFocus={(e) => e.target.select()}
              className="mt-1 h-8 text-center text-sm"
              type="number"
              min="0"
              max="100"
              autoFocus
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Comments
            </label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Add comment..."
              className="mt-1 h-16 resize-none text-sm"
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="mr-1 h-3 w-3" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isLoading}>
              <Check className="mr-1 h-3 w-3" />
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
