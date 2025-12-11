import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { UpdateStudentDto } from "@/types";

export type ParentStudent = {
  id: string;
  userId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  engName: string;
  dateOfBirth: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  classSchool?: string;
  status: "ACTIVE" | "INACTIVE" | "GRADUATED" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email?: string;
    phone?: string;
    role: "STUDENT" | "ADMIN" | "SUPER_ADMIN";
  };
  enrollments?: Array<{
    id: string;
    courseId: string;
    sectionId?: string;
    status: string;
    course: {
      id: string;
      title: string;
      courseCode: string;
      description?: string;
    };
    section?: {
      id: string;
      name: string;
      code: string;
    };
  }>;
  grades?: Array<{
    id: string;
    studentId: string;
    courseId: string;
    gradeTypeId: string;
    grade: number;
    comments?: string;
    gradedAt: string;
    course: {
      id: string;
      title: string;
      courseCode: string;
    };
    gradeType: {
      id: string;
      name: string;
      code: string;
      weight: number;
    };
  }>;
};

// Get current student profile (for logged-in student/parent)
export function useMyProfile() {
  return useQuery({
    queryKey: ["myProfile"],
    queryFn: async (): Promise<ParentStudent> => {
      const response = await api.get("/students/me/profile");
      return response.data;
    },
  });
}

// Update current student profile
export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<UpdateStudentDto>): Promise<ParentStudent> => {
      const response = await api.patch("/students/me/profile", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

// Change password
export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
};

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordDto): Promise<{ message: string }> => {
      const response = await api.post("/auth/change-password", data);
      return response.data;
    },
  });
}

