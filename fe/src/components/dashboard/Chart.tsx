"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Mock data for chart
const chartData = [
  { month: "Jul", students: 140, courses: 7, enrollments: 25 },
  { month: "Aug", students: 145, courses: 8, enrollments: 18 },
  { month: "Sep", students: 150, courses: 8, enrollments: 22 },
  { month: "Oct", students: 152, courses: 9, enrollments: 15 },
  { month: "Nov", students: 154, courses: 9, enrollments: 20 },
  { month: "Dec", students: 156, courses: 8, enrollments: 12 },
];

export function Chart() {
  const maxStudents = Math.max(...chartData.map((d) => d.students));
  const maxCourses = Math.max(...chartData.map((d) => d.courses));
  const maxEnrollments = Math.max(...chartData.map((d) => d.enrollments));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Growth & Course Activity</CardTitle>
        <CardDescription>
          Monthly statistics for students and courses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Chart */}
          <div className="h-80 flex items-end space-x-3">
            {chartData.map((data, index) => (
              <div
                key={data.month}
                className="flex-1 flex flex-col items-center space-y-3"
              >
                {/* Students Bar */}
                <div className="w-full flex flex-col items-center space-y-1">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg shadow-sm"
                    style={{
                      height: `${(data.students / maxStudents) * 140}px`,
                      minHeight: "8px",
                    }}
                  ></div>
                  <span className="text-xs font-medium text-gray-700">
                    {data.students}
                  </span>
                </div>

                {/* Courses Bar */}
                <div className="w-full flex flex-col items-center space-y-1">
                  <div
                    className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg shadow-sm"
                    style={{
                      height: `${(data.courses / maxCourses) * 100}px`,
                      minHeight: "8px",
                    }}
                  ></div>
                  <span className="text-xs font-medium text-gray-700">
                    {data.courses}
                  </span>
                </div>

                {/* Enrollments Bar */}
                <div className="w-full flex flex-col items-center space-y-1">
                  <div
                    className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg shadow-sm"
                    style={{
                      height: `${(data.enrollments / maxEnrollments) * 80}px`,
                      minHeight: "8px",
                    }}
                  ></div>
                  <span className="text-xs font-medium text-gray-700">
                    {data.enrollments}
                  </span>
                </div>

                {/* Month Label */}
                <span className="text-xs font-semibold text-gray-800 mt-2">
                  {data.month}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded"></div>
              <span className="text-sm font-medium text-gray-700">
                Total Students
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gradient-to-r from-green-600 to-green-400 rounded"></div>
              <span className="text-sm font-medium text-gray-700">
                Active Courses
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gradient-to-r from-purple-600 to-purple-400 rounded"></div>
              <span className="text-sm font-medium text-gray-700">
                New Enrollments
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
