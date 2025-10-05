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

  async findAll() {
    return this.prisma.grade.findMany({
      include: {
        student: true,
        course: true,
      },
      orderBy: { gradedAt: "desc" },
    });
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
