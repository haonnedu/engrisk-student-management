"use client";
import * as React from "react";
import { useState } from "react";
import { useClasses, type ClassSection } from "@/hooks/useClasses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Users, BookOpen, Calendar, GraduationCap } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function GradesClassesPage() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const { data: classesData, isLoading, error } = useClasses(1, 100, search);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500">
        Error loading classes
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grades Management</h1>
          <p className="text-muted-foreground">
            Select a class to view and manage student grades
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search classes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classesData?.data?.map((classItem: ClassSection) => (
          <Card
            key={classItem.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/dashboard/grades/classes/${classItem.id}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{classItem.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {classItem.code}
                  </p>
                </div>
                <Badge variant="secondary">
                  {classItem.enrollments?.length || 0} students
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>{classItem.course?.title || "No course assigned"}</span>
                </div>

                {classItem.teacherName && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{classItem.teacherName}</span>
                  </div>
                )}

                {classItem.timeDescription && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{classItem.timeDescription}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/grades/classes/${classItem.id}`);
                  }}
                >
                  <GraduationCap className="mr-2 h-4 w-4" />
                  View Grades
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {classesData?.data?.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <div className="mb-4 text-6xl">📚</div>
          <h3 className="mb-2 text-lg font-semibold">No Classes Found</h3>
          <p className="text-muted-foreground">
            {search
              ? "No classes match your search criteria"
              : "No classes available"}
          </p>
        </div>
      )}
    </div>
  );
}
