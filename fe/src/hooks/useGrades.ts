import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export type Grade = {
  id: string;
  studentId: string;
  courseId: string;
  grade: number;
  gradeType:
    | "ASSIGNMENT"
    | "QUIZ"
    | "EXAM"
    | "FINAL"
    | "HW"
    | "SP"
    | "PP"
    | "TEST_1L"
    | "TEST_1RW"
    | "TEST_2L"
    | "TEST_2RW"
    | "TEST_3L"
    | "TEST_3RW";
  comments?: string;
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
};

export type GradeFormData = {
  studentId: string;
  courseId: string;
  grade: number;
  gradeType:
    | "ASSIGNMENT"
    | "QUIZ"
    | "EXAM"
    | "FINAL"
    | "HW"
    | "SP"
    | "PP"
    | "TEST_1L"
    | "TEST_1RW"
    | "TEST_2L"
    | "TEST_2RW"
    | "TEST_3L"
    | "TEST_3RW";
  comments?: string;
};

export function useGrades(page = 1, limit = 10, search?: string) {
  return useQuery({
    queryKey: ["grades", page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append("search", search);

      const response = await api.get(`/grades?${params}`);
      return response.data;
    },
  });
}

export function useGrade(id: string) {
  return useQuery({
    queryKey: ["grade", id],
    queryFn: async () => {
      const response = await api.get(`/grades/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useGradesByClass(classId: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ["grades", "class", classId, page, limit],
    queryFn: async () => {
      // Get paginated enrollments for this class
      const enrollmentsResponse = await api.get(
        `/enrollments?sectionId=${classId}&page=${page}&limit=${limit}`
      );
      const enrollments = enrollmentsResponse.data.data || [];
      const totalStudents = enrollmentsResponse.data.meta?.total || 0;

      if (enrollments.length === 0) {
        return {
          data: [],
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        };
      }

      // Get all student IDs from paginated enrollments
      const studentIds = enrollments.map(
        (enrollment: any) => enrollment.studentId
      );

      // Get grades for these specific students
      const gradesResponse = await api.get(
        `/grades?studentIds=${studentIds.join(",")}&limit=100`
      );

      return {
        data: gradesResponse.data.data,
        meta: {
          total: totalStudents,
          page,
          limit,
          totalPages: Math.ceil(totalStudents / limit),
        },
      };
    },
    enabled: !!classId,
  });
}

export function useCreateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GradeFormData): Promise<Grade> => {
      const response = await api.post("/grades", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<GradeFormData>;
    }): Promise<Grade> => {
      const response = await api.patch(`/grades/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      queryClient.invalidateQueries({ queryKey: ["grade", id] });
    },
  });
}

export function useDeleteGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/grades/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
  });
}

export function useBulkUpdateGrades() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      grades,
    }: {
      grades: {
        studentId: string;
        courseId: string;
        grade: number;
        gradeType: string;
        comments?: string;
      }[];
    }) => {
      const response = await api.post(`/grades/bulk`, { grades });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
  });
}
