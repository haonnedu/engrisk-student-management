"use client";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StudentDialog } from "@/components/students/StudentDialog";
import { Download, Upload } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export function StudentsToolbar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/students/template", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "students-template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Template downloaded successfully!");
    } catch (error: any) {
      toast.error("Failed to download template");
      console.error(error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/students/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { created, failed, errors } = response.data;
      if (created > 0) {
        toast.success(
          `Successfully imported ${created} student(s)${failed > 0 ? `, ${failed} failed` : ""}`
        );
      }
      if (failed > 0 && errors.length > 0) {
        console.error("Import errors:", errors);
        toast.warning(`${failed} student(s) failed to import. Check console for details.`);
      }

      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to import students");
      console.error(error);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-semibold">Students</h1>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search students..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full sm:w-48"
        />

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadTemplate}
          className="gap-2 shrink-0"
          title="Download Excel template"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Template</span>
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="gap-2 shrink-0"
          title="Import from Excel"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isImporting ? "Importing..." : "Import"}
          </span>
        </Button>

        <StudentDialog />
      </div>
    </div>
  );
}
