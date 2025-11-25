import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GradeType } from "@/lib/api-types";
import { toast } from "sonner";

export type SectionGradeType = GradeType & {
  sectionGradeTypeId: string;
  isActiveInSection: boolean;
  sortOrderInSection: number;
};

export function useSectionGradeTypes(sectionId: string) {
  return useQuery({
    queryKey: ["sectionGradeTypes", sectionId],
    queryFn: async (): Promise<SectionGradeType[]> => {
      const response = await api.get(`/sections/${sectionId}/grade-types`);
      return response.data;
    },
    enabled: !!sectionId,
  });
}

export function useAddGradeTypeToSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionId,
      gradeTypeId,
    }: {
      sectionId: string;
      gradeTypeId: string;
    }) => {
      const response = await api.post(
        `/sections/${sectionId}/grade-types/${gradeTypeId}`
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sectionGradeTypes", variables.sectionId],
      });
      queryClient.invalidateQueries({ queryKey: ["gradeTypes"] });
      toast.success("Grade type added to section successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      toast.error(errorMessage);
    },
  });
}

export function useRemoveGradeTypeFromSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionId,
      gradeTypeId,
    }: {
      sectionId: string;
      gradeTypeId: string;
    }) => {
      await api.delete(`/sections/${sectionId}/grade-types/${gradeTypeId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sectionGradeTypes", variables.sectionId],
      });
      queryClient.invalidateQueries({ queryKey: ["gradeTypes"] });
      toast.success("Grade type removed from section successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      toast.error(errorMessage);
    },
  });
}

export function useUpdateSectionGradeTypesSortOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionId,
      sectionGradeTypeIds,
    }: {
      sectionId: string;
      sectionGradeTypeIds: string[];
    }) => {
      const response = await api.patch(
        `/sections/${sectionId}/grade-types/sort`,
        { sectionGradeTypeIds }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sectionGradeTypes", variables.sectionId],
      });
      toast.success("Sort order updated successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      toast.error(errorMessage);
    },
  });
}

export function useToggleGradeTypeInSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionId,
      gradeTypeId,
      isActive,
    }: {
      sectionId: string;
      gradeTypeId: string;
      isActive: boolean;
    }) => {
      const response = await api.patch(
        `/sections/${sectionId}/grade-types/${gradeTypeId}/toggle`,
        { isActive }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sectionGradeTypes", variables.sectionId],
      });
      toast.success(
        `Grade type ${variables.isActive ? "activated" : "deactivated"} successfully!`
      );
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      toast.error(errorMessage);
    },
  });
}

