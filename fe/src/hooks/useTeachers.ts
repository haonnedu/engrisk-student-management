import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  position?: string;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  userId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email?: string;
    phone?: string;
    role: string;
  };
};

export type CreateTeacherData = {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  position?: string;
  status?: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
};

// Get all teachers
export function useTeachers(page = 1, limit = 10, status?: string) {
  return useQuery({
    queryKey: ["teachers", page, limit, status],
    queryFn: async (): Promise<Teacher[]> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status) params.append("status", status);
      
      const response = await api.get(`/teachers?${params}`);
      return response.data;
    },
  });
}

// Get single teacher
export function useTeacher(id: string) {
  return useQuery({
    queryKey: ["teachers", id],
    queryFn: async (): Promise<Teacher> => {
      const response = await api.get(`/teachers/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create teacher
export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTeacherData): Promise<Teacher> => {
      const response = await api.post("/teachers", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
}

// Update teacher
export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateTeacherData>;
    }): Promise<Teacher> => {
      const response = await api.patch(`/teachers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
}

// Delete teacher
export function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/teachers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
}

