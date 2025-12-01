import { Injectable, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateGradeTypeDto } from "./dto/create-grade-type.dto";
import { UpdateGradeTypeDto } from "./dto/update-grade-type.dto";

@Injectable()
export class GradeTypesService {
  constructor(private prisma: PrismaService) {}

  async create(createGradeTypeDto: CreateGradeTypeDto) {
    // Create the grade type
    const gradeType = await this.prisma.gradeType.create({
      data: createGradeTypeDto,
    });

    // If the grade type is active, create default grades for all existing students
    if (gradeType.isActive) {
      await this.createDefaultGradesForExistingStudents(gradeType.id);
    }

    return gradeType;
  }

  private async createDefaultGradesForExistingStudents(gradeTypeId: string) {
    // Get all active enrollments (student + course combinations)
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        status: "ENROLLED" as any,
      },
      select: {
        studentId: true,
        courseId: true,
      },
      distinct: ["studentId", "courseId"],
    });

    if (enrollments.length === 0) {
      return;
    }

    // Check which grades already exist to avoid duplicates
    // Use OR condition to check for each specific (studentId, courseId) combination
    // Batch the checks if there are many enrollments to avoid query size limits
    const BATCH_SIZE = 500;
    const existingGradeKeys = new Set<string>();

    for (let i = 0; i < enrollments.length; i += BATCH_SIZE) {
      const batch = enrollments.slice(i, i + BATCH_SIZE);
      const existingGrades = await this.prisma.grade.findMany({
        where: {
          gradeTypeId: gradeTypeId,
          OR: batch.map((e) => ({
            studentId: e.studentId,
            courseId: e.courseId,
          })),
        },
        select: {
          studentId: true,
          courseId: true,
        },
      });

      existingGrades.forEach((g) => {
        existingGradeKeys.add(`${g.studentId}-${g.courseId}`);
      });
    }

    // Filter out enrollments that already have grades for this grade type
    const newGrades = enrollments.filter(
      (enrollment) =>
        !existingGradeKeys.has(`${enrollment.studentId}-${enrollment.courseId}`)
    );

    // Create default grades for new combinations only
    const gradePromises = newGrades.map((enrollment) =>
      this.prisma.grade.create({
        data: {
          studentId: enrollment.studentId,
          courseId: enrollment.courseId,
          gradeTypeId: gradeTypeId,
          grade: 0, // Default score
          comments: `Auto-generated for new grade type`,
        },
      })
    );

    if (gradePromises.length > 0) {
      await Promise.all(gradePromises);
    }
  }

  async findAll(page = 1, limit = 10, search?: string, isActive?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { code: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.gradeType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: "asc" },
      }),
      this.prisma.gradeType.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.gradeType.findUnique({
      where: { id },
      include: {
        grades: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, updateGradeTypeDto: UpdateGradeTypeDto) {
    // Get current grade type to check if isActive is changing
    const currentGradeType = await this.prisma.gradeType.findUnique({
      where: { id },
      select: { isActive: true },
    });

    // Update the grade type
    const updatedGradeType = await this.prisma.gradeType.update({
      where: { id },
      data: updateGradeTypeDto,
    });

    // If grade type is being activated and wasn't active before, create default grades
    if (updatedGradeType.isActive && !currentGradeType?.isActive) {
      await this.createDefaultGradesForExistingStudents(id);
    }

    return updatedGradeType;
  }

  async remove(id: string) {
    // Check if grade type is being used
    const gradeCount = await this.prisma.grade.count({
      where: { gradeTypeId: id },
    });

    if (gradeCount > 0) {
      throw new ConflictException(
        `Cannot delete grade type. It is being used by ${gradeCount} grades.`
      );
    }

    return this.prisma.gradeType.delete({
      where: { id },
    });
  }

  async getActiveGradeTypes() {
    return this.prisma.gradeType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  async updateSortOrder(gradeTypeIds: string[]) {
    const updatePromises = gradeTypeIds.map((id, index) =>
      this.prisma.gradeType.update({
        where: { id },
        data: { sortOrder: index },
      })
    );

    return Promise.all(updatePromises);
  }
}
