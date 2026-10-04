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

  // Color function for bars (based on 100-point scale)
  const getColor = (grade: number, hasGrade: boolean) => {
    if (!hasGrade) return "#e5e7eb"; // Gray for no grade
    if (grade >= 85) return "#10b981"; // Green
    if (grade >= 70) return "#3b82f6"; // Blue
    if (grade >= 55) return "#f59e0b"; // Yellow
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
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[96vw] h-[92vh] max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Grade Chart - {student.firstName} {student.lastName}
            {student.engName && ` (${student.engName})`}
          </DialogTitle>
          <DialogDescription>
            Student ID: {student.studentId} | Average: {average.toFixed(1)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="flex flex-col lg:flex-row gap-6 p-4 h-full">
            {/* Chart: horizontal bars, one row per grade type */}
            <div
              className="flex-1 min-w-0"
              style={{ minHeight: Math.max(320, chartData.length * 44 + 60) }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 8, right: 32, bottom: 8, left: 8 }}
                  barCategoryGap={12}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fontSize: 13 }}
                    interval={0}
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
                  <Bar dataKey="grade" radius={[0, 4, 4, 0]} maxBarSize={28}>
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
            <div className="border rounded-lg flex-shrink-0 self-start overflow-auto max-h-full">
              <table className="text-sm whitespace-nowrap">
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
                              item.grade >= 85
                                ? "bg-green-100 text-green-800"
                                : item.grade >= 70
                                ? "bg-blue-100 text-blue-800"
                                : item.grade >= 55
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.grade >= 85
                              ? "Excellent"
                              : item.grade >= 70
                              ? "Good"
                              : item.grade >= 55
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

