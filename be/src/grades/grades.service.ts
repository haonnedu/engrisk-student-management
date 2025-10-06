import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { GradeType } from "@prisma/client";

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    studentId: string;
    courseId: string;
    grade: number;
    gradeType: GradeType;
    comments?: string;
  }) {
    return this.prisma.grade.create({ data });
  }

  async findAll(page = 1, limit = 10, search?: string, studentIds?: string[]) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        {
          student: {
            firstName: { contains: search, mode: "insensitive" as const },
          },
        },
        {
          student: {
            lastName: { contains: search, mode: "insensitive" as const },
          },
        },
        {
          course: {
            title: { contains: search, mode: "insensitive" as const },
          },
        },
      ];
    }

    if (studentIds && studentIds.length > 0) {
      where.studentId = { in: studentIds };
    }

    const [data, total] = await Promise.all([
      this.prisma.grade.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              engName: true,
              studentId: true,
              enrollments: {
                include: {
                  section: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                    },
                  },
                },
              },
            },
          },
          course: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.grade.count({ where }),
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
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: { student: true, course: true },
    });
    if (!grade) {
      throw new NotFoundException(`Grade with ID ${id} not found`);
    }
    return grade;
  }

  async update(
    id: string,
    data: Partial<{ grade: number; gradeType: GradeType; comments?: string }>
  ) {
    await this.findOne(id);
    return this.prisma.grade.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.grade.delete({ where: { id } });
  }
}
