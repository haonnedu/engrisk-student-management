import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export type Enrollment = {
  id: string;
  studentId: string;
  courseId: string;
  sectionId?: string;
  enrolledAt: string;
  status: "ENROLLED" | "COMPLETED" | "DROPPED" | "FAILED";
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    engName: string;
    studentId: string;
  };
  course?: {
    id: string;
    title: string;
    courseCode: string;
  };
  section?: {
    id: string;
    name: string;
    code: string;
  };
};

export type EnrollmentFormData = {
  studentId: string;
  courseId: string;
  sectionId?: string;
  status?: "ENROLLED" | "COMPLETED" | "DROPPED" | "FAILED";
};

export function useEnrollments(
  page = 1,
  limit = 10,
  search?: string,
  sectionId?: string
) {
  return useQuery({
    queryKey: ["enrollments", page, limit, search, sectionId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append("search", search);
      if (sectionId) params.append("sectionId", sectionId);

      const response = await api.get(`/enrollments?${params}`);
      return response.data;
    },
  });
}

export function useEnrollment(id: string) {
  return useQuery({
    queryKey: ["enrollment", id],
    queryFn: async () => {
      const response = await api.get(`/enrollments/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EnrollmentFormData): Promise<Enrollment> => {
      const response = await api.post("/enrollments", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useUpdateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<EnrollmentFormData>;
    }): Promise<Enrollment> => {
      const response = await api.put(`/enrollments/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["enrollment", id] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useDeleteEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/enrollments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
