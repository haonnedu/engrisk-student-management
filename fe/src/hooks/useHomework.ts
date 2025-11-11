import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Homework,
  CreateHomeworkDto,
  UpdateHomeworkDto,
} from "@/lib/api-types";

export interface BulkCreateHomeworkDto {
  sectionId: string;
  title: string;
  description?: string;
  maxPoints?: number;
  dueDate?: string;
  items: { studentId: string; points: number }[];
}

export interface HomeworkResponse {
  data: Homework[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface HomeworkStats {
  totalHomeworks: number;
  totalPoints: number;
  totalMaxPoints: number;
  average: number;
  homeworks: Homework[];
}

export function useHomework(
  sectionId?: string,
  studentId?: string,
  page = 1,
  limit = 10
) {
  return useQuery({
    queryKey: ["homework", sectionId, studentId, page, limit],
    queryFn: async (): Promise<HomeworkResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (sectionId) params.append("sectionId", sectionId);
      if (studentId) params.append("studentId", studentId);

      const response = await api.get(`/homework?${params}`);
      return response.data;
    },
  });
}

export function useHomeworkStats(studentId: string, sectionId?: string) {
  return useQuery({
    queryKey: ["homework-stats", studentId, sectionId],
    queryFn: async (): Promise<HomeworkStats> => {
      const params = new URLSearchParams({ studentId });
      if (sectionId) params.append("sectionId", sectionId);

      const response = await api.get(`/homework/stats?${params}`);
      return response.data;
    },
    enabled: !!studentId,
  });
}

export function useCreateHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHomeworkDto): Promise<Homework> => {
      const response = await api.post("/homework", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
      queryClient.invalidateQueries({ queryKey: ["homework-stats"] });
      queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
  });
}

export function useCreateHomeworkBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkCreateHomeworkDto): Promise<{ count: number }> => {
      const response = await api.post("/homework/bulk", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
      queryClient.invalidateQueries({ queryKey: ["homework-stats"] });
      queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
  });
}

export function useUpdateHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateHomeworkDto;
    }): Promise<Homework> => {
      const response = await api.patch(`/homework/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
      queryClient.invalidateQueries({ queryKey: ["homework-stats"] });
      queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
  });
}

export function useDeleteHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/homework/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
      queryClient.invalidateQueries({ queryKey: ["homework-stats"] });
      queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
  });
}
