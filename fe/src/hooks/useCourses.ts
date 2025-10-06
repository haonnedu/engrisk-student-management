import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export type Course = {
  id: string;
  title: string;
  courseCode: string;
  description?: string;
  credits: number;
  duration: number;
  maxStudents: number;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
};

export type CourseFormData = {
  title: string;
  courseCode: string;
  description?: string;
  credits: number;
  duration: number;
  maxStudents: number;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
};

export function useCourses(page = 1, limit = 10, search?: string) {
  return useQuery({
    queryKey: ["courses", page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append("search", search);

      const response = await api.get(`/courses?${params}`);
      return response.data;
    },
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ["course", id],
    queryFn: async () => {
      const response = await api.get(`/courses/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CourseFormData): Promise<Course> => {
      const response = await api.post("/courses", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CourseFormData>;
    }): Promise<Course> => {
      const response = await api.put(`/courses/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", id] });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}
