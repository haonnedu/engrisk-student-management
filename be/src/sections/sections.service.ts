import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  createSection(data: any) {
    return this.prisma.classSection.create({ data });
  }

  getSection(id: string) {
    return this.prisma.classSection.findUnique({
      where: { id },
      include: { assessments: true, enrollments: true },
    });
  }

  // Get grade types for a section
  async getSectionGradeTypes(sectionId: string) {
    const section = await this.prisma.classSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    const sectionGradeTypes = await this.prisma.sectionGradeType.findMany({
      where: { sectionId },
      include: {
        gradeType: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return sectionGradeTypes.map((sgt) => ({
      ...sgt.gradeType,
      sectionGradeTypeId: sgt.id,
      isActiveInSection: sgt.isActive,
      sortOrderInSection: sgt.sortOrder,
    }));
  }

  // Add grade type to section
  async addGradeTypeToSection(sectionId: string, gradeTypeId: string) {
    const section = await this.prisma.classSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    const gradeType = await this.prisma.gradeType.findUnique({
      where: { id: gradeTypeId },
    });

    if (!gradeType) {
      throw new NotFoundException(`Grade type with ID ${gradeTypeId} not found`);
    }

    // Get current max sort order for this section
    const maxSortOrder = await this.prisma.sectionGradeType.findFirst({
      where: { sectionId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const result = await this.prisma.sectionGradeType.upsert({
      where: { sectionId_gradeTypeId: { sectionId, gradeTypeId } },
      update: { isActive: true },
      create: {
        sectionId,
        gradeTypeId,
        isActive: true,
        sortOrder: (maxSortOrder?.sortOrder ?? -1) + 1,
      },
      include: { gradeType: true },
    });

    // Create grade records for all currently enrolled students who don't have one yet
    const enrollments = await this.prisma.enrollment.findMany({
      where: { sectionId, status: "ENROLLED" },
      select: { studentId: true, courseId: true },
    });

    if (enrollments.length > 0) {
      // Find which students already have a grade record for this type
      const existingGrades = await this.prisma.grade.findMany({
        where: {
          gradeTypeId,
          OR: enrollments.map((e) => ({
            studentId: e.studentId,
            courseId: e.courseId,
          })),
        },
        select: { studentId: true, courseId: true },
      });
      const existingKeys = new Set(
        existingGrades.map((g) => `${g.studentId}-${g.courseId}`)
      );

      const newGrades = enrollments
        .filter((e) => !existingKeys.has(`${e.studentId}-${e.courseId}`))
        .map((e) => ({
          studentId: e.studentId,
          courseId: e.courseId,
          gradeTypeId,
          grade: 0,
          comments: `Auto-generated for ${gradeType.name}`,
        }));

      if (newGrades.length > 0) {
        await this.prisma.grade.createMany({ data: newGrades });
      }
    }

    return result;
  }

  // Remove grade type from section
  async removeGradeTypeFromSection(sectionId: string, gradeTypeId: string) {
    return this.prisma.sectionGradeType.delete({
      where: {
        sectionId_gradeTypeId: {
          sectionId,
          gradeTypeId,
        },
      },
    });
  }

  // Update sort order of grade types in section
  async updateSectionGradeTypesSortOrder(
    sectionId: string,
    sectionGradeTypeIds: string[]
  ) {
    const updatePromises = sectionGradeTypeIds.map((id, index) =>
      this.prisma.sectionGradeType.update({
        where: { id },
        data: { sortOrder: index },
      })
    );

    return Promise.all(updatePromises);
  }

  // Toggle active status of grade type in section
  async toggleGradeTypeInSection(
    sectionId: string,
    gradeTypeId: string,
    isActive: boolean
  ) {
    return this.prisma.sectionGradeType.update({
      where: {
        sectionId_gradeTypeId: {
          sectionId,
          gradeTypeId,
        },
      },
      data: { isActive },
      include: {
        gradeType: true,
      },
    });
  }
}
