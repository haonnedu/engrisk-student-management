import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  GradeType,
  GradeTypesResponse,
  CreateGradeTypeDto,
  UpdateGradeTypeDto,
} from "@/lib/api-types";

export function useGradeTypes(
  page = 1,
  limit = 10,
  search?: string,
  isActive?: boolean
) {
  return useQuery({
    queryKey: ["gradeTypes", page, limit, search, isActive],
    queryFn: async (): Promise<GradeTypesResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append("search", search);
      if (isActive !== undefined)
        params.append("isActive", isActive.toString());

      const response = await api.get(`/grade-types?${params}`);
      return response.data;
    },
  });
}

export function useActiveGradeTypes() {
  return useQuery({
    queryKey: ["gradeTypes", "active"],
    queryFn: async (): Promise<GradeType[]> => {
      const response = await api.get("/grade-types/active");
      return response.data;
    },
  });
}

export function useGradeType(id: string) {
  return useQuery({
    queryKey: ["gradeTypes", id],
    queryFn: async (): Promise<GradeType> => {
      const response = await api.get(`/grade-types/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateGradeType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGradeTypeDto): Promise<GradeType> => {
      const response = await api.post("/grade-types", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradeTypes"] });
    },
  });
}

export function useUpdateGradeType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateGradeTypeDto;
    }): Promise<GradeType> => {
      const response = await api.patch(`/grade-types/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradeTypes"] });
    },
  });
}

export function useDeleteGradeType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/grade-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradeTypes"] });
    },
  });
}

export function useUpdateGradeTypeSortOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gradeTypeIds: string[]): Promise<void> => {
      await api.patch("/grade-types/sort/update", { gradeTypeIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradeTypes"] });
    },
  });
}
