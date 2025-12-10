"use client";
import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type StudentGradeChartDialogProps = {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    engName?: string;
    studentId: string;
  };
  grades: Array<{
    id: string;
    grade: number;
    gradeType?: {
      id: string;
      name: string;
      code: string;
    };
    gradeTypeId?: string;
  }>;
  gradeTypes: Array<{
    id: string;
    name: string;
    code: string;
  }>;
};

export function StudentGradeChartDialog({
  student,
  grades,
  gradeTypes,
}: StudentGradeChartDialogProps) {
  // Prepare chart data
  const chartData = useMemo(() => {
    return gradeTypes.map((gradeType) => {
      const grade = grades.find(
        (g) =>
          g.gradeType?.id === gradeType.id ||
          g.gradeTypeId === gradeType.id ||
          g.gradeType?.code === gradeType.code
      );

      return {
        name: gradeType.name,
        code: gradeType.code,
        grade: grade ? grade.grade : 0,
        hasGrade: !!grade,
      };
    });
  }, [grades, gradeTypes]);

  // Calculate average
  const average = useMemo(() => {
    const gradesWithValues = grades.filter((g) => g.grade > 0);
    if (gradesWithValues.length === 0) return 0;
    const sum = gradesWithValues.reduce((acc, g) => acc + g.grade, 0);
    return sum / gradesWithValues.length;
  }, [grades]);

  // Color function for bars
  const getColor = (grade: number, hasGrade: boolean) => {
    if (!hasGrade) return "#e5e7eb"; // Gray for no grade
    if (grade >= 8.5) return "#10b981"; // Green
    if (grade >= 7.0) return "#3b82f6"; // Blue
    if (grade >= 5.5) return "#f59e0b"; // Yellow
    return "#ef4444"; // Red
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <BarChart3 className="h-4 w-4" />
          <span className="sr-only">View grade chart</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Grade Chart - {student.firstName} {student.lastName}
            {student.engName && ` (${student.engName})`}
          </DialogTitle>
          <DialogDescription>
            Student ID: {student.studentId} | Average: {average.toFixed(1)}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {/* Chart */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  width={40}
                />
                <Tooltip
                  formatter={(value: number, name: string, props: any) => {
                    if (!props.payload.hasGrade) {
                      return ["No grade", "N/A"];
                    }
                    return [`${value.toFixed(1)}`, "Grade"];
                  }}
                  labelFormatter={(label) => `Grade Type: ${label}`}
                  contentStyle={{ fontSize: "12px" }}
                />
                <Bar dataKey="grade" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getColor(entry.grade, entry.hasGrade)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Grade Summary Table */}
          <div className="border rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Grade Type</th>
                    <th className="px-4 py-2 text-center">Grade</th>
                    <th className="px-4 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, index) => (
                    <tr
                      key={index}
                      className="border-t hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-2 font-medium">{item.name}</td>
                      <td className="px-4 py-2 text-center">
                        {item.hasGrade ? (
                          <span className="font-semibold">
                            {item.grade.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {item.hasGrade ? (
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              item.grade >= 8.5
                                ? "bg-green-100 text-green-800"
                                : item.grade >= 7.0
                                ? "bg-blue-100 text-blue-800"
                                : item.grade >= 5.5
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.grade >= 8.5
                              ? "Excellent"
                              : item.grade >= 7.0
                              ? "Good"
                              : item.grade >= 5.5
                              ? "Average"
                              : "Needs Improvement"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            No grade
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

