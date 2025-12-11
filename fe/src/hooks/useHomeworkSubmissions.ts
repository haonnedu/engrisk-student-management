import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  comment?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  homework: {
    id: string;
    title: string;
    description?: string;
    points: number;
    maxPoints: number;
    dueDate?: string;
    section: {
      id: string;
      name: string;
      code: string;
    };
  };
  files: HomeworkFile[];
}

export interface HomeworkFile {
  id: string;
  submissionId: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  googleDriveFileId: string;
  googleDriveId: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  googleDrive: {
    id: string;
    email: string;
    name: string;
  };
}

export interface CreateHomeworkSubmissionDto {
  homeworkId: string;
  comment?: string;
}

export interface UpdateHomeworkSubmissionDto {
  comment?: string;
}

export function useHomeworkSubmissions(homeworkId?: string, studentId?: string) {
  return useQuery({
    queryKey: ["homework-submissions", homeworkId, studentId],
    queryFn: async (): Promise<HomeworkSubmission[]> => {
      const params = new URLSearchParams();
      if (homeworkId) params.append("homeworkId", homeworkId);
      if (studentId) params.append("studentId", studentId);

      // Only make request if we have at least homeworkId or studentId
      if (!homeworkId && !studentId) {
        return [];
      }

      const queryString = params.toString();
      const url = queryString ? `/homework/submissions?${queryString}` : '/homework/submissions';
      
      const response = await api.get(url);
      // Ensure we return an array
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: !!(homeworkId || studentId), // Only enable query if we have at least one parameter
  });
}

export function useHomeworkSubmission(submissionId: string) {
  return useQuery({
    queryKey: ["homework-submission", submissionId],
    queryFn: async (): Promise<HomeworkSubmission> => {
      const response = await api.get(`/homework/submissions/${submissionId}`);
      return response.data;
    },
    enabled: !!submissionId,
  });
}

export function useCreateHomeworkSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateHomeworkSubmissionDto
    ): Promise<HomeworkSubmission> => {
      const response = await api.post("/homework/submissions", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["homework"] });
    },
  });
}

export function useUpdateHomeworkSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateHomeworkSubmissionDto;
    }): Promise<HomeworkSubmission> => {
      const response = await api.patch(`/homework/submissions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["homework-submission"] });
    },
  });
}

export function useUploadHomeworkFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      file,
    }: {
      submissionId: string;
      file: File;
    }): Promise<HomeworkFile> => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
        `/homework/submissions/${submissionId}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["homework-submission", variables.submissionId],
      });
      queryClient.invalidateQueries({ queryKey: ["homework-submissions"] });
    },
  });
}

export function useDeleteHomeworkFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      fileId,
    }: {
      submissionId: string;
      fileId: string;
    }): Promise<void> => {
      await api.delete(
        `/homework/submissions/${submissionId}/files/${fileId}`
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["homework-submission", variables.submissionId],
      });
      queryClient.invalidateQueries({ queryKey: ["homework-submissions"] });
    },
  });
}

