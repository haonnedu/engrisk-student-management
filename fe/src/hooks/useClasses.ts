import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export type ClassSection = {
  id: string;
  name: string;
  code: string;
  color?: string | null;
  timeDescription?: string;
  day1?: number;
  day2?: number;
  teacherName?: string;
  book?: string;
  courseId?: string;
  createdAt: string;
  updatedAt: string;
  assessments?: Assessment[];
  enrollments?: Enrollment[];
  course?: {
    id: string;
    title: string;
    courseCode: string;
    description?: string;
    credits: number;
    duration: number;
    maxStudents: number;
    status: string;
  };
};

export type Assessment = {
  id: string;
  sectionId: string;
  code: string;
  label: string;
  maxScore: number;
  weight: number;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type AssessmentScore = {
  id: string;
  assessmentId: string;
  studentId: string;
  score?: number;
  createdAt: string;
  updatedAt: string;
};

export type Attendance = {
  id: string;
  sectionId: string;
  studentId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  note?: string;
  createdAt: string;
  updatedAt: string;
};

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
};

export function useClasses(page = 1, limit = 10, search?: string) {
  return useQuery({
    queryKey: ["classes", page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append("search", search);

      const response = await api.get(`/classes?${params}`);
      return response.data;
    },
  });
}

export function useClass(id: string) {
  return useQuery({
    queryKey: ["class", id],
    queryFn: async () => {
      const response = await api.get(`/classes/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ClassSection>): Promise<ClassSection> => {
      const response = await api.post("/classes", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ClassSection>;
    }): Promise<ClassSection> => {
      const response = await api.put(`/classes/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["class", id] });
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useAssessments(sectionId: string) {
  return useQuery({
    queryKey: ["assessments", sectionId],
    queryFn: async () => {
      const response = await api.get(`/classes/${sectionId}/assessments`);
      return response.data;
    },
    enabled: !!sectionId,
  });
}

export function useSeedAssessments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sectionId: string): Promise<Assessment[]> => {
      const response = await api.post(`/classes/${sectionId}/assessments/seed`);
      return response.data;
    },
    onSuccess: (_, sectionId) => {
      queryClient.invalidateQueries({ queryKey: ["assessments", sectionId] });
    },
  });
}

export function useUpdateScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionId,
      scores,
    }: {
      sectionId: string;
      scores: {
        assessmentId: string;
        studentId: string;
        score: number | null;
      }[];
    }) => {
      const response = await api.post(`/classes/${sectionId}/scores`, {
        scores,
      });
      return response.data;
    },
    onSuccess: (_, { sectionId }) => {
      queryClient.invalidateQueries({ queryKey: ["assessments", sectionId] });
    },
  });
}

export function useGenerateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionId,
      startDate,
      endDate,
    }: {
      sectionId: string;
      startDate: string;
      endDate: string;
    }) => {
      const response = await api.post(
        `/classes/${sectionId}/attendance/generate`,
        { startDate, endDate }
      );
      return response.data;
    },
    onSuccess: (_, { sectionId }) => {
      queryClient.invalidateQueries({ queryKey: ["attendance", sectionId] });
    },
  });
}

export function useSetAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionId,
      studentId,
      date,
      status,
    }: {
      sectionId: string;
      studentId: string;
      date: string;
      status: string;
    }) => {
      const response = await api.post(`/classes/${sectionId}/attendance`, {
        studentId,
        date,
        status,
      });
      return response.data;
    },
    onSuccess: (_, { sectionId }) => {
      queryClient.invalidateQueries({ queryKey: ["attendance", sectionId] });
    },
  });
}

export function useAttendance(sectionId: string, month?: string) {
  return useQuery({
    queryKey: ["attendance", sectionId, month],
    queryFn: async () => {
      const params = month ? `?month=${month}` : "";
      const response = await api.get(
        `/classes/${sectionId}/attendance${params}`
      );
      return response.data;
    },
    enabled: !!sectionId,
  });
}
