import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { CreateStudentDto } from "@/types";

export type Student = {
  id: string;
  userId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  enrollmentDate: string;
  status: "ACTIVE" | "INACTIVE" | "GRADUATED" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email?: string;
    phone?: string;
    role: "STUDENT" | "ADMIN" | "SUPER_ADMIN";
  };
};

export type StudentsResponse = {
  data: Student[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// Hooks
export function useStudents(page = 1, limit = 10, status?: string) {
  return useQuery({
    queryKey: ["students", page, limit, status],
    queryFn: async (): Promise<StudentsResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
      });
      const response = await api.get(`/students?${params}`);
      return response.data;
    },
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStudentDto): Promise<Student> => {
      const response = await api.post("/students", data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch students list
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateStudentDto>;
    }): Promise<Student> => {
      const response = await api.patch(`/students/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
