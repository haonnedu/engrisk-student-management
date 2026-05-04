import { Injectable, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateGradeTypeDto } from "./dto/create-grade-type.dto";
import { UpdateGradeTypeDto } from "./dto/update-grade-type.dto";

@Injectable()
export class GradeTypesService {
  constructor(private prisma: PrismaService) {}

  async create(createGradeTypeDto: CreateGradeTypeDto) {
    return this.prisma.gradeType.create({
      data: createGradeTypeDto,
    });
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
    return this.prisma.gradeType.update({
      where: { id },
      data: updateGradeTypeDto,
    });
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
