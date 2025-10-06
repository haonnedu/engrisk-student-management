import type { components, paths } from "@/types/api";

// Grade Types
export type GradeType = {
  id: string;
  name: string;
  code: string;
  description?: string;
  weight: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateGradeTypeDto = components["schemas"]["CreateGradeTypeDto"];
export type UpdateGradeTypeDto = components["schemas"]["UpdateGradeTypeDto"];

// Grade Types API responses
export type GradeTypesResponse = {
  data: GradeType[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// Homework
export type Homework = {
  id: string;
  studentId: string;
  sectionId: string;
  title: string;
  description: string;
  points: number;
  maxPoints: number;
  dueDate?: string;
  submittedAt?: string;
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

export type CreateHomeworkDto = components["schemas"]["CreateHomeworkDto"];
export type UpdateHomeworkDto = components["schemas"]["UpdateHomeworkDto"];

// API endpoints
export type GradeTypesEndpoints = {
  findAll: paths["/api/v1/grade-types"]["get"];
  create: paths["/api/v1/grade-types"]["post"];
  getActive: paths["/api/v1/grade-types/active"]["get"];
  findOne: paths["/api/v1/grade-types/{id}"]["get"];
  update: paths["/api/v1/grade-types/{id}"]["patch"];
  remove: paths["/api/v1/grade-types/{id}"]["delete"];
  updateSortOrder: paths["/api/v1/grade-types/sort/update"]["patch"];
};
