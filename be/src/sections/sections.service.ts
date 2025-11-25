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

    return this.prisma.sectionGradeType.upsert({
      where: {
        sectionId_gradeTypeId: {
          sectionId,
          gradeTypeId,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        sectionId,
        gradeTypeId,
        isActive: true,
        sortOrder: (maxSortOrder?.sortOrder ?? -1) + 1,
      },
      include: {
        gradeType: true,
      },
    });
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
