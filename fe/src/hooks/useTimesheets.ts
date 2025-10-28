import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export type Timesheet = {
  id: string;
  teacherId: string;
  date: string;
  hoursWorked: number;
  minutesWorked: number;
  description?: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

export type TimesheetsResponse = {
  data: Timesheet[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type CreateTimesheetData = {
  date: string;
  hoursWorked: number;
  minutesWorked: number;
  description?: string;
};

// Get my timesheets (for teachers)
export function useMyTimesheets(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["timesheets", "my", page, limit],
    queryFn: async (): Promise<TimesheetsResponse> => {
      const response = await api.get(`/timesheets/my?page=${page}&limit=${limit}`);
      return response.data;
    },
  });
}

// Get all timesheets (for admins)
export function useTimesheets(page = 1, limit = 10, status?: string, teacherId?: string) {
  return useQuery({
    queryKey: ["timesheets", page, limit, status, teacherId],
    queryFn: async (): Promise<TimesheetsResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status) params.append("status", status);
      if (teacherId) params.append("teacherId", teacherId);
      
      const response = await api.get(`/timesheets?${params}`);
      return response.data;
    },
  });
}

// Create timesheet
export function useCreateTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTimesheetData): Promise<Timesheet> => {
      const response = await api.post("/timesheets", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
    },
  });
}

// Update timesheet
export function useUpdateTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateTimesheetData>;
    }): Promise<Timesheet> => {
      const response = await api.patch(`/timesheets/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
    },
  });
}

// Submit timesheet
export function useSubmitTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<Timesheet> => {
      const response = await api.post(`/timesheets/${id}/submit`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
    },
  });
}

// Approve timesheet (admin only)
export function useApproveTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<Timesheet> => {
      const response = await api.post(`/timesheets/${id}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
    },
  });
}

// Reject timesheet (admin only)
export function useRejectTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }): Promise<Timesheet> => {
      const response = await api.post(`/timesheets/${id}/reject`, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
    },
  });
}

// Delete timesheet
export function useDeleteTimesheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/timesheets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
    },
  });
}

