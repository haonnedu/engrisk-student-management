"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { useMyProfile } from "@/hooks/useParent";
import { useTranslations } from "@/hooks/useTranslations";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Search } from "lucide-react";

type GradeRow = {
  id: string;
  courseName: string;
  courseCode: string;
  gradeTypeName: string;
  gradeTypeCode: string;
  grade: number;
  weight: number;
  comments?: string;
  gradedAt: string;
};

export default function ParentGradesPage() {
  const { data: profile, isLoading, error } = useMyProfile();
  const { t } = useTranslations('parent.grades');
  const [globalFilter, setGlobalFilter] = useState("");

  const gradesData: GradeRow[] = useMemo(() => {
    if (!profile) return [];
    if (!profile.grades || !Array.isArray(profile.grades)) return [];
    
    return profile.grades.map((grade) => ({
      id: grade.id,
      courseName: grade.course?.title || "Unknown Course",
      courseCode: grade.course?.courseCode || "N/A",
      gradeTypeName: grade.gradeType?.name || "Unknown",
      gradeTypeCode: grade.gradeType?.code || "N/A",
      grade: grade.grade || 0,
      weight: grade.gradeType?.weight || 1,
      comments: grade.comments,
      gradedAt: grade.gradedAt,
    }));
  }, [profile]);

  const columns = useMemo<ColumnDef<GradeRow>[]>(
    () => [
      {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              {t('course')}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        accessorKey: "courseName",
        cell: (info) => (
          <div>
            <div className="font-medium">{info.getValue() as string}</div>
            <div className="text-sm text-muted-foreground">
              {info.row.original.courseCode}
            </div>
          </div>
        ),
      },
      {
        header: t('gradeType'),
        accessorKey: "gradeTypeName",
        cell: (info) => (
          <Badge variant="outline">{info.getValue() as string}</Badge>
        ),
      },
      {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              {t('score')}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        accessorKey: "grade",
        cell: (info) => {
          const grade = info.getValue() as number;
          const color =
            grade >= 80
              ? "text-green-600 font-semibold"
              : grade >= 60
              ? "text-yellow-600 font-medium"
              : "text-red-600 font-medium";

          return <div className={color}>{grade.toFixed(1)}</div>;
        },
      },

      {
        header: t('comments'),
        accessorKey: "comments",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {(info.getValue() as string) || "-"}
          </span>
        ),
      },
      {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              {t('date')}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        accessorKey: "gradedAt",
        cell: (info) => {
          const date = new Date(info.getValue() as string);
          return (
            <span className="text-sm">
              {date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          );
        },
      },
    ],
    [t]
  );

  const table = useReactTable({
    data: gradesData,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error) {
    const errorMessage = (error as any).message || 
                        (error as any).response?.data?.message || 
                        t('errorMessage');
    
    return (
      <div className="flex h-64 flex-col items-center justify-center text-red-500 gap-2">
        <p className="font-semibold">{t('errorLoading')}</p>
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
      </div>
    );
  }

  // Calculate average grade
  const averageGrade = gradesData.length > 0
    ? gradesData.reduce((acc, g) => acc + g.grade, 0) / gradesData.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Student Info Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('studentName')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile?.firstName} {profile?.lastName}
            </div>
            <p className="text-sm text-muted-foreground">{profile?.engName}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('studentId')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.studentId}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{t('averageGrade')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              averageGrade >= 80
                ? "text-green-600"
                : averageGrade >= 60
                ? "text-yellow-600"
                : "text-red-600"
            }`}>
              {averageGrade.toFixed(1)}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('gradesRecorded', { count: gradesData.length })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t('gradeHistory')}</CardTitle>
              <CardDescription>{t('allGradesAcrossCourses')}</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-8 w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      {t('noGradesFound')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              {t('showing', { current: table.getRowModel().rows.length, total: gradesData.length })}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                {t('previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                {t('next')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
