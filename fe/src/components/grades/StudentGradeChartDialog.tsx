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
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-[96vw] lg:max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Grade Chart - {student.firstName} {student.lastName}
            {student.engName && ` (${student.engName})`}
          </DialogTitle>
          <DialogDescription>
            Student ID: {student.studentId} | Average: {average.toFixed(1)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
          {/* Grade summary: one column per grade type */}
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left sticky left-0 bg-muted">
                    Grade Type
                  </th>
                  {chartData.map((item, index) => (
                    <th key={index} className="px-4 py-2 text-center">
                      {item.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium sticky left-0 bg-background">
                    Grade
                  </td>
                  {chartData.map((item, index) => (
                    <td key={index} className="px-4 py-2 text-center">
                      {item.hasGrade ? (
                        <span className="font-semibold">
                          {item.grade.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-medium sticky left-0 bg-background">
                    Status
                  </td>
                  {chartData.map((item, index) => (
                    <td key={index} className="px-4 py-2 text-center">
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
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Compact chart below the table */}
          <div className="border rounded-lg p-3">
            <div
              className="h-64 mx-auto"
              style={{ maxWidth: Math.max(360, chartData.length * 90 + 80) }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={chartData.length > 8 ? -30 : 0}
                    textAnchor={chartData.length > 8 ? "end" : "middle"}
                    height={chartData.length > 8 ? 60 : 30}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    width={36}
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
                  <Bar dataKey="grade" radius={[4, 4, 0, 0]} maxBarSize={40}>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

