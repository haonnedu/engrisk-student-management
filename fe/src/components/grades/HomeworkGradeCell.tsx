"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { HomeworkDialog } from "./HomeworkDialog";

interface HomeworkGradeCellProps {
  grade: {
    id: string;
    grade: number;
    gradeType: string;
    studentId: string;
    courseId: string;
  };
  classId: string;
  className: string;
  onUpdate: () => void;
}

export function HomeworkGradeCell({
  grade,
  classId,
  className,
  onUpdate,
}: HomeworkGradeCellProps) {
  const [homeworkGrade, setHomeworkGrade] = useState(grade.grade);

  // Update homework grade when grade prop changes
  React.useEffect(() => {
    setHomeworkGrade(grade.grade);
  }, [grade.grade]);

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={
          homeworkGrade >= 80
            ? "default"
            : homeworkGrade >= 70
            ? "secondary"
            : homeworkGrade >= 50
            ? "outline"
            : "destructive"
        }
        className="cursor-pointer hover:opacity-80"
      >
        {homeworkGrade}
      </Badge>
      <HomeworkDialog
        classId={classId}
        className={className}
        currentGrade={homeworkGrade}
        studentId={grade.studentId}
        onGradeUpdate={onUpdate}
        trigger={
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            title="Manage homework"
          >
            <BookOpen className="h-3 w-3" />
          </Button>
        }
      />
    </div>
  );
}
