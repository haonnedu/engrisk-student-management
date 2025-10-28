import { components } from "./api";

/**
 * Re-export types from auto-generated API types
 */
export type { components, paths, operations } from "./api";

// Convenience type aliases for commonly used types
export type LoginDto = components["schemas"]["LoginDto"];
export type RegisterDto = components["schemas"]["RegisterDto"];
export type CreateStudentDto = components["schemas"]["CreateStudentDto"];
export type UpdateStudentDto = components["schemas"]["UpdateStudentDto"];
export type CreateGradeDto = components["schemas"]["CreateGradeDto"];
export type UpdateGradeDto = components["schemas"]["UpdateGradeDto"];

// User type based on API response
export type User = {
  id: string;
  email?: string;
  phone?: string;
  role: "STUDENT" | "TEACHER" | "ADMIN" | "SUPER_ADMIN";
  student?: any;
  teacher?: any;
  admin?: any;
};

// Login response type
export type LoginResponse = {
  access_token: string;
  user: User;
};
