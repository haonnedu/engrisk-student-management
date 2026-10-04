"use client";
import { useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart3, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
  /** Optional class details printed on the PDF report */
  classInfo?: {
    name?: string;
    code?: string;
    teacherName?: string;
    book?: string;
    course?: { title?: string } | null;
  } | null;
};

const getStatus = (grade: number) =>
  grade >= 85
    ? { label: "Excellent", bg: "#dcfce7", fg: "#166534" }
    : grade >= 70
      ? { label: "Good", bg: "#dbeafe", fg: "#1e40af" }
      : grade >= 55
        ? { label: "Average", bg: "#fef9c3", fg: "#854d0e" }
        : { label: "Needs Improvement", bg: "#fee2e2", fg: "#991b1b" };

// A4 portrait at 96dpi
const REPORT_WIDTH = 794;
const REPORT_MIN_HEIGHT = 1123;

export function StudentGradeChartDialog({
  student,
  grades,
  gradeTypes,
  classInfo,
}: StudentGradeChartDialogProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [page, setPage] = useState<"chart" | "grades">("chart");

  // Prepare chart data
  const chartData = useMemo(() => {
    return gradeTypes.map((gradeType) => {
      const grade = grades.find(
        (g) =>
          g.gradeType?.id === gradeType.id ||
          g.gradeTypeId === gradeType.id ||
          g.gradeType?.code === gradeType.code,
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

  const fullName = `${student.lastName} ${student.firstName}`.trim();

  async function handleExportPdf() {
    setIsExportingPdf(true);
    try {
      // Wait for the off-screen report (and its chart) to mount and paint
      await new Promise((resolve) => setTimeout(resolve, 300));
      const node = reportRef.current;
      if (!node) throw new Error("Report is not ready");

      const [{ toPng }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);

      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      // Fit the whole report on a single page, keeping aspect ratio
      const ratio = node.offsetHeight / node.offsetWidth;
      let imgW = pageW;
      let imgH = pageW * ratio;
      if (imgH > pageH) {
        imgH = pageH;
        imgW = pageH / ratio;
      }
      pdf.addImage(dataUrl, "PNG", (pageW - imgW) / 2, 0, imgW, imgH);

      const safeName = (student.engName || fullName || student.studentId)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      pdf.save(`grade-report-${safeName}-${student.studentId}.pdf`);
      toast.success("PDF exported");
    } catch (err) {
      console.error("Export PDF failed", err);
      toast.error("Failed to export PDF");
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <BarChart3 className="h-4 w-4" />
          <span className="sr-only">View grade chart</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[98vw] max-w-[98vw] sm:max-w-[98vw] max-h-[94vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Grade Chart - {student.firstName} {student.lastName}
            {student.engName && ` (${student.engName})`}
          </DialogTitle>
          <DialogDescription>
            Student ID: {student.studentId} | Average: {average.toFixed(1)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Page switcher */}
          <div className="inline-flex self-start rounded-lg border p-1 bg-muted/50">
            {(
              [
                { key: "chart", label: "Chart" },
                { key: "grades", label: "Grades" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setPage(tab.key)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  page === tab.key
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
          >
            {isExportingPdf ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            {isExportingPdf ? "Exporting..." : "Export PDF"}
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Grades page: one column per grade type */}
          {page === "grades" && (
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left sticky left-0 bg-muted whitespace-nowrap">
                      Grade Type
                    </th>
                    {chartData.map((item, index) => (
                      <th
                        key={index}
                        className="px-2 py-2 text-center text-xs font-semibold min-w-[72px]"
                      >
                        {item.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-3 py-2 font-medium sticky left-0 bg-background whitespace-nowrap">
                      Grade
                    </td>
                    {chartData.map((item, index) => (
                      <td key={index} className="px-2 py-2 text-center">
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
                    <td className="px-3 py-2 font-medium sticky left-0 bg-background whitespace-nowrap">
                      Status
                    </td>
                    {chartData.map((item, index) => (
                      <td key={index} className="px-2 py-2 text-center">
                        {item.hasGrade ? (
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[11px] leading-tight font-medium ${
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
          )}

          {/* Chart page */}
          {page === "chart" && (
            <div className="border rounded-lg p-3">
              <div
                className="h-[60vh] min-h-64 mx-auto"
                style={{ maxWidth: Math.max(480, chartData.length * 110 + 80) }}
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
          )}
        </div>
        {/* Off-screen A4 report, only mounted while exporting. Inline styles keep
            the capture independent from the app theme. */}
        {isExportingPdf && (
          <div
            style={{
              position: "fixed",
              left: -10000,
              top: 0,
              pointerEvents: "none",
            }}
            aria-hidden
          >
            <div
              ref={reportRef}
              style={{
                width: REPORT_WIDTH,
                minHeight: REPORT_MIN_HEIGHT,
                boxSizing: "border-box",
                padding: "40px 44px",
                background: "#ffffff",
                color: "#111827",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 13,
                lineHeight: 1.45,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  borderBottom: "3px solid #1e3a8a",
                  paddingBottom: 12,
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 22, fontWeight: 700, color: "#1e3a8a" }}
                  >
                    Ms. Jenny English
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>
                    PHIẾU ĐIỂM HỌC SINH / STUDENT GRADE REPORT
                  </div>
                </div>
                <div
                  style={{ fontSize: 12, color: "#4b5563", textAlign: "right" }}
                >
                  Ngày xuất / Date:
                  <br />
                  {new Date().toLocaleDateString("vi-VN")}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px 24px",
                  marginTop: 18,
                  padding: "14px 16px",
                  background: "#f3f4f6",
                  borderRadius: 8,
                }}
              >
                <div>
                  <b>Học sinh / Student:</b> {fullName}
                  {student.engName ? ` (${student.engName})` : ""}
                </div>
                <div>
                  <b>Mã HS / Student ID:</b> {student.studentId}
                </div>
                {classInfo?.name && (
                  <div>
                    <b>Lớp / Class:</b> {classInfo.name}
                    {classInfo.code ? ` (${classInfo.code})` : ""}
                  </div>
                )}
                {classInfo?.course?.title && (
                  <div>
                    <b>Khóa học / Course:</b> {classInfo.course.title}
                  </div>
                )}
                {classInfo?.teacherName && (
                  <div>
                    <b>Giáo viên / Teacher:</b> {classInfo.teacherName}
                  </div>
                )}
                {classInfo?.book && (
                  <div>
                    <b>Giáo trình / Book:</b> {classInfo.book}
                  </div>
                )}
                <div>
                  <b>Điểm trung bình / Average:</b>{" "}
                  <span
                    style={{ fontSize: 15, fontWeight: 700, color: "#1e3a8a" }}
                  >
                    {average.toFixed(1)}
                  </span>
                </div>
              </div>

              <div style={{ fontWeight: 700, margin: "22px 0 8px" }}>
                Biểu đồ điểm / Grade chart
              </div>
              <BarChart
                width={REPORT_WIDTH - 88}
                height={250}
                data={chartData}
                margin={{ top: 16, right: 8, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  interval={0}
                  tick={{ fontSize: 10, fill: "#374151" }}
                  angle={chartData.length > 7 ? -35 : 0}
                  textAnchor={chartData.length > 7 ? "end" : "middle"}
                  height={chartData.length > 7 ? 64 : 28}
                />
                <YAxis
                  domain={[0, 100]}
                  width={32}
                  tick={{ fontSize: 10, fill: "#374151" }}
                />
                <Bar
                  dataKey="grade"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={36}
                  isAnimationActive={false}
                  label={{ position: "top", fontSize: 10, fill: "#111827" }}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`pdf-cell-${index}`}
                      fill={getColor(entry.grade, entry.hasGrade)}
                    />
                  ))}
                </Bar>
              </BarChart>

              <div style={{ fontWeight: 700, margin: "20px 0 8px" }}>
                Bảng điểm chi tiết / Grade details
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12.5,
                }}
              >
                <thead>
                  <tr style={{ background: "#1e3a8a", color: "#ffffff" }}>
                    <th
                      style={{
                        padding: "7px 10px",
                        textAlign: "center",
                        width: 40,
                      }}
                    >
                      #
                    </th>
                    <th style={{ padding: "7px 10px", textAlign: "left" }}>
                      Loại điểm / Grade type
                    </th>
                    <th
                      style={{
                        padding: "7px 10px",
                        textAlign: "center",
                        width: 110,
                      }}
                    >
                      Điểm / Grade
                    </th>
                    <th
                      style={{
                        padding: "7px 10px",
                        textAlign: "center",
                        width: 170,
                      }}
                    >
                      Xếp loại / Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, index) => {
                    const status = getStatus(item.grade);
                    return (
                      <tr
                        key={index}
                        style={{
                          background: index % 2 ? "#f9fafb" : "#ffffff",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <td
                          style={{ padding: "6px 10px", textAlign: "center" }}
                        >
                          {index + 1}
                        </td>
                        <td style={{ padding: "6px 10px" }}>{item.name}</td>
                        <td
                          style={{
                            padding: "6px 10px",
                            textAlign: "center",
                            fontWeight: 700,
                          }}
                        >
                          {item.hasGrade ? item.grade.toFixed(1) : "-"}
                        </td>
                        <td
                          style={{ padding: "6px 10px", textAlign: "center" }}
                        >
                          {item.hasGrade ? (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                background: status.bg,
                                color: status.fg,
                              }}
                            >
                              {status.label}
                            </span>
                          ) : (
                            <span style={{ color: "#6b7280" }}>No grade</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ marginTop: 16, fontSize: 11, color: "#6b7280" }}>
                Xếp loại / Scale: Excellent ≥ 85 · Good ≥ 70 · Average ≥ 55 ·
                Needs Improvement &lt; 55
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
