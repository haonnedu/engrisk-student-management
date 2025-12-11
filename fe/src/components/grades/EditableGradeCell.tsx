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
  onUpdate: () => void;
}

export function EditableGradeCell({ grade, onUpdate }: EditableGradeCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(grade.grade.toString());
  const [comments, setComments] = useState(grade.comments || "");
  const [isLoading, setIsLoading] = useState(false);

  const updateGradeMutation = useUpdateGrade();

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
        data: { grade: newGrade, comments: comments || undefined },
      });
      setIsEditing(false);
      onUpdate();
      toast.success("Grade updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update grade");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(grade.grade.toString());
    setComments(grade.comments || "");
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

  if (isEditing) {
    return (
      <Popover open={isEditing} onOpenChange={setIsEditing}>
        <PopoverTrigger asChild>
          <div className="cursor-pointer hover:bg-muted rounded px-2 py-1 text-center">
            <span
              className={
                grade.grade >= 8.5
                  ? "text-green-600 font-medium"
                  : grade.grade >= 7.0
                  ? "text-blue-600"
                  : grade.grade >= 5.5
                  ? "text-yellow-600"
                  : "text-red-600"
              }
            >
              {grade.grade}
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="center">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Score (0-100)
              </label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyPress}
                className="h-8 text-center text-sm mt-1"
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
                className="h-16 text-sm mt-1 resize-none"
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
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isLoading}
              >
                <Check className="h-3 w-3 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div
      className="cursor-pointer hover:bg-muted rounded px-2 py-1 text-center relative group"
      onClick={() => setIsEditing(true)}
      title={grade.comments ? `Comment: ${grade.comments}` : "Click to edit"}
    >
      <span
        className={
          grade.grade >= 8.5
            ? "text-green-600 font-medium"
            : grade.grade >= 7.0
            ? "text-blue-600"
            : grade.grade >= 5.5
            ? "text-yellow-600"
            : "text-red-600"
        }
      >
        {grade.grade}
      </span>
      {grade.comments && (
        <MessageSquare className="h-3 w-3 text-primary absolute -top-1 -right-1 opacity-70" />
      )}
    </div>
  );
}
