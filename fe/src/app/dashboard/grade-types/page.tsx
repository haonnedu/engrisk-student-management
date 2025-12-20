"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GradeTypesToolbar } from "@/components/grade-types/GradeTypesToolbar";
import { GradeTypesTable } from "@/components/grade-types/GradeTypesTable";
import { useGradeTypes } from "@/hooks/useGradeTypes";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function GradeTypesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);

  const { data, isLoading, error, refetch } = useGradeTypes(
    page,
    10,
    search,
    isActive
  );

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading grade types</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Grade Types</h1>
        <p className="text-muted-foreground">
          Manage different types of grades and their weights for calculating
          averages.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grade Types Management</CardTitle>
          <CardDescription>
            Create and manage different types of grades used in the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GradeTypesToolbar
            search={search}
            onSearchChange={setSearch}
            isActive={isActive}
            onIsActiveChange={setIsActive}
          />

          <GradeTypesTable
            gradeTypes={data?.data || []}
            isLoading={isLoading}
            onRefresh={refetch}
          />

          {/* Pagination */}
          {data && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * 10 + 1} to{" "}
                {Math.min(page * 10, data.meta.total)} of {data.meta.total}{" "}
                grade types
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: data.meta.totalPages },
                    (_, i) => i + 1
                  ).map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.meta.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
