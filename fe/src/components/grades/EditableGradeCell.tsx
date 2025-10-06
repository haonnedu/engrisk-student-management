"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useUpdateGrade } from "@/hooks/useGrades";
import { toast } from "sonner";

interface EditableGradeCellProps {
  grade: {
    id: string;
    grade: number;
    gradeType: string;
    studentId: string;
    courseId: string;
  };
  onUpdate: () => void;
}

export function EditableGradeCell({ grade, onUpdate }: EditableGradeCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(grade.grade.toString());
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
        data: { grade: newGrade },
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
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyPress}
          className="h-8 w-16 text-center text-sm"
          type="number"
          min="0"
          max="100"
          autoFocus
          disabled={isLoading}
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={handleSave}
          disabled={isLoading}
        >
          <Check className="h-3 w-3 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <X className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer hover:bg-muted rounded px-2 py-1 text-center"
      onClick={() => setIsEditing(true)}
      title="Click to edit"
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
    </div>
  );
}
