"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useMyProfile } from "@/hooks/useParent";
import { useHomework } from "@/hooks/useHomework";
import {
  useHomeworkSubmissions,
  useCreateHomeworkSubmission,
} from "@/hooks/useHomeworkSubmissions";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Upload, CheckCircle2, Clock, Video, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { HomeworkSubmissionDialog } from "@/components/homework/HomeworkSubmissionDialog";

export default function ParentHomeworkPage() {
  const { data: profile, isLoading: profileLoading, error: profileError } = useMyProfile();
  const studentId = profile?.id;

  const {
    data: homeworkData,
    isLoading: homeworkLoading,
    error: homeworkError,
  } = useHomework(undefined, studentId, 1, 100);

  const {
    data: submissions,
    isLoading: submissionsLoading,
    refetch: refetchSubmissions,
  } = useHomeworkSubmissions(undefined, studentId || undefined);

  const [selectedHomework, setSelectedHomework] = useState<string | null>(null);

  // Refetch submissions when dialog closes to get latest files
  useEffect(() => {
    if (!selectedHomework) {
      const timeoutId = setTimeout(() => {
        refetchSubmissions();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedHomework, refetchSubmissions]);

  if (profileLoading || homeworkLoading || submissionsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (profileError) {
    const errorMessage = (profileError as any)?.response?.data?.message || 
                        (profileError as any)?.message || 
                        "Error loading profile";
    return (
      <div className="flex h-64 flex-col items-center justify-center text-red-500 gap-2">
        <p className="font-semibold">Error loading profile</p>
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-w-md">
            {JSON.stringify(profileError, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  if (homeworkError) {
    const errorMessage = (homeworkError as any)?.response?.data?.message || 
                        (homeworkError as any)?.message || 
                        "Error loading homework";
    return (
      <div className="flex h-64 flex-col items-center justify-center text-red-500 gap-2">
        <p className="font-semibold">Error loading homework</p>
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-w-md">
            {JSON.stringify(homeworkError, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  const homeworks = Array.isArray(homeworkData?.data) ? homeworkData.data : [];
  const submissionsArray = Array.isArray(submissions) ? submissions : [];
  const submissionsMap = new Map(
    submissionsArray.map((s) => [s.homeworkId, s])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Homework</h1>
        <p className="text-muted-foreground">
          View and submit homework assignments
        </p>
      </div>

      {homeworks.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No Homework Found</h3>
            <p className="text-muted-foreground">
              You don't have any homework assignments yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {homeworks.map((homework) => {
            const submission = submissionsMap.get(homework.id);
            const isOverdue =
              homework.dueDate &&
              new Date(homework.dueDate) < new Date() &&
              !submission;
            const isSubmitted = !!submission;
            const hasFiles = submission?.files && submission.files.length > 0;

            return (
              <Card key={homework.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{homework.title}</CardTitle>
                      {homework.description && (
                        <p className="text-sm text-muted-foreground">
                          {homework.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isSubmitted ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Submitted
                        </Badge>
                      ) : isOverdue ? (
                        <Badge variant="destructive" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Overdue
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Class:</span>{" "}
                        <Badge variant="outline">
                          {homework.section?.code || "N/A"}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Points:</span>{" "}
                        {homework.points} / {homework.maxPoints}
                      </div>
                      {homework.dueDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Due Date:</span>{" "}
                          {format(new Date(homework.dueDate), "PPP")}
                        </div>
                      )}
                      {submission && (
                        <div>
                          <span className="font-medium">Submitted:</span>{" "}
                          {format(
                            new Date(submission.submittedAt),
                            "PPP 'at' p"
                          )}
                        </div>
                      )}
                    </div>

                    {hasFiles && (
                      <div id={`files-${homework.id}`} className="space-y-2 transition-all duration-300">
                        <span className="text-sm font-medium">Uploaded Files:</span>
                        <div className="space-y-2">
                          {submission.files.map((file) => {
                            const isVideo = file.mimeType?.startsWith('video/');
                            const isImage = file.mimeType?.startsWith('image/');
                            const fileSize = file.fileSize 
                              ? `${(file.fileSize / 1024 / 1024).toFixed(2)} MB`
                              : 'Unknown size';
                            
                            // Create view URL from downloadUrl or googleDriveFileId
                            const viewUrl = file.downloadUrl 
                              ? file.downloadUrl 
                              : file.googleDriveFileId 
                                ? `https://drive.google.com/file/d/${file.googleDriveFileId}/view`
                                : file.fileName
                                  ? `https://drive.google.com/file/d/${file.fileName}/view`
                                  : null;
                            
                            return (
                              <div
                                key={file.id}
                                className="flex items-center justify-between rounded-md border p-3 hover:bg-accent transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {isVideo ? (
                                    <Video className="h-5 w-5 text-red-500 flex-shrink-0" />
                                  ) : isImage ? (
                                    <ImageIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                  ) : (
                                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {file.originalFileName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {fileSize}
                                    </p>
                                  </div>
                                </div>
                                {viewUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    className="flex-shrink-0"
                                    title="View file"
                                  >
                                    <a
                                      href={viewUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1"
                                    >
                                      <FileText className="h-4 w-4" />
                                      View
                                    </a>
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => setSelectedHomework(homework.id)}
                      variant={isSubmitted ? "outline" : "default"}
                    >
                      {isSubmitted ? (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Update Submission
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Submit Homework
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedHomework && (
        <HomeworkSubmissionDialog
          homeworkId={selectedHomework}
          open={!!selectedHomework}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedHomework(null);
              // Force refetch submissions after dialog closes
              setTimeout(() => {
                refetchSubmissions();
              }, 500);
            }
          }}
        />
      )}
    </div>
  );
}

