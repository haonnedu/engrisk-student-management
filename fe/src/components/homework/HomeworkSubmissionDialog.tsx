"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { useHomework } from "@/hooks/useHomework";
import {
  useHomeworkSubmissions,
  useCreateHomeworkSubmission,
  useUpdateHomeworkSubmission,
  useUploadHomeworkFile,
  useDeleteHomeworkFile,
  type HomeworkFile,
} from "@/hooks/useHomeworkSubmissions";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Upload, FileText, Video, Image, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";

interface HomeworkSubmissionDialogProps {
  homeworkId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HomeworkSubmissionDialog({
  homeworkId,
  open,
  onOpenChange,
}: HomeworkSubmissionDialogProps) {
  const { data: homework } = useHomework(undefined, undefined, 1, 1);
  const currentHomework = homework?.data.find((h) => h.id === homeworkId);

  const { data: submissions, refetch: refetchSubmissions } = useHomeworkSubmissions(homeworkId);
  const existingSubmission = submissions?.[0];
  const queryClient = useQueryClient();

  const createSubmission = useCreateHomeworkSubmission();
  const updateSubmission = useUpdateHomeworkSubmission();
  const uploadFile = useUploadHomeworkFile();
  const deleteFile = useDeleteHomeworkFile();

  const [comment, setComment] = useState(
    existingSubmission?.comment || ""
  );
  const [files, setFiles] = useState<HomeworkFile[]>(
    existingSubmission?.files || []
  );
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  // Update state when submission changes
  React.useEffect(() => {
    if (existingSubmission) {
      setComment(existingSubmission.comment || "");
      // Ensure files are always an array and have proper structure
      const submissionFiles = Array.isArray(existingSubmission.files) 
        ? existingSubmission.files 
        : [];
      setFiles(submissionFiles);
    } else {
      setComment("");
      setFiles([]);
    }
  }, [existingSubmission]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!existingSubmission) {
        // Create submission first if it doesn't exist
        try {
          const newSubmission = await createSubmission.mutateAsync({
            homeworkId,
            comment: comment || undefined,
          });
          // Invalidate all homework-submissions queries to refresh parent page
          await queryClient.invalidateQueries({ queryKey: ["homework-submissions"] });
          // Now upload files
          for (const file of acceptedFiles) {
            await uploadFileToSubmission(newSubmission.id, file);
          }
        } catch (error: any) {
          toast.error(
            error.response?.data?.message || "Failed to create submission"
          );
        }
      } else {
        // Upload files to existing submission
        for (const file of acceptedFiles) {
          await uploadFileToSubmission(existingSubmission.id, file);
        }
      }
    },
    [existingSubmission, homeworkId, comment, createSubmission, queryClient]
  );

  const uploadFileToSubmission = async (
    submissionId: string,
    file: File
  ) => {
    const fileId = `${Date.now()}-${file.name}`;
    setUploadingFiles((prev) => new Set(prev).add(fileId));

    try {
      const uploadedFile = await uploadFile.mutateAsync({
        submissionId,
        file,
      });
      
      // Invalidate and refetch submissions to get latest data with downloadUrl
      await queryClient.invalidateQueries({ queryKey: ["homework-submissions"] });
      await refetchSubmissions();
      
      // Update local state with the uploaded file
      setFiles((prev) => {
        // Check if file already exists (avoid duplicates)
        const exists = prev.some(f => f.id === uploadedFile.id);
        if (exists) return prev;
        return [...prev, uploadedFile];
      });
      
      toast.success(`File "${file.name}" uploaded successfully`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || `Failed to upload "${file.name}"`
      );
    } finally {
      setUploadingFiles((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!existingSubmission) return;

    try {
      await deleteFile.mutateAsync({
        submissionId: existingSubmission.id,
        fileId,
      });
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success("File deleted successfully");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to delete file"
      );
    }
  };

  const handleSave = async () => {
    try {
      if (existingSubmission) {
        await updateSubmission.mutateAsync({
          id: existingSubmission.id,
          data: { comment: comment || undefined },
        });
        toast.success("Submission updated successfully");
      } else {
        await createSubmission.mutateAsync({
          homeworkId,
          comment: comment || undefined,
        });
        toast.success("Submission created successfully");
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to save submission"
      );
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm"],
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".bmp"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc", ".docx"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("video/")) {
      return <Video className="h-4 w-4" />;
    } else if (mimeType.startsWith("image/")) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingSubmission ? "Update Submission" : "Submit Homework"}
          </DialogTitle>
          <DialogDescription>
            {currentHomework?.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Add any comments about your submission..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Upload Files</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              {isDragActive ? (
                <p className="text-primary">Drop files here...</p>
              ) : (
                <div>
                  <p className="text-sm font-medium mb-1">
                    Drag & drop files here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports videos, images, PDFs, and documents (Max 500MB per file)
                  </p>
                </div>
              )}
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Files</Label>
              <div className="space-y-2">
                {files.map((file) => {
                  // Create view URL from downloadUrl or googleDriveFileId
                  const viewUrl: string = file.downloadUrl 
                    ? file.downloadUrl 
                    : file.googleDriveFileId 
                      ? `https://drive.google.com/file/d/${file.googleDriveFileId}/view`
                      : file.fileName
                        ? `https://drive.google.com/file/d/${file.fileName}/view`
                        : '#';
                  
                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(file.mimeType)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.originalFileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.fileSize)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {viewUrl && viewUrl !== '#' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(file.id)}
                          disabled={deleteFile.isPending}
                          title="Delete file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {uploadingFiles.size > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              <span>Uploading {uploadingFiles.size} file(s)...</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                createSubmission.isPending ||
                updateSubmission.isPending ||
                uploadFile.isPending
              }
            >
              {createSubmission.isPending || updateSubmission.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

