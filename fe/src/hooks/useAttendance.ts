import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export type Attendance = {
  id: string;
  sectionId: string;
  studentId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  note?: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    engName: string;
    studentId: string;
  };
  section?: {
    id: string;
    name: string;
    code: string;
  };
};

export type AttendanceFormData = {
  sectionId: string;
  studentId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  note?: string;
};

export function useAttendance(sectionId: string, month?: string) {
  return useQuery({
    queryKey: ["attendance", sectionId, month],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sectionId) params.append("sectionId", sectionId);
      if (month) params.append("month", month);

      const response = await api.get(`/attendance?${params}`);
      return response.data;
    },
    enabled: !!sectionId,
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
      note,
    }: {
      sectionId: string;
      studentId: string;
      date: string;
      status: string;
      note?: string;
    }) => {
      const response = await api.post("/attendance/set", {
        sectionId,
        studentId,
        date,
        status,
        note,
      });
      return response.data;
    },
    onSuccess: (_, { sectionId }) => {
      queryClient.invalidateQueries({ queryKey: ["attendance", sectionId] });
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
      const response = await api.post("/attendance/generate", {
        sectionId,
        startDate,
        endDate,
      });
      return response.data;
    },
    onSuccess: (_, { sectionId }) => {
      queryClient.invalidateQueries({ queryKey: ["attendance", sectionId] });
    },
  });
}

export function useBulkUpdateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sectionId,
      date,
      attendanceData,
    }: {
      sectionId: string;
      date: string;
      attendanceData: { studentId: string; status: string; note?: string }[];
    }) => {
      const response = await api.post(`/classes/${sectionId}/attendance/bulk`, {
        date,
        attendanceData,
      });
      return response.data;
    },
    onSuccess: (_, { sectionId }) => {
      queryClient.invalidateQueries({ queryKey: ["attendance", sectionId] });
    },
  });
}
